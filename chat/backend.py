import sqlite3
import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime, timedelta
import uuid
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_super_secret_key_here' # IMPORTANT: Change this in production!
app.config['DEBUG'] = True # Set to False in production

socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False) # manage_session=False to use Flask's session

DATABASE = 'chat.db'

# --- Database Initialization ---
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    
    # User status table (tracks online status, last seen, current active chat room)
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_status (
            user_id TEXT PRIMARY KEY,
            online INTEGER NOT NULL,
            last_seen TEXT,
            socket_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Messages table
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            sender_name TEXT NOT NULL,
            sender_role TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    ''')

    # Help requests table
    c.execute('''
        CREATE TABLE IF NOT EXISTS help_requests (
            id TEXT PRIMARY KEY,
            victim_id TEXT NOT NULL,
            victim_name TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL, -- pending, assigned, resolved, conflict
            assigned_volunteer_id TEXT,
            assigned_volunteer_name TEXT,
            created_at TEXT NOT NULL,
            accepted_at TEXT,
            resolved_at TEXT,
            conflict_room_id TEXT, -- New column for conflict chat room ID
            FOREIGN KEY (victim_id) REFERENCES users(id),
            FOREIGN KEY (assigned_volunteer_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()

# --- Database Helpers ---
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # This allows accessing columns by name
    return conn

# --- User Management ---
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('chat'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role'] # victim, volunteer, admin

        conn = get_db_connection()
        c = conn.cursor()
        try:
            user_id = str(uuid.uuid4())
            c.execute("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)",
                      (user_id, username, password, role))
            # Initialize user_status for the new user
            c.execute("INSERT INTO user_status (user_id, online, last_seen, socket_id) VALUES (?, ?, ?, ?)",
                      (user_id, 0, datetime.now().isoformat(), None))
            conn.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('index'))
        except sqlite3.IntegrityError:
            flash('Username already exists.', 'danger')
        finally:
            conn.close()
    return render_template('index.html') # Or a separate register.html

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        conn = get_db_connection()
        c = conn.cursor()
        user = c.execute("SELECT * FROM users WHERE username = ? AND password = ?",
                         (username, password)).fetchone()
        conn.close()

        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            flash('Logged in successfully!', 'success')
            return redirect(url_for('chat'))
        else:
            flash('Invalid username or password.', 'danger')
    return render_template('index.html')

@app.route('/logout')
def logout():
    if 'user_id' in session:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('UPDATE user_status SET online = 0, last_seen = ? WHERE user_id = ?',
                  (datetime.now().isoformat(), session['user_id']))
        conn.commit()
        conn.close()

        # Remove user from any Socket.IO rooms they might be in
        # This is handled by socketio.on('disconnect') as well, but good to be explicit
        if session.get('socket_id'):
            socketio.close_room(session['socket_id']) # Close the user's specific room
        
        session.pop('user_id', None)
        session.pop('username', None)
        session.pop('role', None)
        session.pop('socket_id', None) # Clear socket_id from session as well
        
        flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# --- Chat Page ---
@app.route('/chat')
def chat():
    if 'user_id' not in session:
        flash('Please log in to access the chat.', 'warning')
        return redirect(url_for('index'))

    user_id = session['user_id']
    user_role = session['role']
    
    conn = get_db_connection()
    c = conn.cursor()

    # Get current user's details
    current_user_data = c.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,)).fetchone()
    current_user = {
        'id': current_user_data['id'],
        'username': current_user_data['username'],
        'role': current_user_data['role']
    } if current_user_data else None

    # Determine chat partners based on role hierarchy
    online_chat_partners = []
    if user_role == 'admin':
        # Admin can chat with anyone online
        partners = c.execute("SELECT u.id, u.username, u.role FROM users u JOIN user_status us ON u.id = us.user_id WHERE u.id != ? AND us.online = 1", (user_id,)).fetchall()
    elif user_role == 'volunteer':
        # Volunteer can chat with admin and victims they are assigned to, or any online admin
        partners = c.execute("""
            SELECT u.id, u.username, u.role 
            FROM users u 
            JOIN user_status us ON u.id = us.user_id 
            WHERE u.id != ? AND us.online = 1 AND u.role = 'admin'
            UNION
            SELECT u.id, u.username, u.role 
            FROM users u 
            JOIN user_status us ON u.id = us.user_id 
            JOIN help_requests hr ON u.id = hr.victim_id
            WHERE u.id != ? AND us.online = 1 AND hr.assigned_volunteer_id = ? AND hr.status IN ('assigned', 'conflict')
        """, (user_id, user_id, user_id)).fetchall()
    elif user_role == 'victim':
        # Victim can chat with admin and volunteer assigned to their request, or any online admin
        partners = c.execute("""
            SELECT u.id, u.username, u.role 
            FROM users u 
            JOIN user_status us ON u.id = us.user_id 
            WHERE u.id != ? AND us.online = 1 AND u.role = 'admin'
            UNION
            SELECT u.id, u.username, u.role 
            FROM users u 
            JOIN user_status us ON u.id = us.user_id 
            JOIN help_requests hr ON u.id = hr.assigned_volunteer_id
            WHERE u.id != ? AND us.online = 1 AND hr.victim_id = ? AND hr.status IN ('assigned', 'conflict')
        """, (user_id, user_id, user_id)).fetchall()
    else:
        partners = [] # No chat partners for unknown roles

    # Remove duplicates if any from UNION queries
    seen_ids = set()
    for p in partners:
        if p['id'] not in seen_ids:
            online_chat_partners.append(dict(p))
            seen_ids.add(p['id'])

    conn.close()

    return render_template('chat.html', 
                           current_user=current_user, 
                           online_chat_partners=online_chat_partners)

# --- Help Request Management ---
@app.route('/requests', methods=['GET'])
def get_requests():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user_role = session['role']
    
    conn = get_db_connection()
    c = conn.cursor()
    
    requests_data = []
    if user_role == 'victim':
        # Victim sees their own requests
        requests_data = c.execute("SELECT * FROM help_requests WHERE victim_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    elif user_role == 'volunteer':
        # Volunteer sees pending requests and requests assigned to them
        requests_data = c.execute("""
            SELECT * FROM help_requests 
            WHERE status = 'pending' 
            OR (assigned_volunteer_id = ? AND status IN ('assigned', 'conflict'))
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
    elif user_role == 'admin':
        # Admin sees all requests
        requests_data = c.execute("SELECT * FROM help_requests ORDER BY created_at DESC").fetchall()
    
    conn.close()
    
    return jsonify([dict(row) for row in requests_data])

@app.route('/request/create', methods=['POST'])
def create_request():
    if 'user_id' not in session or session['role'] != 'victim':
        return jsonify({'error': 'Unauthorized'}), 401
    
    description = request.json.get('description')
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    victim_id = session['user_id']
    victim_name = session['username']
    request_id = str(uuid.uuid4())
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO help_requests (id, victim_id, victim_name, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              (request_id, victim_id, victim_name, description, 'pending', datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    # Notify admins and volunteers about a new request (optional: implement specific broadcast)
    socketio.emit('new_help_request', {'id': request_id, 'victim_name': victim_name, 'description': description}, room='admin_volunteers') # Example room
    
    return jsonify({'message': 'Help request created successfully', 'request_id': request_id}), 201

@app.route('/request/<request_id>/accept', methods=['POST'])
def accept_request(request_id):
    if 'user_id' not in session or session['role'] != 'volunteer':
        return jsonify({'error': 'Unauthorized'}), 401
    
    volunteer_id = session['user_id']
    volunteer_name = session['username']
    
    conn = get_db_connection()
    c = conn.cursor()
    
    req = c.execute("SELECT * FROM help_requests WHERE id = ? AND status = 'pending'", (request_id,)).fetchone()
    if not req:
        conn.close()
        return jsonify({'error': 'Request not found or already accepted'}), 404
    
    c.execute("""
        UPDATE help_requests SET 
        status = 'assigned', 
        assigned_volunteer_id = ?, 
        assigned_volunteer_name = ?, 
        accepted_at = ? 
        WHERE id = ?
    """, (volunteer_id, volunteer_name, datetime.now().isoformat(), request_id))
    conn.commit()
    conn.close()

    # Create a private chat room for victim and volunteer
    victim_id = req['victim_id']
    room_id = get_private_chat_room_id(victim_id, volunteer_id)
    
    # Notify both victim and volunteer that a chat room has been created
    # This will trigger their frontend to open the chat or show a notification
    socketio.emit('request_assigned_chat_ready', {
        'request_id': request_id,
        'room_id': room_id,
        'victim_id': victim_id,
        'victim_name': req['victim_name'],
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer_name
    }, room=get_user_socket_id(victim_id)) # Emit to victim's socket
    
    socketio.emit('request_assigned_chat_ready', {
        'request_id': request_id,
        'room_id': room_id,
        'victim_id': victim_id,
        'victim_name': req['victim_name'],
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer_name
    }, room=get_user_socket_id(volunteer_id)) # Emit to volunteer's socket

    return jsonify({'message': 'Request accepted and chat room created', 'room_id': room_id}), 200

@app.route('/request/<request_id>/resolve', methods=['POST'])
def resolve_request(request_id):
    if 'user_id' not in session or session['role'] not in ['volunteer', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user_role = session['role']

    conn = get_db_connection()
    c = conn.cursor()
    
    req = c.execute("SELECT * FROM help_requests WHERE id = ?", (request_id,)).fetchone()
    if not req:
        conn.close()
        return jsonify({'error': 'Request not found'}), 404
    
    # Only assigned volunteer or admin can resolve
    if user_role == 'volunteer' and req['assigned_volunteer_id'] != user_id:
        conn.close()
        return jsonify({'error': 'You are not assigned to this request'}), 403
    
    c.execute("UPDATE help_requests SET status = 'resolved', resolved_at = ? WHERE id = ?",
              (datetime.now().isoformat(), request_id))
    conn.commit()
    conn.close()
    
    # Notify involved parties (victim, volunteer) that request is resolved
    socketio.emit('request_resolved', {'request_id': request_id}, room=get_user_socket_id(req['victim_id']))
    if req['assigned_volunteer_id']:
        socketio.emit('request_resolved', {'request_id': request_id}, room=get_user_socket_id(req['assigned_volunteer_id']))

    return jsonify({'message': 'Request resolved successfully'}), 200

@app.route('/request/<request_id>/conflict', methods=['POST'])
def raise_conflict(request_id):
    if 'user_id' not in session or session['role'] != 'volunteer':
        return jsonify({'error': 'Unauthorized'}), 401
    
    volunteer_id = session['user_id']
    volunteer_name = session['username']

    conn = get_db_connection()
    c = conn.cursor()
    
    req = c.execute("SELECT * FROM help_requests WHERE id = ? AND assigned_volunteer_id = ? AND status = 'assigned'",
                    (request_id, volunteer_id)).fetchone()
    if not req:
        conn.close()
        return jsonify({'error': 'Request not found or not assigned to you, or not in assigned status'}), 404

    # Create a unique room for volunteer-admin conflict chat
    admin_users = c.execute("SELECT id FROM users WHERE role = 'admin'").fetchall()
    if not admin_users:
        conn.close()
        return jsonify({'error': 'No admins online to handle conflict'}), 500 # Or just proceed without a chat

    # For simplicity, we'll create a conflict room with the first admin found
    # In a real app, you might pick an active admin or allow multiple admins to join
    admin_id = admin_users[0]['id'] # Just pick the first admin for now
    conflict_room_id = get_private_chat_room_id(volunteer_id, admin_id, prefix='conflict')

    c.execute("UPDATE help_requests SET status = 'conflict', conflict_room_id = ? WHERE id = ?",
              (conflict_room_id, request_id))
    conn.commit()
    conn.close()

    # Notify the volunteer and the admin(s) about the conflict chat
    socketio.emit('conflict_chat_ready', {
        'request_id': request_id,
        'room_id': conflict_room_id,
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer_name,
        'admin_id': admin_id # The admin chosen for this conflict
    }, room=get_user_socket_id(volunteer_id))

    socketio.emit('conflict_chat_ready', {
        'request_id': request_id,
        'room_id': conflict_room_id,
        'volunteer_id': volunteer_id,
        'volunteer_name': volunteer_name,
        'admin_id': admin_id
    }, room=get_user_socket_id(admin_id))

    return jsonify({'message': 'Conflict raised, chat room with admin created', 'room_id': conflict_room_id}), 200


# --- Message API ---
@app.route('/api/messages/<room_id>', methods=['GET'])
def get_messages_for_room(room_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    c = conn.cursor()
    messages = c.execute("SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC", (room_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in messages])

# --- Socket.IO Event Handlers ---
@socketio.on('connect')
def handle_connect():
    if 'user_id' in session:
        user_id = session['user_id']
        username = session['username']
        role = session['role']
        socket_id = request.sid

        conn = get_db_connection()
        c = conn.cursor()
        
        # Update user status to online and store their current socket_id
        # Important: If a user has multiple tabs open, they'll have multiple socket_ids.
        # We'll store the latest one or manage a list. For simplicity, let's update the latest.
        # A more robust solution might track all active socket_ids for a user.
        c.execute('UPDATE user_status SET online = 1, last_seen = ?, socket_id = ? WHERE user_id = ?',
                  (datetime.now().isoformat(), socket_id, user_id))
        conn.commit()
        conn.close()

        # Store socket_id in session for easy retrieval
        session['socket_id'] = socket_id
        
        print(f"Client connected: {socket_id} for user {username} ({user_id})")
        
        # Emit to all relevant users that this user is now online
        emit('user_status_update', {'user_id': user_id, 'username': username, 'online': True, 'role': role}, broadcast=True)
        
        # Add user to a personal room for direct notifications
        join_room(user_id) # Join a room named after their user_id

    else:
        print(f"Unauthorized client tried to connect: {request.sid}")
        # Optionally, disconnect unauthorized clients
        # disconnect()

@socketio.on('disconnect')
def handle_disconnect():
    if 'user_id' in session:
        user_id = session['user_id']
        username = session['username']
        role = session['role']
        socket_id = request.sid

        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if this was the last active socket for the user
        # This requires tracking multiple sockets per user if they have multiple tabs
        # For simplicity, if the disconnected socket_id matches the one in DB, set offline
        # A better approach for multiple tabs: decrement a counter for active sockets per user.
        
        # For now, let's assume one socket per user for online status
        # If the disconnected socket is the one we registered as 'active'
        db_socket_id = c.execute('SELECT socket_id FROM user_status WHERE user_id = ?', (user_id,)).fetchone()
        if db_socket_id and db_socket_id[0] == socket_id:
            c.execute('UPDATE user_status SET online = 0, last_seen = ?, socket_id = NULL WHERE user_id = ?',
                      (datetime.now().isoformat(), user_id))
            conn.commit()
            print(f"Client disconnected: {socket_id} for user {username} ({user_id}) - set offline")
            # Emit to all relevant users that this user is now offline
            emit('user_status_update', {'user_id': user_id, 'username': username, 'online': False, 'role': role}, broadcast=True)
        else:
            print(f"Client disconnected: {socket_id} for user {username} ({user_id}) - not primary socket")

        conn.close()
        leave_room(user_id) # Leave their personal room
    else:
        print(f"Unauthorized client disconnected: {request.sid}")

@socketio.on('join_chat_room')
def handle_join_chat_room(data):
    if 'user_id' not in session:
        return {'error': 'Unauthorized'}

    current_user_id = session['user_id']
    target_user_id = data.get('target_user_id')
    
    if not target_user_id:
        return {'error': 'Target user ID is required'}

    conn = get_db_connection()
    c = conn.cursor()
    
    # Verify target user exists and is online (optional, but good practice)
    target_user_data = c.execute("SELECT id, username, role FROM users WHERE id = ?", (target_user_id,)).fetchone()
    if not target_user_data:
        conn.close()
        return {'error': 'Target user not found'}
    
    # Determine the room ID based on the two users involved
    room_id = get_private_chat_room_id(current_user_id, target_user_id)

    # Join the room
    join_room(room_id)
    
    # Also join the target user's socket to this room if they are online
    target_socket_id = get_user_socket_id(target_user_id)
    if target_socket_id:
        # We need to use `socketio.server.enter_room` for a socket not associated with the current request
        socketio.server.enter_room(target_socket_id, room_id)
        print(f"User {target_user_data['username']} ({target_user_id}) also joined room {room_id}")

    conn.close()
    
    emit('room_joined', {
        'room_id': room_id,
        'target_user_id': target_user_id,
        'target_user_name': target_user_data['username']
    })
    print(f"User {session['username']} ({current_user_id}) joined room {room_id} with {target_user_data['username']}")


@socketio.on('send_message')
def handle_send_message(data):
    if 'user_id' not in session:
        return {'error': 'Unauthorized'}

    room_id = data.get('room_id')
    message_content = data.get('message')
    
    if not room_id or not message_content:
        return {'error': 'Room ID and message are required'}

    sender_id = session['user_id']
    sender_name = session['username']
    sender_role = session['role']
    message_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO messages (id, room_id, sender_id, sender_name, sender_role, message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (message_id, room_id, sender_id, sender_name, sender_role, message_content, timestamp))
    conn.commit()
    conn.close()

    message_data = {
        'id': message_id,
        'room_id': room_id,
        'sender_id': sender_id,
        'sender_name': sender_name,
        'sender_role': sender_role,
        'message': message_content,
        'timestamp': timestamp
    }
    
    emit('new_message', message_data, room=room_id)

    # Ensure the non-sending participant receives the message even if not currently joined to the room
    room_participants = socketio.server.manager.rooms.get('/', {}).get(room_id, set())
    if not room_participants or len(room_participants) == 1:
        for participant_id in get_participants_from_room_id(room_id):
            if participant_id and participant_id != sender_id:
                target_socket_id = get_user_socket_id(participant_id)
                if target_socket_id and target_socket_id not in room_participants:
                    socketio.emit('new_message', message_data, room=target_socket_id)
    print(f"Message in room {room_id} from {sender_name}: {message_content}")

@socketio.on('typing')
def handle_typing(data):
    if 'user_id' not in session:
        return {'error': 'Unauthorized'}

    room_id = data.get('room_id')
    is_typing = data.get('is_typing')
    
    if not room_id:
        return {'error': 'Room ID is required'}

    emit('user_typing', {
        'user_id': session['user_id'],
        'username': session['username'],
        'room_id': room_id,
        'is_typing': is_typing
    }, room=room_id, include_self=False) # Don't send typing indicator to self


# --- Utility Functions ---
def get_private_chat_room_id(user1_id, user2_id, prefix='private_chat'):
    # Ensure a consistent room ID regardless of the order of user IDs
    sorted_ids = sorted([user1_id, user2_id])
    return f"{prefix}_{sorted_ids[0]}_{sorted_ids[1]}"

def get_user_socket_id(user_id):
    """Retrieves the active socket_id for a given user_id from the database."""
    conn = get_db_connection()
    c = conn.cursor()
    socket_id = c.execute("SELECT socket_id FROM user_status WHERE user_id = ? AND online = 1", (user_id,)).fetchone()
    conn.close()
    return socket_id[0] if socket_id else None

def is_socket_in_room(socket_id, room_id, namespace='/'):
    """
    Checks if a socket (by id) is already a member of a given room.
    """
    if not socket_id or not room_id:
        return False

    rooms_for_namespace = socketio.server.manager.rooms.get(namespace, {})
    room_participants = rooms_for_namespace.get(room_id, set())
    return socket_id in room_participants

def get_participants_from_room_id(room_id: str):
    """
    Extracts the participant user IDs from a room identifier.
    Supports both private chats and conflict chats.
    """
    if not room_id:
        return []

    parts = room_id.split('_')
    if len(parts) < 3:
        return []

    if parts[0] == 'private' and parts[1] == 'chat':
        return parts[2:]
    if parts[0] == 'conflict':
        return parts[1:]

    # Fallback: return everything after the first segment
    return parts[1:]

#--- Main Execution ---
if __name__ == '__main__':
    init_db()
    socketio.run(app, host='0.0.0.0', port=5000)

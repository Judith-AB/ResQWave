# ResQwav: Real-time Disaster Response Chat Application

ResQwav is a real-time, multi-user chat application designed to facilitate communication and coordination during disaster response scenarios. It features role-based access (Admin, Volunteer, Victim), individual chat rooms, help request management, and conflict resolution.

---

## 🚀 Features

- *Role-Based Access*: Users can register and log in as Admin, Volunteer, or Victim, each with specific permissions and views.
- *Real-time Messaging*: Powered by Flask-SocketIO, all communication happens in real-time.
- *Individual Chat Rooms*: Users can initiate and participate in private 1:1 chat rooms.
- *Help Request Management*:
  - Victims can create help requests.
  - Volunteers can accept and manage help requests.
  - Admins have oversight over all requests.
- *Request Status Tracking*: Requests transition through pending, assigned, and resolved states.
- *Conflict Resolution*: Admins can "Raise Conflict" on requests, indicating a need for intervention.
- *User Status*: Online/offline indicators for users.
- *Typing Indicators*: See when other users are typing.
- *Broadcast Messaging (Admin/Demo)*: Admins can send messages to all users (useful for testing or announcements).
- *Persistent Data*: User registrations, messages, and help requests are stored in a SQLite database.

---

## 🧠 Technologies Used

- *Backend*: Python, Flask, Flask-SocketIO  
- *Frontend*: HTML, CSS, JavaScript  
- *Database*: SQLite3  
- *Asynchronous WSGI Server*: Gunicorn (for production), Gevent, Gevent-WebSocket

---

## ⚙ Setup Instructions

Follow these steps to get *ResQwav* running on your local machine.

### Prerequisites

- Python *3.9–3.12*  
  ⚠ Python *3.13* is *NOT supported* due to Gevent incompatibility.
- pip (Python package installer)
- git (for cloning the repository)

---

### 1️⃣ Clone the Repository

bash
git clone <your-repository-url>
cd <your-repository-name>  # e.g., cd resqwav-chat-app


---

### 2️⃣ Create and Activate a Virtual Environment

bash
# Create a virtual environment using a supported Python version (e.g., 3.11)
python3.11 -m venv venv

# Activate the virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate


---

### 3️⃣ Install Dependencies

bash
pip install -r requirements.txt


#### 🧩 Troubleshooting Gevent Wheel Errors

If you encounter wheel build errors (especially for gevent or greenlet), it’s usually due to:

- Unsupported Python version (like 3.13)
- Missing build tools

Fix it with:

*Verify Python version:*  
bash
python --version


*Install build tools:*  
bash
# Ubuntu/Debian
sudo apt update && sudo apt install build-essential python3-dev

# Fedora/RHEL
sudo dnf groupinstall "Development Tools" && sudo dnf install python3-devel

# macOS
xcode-select --install


---

### 4️⃣ Initialize the Database

The app uses a SQLite database (chat.db). It is *auto-created* on the first run.  
To reset manually:

bash
rm chat.db  # Linux/macOS
# del chat.db  # Windows


---

## 🧩 Running the Application

### 🔹 Local Development

bash
source venv/bin/activate
python backend.py


Access the app at: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

### 🔹 Production Deployment (Gunicorn)

bash
gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 backend:app


*Notes:*  
- Ensure gunicorn is listed in requirements.txt.  
- Use environment variables for sensitive keys:  
  python
  app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback_key')
  

---

## 🧑‍💻 Using the Application

### 🏠 Register
Register users as *Admin, **Volunteer, or **Victim*.

### 🔐 Login
Log in using your credentials.

### 🧭 Dashboards

#### 🛠 Admin
- View all users and requests.  
- Initiate chats.  
- Raise or resolve conflicts.

#### 🤝 Volunteer
- View online users and pending requests.  
- Accept and manage help requests.  
- Chat with victims.

#### 🚨 Victim
- Create help requests with descriptions.  
- Track request status.  
- Chat directly once a volunteer accepts.

---

### 💬 Chatting

Click on a user or accepted request → Open chat window → Type → Press *Enter* or click *Send*.

---

## 🧾 Summary

This README provides complete setup, configuration, and feature explanation for *ResQwav*, a real-time Flask-SocketIO chat system designed for effective disaster response communication.

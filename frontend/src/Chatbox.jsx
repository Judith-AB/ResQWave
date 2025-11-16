import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './context/ChatContext';
import { useRequests } from './context/RequestsContext';
import io from 'socket.io-client';

const API_ASSIGNMENT_URL = "http://localhost:3001/api/assignments";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });


const ChatBox = ({ requestId, participantName, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { requests } = useRequests();
    const [inputText, setInputText] = useState('');
    const messages = getMessages(requestId);
    const messagesEndRef = useRef(null);

    const request = requests.find(req => req.id === requestId);
    const victimName = request ? request.victimName : 'Victim';

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit('join_room', requestId);

        const messageListener = (data) => {
            addMessage(data.roomId, data.sender, data.text);
        };
        socket.on('receive_message', messageListener);

        return () => {
            socket.off('receive_message', messageListener);
        };
    }, [requestId, addMessage]);

    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    
    const reportConflict = async () => {
        if (!confirm("Are you sure you want to report a conflict? This escalates the issue to Admin and flags the request as ATMOST URGENT.")) return;

        try {
            const response = await fetch(`${API_ASSIGNMENT_URL}/conflict/${requestId}`, {
                method: "PUT",
            });

            if (response.ok) {
                alert("Conflict reported! The Admin has been notified. This chat will now close.");
                onClose();
            } else {
                alert("Failed to report conflict.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error while reporting conflict.");
        }
    };
    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        const sender = participantName;
        const messageText = inputText.trim();

        const messageData = {
            roomId: requestId,
            sender: sender,
            text: messageText,
        };

        socket.emit('send_message', messageData);
        addMessage(requestId, sender, messageText);

        setInputText('');
    };


    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden' }}>

            
                <div style={{ background: '#2196F3', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💬 Request #{requestId} Chat: {participantName}</h3>

                    <button
                        onClick={reportConflict}
                        style={{
                            background: 'none',
                            border: '1px solid white',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                            marginRight: '10px'
                        }}
                    >
                        Report Conflict 🚨
                    </button>

                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>

                
                <div style={{ height: '350px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '20%' }}>Start communication for resolution.</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} style={{
                                justifyContent: msg.sender === participantName ? 'flex-end' : 'flex-start', display: 'flex', marginBottom: '0.5rem',
                            }}>
                                <div style={{
                                    maxWidth: '75%', padding: '0.5rem 1rem', borderRadius: '15px',
                                    backgroundColor: msg.sender === participantName ? '#2196F3' : '#f44336',
                                    color: 'white',
                                }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>
                                        {msg.sender === participantName ? 'You' : msg.sender}
                                    </p>
                                    <p style={{ margin: '0.2rem 0 0', wordWrap: 'break-word' }}>{msg.text}</p>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

 
                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message..."
                        style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px 0 0 8px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '1rem' }}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;
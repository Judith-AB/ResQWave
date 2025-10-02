import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './context/ChatContext';
import { useRequests } from './context/RequestsContext';
import { useVolunteers } from './context/VolunteerContext';

// This ChatBox UI is used by the Admin (acting as Volunteer)
const ChatBox = ({ requestId, participantName, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { requests } = useRequests();
    const { volunteers } = useVolunteers();
    const [inputText, setInputText] = useState('');
    const messages = getMessages(requestId);
    const messagesEndRef = useRef(null);

    // Find the request and the victim's name
    const request = requests.find(req => req.id === requestId);
    const victimName = request ? request.name : 'Victim';

    // Scroll to the bottom whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        // Sender is the Volunteer's name passed from AdminDashboard
        addMessage(requestId, participantName, inputText.trim());
        setInputText('');
    };

    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden' }}>

                {/* Chat Header */}
                <div style={{ background: '#2196F3', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💬 Chat: {participantName} &rarr; {victimName}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>

                {/* Message Area */}
                <div style={{ height: '350px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '20%' }}>Start the conversation with the Victim.</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} style={{
                                // Check if sender is the Volunteer (participantName)
                                justifyContent: msg.sender === participantName ? 'flex-end' : 'flex-start',
                                display: 'flex',
                                marginBottom: '0.5rem',
                            }}>
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '15px',
                                    // Volunteer messages are blue, Victim messages are red
                                    backgroundColor: msg.sender === participantName ? '#2196F3' : '#f44336',
                                    color: 'white',
                                }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>
                                        {msg.sender === participantName ? 'You (Volunteer)' : victimName}
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

                {/* Input Area */}
                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message to the victim..."
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
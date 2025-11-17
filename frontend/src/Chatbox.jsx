import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './context/ChatContext';
import { useRequests } from './context/RequestsContext';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:3001";
const socket = io(SOCKET_SERVER_URL, { autoConnect: false });


const ChatBox = ({ requestId, participantName, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { requests, updateRequestStatus } = useRequests();
    const [inputText, setInputText] = useState('');

    const request = requests.find(req => req.id === requestId);
    const [isSolvedConfirmed, setIsSolvedConfirmed] = useState(request?.isResolvedByVolunteer || false);

    const messages = getMessages(requestId);
    const messagesEndRef = useRef(null);
    const reqIdStr = String(requestId);
    const userRole = participantName === 'Admin' ? 'Admin' : 'Volunteer';

    
    const isConflict = request?.status === 'Conflict' || request?.status === 'Atmost';

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
        socket.emit('join_room', reqIdStr);

        const messageListener = (data) => {
            addMessage(data.roomId, data.sender, data.text, data.timestamp);
        };

        const systemNotificationListener = (data) => {
            alert(data.text);
            updateRequestStatus(data.requestId, data.status);

            if (data.status === 'COMPLETED') {
                onClose();
            }
        };

        socket.on('receive_message', messageListener);
        socket.on('system_notification', systemNotificationListener);

        return () => {
            socket.off('receive_message', messageListener);
            socket.off('system_notification', systemNotificationListener);
        };
    }, [requestId, addMessage, updateRequestStatus, onClose]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    
    const reportConflict = () => {
        if (!confirm("Are you sure you want to report a conflict?")) return;
        socket.emit('raise_conflict', { requestId: reqIdStr, reporterRole: userRole, reason: `${userRole} reported conflict.` });
        alert("Conflict reported! Admin notified.");
    };

    const handleMarkSolved = () => {
        if (window.confirm("Are you sure the issue is fully resolved?")) {
            setIsSolvedConfirmed(true);
            socket.emit('mark_solved', { requestId: reqIdStr, reporterRole: userRole });
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        const sender = participantName;
        const messageText = inputText.trim();
        const timestamp = new Date().toLocaleTimeString();

        const messageData = { roomId: reqIdStr, sender: sender, text: messageText, timestamp: timestamp, };

        socket.emit('send_message', messageData);
        addMessage(requestId, sender, messageText, timestamp);
        setInputText('');
    };


    return (
       
        <div className="form-overlay" style={{
            background: 'rgba(0, 0, 0, 0.4)',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',


            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

           
            zIndex: 999999
        }}>
          
            <div className="form-container" style={{
                width: '450px',
                padding: '0',
                overflow: 'hidden',
                background: 'white',

             
                marginTop: '50px',
                borderRadius: '12px',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',


                display: 'flex',
                flexDirection: 'column',
                maxHeight: '80vh'
            }}>

                <div style={{ background: '#2196F3', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💬 Request #{requestId} Chat: {userRole}</h3>


                    {userRole !== 'Admin' && (
                        <button
                            onClick={reportConflict}
                            style={{ background: '#e53935', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold', flexShrink: 0 }}
                        >
                            Report Conflict 🚨
                        </button>
                    )}

                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', marginLeft: '10px' }}>&times;</button>
                </div>

        
                <div style={{
                    flexGrow: 1, 
                    overflowY: 'auto',
                    padding: '1rem',
                    background: '#f0f2f5'
                }}>
                    {messages.length === 0 ? (<p style={{ textAlign: 'center', color: '#666', marginTop: '20%' }}>Start communication for resolution.</p>) : (
                        messages.map((msg, index) => (
                            <div key={index} style={{ justifyContent: msg.sender === participantName ? 'flex-end' : 'flex-start', display: 'flex', marginBottom: '0.5rem' }}>
                                <div style={{ maxWidth: '75%', padding: '0.5rem 1rem', borderRadius: '15px', backgroundColor: msg.sender === participantName ? '#2196F3' : '#f44336', color: 'white' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>{msg.sender === participantName ? 'You' : msg.sender}</p>
                                    <p style={{ margin: '0.2rem 0 0', wordWrap: 'break-word' }}>{msg.text}</p>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>{msg.timestamp}</span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

             
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #ccc', textAlign: 'right', background: '#e9ecef', flexShrink: 0 }}>
                    <button
                        onClick={handleMarkSolved}
                        disabled={isSolvedConfirmed || isConflict} 
                        style={{ padding: '0.5rem 1rem', background: (isSolvedConfirmed || isConflict) ? '#adb5bd' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isConflict ? '🚫 Admin Control' : isSolvedConfirmed ? '✅ Confirmed Solved' : 'Mark as Solved'}
                    </button>
                </div>

                <form onSubmit={handleSend} style={{ padding: '1rem', display: 'flex', flexShrink: 0 }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your message..."
                        style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px 0 0 8px' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '1rem', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Send</button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;
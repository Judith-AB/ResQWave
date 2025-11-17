// --- frontend/HelpRequestForm.jsx ---
import React, { useState, useEffect } from "react";
import "./index.css";
import { useRequests } from "./context/RequestsContext"; 
import { useChat } from "./context/ChatContext"; 
import { useVolunteers } from "./context/VolunteerContext"; 

import io from 'socket.io-client';
import ConflictModal from "./ConflictModal";

const API_BASE_URL = "http://localhost:3001/api/requests";
const SOCKET_SERVER_URL = "http://localhost:3001";
const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const VictimStatusChat = ({ request, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { volunteers } = useVolunteers();
    const { updateRequestStatus } = useRequests();

    const [inputText, setInputText] = useState('');
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [isSolvedConfirmed, setIsSolvedConfirmed] = useState(request.isResolvedByVictim || false);

    const messages = getMessages(request.id);
    const assignedVolunteer = volunteers.find(v => v.id === request.assignedVolunteerId);
    const volunteerName = assignedVolunteer ? assignedVolunteer.fullName : 'A Volunteer';
    const userRole = 'Victim';
    const reqIdStr = String(request.id);
    

    const isConflict = request.status === 'Conflict' || request.status === 'Atmost'; 

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
    }, [request.id, addMessage, updateRequestStatus, onClose]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        const sender = request.victimName;
        const messageText = inputText.trim();
        const timestamp = new Date().toLocaleTimeString();

        const messageData = { roomId: reqIdStr, sender: sender, text: messageText, timestamp: timestamp };

        socket.emit('send_message', messageData);
        addMessage(request.id, sender, messageText, timestamp);
        setInputText('');
    };

    const handleConflictSubmit = (reason) => {
        socket.emit('raise_conflict', { requestId: reqIdStr, reporterRole: userRole, reason: reason });
        setIsConflictModalOpen(false);
    };

    const handleMarkSolved = () => {
        if (window.confirm("Are you sure the issue is fully resolved? Clicking YES confirms completion.")) {
            setIsSolvedConfirmed(true);
            socket.emit('mark_solved', { requestId: reqIdStr, reporterRole: userRole });
        }
    };


    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden', background: 'white', marginTop: '50px', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)' }}>

             
                <div style={{ background: request.assignedVolunteerId ? '#4CAF50' : '#f44336', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {request.assignedVolunteerId ? ` Matched with ${volunteerName}` : `🚨 Request ID: ${request.id} Pending...`}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

         
                <div style={{ height: '250px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 && (<p style={{ textAlign: 'center', color: '#666', marginTop: '10%' }}>Start the chat or wait for the volunteer to reach out.</p>)}
                    {messages.map((msg, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: msg.sender === request.victimName ? 'flex-end' : 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ maxWidth: '75%', padding: '0.5rem 1rem', borderRadius: '15px', backgroundColor: msg.sender === request.victimName ? '#f44336' : '#2196F3', color: 'white' }}>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>{msg.sender === request.victimName ? 'You (Victim)' : msg.sender}</p>
                                <p style={{ margin: '0.2rem 0 0', wordWrap: 'break-word' }}>{msg.text}</p>
                                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>{msg.timestamp}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: '#e9ecef', flexShrink: 0 }}>
                    <button onClick={() => setIsConflictModalOpen(true)} style={{ padding: '0.5rem', background: '#e53935', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        🚩 Report Conflict
                    </button>

                    <button 
                        onClick={handleMarkSolved} 
                        disabled={isSolvedConfirmed || isConflict} 
                        style={{ 
                            padding: '0.5rem', 
                            background: (isSolvedConfirmed || isConflict) ? '#adb5bd' : '#4CAF50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        {isConflict ? '🚫 Admin Control' : isSolvedConfirmed ? '✅ Confirmed Solved' : 'Mark as Solved'}
                    </button>
                </div>

                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex', flexShrink: 0 }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send message..."
                        style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px 0 0 8px' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '1rem', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>Send</button>
                </form>


                {isConflictModalOpen && (<ConflictModal onClose={() => setIsConflictModalOpen(false)} onSubmit={handleConflictSubmit} />)}
            </div>
        </div>
    );
};



const HelpRequestForm = ({ onClose }) => {
    const { addRequest, requests } = useRequests();
    const [formData, setFormData] = useState({ name: "", contact: "", location: "", emergencyType: "", details: "" });
    const [submittedRequest, setSubmittedRequest] = useState(null);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { victimName: formData.name, contact: formData.contact, location: formData.location, emergencyType: formData.emergencyType, details: formData.details };
            const response = await fetch(API_BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await response.json();

            if (response.ok) {
                const newRequest = { ...formData, id: data.requestId, status: 'Pending', urgencyScore: data.urgencyScore, victimName: formData.name };
                addRequest(newRequest);
                setSubmittedRequest(newRequest);
            } else {
                alert("Submission failed: " + (data.message || "Server error."));
            }
        } catch (error) {
            console.error('Request Submission Error:', error);
            alert("Network error: Could not submit request.");
        }
    };


    if (submittedRequest) {
        const liveRequest = requests.find(req => req.id === submittedRequest.id) || submittedRequest;
        return <VictimStatusChat request={liveRequest} onClose={onClose} />;
    }

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h2>🚨 Request Help</h2>
                <form onSubmit={handleSubmit}>
                    <label>Full Name:<input type="text" name="name" value={formData.name} onChange={handleChange} required /></label>
                    <label>Contact:<input type="text" name="contact" value={formData.contact} onChange={handleChange} required /></label>
                    <label>Location:<input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Area" required /></label>
                    <label>Emergency Type:
                        <select name="emergencyType" value={formData.emergencyType} onChange={handleChange} required>
                            <option value="">--Select Assistance Needed--</option>
                            <option value="Medical">🏥 Medical Aid / First Aid</option>
                            <option value="Water">💧 Drinking Water / Hydration</option>
                            <option value="Food">🍲 Food Rations / Cooked Meals</option>
                            <option value="Shelter">⛺ Temporary Shelter / Tarpaulin</option>
                            <option value="Flooding">🌊 Flood / Monsoon Rescue</option>
                            <option value="Missing">🔍 Search for Missing Person</option>
                            <option value="Other">⚠️ Other Critical Need</option>
                        </select>
                    </label>
                    <label>Additional Details:<textarea name="details" value={formData.details} onChange={handleChange} placeholder="Describe the situation..." /></label>
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Submit</button>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


HelpRequestForm.VictimStatusChat = VictimStatusChat;
export default HelpRequestForm;
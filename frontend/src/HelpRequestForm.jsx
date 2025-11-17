import { useState, useEffect } from "react";
import "./index.css";
import { useRequests } from "./context/RequestsContext"; 
import { useChat } from "./context/ChatContext"; 
import { useVolunteers } from "./context/VolunteerContext"; 
import io from 'socket.io-client';

const API_BASE_URL = "http://localhost:3001/api/requests"; 
const SOCKET_SERVER_URL = "http://localhost:3001"; 

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const VictimStatusChat = ({ request, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { volunteers } = useVolunteers();
    const [inputText, setInputText] = useState('');
    const messages = getMessages(request.id);

    const assignedVolunteer = volunteers.find(v => v.id === request.assignedVolunteerId);
    const volunteerName = assignedVolunteer ? assignedVolunteer.fullName : 'A Volunteer';

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit('join_room', request.id); 

        const messageListener = (data) => {
            addMessage(data.roomId, data.sender, data.text);
        };
        socket.on('receive_message', messageListener);

        return () => socket.off('receive_message', messageListener);
    }, [request.id, addMessage]); 

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;

        const sender = request.victimName;
        const messageText = inputText.trim();

        const messageData = { roomId: request.id, sender, text: messageText };
        socket.emit('send_message', messageData);
        addMessage(request.id, sender, messageText);

        setInputText('');
    };

    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden' }}>
                <div style={{
                    background: request.assignedVolunteerId ? '#4CAF50' : '#f44336',
                    color: 'white', padding: '1rem', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {request.assignedVolunteerId ? `Matched with ${volunteerName}` : `🚨 Request ID: ${request.id} Pending... (Score: ${request.urgencyScore.toFixed(2)})`}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
                    <p className="text-sm font-semibold">Location: {request.location} | Type: {request.emergencyType}</p>
                    {request.assignedVolunteerId
                        ? <p className="mt-2 text-green-700 font-bold">Volunteer is on the way. Use chat below!</p>
                        : <p className="mt-2 text-red-700 font-bold">Please wait. Coordinators are assigning help.</p>
                    }
                </div>

                <div style={{ height: '250px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '10%' }}>Start the chat or wait for the volunteer to reach out.</p>}
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.sender === request.victimName ? 'flex-end' : 'flex-start',
                            marginBottom: '0.5rem',
                        }}>
                            <div style={{
                                maxWidth: '75%',
                                padding: '0.5rem 1rem',
                                borderRadius: '15px',
                                backgroundColor: msg.sender === request.victimName ? '#f44336' : '#2196F3',
                                color: 'white',
                            }}>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>
                                    {msg.sender === request.victimName ? 'You (Victim)' : msg.sender}
                                </p>
                                <p style={{ margin: '0.2rem 0 0', wordWrap: 'break-word' }}>{msg.text}</p>
                                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '0.3rem' }}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send message to volunteer/coordinator..."
                        style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px 0 0 8px' }}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '1rem' }}>Send</button>
                </form>
            </div>
        </div>
    );
};

/* ===== Help Request Form ===== */
const HelpRequestForm = ({ onClose }) => {
    const { addRequest, requests } = useRequests();
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        location: "",
        emergencyType: "",
        details: "",
    });
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const validateForm = () => {
    if (!formData.name.trim()) return "Full Name is required.";

    if (!/^[A-Za-z\s]+$/.test(formData.name)) {
        return "Full Name cannot contain numbers or special characters.";
    }

    if (!formData.contact.trim()) return "Contact is required.";
    if (!/^\d{10}$/.test(formData.contact)) return "Contact must be a 10-digit number.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.emergencyType.trim()) return "Please select the type of emergency.";
    if (formData.details.length > 500) return "Additional details cannot exceed 500 characters.";
    return null;
};


    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const payload = {
                victimName: formData.name, 
                contact: formData.contact,
                location: formData.location,
                emergencyType: formData.emergencyType,
                details: formData.details,
            };

            const response = await fetch(API_BASE_URL, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                const newRequest = { 
                    ...formData, 
                    id: data.requestId, 
                    status: 'Pending', 
                    urgencyScore: data.urgencyScore,
                    victimName: formData.name, 
                }; 
                
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
                {error && <div style={{ color: 'white', background: '#f44336', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <label>Full Name:<input type="text" name="name" value={formData.name} onChange={handleChange} /></label>
                    <label>Contact:<input type="text" name="contact" value={formData.contact} onChange={handleChange} /></label>
                    <label>Location:<input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Area" /></label>
                    <label>Emergency Type:
                        <select name="emergencyType" value={formData.emergencyType} onChange={handleChange}>
                            <option value="">--Select Assistance Needed--</option>
                            <option value="Medical">🏥 Medical Aid / First Aid</option>
                            <option value="Water">💧 Drinking Water / Hydration</option>
                            <option value="Food">🍲 Food Rations / Cooked Meals</option>
                            <option value="Shelter">⛺ Temporary Shelter / Tarpaulin</option>
                            <option value="Flooding">🌊 Flood / Monsoon Rescue</option>
                            <option value="Missing">🔍 Search for Missing Person</option>
                            <option value="Electricity">💡 Electricity / Power Loss</option>
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

export default HelpRequestForm;

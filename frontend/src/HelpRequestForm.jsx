
import { useState } from "react";
import "./index.css";
import { useRequests } from "./context/RequestsContext";
import { useChat } from "./context/ChatContext";
import { useVolunteers } from "./context/VolunteerContext"; 

const API_BASE_URL = "http://localhost:3001/api/requests";

// --- Victim Status and Chat View Component ---
const VictimStatusChat = ({ request, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { volunteers } = useVolunteers();
    const [inputText, setInputText] = useState('');
    const messages = getMessages(request.id);

    // Find the assigned volunteer's name based on the local context 
    const assignedVolunteer = volunteers.find(v => v.id === request.assignedVolunteerId);
    const volunteerName = assignedVolunteer ? assignedVolunteer.fullName : 'A Volunteer';

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;
        addMessage(request.id, request.victimName, inputText.trim()); 
        setInputText('');
    };

    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
             <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden' }}>
                 {/* Status Header */}
                <div style={{ background: request.assignedVolunteerId ? '#4CAF50' : '#f44336', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {request.assignedVolunteerId ? `✅ Matched with ${volunteerName}` : `🚨 Request ID: ${request.id} Pending... (Score: ${request.urgencyScore.toFixed(2)})`}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
                    <p className="text-sm font-semibold">Location: {request.location} | Type: {request.emergencyType}</p>
                    {request.assignedVolunteerId ? (
                        <p className="mt-2 text-green-700 font-bold">Volunteer is on the way. Use chat below!</p>
                    ) : (
                        <p className="mt-2 text-red-700 font-bold">Please wait. Coordinators are assigning help.</p>
                    )}
                </div>
                
                {/* Chat Area (Uses logic from ChatBox) */}
                <div style={{ height: '250px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '10%' }}>Start the chat or wait for the volunteer to reach out.</p>
                    )}
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

                {/* Input Area */}
                <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send message to volunteer/coordinator..."
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

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(API_BASE_URL, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Use the real Request ID and Urgency Score returned by the backend
                const newRequest = { 
                    ...formData, 
                    id: data.requestId, 
                    status: 'Pending', 
                    urgencyScore: data.urgencyScore 
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
    
    // RENDER: If request is submitted, show the status/chat view.
    if (submittedRequest) {
        const liveRequest = requests.find(req => req.id === submittedRequest.id) || submittedRequest;
        
        return (
            <VictimStatusChat 
                request={liveRequest} 
                onClose={onClose} 
            />
        );
    }

    // RENDER: Initial Form
    return (
        <div className="form-overlay">
            <div className="form-container">
                <h2>🚨 Request Help</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Full Name:
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </label>
                    <label>
                        Contact:
                        <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />
                    </label>
                    <label>
                        Location:
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Area" required />
                    </label>
                    <label>
                        Emergency Type:
                        <select name="emergencyType" value={formData.emergencyType} onChange={handleChange} required>
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
                    <label>
                        Additional Details:
                        <textarea name="details" value={formData.details} onChange={handleChange} placeholder="Describe the situation..." />
                    </label>
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
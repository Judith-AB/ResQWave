import { useState } from "react";
import "./index.css";
import { useRequests } from "./context/RequestsContext";
import { useChat } from "./context/ChatContext";
import { useVolunteers } from "./context/VolunteerContext";


const VictimStatusChat = ({ request, onClose }) => {
    const { getMessages, addMessage } = useChat();
    const { volunteers } = useVolunteers();
    const [inputText, setInputText] = useState('');
    const messages = getMessages(request.id);

    
    const assignedVolunteer = volunteers.find(v => v.id === request.assignedVolunteerId);
    const volunteerName = assignedVolunteer ? assignedVolunteer.name : 'A Volunteer';

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;
        addMessage(request.id, request.name, inputText.trim()); // Sender is the Victim's name
        setInputText('');
    };

    return (
        <div className="form-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="form-container" style={{ width: '450px', padding: '0', overflow: 'hidden' }}>
          
                <div style={{ background: request.assignedVolunteerId ? '#4CAF50' : '#f44336', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {request.assignedVolunteerId ? `✅ Matched with ${volunteerName}` : `🚨 Request ID: ${request.id} Pending...`}
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

               
                <div style={{ height: '250px', overflowY: 'auto', padding: '1rem', background: '#f0f2f5' }}>
                    {messages.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '10%' }}>Start the chat or wait for the volunteer to reach out.</p>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            justifyContent: msg.sender === request.name ? 'flex-end' : 'flex-start',
                            marginBottom: '0.5rem',
                        }}>
                            <div style={{
                                maxWidth: '75%',
                                padding: '0.5rem 1rem',
                                borderRadius: '15px',
                        
                                backgroundColor: msg.sender === request.name ? '#f44336' : '#2196F3',
                                color: 'white',
                            }}>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.8 }}>
                                    {msg.sender === request.name ? 'You (Victim)' : msg.sender}
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

    const handleSubmit = (e) => {
        e.preventDefault();

        const requestId = Date.now();
        const newRequest = {
            ...formData,
            id: requestId,
            status: 'Pending',
            assignedVolunteerId: null
        };

        addRequest(newRequest);
        setSubmittedRequest(newRequest);
    };

    if (submittedRequest) {
        const liveRequest = requests.find(req => req.id === submittedRequest.id) || submittedRequest;

        return (
            <VictimStatusChat
                request={liveRequest}
                onClose={onClose}
            />
        );
    }

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
                            <option value="Medical">🏥 Medical Aid</option>
                            <option value="Food">🍎 Food / Water Supply</option>
                            <option value="Rescue">🚨 Search & Rescue</option>
                            <option value="Shelter">⛺ Temporary Shelter</option>
                            <option value="Transportation">🚌 Transportation / Evacuation</option>
                            <option value="Other">⚠️ Other / Critical Need</option>
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
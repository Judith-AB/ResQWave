import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import ChatBox from './ChatBox'; 
import './index.css'; 

// Enhanced Icon Placeholders
const CheckCircle = () => <span style={{ color: '#4CAF50', marginRight: '5px' }}>✅</span>;
const AlertTriangle = () => <span style={{ color: '#FF9800', marginRight: '5px' }}>⚠️</span>;
const LogOut = () => <span style={{ color: 'white', fontWeight: 'bold' }}>⏏</span>;
const ChatIcon = () => <span style={{ color: 'white', fontSize: '1.2em' }}>💬</span>;
const UserIcon = () => <span style={{ color: '#2196F3', marginRight: '5px' }}>👤</span>;

// Define the API URL for fetching dashboard data
const API_BASE_URL = "http://localhost:3001/api/requests"; 

// Helper function to get status colors
const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return { accent: '#4CAF50', background: '#e8f5e9', text: '#2e7d32' };
        case 'Atmost': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' }; // HIGHEST URGENCY
        case 'Pending': return { accent: '#FF9800', background: '#fff3e0', text: '#ef6c00' };
        case 'Assigned': return { accent: '#2196F3', background: '#e3f2fd', text: '#1565C0' };
        default: return { accent: '#999', background: '#f0f0f0', text: '#666' };
    }
};

// --- STATS CARD Component ---
const StatCard = ({ title, value, icon, color }) => (
    <div style={{
        background: 'white',
        padding: '2rem 1.5rem',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
        borderTop: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.3s ease',
        cursor: 'default',
    }}>
        <div style={{ 
            fontSize: '0.9rem', 
            color: '#666', 
            fontWeight: '500', 
            display: 'flex', 
            alignItems: 'center',
            opacity: 0.8
        }}>
            {icon} &nbsp; {title}
        </div>
        <div style={{ fontSize: '2.8rem', fontWeight: '800', color: color, marginTop: '0.2rem' }}>{value}</div>
    </div>
);
// -----------------------------

const AdminDashboard = () => {
    const { logoutAdmin } = useAuth();
    // Using local state to hold data fetched from the backend
    const [requests, setRequests] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [activeTab, setActiveTab] = useState('requests'); 
    const [activeChat, setActiveChat] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to refresh data after assignment/completion
    const refreshData = () => {
        setLoading(true);
        setError(null);
        fetchData();
    }

    // --- Data Fetch Effect (Fetches all dashboard data on load) ---
    const fetchData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/pending`);
            const data = await response.json();
            
            if (response.ok) {
                setRequests(data.requests);
                setVolunteers(data.volunteers);
            } else {
                setError(data.message || "Failed to load dashboard data.");
            }
        } catch (err) {
            setError("Connection failed. Ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    // Placeholder functions (These will be updated to call the backend in the next steps)
    const handleAssign = (requestId, volunteerId) => {
        alert(`ACTION: Assigned Req ${requestId} to Vol ${volunteerId}. Build POST /api/assignments endpoint next.`);
        // Placeholder for immediate UI feedback:
        refreshData(); 
    };
    
    const handleComplete = (requestId, volunteerId) => {
        alert(`ACTION: Mark Req ${requestId} as Completed. Build POST /api/requests/resolve endpoint next.`);
        // Placeholder for immediate UI feedback:
        refreshData(); 
    };
    
    // Calculations for the Stat Cards
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'Pending').length;
    const assignedRequests = requests.filter(r => r.status === 'Assigned' || r.status === 'Atmost').length;
    const totalVolunteers = volunteers.length;
    const availableVolunteers = volunteers.filter(v => v.status === 'Available').length; // NOTE: Status must be fetched from backend later
    const getVolunteerName = (req) => {
        return volunteers.find(v => v.id === req.assignedVolunteerId)?.fullName || 'Unassigned';
    };


    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '200px', fontSize: '1.5rem', color: '#1565C0' }}>Loading Dashboard Data...</div>;
    }
    if (error) {
        return <div style={{ textAlign: 'center', paddingTop: '200px', fontSize: '1.5rem', color: '#f44336' }}>Error: {error}</div>;
    }
    
    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '100px 2rem 4rem' }}>
          
          {/* Header */}
          <header style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem', 
            paddingBottom: '1rem', 
            borderBottom: '2px solid #e0e0e0' 
          }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#1565C0' }}>
              Coordination Dashboard
            </h1>
            <button 
              onClick={logoutAdmin} 
              className="btn-help" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'linear-gradient(135deg, #d32f2f, #b71c1c)' 
              }}
            >
              <LogOut /> LOG OUT
            </button>
          </header>
          
          {/* Stats Row */}
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem', 
            marginBottom: '3rem' 
          }}>
            <StatCard title="Total Requests" value={totalRequests} color="#f44336" icon="❤️" />
            <StatCard title="Assigned Requests" value={assignedRequests} color="#FF9800" icon="⏳" />
            <StatCard title="Total Volunteers" value={totalVolunteers} color="#4CAF50" icon="🤝" />
            <StatCard title="Available Volunteers" value={availableVolunteers} color="#2196F3" icon="✅" />
          </div>

          {/* Tabs */}
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setActiveTab('requests')} 
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'requests' ? '4px solid #f44336' : '4px solid transparent',
                  color: activeTab === 'requests' ? '#f44336' : '#666',
                  transition: 'all 0.3s ease',
                }}
              >
                Help Requests
              </button>
              <button 
                onClick={() => setActiveTab('volunteers')} 
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'volunteers' ? '4px solid #4CAF50' : '4px solid transparent',
                  color: activeTab === 'volunteers' ? '#4CAF50' : '#666',
                  transition: 'all 0.3s ease',
                }}
              >
                Volunteers
              </button>
            </div>

            {/* Requests Tab Content */}
            {activeTab === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {requests.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No active help requests right now.</p>}
                {requests.map(req => {
                    const statusStyle = getStatusColor(req.status);
                    const isMedical = req.emergencyType.toLowerCase().includes('medical');

                    return (
                        <div key={req.id} style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            borderLeft: `6px solid ${statusStyle.accent}`,
                            transition: 'box-shadow 0.2s ease',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>
                                        {req.emergencyType} in {req.location} (Score: {req.urgencyScore.toFixed(2)})
                                    </h4>
                                    <span style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: '700',
                                        color: isMedical ? '#d32f2f' : '#2e7d32',
                                        marginRight: '10px'
                                    }}>
                                        {isMedical && 'MEDICAL REQUEST'}
                                    </span>
                                </div>
                                
                                <span style={{ 
                                    padding: '4px 12px', 
                                    borderRadius: '20px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    background: statusStyle.background,
                                    color: statusStyle.text,
                                }}>
                                    {req.status}
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>
                                Requester: **{req.victimName}** | Contact: {req.contact}
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#444', fontStyle: 'italic', marginBottom: '1rem' }}>
                                Details: "{req.details}"
                            </p>

                            {/* Assignment & Action Block */}
                            <div style={{ borderTop: '1px dashed #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            
                                {/* Status Display */}
                                {req.status === 'Completed' ? (
                                    <p style={{ color: '#2e7d32', fontWeight: '700', margin: 0 }}><CheckCircle /> RESOLVED</p>
                                ) : req.assignedVolunteerId ? (
                                    <p style={{ color: '#1565C0', fontWeight: '600', margin: 0 }}>
                                        Assigned to: {getVolunteerName(req)}
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Assign Volunteer:</label>
                                        <select 
                                            onChange={(e) => handleAssign(req.id, parseInt(e.target.value))}
                                            defaultValue=""
                                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}
                                            // Filter volunteers by medical verification if needed
                                            disabled={volunteers.length === 0}
                                        >
                                            <option value="" disabled>{volunteers.length === 0 ? 'No Vols Available' : '-- Select --'}</option>
                                            {volunteers
                                                // Filter logic: If medical request, only show verified medical volunteers
                                                .filter(v => !isMedical || v.isMedicalVerified) 
                                                .filter(v => v.status === 'Available' || v.status === undefined) // Only show available for simplicity
                                                .map(v => (
                                                <option key={v.id} value={v.id}>{v.fullName} {v.isMedicalVerified ? '(Verified)' : ''} ({v.skills || 'N/A'})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Actions (Chat & Complete) */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {req.assignedVolunteerId && (
                                    <button 
                                        onClick={() => setActiveChat({ requestId: req.id, senderName: getVolunteerName(req) })}
                                        className="btn-primary" 
                                        style={{ background: '#2196F3', color: 'white', padding: '10px 18px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 10px rgba(33, 150, 243, 0.2)' }}
                                    >
                                        <ChatIcon /> Join Chat
                                    </button>
                                    )}
                                    {req.assignedVolunteerId && req.status !== 'Completed' && (
                                    <button 
                                        onClick={() => handleComplete(req.id, req.assignedVolunteerId)}
                                        className="btn-secondary"
                                        style={{ background: '#4CAF50', color: 'white', padding: '10px 18px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 10px rgba(76, 175, 80, 0.2)' }}
                                    >
                                        Mark Completed
                                    </button>
                                    )}
                                </div>
                                
                            </div>
                        </div>
                    );
                })}
              </div>
            )}

            {/* Volunteers Tab Content (Will be finalized in a later step) */}
            {activeTab === 'volunteers' && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    Volunteer list management will be implemented here.
                </div>
            )}
          </div>

          {/* Chat Box Modal */}
          {activeChat && (
            <ChatBox
              requestId={activeChat.requestId}
              participantName={activeChat.senderName} 
              onClose={() => setActiveChat(null)}
            />
          )}
        </div>
    );
};

export default AdminDashboard;
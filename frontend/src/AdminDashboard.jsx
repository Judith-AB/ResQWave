// --- frontend/AdminDashboard.jsx (FINAL, COMPLETE CODE) ---
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import ChatBox from './ChatBox';
import io from 'socket.io-client';
import './index.css';
// NOTE: Assume helper components (CheckCircle, LogOut, etc.) are defined or imported

const REQUEST_API_URL = "http://localhost:3001/api/requests";
const ASSIGNMENT_API_URL = "http://localhost:3001/api/assignments";
const API_AUTH_URL = "http://localhost:3001/api/auth"; // For verification
const SOCKET_SERVER_URL = "http://localhost:3001";

// Initialize socket client
const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

// Helper components and functions (Simplified)
const CheckCircle = () => <span style={{ color: '#4CAF50', marginRight: '5px' }}>✅</span>;
const LogOut = () => <span style={{ color: 'white', fontWeight: 'bold' }}>⏏</span>;
const ChatIcon = () => <span style={{ color: 'white', fontSize: '1.2em' }}>💬</span>;
const UserIcon = () => <span style={{ color: '#2196F3', marginRight: '5px' }}>👤</span>;

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return { accent: '#4CAF50', background: '#e8f5e9', text: '#2e7d32' };
        case 'Conflict': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' };
        case 'Atmost': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' };
        case 'Pending': return { accent: '#FF9800', background: '#fff3e0', text: '#ef6c00' };
        case 'Assigned': return { accent: '#2196F3', background: '#e3f2fd', text: '#1565C0' };
        default: return { accent: '#999', background: '#f0f0f0', text: '#666' };
    }
};

const StatCard = ({ title, value, icon, color }) => (
    <div style={{
        background: 'white', padding: '2rem 1.5rem', borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
        borderTop: `4px solid ${color}`, display: 'flex', flexDirection: 'column',
    }}>
        <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
            {icon} &nbsp; {title}
        </div>
        <div style={{ fontSize: '2.8rem', fontWeight: '800', color: color, marginTop: '0.2rem' }}>{value}</div>
    </div>
);


const AdminDashboard = () => {
    const { logoutAdmin } = useAuth();
    const [requests, setRequests] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [conflictAlert, setConflictAlert] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState({});

    const refreshData = () => {
        setLoading(true);
        setError(null);
        fetchData();
    }

    const fetchData = async () => {
        try {
            // Fetches all active requests (Pending, Assigned, Conflict, Atmost) and all volunteers
            const response = await fetch(`${REQUEST_API_URL}/pending`);
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

        // --- SOCKET.IO SETUP FOR ADMIN ALERTS ---
        if (!socket.connected) {
            socket.connect();
        }
        // Admin joins the dedicated alert room to receive conflict broadcasts
        socket.emit('join_room', 'admin_room');

        const adminAlertListener = (data) => {
            setConflictAlert(data);
            refreshData(); // Updates request list status immediately
            // Opens chat for Admin to intervene instantly
            setActiveChat({ requestId: data.requestId, senderName: 'Admin' });
        };

        socket.on('new_conflict_alert', adminAlertListener);

        return () => {
            socket.off('new_conflict_alert', adminAlertListener);
        };
    }, []);


    // --- ACTION HANDLERS ---

    const handleAssign = async (requestId, volId) => {
        const volunteerId = parseInt(volId);
        if (!volunteerId) {
            alert("Please select a volunteer first.");
            return;
        }

        if (!window.confirm(`Assign Request #${requestId} to Volunteer ID ${volunteerId}?`)) return;

        try {
            // Triggers backend assignment logic which emits real-time notification
            const response = await fetch(`${ASSIGNMENT_API_URL}/admin-assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, volunteerId }),
            });

            if (response.ok) {
                alert(`Request ${requestId} successfully assigned!`);
            } else {
                const data = await response.json();
                alert(`Assignment failed: ${data.message}`);
            }
            refreshData();

        } catch (error) {
            alert("Network error during assignment. Check server connection.");
        }
    };

    const handleComplete = async (requestId) => {
        // Confirmation Modal for Admin Override
        if (!window.confirm("ADMIN OVERRIDE: Are you sure you want to mark this request as RESOLVED? This confirms mutual resolution and resets the assigned volunteer's status.")) return;
        try {
            // Triggers Admin Manual Resolution endpoint
            const response = await fetch(`${ASSIGNMENT_API_URL}/resolve/${requestId}/admin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                alert(`Request ${requestId} marked as RESOLVED.`);
            } else {
                const data = await response.json();
                alert(`Resolution failed: ${data.message}`);
            }
            refreshData();
        } catch (err) {
            alert("Failed to resolve request.");
        }
    };

    // --- MEDICAL PROOF VERIFICATION HANDLER ---
    const handleVerifyMedical = async (userId) => {
        // In a real app, this would open a modal to view the proof file (proofUrl)
        if (!window.confirm(`Verify medical certification for User ID ${userId}? This will grant access to medical tasks.`)) return;

        try {
            // PUT call to the new verification route
            const response = await fetch(`${API_AUTH_URL}/verify-medical/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                alert(`Volunteer ${userId} verified successfully!`);
            } else {
                alert('Verification failed on server.');
            }
            refreshData(); // Reload the dashboard data
        } catch (error) {
            alert("Network error during verification.");
        }
    };


    // --- DATA CALCULATIONS ---

    const totalRequests = requests.length;
    const conflictRequests = requests.filter(r => r.status === 'Conflict' || r.status === 'Atmost').length;
    const assignedRequests = requests.filter(r => r.status === 'Assigned' || r.status === 'Atmost' || r.status === 'Conflict').length;
    const totalVolunteers = volunteers.length;
    const availableVolunteers = volunteers.filter(v => v.status === 'Available' || !v.status).length;

    const getVolunteerName = (req) => {
        const assignment = req.assignments?.[0];

        if (assignment && (req.status === 'Assigned' || req.status === 'Atmost' || req.status === 'Conflict')) {
            const volunteer = assignment.volunteer;
            const acceptedStatus = assignment.isAccepted ? 'Accepted' : 'Pending Acceptance';
            return `${volunteer?.fullName || 'Assigned'} (${acceptedStatus})`;
        }
        return 'Unassigned';
    };


    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '200px', fontSize: '1.5rem', color: '#1565C0' }}>Loading Dashboard Data...</div>;
    }
    if (error) {
        return <div style={{ textAlign: 'center', paddingTop: '200px', fontSize: '1.5rem', color: '#f44336' }}>Error: {error}</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '100px 2rem 4rem' }}>
            <header style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
                <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: '#1565C0' }}>Coordination Dashboard</h1>
                <button onClick={logoutAdmin} className="btn-help" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #d32f2f, #b71c1c)' }}><LogOut /> LOG OUT</button>
            </header>

            {/* REAL-TIME CONFLICT ALERT BANNER */}
            {conflictAlert && (
                <div
                    style={{
                        maxWidth: '1200px', margin: '0 auto 2rem', padding: '1.5rem', borderRadius: '12px',
                        background: '#f44336', color: 'white', fontWeight: 'bold', fontSize: '1.1rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)'
                    }}
                >
                    🚨 LIVE CONFLICT ALERT: Request **#{conflictAlert.requestId}** reported by **{conflictAlert.reporter}**. Reason: {conflictAlert.reason}
                    <button onClick={() => setConflictAlert(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>
            )}

            {/* STAT CARDS */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title="Total Active" value={totalRequests} color="#f44336" icon="❤️" />
                <StatCard title="Assigned / Active" value={assignedRequests} color="#FF9800" icon="⏳" />
                <StatCard title="🚨 CONFLICTS" value={conflictRequests} color="#d32f2f" icon="❌" />
                <StatCard title="Available Volunteers" value={availableVolunteers} color="#2196F3" icon="✅" />
            </div>


            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
                    <button onClick={() => setActiveTab('requests')} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeTab === 'requests' ? '4px solid #f44336' : '4px solid transparent', color: activeTab === 'requests' ? '#f44336' : '#666', transition: 'all 0.3s ease' }}>Help Requests</button>
                    <button onClick={() => setActiveTab('volunteers')} style={{ padding: '0.75rem 1.5rem', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'none', borderBottom: activeTab === 'volunteers' ? '4px solid #4CAF50' : '4px solid transparent', color: activeTab === 'volunteers' ? '#4CAF50' : '#666', transition: 'all 0.3s ease' }}>Volunteers</button>
                </div>


                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {requests.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No active help requests right now.</p>}
                        {requests.map(req => {
                            const statusStyle = getStatusColor(req.status);
                            const isMedical = req.emergencyType.toLowerCase().includes('medical');
                            const assignedVolunteerName = getVolunteerName(req);
                            const isConflict = req.status === 'Conflict' || req.status === 'Atmost';

                            const availableVols = volunteers.filter(v =>
                                (v.status === 'Available' || !v.status) && (!isMedical || v.isMedicalVerified)
                            );

                            return (
                                <div key={req.id} style={{
                                    background: 'white', padding: '1.5rem', borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                    borderLeft: `6px solid ${isConflict ? '#d32f2f' : statusStyle.accent}`,
                                    transition: 'box-shadow 0.2s ease', cursor: 'default'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'}
                                >
                                    {/* Header and Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>
                                                {req.emergencyType} in {req.location} (Score: {req.urgencyScore.toFixed(2)})
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isMedical ? '#d32f2f' : '#2e7d32', marginRight: '10px' }}>
                                                {isMedical && 'MEDICAL REQUEST'}
                                            </span>
                                        </div>

                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', background: statusStyle.background, color: statusStyle.text }}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>Requester: **{req.victimName}** | Contact: {req.contact}</p>
                                    <p style={{ fontSize: '0.9rem', color: '#444', fontStyle: 'italic', marginBottom: '1rem' }}>Details: "{req.details}"</p>

                                    {/* Assignment and Action Buttons */}
                                    <div style={{ borderTop: '1px dashed #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>

                                        {(req.status === 'Assigned' || isConflict) ? (
                                            <p style={{ color: statusStyle.accent, fontWeight: '600', margin: 0 }}>
                                                Assigned to: **{assignedVolunteerName}**
                                            </p>
                                        ) : req.status === 'Completed' ? (
                                            <p style={{ color: '#2e7d32', fontWeight: '700', margin: 0 }}><CheckCircle /> RESOLVED</p>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>Assign Volunteer:</label>
                                                <select
                                                    onChange={(e) => setSelectedVolunteer(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    value={selectedVolunteer[req.id] || ""}
                                                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}
                                                    disabled={availableVols.length === 0}
                                                >
                                                    <option value="" disabled>{availableVols.length === 0 ? 'No Vols Available' : '-- Select --'}</option>
                                                    {availableVols.map(v => (
                                                        <option key={v.id} value={v.id}>{v.fullName} {v.isMedicalVerified ? ' (Verified)' : ''} ({v.skills || 'N/A'})</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleAssign(req.id, selectedVolunteer[req.id])}
                                                    disabled={!selectedVolunteer[req.id]}
                                                    style={{ padding: '8px 15px', background: '#FF9800', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    ASSIGN
                                                </button>
                                            </div>
                                        )}


                                        <div style={{ display: 'flex', gap: '10px' }}>

                                            {/* Chat button for Assigned/Conflict requests */}
                                            {(req.status === 'Assigned' || isConflict) && (
                                                <button onClick={() => setActiveChat({ requestId: req.id, senderName: 'Admin' })} className="btn-primary" style={{ background: isConflict ? '#d32f2f' : '#2196F3', color: 'white', padding: '10px 18px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 10px rgba(33, 150, 243, 0.2)' }}>
                                                    <ChatIcon /> {isConflict ? 'INTERVENE CHAT' : 'JOIN CHAT'}
                                                </button>
                                            )}
                                            {/* Mark Completed button (Admin Override) */}
                                            {req.status !== 'Completed' && (
                                                <button onClick={() => handleComplete(req.id)} className="btn-secondary" style={{ background: '#4CAF50', color: 'white', padding: '10px 18px', fontSize: '0.9rem', fontWeight: '700', borderRadius: '8px', boxShadow: '0 4px 10px rgba(76, 175, 80, 0.2)' }}>
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

                {/* Volunteers Tab */}
                {activeTab === 'volunteers' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', padding: '1.5rem 0' }}>
                        {volunteers.map(v => {
                            // Determine if proof needs review
                            const needsProofReview = v.proofs && v.proofs.length > 0 && !v.isMedicalVerified;

                            return (
                                <div key={v.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', borderLeft: `6px solid ${v.isMedicalVerified ? '#4CAF50' : (needsProofReview ? '#FF9800' : (v.status === 'Available' ? '#2196F3' : '#FF9800'))}`, transition: 'box-shadow 0.2s ease', cursor: 'default' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#333' }}><UserIcon />{v.fullName}</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>Location: {v.location} | Contact: {v.contact}</p>
                                    <p style={{ fontSize: '0.9rem', color: '#1565C0', fontWeight: '600', marginBottom: '1rem' }}>Expertise: **{v.skills || 'N/A'}**</p>

                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', background: v.status === 'Available' ? '#e8f5e9' : '#fff3e0', color: v.status === 'Available' ? '#2e7d32' : '#ef6c00' }}>
                                            {v.status || 'Available'}
                                        </span>
                                        {v.isMedicalVerified ? (
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#fff', fontWeight: '700', background: '#4CAF50' }}>
                                                MEDICALLY VERIFIED
                                            </span>
                                        ) : needsProofReview ? (
                                            // Show verification button ONLY if proof record exists and status is unverified
                                            <button
                                                onClick={() => handleVerifyMedical(v.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: '#FF9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                VERIFY PROOF 📋
                                            </button>
                                        ) : (
                                            // Default state for general volunteers who haven't submitted anything
                                            <span style={{ fontSize: '0.8rem', color: '#999' }}>General Access</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* ChatBox for Admin intervention */}
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
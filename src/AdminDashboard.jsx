import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useRequests } from './context/RequestsContext';
import { useVolunteers } from './context/VolunteerContext';
import ChatBox from './ChatBox';
import './index.css';


const CheckCircle = () => <span style={{ color: '#4CAF50', marginRight: '5px' }}>✅</span>;
const AlertTriangle = () => <span style={{ color: '#FF9800', marginRight: '5px' }}>⚠️</span>;
const LogOut = () => <span style={{ color: 'white', fontWeight: 'bold' }}>⏏</span>;
const ChatIcon = () => <span style={{ color: 'white', fontSize: '1.2em' }}>💬</span>;
const UserIcon = () => <span style={{ color: '#2196F3', marginRight: '5px' }}>👤</span>;

const AdminDashboard = () => {
    const { logoutAdmin } = useAuth();
    const { requests, updateRequest } = useRequests();
    const { volunteers, updateVolunteer } = useVolunteers();
    const [activeTab, setActiveTab] = useState('requests');
    const [activeChat, setActiveChat] = useState(null);

    const handleAssign = (requestId, volunteerId) => {
        updateRequest(requestId, { assignedVolunteerId: volunteerId, status: 'Assigned' });
        updateVolunteer(volunteerId, { status: 'Busy' });
    };

    const handleComplete = (requestId, volunteerId) => {
        updateRequest(requestId, { status: 'Completed' });
        if (volunteerId) {
            updateVolunteer(volunteerId, { status: 'Available' });
        }
    };

    const availableVolunteers = volunteers.filter(v => v.status === 'Available');
    const getVolunteerName = (req) => {
        return volunteers.find(v => v.id === req.assignedVolunteerId)?.name || 'Unassigned';
    };

    
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.status === 'Pending').length;
    const totalVolunteers = volunteers.length;
    const busyVolunteers = volunteers.filter(v => v.status === 'Busy').length;


    const StatCard = ({ title, value, icon, color }) => (
        <div style={{
            background: 'white',
            padding: '2rem 1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.05)', // Added inset shadow for crisp edge
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

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '100px 2rem 4rem' }}>

         
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
                        background: 'linear-gradient(135deg, #d32f2f, #b71c1c)' // Slightly darker red gradient
                    }}
                >
                    <LogOut /> LOG OUT
                </button>
            </header>

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <StatCard title="Total Requests" value={totalRequests} color="#f44336" icon="❤️" />
                <StatCard title="Pending Requests" value={pendingRequests} color="#FF9800" icon="⏳" />
                <StatCard title="Total Volunteers" value={totalVolunteers} color="#4CAF50" icon="🤝" />
                <StatCard title="Available Volunteers" value={totalVolunteers - busyVolunteers} color="#2196F3" icon="✅" />
            </div>

         
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

                {activeTab === 'requests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {requests.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No help requests submitted yet.</p>}
                        {requests.map(req => (
                            <div key={req.id} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                borderLeft: `6px solid ${req.status === 'Completed' ? '#4CAF50' : req.status === 'Pending' ? '#FF9800' : '#2196F3'}`,
                                transition: 'box-shadow 0.2s ease',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#333' }}>
                                        {req.emergencyType} in {req.location}
                                    </h4>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: req.status === 'Completed' ? '#e8f5e9' : req.status === 'Pending' ? '#fff3e0' : '#e3f2fd',
                                        color: req.status === 'Completed' ? '#2e7d32' : req.status === 'Pending' ? '#ef6c00' : '#1565C0',
                                    }}>
                                        {req.status}
                                    </span>
                                </div>

                                <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>
                                    Requester: **{req.name}** | Contact: {req.contact}
                                </p>
                                <p style={{ fontSize: '0.9rem', color: '#444', fontStyle: 'italic', marginBottom: '1rem' }}>
                                    Details: "{req.details}"
                                </p>

                                <div style={{ borderTop: '1px dashed #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>

                                 
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
                                                disabled={availableVolunteers.length === 0}
                                            >
                                                <option value="" disabled>{availableVolunteers.length === 0 ? 'No Volunteers Available' : '-- Select --'}</option>
                                                {availableVolunteers.map(v => (
                                                    <option key={v.id} value={v.id}>{v.name} ({v.skills || 'N/A'})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}


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
                        ))}
                    </div>
                )}

             
                {activeTab === 'volunteers' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {volunteers.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No volunteers have signed up yet.</p>}
                        {volunteers.map(v => (
                            <div key={v.id} style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                borderLeft: `6px solid ${v.status === 'Available' ? '#4CAF50' : '#FF9800'}`,
                                transition: 'box-shadow 0.2s ease',
                                cursor: 'default'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'}
                            >
                                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#333' }}><UserIcon />{v.name}</h4>
                                <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0' }}>Contact: {v.contact}</p>
                                <p style={{ fontSize: '0.9rem', color: '#1565C0', fontWeight: '600', marginBottom: '1rem' }}>Expertise: **{v.skills || 'N/A'}**</p>

                                <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: v.status === 'Available' ? '#e8f5e9' : '#fff3e0',
                                        color: v.status === 'Available' ? '#2e7d32' : '#ef6c00',
                                    }}>
                                        {v.status}
                                    </span>
                                    {v.status === 'Busy' && (
                                        <p style={{ fontSize: '0.8rem', color: '#f44336', margin: 0, fontWeight: '600' }}>
                                            Assigned to Request ID: {requests.find(req => req.assignedVolunteerId === v.id)?.id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


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
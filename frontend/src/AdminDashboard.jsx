// --- frontend/AdminDashboard.jsx ---
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import ChatBox from './ChatBox';
import io from 'socket.io-client';
import './index.css';

const REQUEST_API_URL = "http://localhost:3001/api/requests";
const ASSIGNMENT_API_URL = "http://localhost:3001/api/assignments";
const API_AUTH_URL = "http://localhost:3001/api/auth";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return { accent: '#4CAF50', background: '#e8f5e9', text: '#2e7d32' };
    case 'Conflict': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' };
    case 'Reassign': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' };
    case 'Atmost': return { accent: '#d32f2f', background: '#ffebee', text: '#d32f2f' };
    case 'Pending': return { accent: '#FF9800', background: '#fff3e0', text: '#ef6c00' };
    case 'Assigned': return { accent: '#2196F3', background: '#e3f2fd', text: '#1565C0' };
    default: return { accent: '#999', background: '#f0f0f0', text: '#666' };
  }
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ background: 'white', padding: '1.4rem', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `6px solid ${color}` }}>
    <div style={{ color: '#666', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
  </div>
);

const AdminDashboard = () => {
  const { logoutAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${REQUEST_API_URL}/pending`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
        setVolunteers(data.volunteers || []);
      }
    } catch (err) {
      console.error('Admin fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!socket.connected) socket.connect();
    socket.emit('join_room', 'admin_room');

    const sysListener = (d) => {
      if (['Reassign', 'Atmost', 'Conflict', 'Assigned', 'Pending', 'Completed'].includes(d.status)) {
        fetchData();
      }
    };
    socket.on('system_notification', sysListener);
    return () => socket.off('system_notification', sysListener);
  }, []);

  const handleAssign = async (requestId) => {
    const volunteerId = selectedVolunteer[requestId];
    if (!volunteerId) return alert("Select a volunteer first.");
    if (!window.confirm(`Assign request ${requestId} to volunteer ${volunteerId}?`)) return;

    try {
      const res = await fetch(`${ASSIGNMENT_API_URL}/admin-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, volunteerId: parseInt(volunteerId) })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Assignment failed.");
      } else {
        alert("Assigned.");
      }
      fetchData();
    } catch (err) {
      alert("Network error during assign.");
    }
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm("Mark completed?")) return;
    await fetch(`${ASSIGNMENT_API_URL}/resolve/${requestId}/admin`, { method: 'PUT' });
    fetchData();
  };

  const handleVerifyMedical = async (userId) => {
    if (!window.confirm("Verify medical proof?")) return;
    await fetch(`${API_AUTH_URL}/verify-medical/${userId}`, { method: 'PUT' });
    fetchData();
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Loading...</div>;

  const totalRequests = requests.length;
  const conflictRequests = requests.filter(r => r.status === 'Conflict' || r.status === 'Reassign' || r.status === 'Atmost').length;
  const assignedRequests = requests.filter(r => r.status === 'Assigned').length;
  const availableVols = volunteers.filter(v => !v.status || v.status === 'Available').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '80px 24px' }}>
      <header style={{ maxWidth: 1200, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between' }}>
        <h1>Coordination Dashboard</h1>
        <button onClick={logoutAdmin} style={{ background: '#d32f2f', color: 'white', padding: '8px 14px', borderRadius: 8 }}>LOG OUT</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto 24px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard title="Total Active" value={totalRequests} color="#f44336" />
        <StatCard title="Assigned" value={assignedRequests} color="#FF9800" />
        <StatCard title="Conflicts / Reassign" value={conflictRequests} color="#d32f2f" />
        <StatCard title="Available Volunteers" value={availableVols} color="#2196F3" />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {requests.map(req => {
          const statusStyle = getStatusColor(req.status);
          const assigned = req.assignments?.[0];
          const assignedName = assigned?.volunteer?.fullName || 'Unassigned';
          const isAssignedToSomeoneElse = req.status === 'Assigned' && (!assigned || !assigned.volunteer);

          // Volunteers that are available (and med filter applied)
          const availableVols = volunteers.filter(v => (v.status === 'Available' || !v.status) && (!(req.emergencyType || '').toLowerCase().includes('medical') || v.isMedicalVerified || (v.fullName || '').startsWith('Dr.')));

          return (
            <div key={req.id} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `6px solid ${statusStyle.accent}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{req.emergencyType} in {req.location} (Score: {req.urgencyScore?.toFixed(2)})</h3>
                  {(req.emergencyType || '').toLowerCase() === 'medical' && <div style={{ color: '#d32f2f', fontWeight: 700 }}>MEDICAL</div>}
                  <div>Requester: {req.victimName} | {req.contact}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ padding: '6px 12px', background: statusStyle.background, color: statusStyle.text, borderRadius: 10, fontWeight: 700 }}>{req.status}</div>
                </div>
              </div>

              <p style={{ fontStyle: 'italic', marginTop: 8 }}>"{req.details}"</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div>
                  {/* If it's Pending or Reassign or Atmost -> show dropdown + assign */}
                  {['Pending', 'Reassign', 'Atmost'].includes(req.status) ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={selectedVolunteer[req.id] || ''} onChange={(e) => setSelectedVolunteer(prev => ({ ...prev, [req.id]: e.target.value }))} style={{ padding: 8, borderRadius: 8 }}>
                        <option value="">-- Select Volunteer --</option>
                        {availableVols.map(v => <option key={v.id} value={v.id}>{v.fullName} {v.isMedicalVerified ? '(Verified)' : ''}</option>)}
                      </select>
                      <button onClick={() => handleAssign(req.id)} style={{ background: '#FF9800', color: 'white', padding: '8px 12px', borderRadius: 8 }}>Assign</button>
                    </div>
                  ) : (
                    // Assigned or Completed -> show assigned name
                    <div style={{ fontWeight: 700 }}>Assigned to: {assignedName} {assigned?.isAccepted ? '(Accepted)' : '(Pending)'}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {(req.status === 'Assigned' || req.status === 'Conflict' || req.status === 'Reassign') && (
                    <button onClick={() => setActiveChat({ requestId: req.id, senderName: 'Admin' })} style={{ background: req.status === 'Conflict' ? '#d32f2f' : '#2196F3', color: 'white', padding: '8px 12px', borderRadius: 8 }}>
                      {req.status === 'Conflict' ? 'INTERVENE CHAT' : 'JOIN CHAT'}
                    </button>
                  )}
                  {req.status !== 'Completed' && <button onClick={() => handleComplete(req.id)} style={{ background: '#4CAF50', color: 'white', padding: '8px 12px', borderRadius: 8 }}>Mark Completed</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeChat && <ChatBox requestId={activeChat.requestId} participantName={activeChat.senderName} onClose={() => setActiveChat(null)} />}
    </div>
  );
};

export default AdminDashboard;

// --- frontend/VolunteerDashboard.jsx ---
import React, { useEffect, useState } from "react";
import "./index.css";
import ChatBox from './ChatBox';
import io from 'socket.io-client';

const ASSIGNMENT_API_URL = "http://localhost:3001/api/assignments";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const thStyle = { padding: "14px 20px", textAlign: "left", fontWeight: 600, fontSize: "14px", borderBottom: "1px solid #e2e8f0" };
const tdStyle = { padding: "14px 20px", fontSize: "14px", color: "#334155" };
const buttonAction = (color, disabled = false) => ({
  backgroundColor: disabled ? "#9ca3af" : color,
  border: "none",
  padding: "7px 12px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  color: "white",
  cursor: disabled ? "not-allowed" : "pointer",
  marginRight: "8px",
  minWidth: "75px",
  opacity: disabled ? 0.6 : 1
});

const getUrgencyStyle = (score) => {
  if (score >= 7.5) return { label: "Critical", background: "#fee2e2", color: "#b91c1c" };
  if (score >= 5.0) return { label: "High", background: "#fef3c7", color: "#b45309" };
  if (score >= 2.5) return { label: "Medium", background: "#e0f2fe", color: "#0369a1" };
  return { label: "Low", background: "#dcfce7", color: "#15803d" };
};

const VolunteerDashboard = ({ onClose, user }) => {
  const [requests, setRequests] = useState([]);
  const [myActiveAssignment, setMyActiveAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChatRequest, setActiveChatRequest] = useState(null);

  const volunteerId = user.id;

  const fetchData = () => {
    setLoading(true);
    fetch(`${ASSIGNMENT_API_URL}/available-tasks/${volunteerId}`)
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(err => { console.error("Fetch tasks error", err); setLoading(false); });
  };

  const fetchActiveAssignment = () => {
    fetch(`${ASSIGNMENT_API_URL}/my-active-task/${volunteerId}`)
      .then(res => res.json())
      .then(data => setMyActiveAssignment(data.activeRequest || null))
      .catch(err => console.error("fetch active", err));
  };

  useEffect(() => {
    fetchData();
    fetchActiveAssignment();

    if (!socket.connected) socket.connect();

    const listener = (data) => {
      if (["Pending", "Assigned", "Conflict", "Reassign", "Completed"].includes(data.status)) {
        fetchData();
        fetchActiveAssignment();
      }
    };

    socket.on('system_notification', listener);
    return () => socket.off('system_notification', listener);
  }, []);

  const handleAccept = async (reqId) => {
    if (!confirm("Accept this task?")) return;
    try {
      const res = await fetch(`${ASSIGNMENT_API_URL}/accept-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: reqId, volunteerId })
      });

      if (res.status === 403) {
        const data = await res.json();
        alert(data.message || "Only medical volunteers can accept medical requests.");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setActiveChatRequest({ requestId: reqId, participantName: user.fullName || user.username });
        alert("Request accepted — starting chat.");
        fetchData();
        fetchActiveAssignment();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to accept.");
      }
    } catch (err) {
      alert("Network error accepting.");
    }
  };

  const handleDecline = async (reqId) => {
    if (!confirm("Decline this task?")) return;
    try {
      const res = await fetch(`${ASSIGNMENT_API_URL}/volunteer-decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: reqId, volunteerId })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.needsAdminAssign) {
          alert("This request was declined by 3 volunteers. Admin must reassign.");
        } else {
          alert("Declined — request returned to queue.");
        }
        fetchData();
        fetchActiveAssignment();
      } else {
        alert(data.message || "Failed to decline.");
      }
    } catch {
      alert("Network error declining.");
    }
  };

  const handleResumeChat = (reqId) => {
    setActiveChatRequest({ requestId: reqId, participantName: user.fullName || user.username });
  };

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 50 }}>Loading tasks...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: "Segoe UI" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 800 }}>🛟 Volunteer Task Board ({user.fullName})</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d32f2f', fontWeight: 700 }}>LOG OUT</button>
      </div>

      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>
        {myActiveAssignment && (
          <div style={{ background: '#e0f7fa', padding: 18, borderRadius: 10, marginBottom: 24 }}>
            <h3 style={{ margin: 0 }}>⭐ Your Active Assignment — Request #{myActiveAssignment.id}</h3>
            <p style={{ margin: '8px 0', fontWeight: 700 }}>{myActiveAssignment.emergencyType} in {myActiveAssignment.location} (Score: {myActiveAssignment.urgencyScore?.toFixed(2)})</p>
            <p style={{ fontStyle: 'italic' }}>"{myActiveAssignment.details}"</p>
            <button onClick={() => handleResumeChat(myActiveAssignment.id)} style={buttonAction('#00bcd4')}>RESUME CHAT</button>
          </div>
        )}

        <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Available Requests ({requests.length})</h2>

        <table style={{ width: '100%', background: 'white', borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Victim</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Urgency</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No pending requests.</td></tr>
            ) : requests.map(req => {
              const urgency = getUrgencyStyle(req.urgencyScore);
              const isMedical = (req.emergencyType || '').toLowerCase() === 'medical';
              return (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>#{req.id}</td>
                  <td style={tdStyle}><div style={{ fontWeight: 700 }}>{req.victimName}</div><small>{req.contact}</small></td>
                  <td style={tdStyle}>{req.location}</td>
                  <td style={tdStyle}>
                    {isMedical && <small style={{ color: '#d32f2f', fontWeight: 700 }}>[MEDICAL]&nbsp;</small>}
                    <span style={{ padding: '4px 8px', borderRadius: 10, background: urgency.background, color: urgency.color, fontWeight: 700 }}>{req.urgencyScore?.toFixed(1)} - {urgency.label}</span>
                  </td>
                  <td style={tdStyle}>
                    {/* If this request is assigned to someone else, these won't appear in this list due to backend filtering */}
                    <button style={buttonAction('#22c55e')} onClick={() => handleAccept(req.id)}>Accept</button>
                    <button style={buttonAction('#ef4444')} onClick={() => handleDecline(req.id)}>Decline</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeChatRequest && <ChatBox requestId={activeChatRequest.requestId} participantName={activeChatRequest.participantName} onClose={() => setActiveChatRequest(null)} />}
    </div>
  );
};

export default VolunteerDashboard;

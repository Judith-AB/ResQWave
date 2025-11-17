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

const UserIcon = () => <span style={{ color: "#2196F3", marginRight: 6 }}>👤</span>;

const StatCard = ({ title, value, color }) => (
  <div style={{
    background: 'white',
    padding: '1.4rem',
    borderRadius: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    borderLeft: `6px solid ${color}`
  }}>
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
  const [activeTab, setActiveTab] = useState("requests");
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
      console.error("Admin fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket.connected) socket.connect();
    socket.emit("join_room", "admin_room");

    const sysListener = (d) => {
      if (["Reassign","Atmost","Conflict","Assigned","Pending","Completed"].includes(d.status)) {
        fetchData();
      }
    };
    socket.on("system_notification", sysListener);

    return () => socket.off("system_notification", sysListener);
  }, []);

  const handleAssign = async (requestId) => {
    const volunteerId = selectedVolunteer[requestId];
    if (!volunteerId) return alert("Select a volunteer first.");
    if (!window.confirm(`Assign Request #${requestId}?`)) return;

    await fetch(`${ASSIGNMENT_API_URL}/admin-assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, volunteerId: parseInt(volunteerId) })
    });

    fetchData();
  };

  const handleComplete = async (requestId) => {
    if (!window.confirm("Mark completed?")) return;
    await fetch(`${ASSIGNMENT_API_URL}/resolve/${requestId}/admin`, { method: "PUT" });
    fetchData();
  };

  const handleVerifyMedical = async (userId) => {
    if (!window.confirm("Verify medical proof?")) return;
    await fetch(`${API_AUTH_URL}/verify-medical/${userId}`, { method: "PUT" });
    fetchData();
  };

  if (loading) {
    return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
  }

  const totalRequests = requests.length;
  const conflictRequests = requests.filter(r => ["Conflict", "Reassign", "Atmost"].includes(r.status)).length;
  const assignedRequests = requests.filter(r => r.status === "Assigned").length;
  const availableVols = volunteers.filter(v => !v.status || v.status === "Available").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "50px 20px" }}>
      <header style={{ maxWidth: 1200, margin: "0 auto 24px", display: "flex", justifyContent: "space-between" }}>
        <h1>Coordination Dashboard</h1>
        <button onClick={logoutAdmin} style={{ padding: "10px 18px", background: "#d32f2f", color: "white", borderRadius: 8 }}>
          LOG OUT
        </button>
      </header>

      {/* STATS */}
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard title="Total Active" value={totalRequests} color="#f44336" />
        <StatCard title="Assigned" value={assignedRequests} color="#FF9800" />
        <StatCard title="Conflicts / Reassign" value={conflictRequests} color="#d32f2f" />
        <StatCard title="Available Volunteers" value={availableVols} color="#2196F3" />
      </div>

      {/* TABS */}
      <div style={{ maxWidth: 1200, margin: "20px auto", display: "flex", borderBottom: "2px solid #ddd" }}>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "requests" ? "4px solid red" : "4px solid transparent",
            fontWeight: "bold"
          }}
        >
          Help Requests
        </button>

        <button
          onClick={() => setActiveTab("volunteers")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "volunteers" ? "4px solid green" : "4px solid transparent",
            fontWeight: "bold"
          }}
        >
          Volunteers
        </button>
      </div>

      {/* REQUESTS LIST */}
      {activeTab === "requests" && (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {requests.map(req => {
            const statusColor = getStatusColor(req.status);
            const assigned = req.assignments?.[0];
            const assignedName = assigned?.volunteer?.fullName || "Unassigned";

            const candidates = volunteers.filter(v =>
              (!req.emergencyType.toLowerCase().includes("medical") || v.isMedicalVerified || v.fullName.startsWith("Dr.")) &&
              (v.status === "Available" || !v.status)
            );

            return (
              <div key={req.id} style={{
                background: "white",
                padding: 20,
                marginBottom: 14,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${statusColor.accent}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <h3>{req.emergencyType} | {req.location} (Score {req.urgencyScore})</h3>
                    <p>{req.victimName} | {req.contact}</p>
                  </div>

                  <div style={{
                    background: statusColor.background,
                    color: statusColor.text,
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontWeight: "bold"
                  }}>
                    {req.status}
                  </div>
                </div>

                {/* ASSIGN / SHOW ASSIGNED */}
                <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                  {["Pending", "Reassign", "Atmost"].includes(req.status) ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={selectedVolunteer[req.id] || ""}
                        onChange={e => setSelectedVolunteer(prev => ({ ...prev, [req.id]: e.target.value }))}
                        style={{ padding: 8, borderRadius: 8 }}
                      >
                        <option value="">Select Volunteer</option>
                        {candidates.map(v => (
                          <option key={v.id} value={v.id}>{v.fullName}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAssign(req.id)}
                        style={{
                          background: "#FF9800",
                          padding: "8px 12px",
                          borderRadius: 8,
                          color: "white"
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontWeight: "bold" }}>Assigned to: {assignedName}</div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    {(req.status === "Assigned" || req.status === "Conflict" || req.status === "Reassign") && (
                      <button
                        onClick={() => setActiveChat({ requestId: req.id, senderName: "Admin" })}
                        style={{ background: "#2196F3", padding: "8px 12px", borderRadius: 8, color: "white" }}
                      >
                        Chat
                      </button>
                    )}

                    {req.status !== "Completed" && (
                      <button
                        onClick={() => handleComplete(req.id)}
                        style={{ background: "#4CAF50", padding: "8px 12px", borderRadius: 8, color: "white" }}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ⭐⭐⭐ VOLUNTEERS TAB (RESTORED FULLY) ⭐⭐⭐ */}
      {activeTab === "volunteers" && (
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem"
        }}>
          {volunteers.map(v => {
            const needsProof = v.proofs?.length > 0 && !v.isMedicalVerified;

            return (
              <div key={v.id} style={{
                background: "white",
                padding: "1.4rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderLeft: `6px solid ${
                  v.isMedicalVerified
                    ? "#4CAF50"
                    : needsProof
                    ? "#FF9800"
                    : (v.status === "Available" ? "#2196F3" : "#FF9800")
                }`
              }}>
                <h3><UserIcon /> {v.fullName}</h3>
                <p>📍 {v.location}</p>
                <p>📞 {v.contact}</p>
                <p>🧩 Skills: <b>{v.skills || "N/A"}</b></p>

                <div style={{
                  borderTop: "1px solid #eee",
                  marginTop: 12,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span style={{
                    background: v.status === "Available" ? "#e8f5e9" : "#fff3e0",
                    padding: "6px 12px",
                    borderRadius: 10,
                    fontWeight: 600
                  }}>
                    {v.status || "Available"}
                  </span>

                  {v.isMedicalVerified ? (
                    <span style={{ color: "#4CAF50", fontWeight: "bold" }}>MEDICAL VERIFIED</span>
                  ) : needsProof ? (
                    <button
                      onClick={() => handleVerifyMedical(v.id)}
                      style={{ background: "#FF9800", color: "white", padding: "6px 10px", borderRadius: 8 }}
                    >
                      VERIFY PROOF
                    </button>
                  ) : (
                    <span style={{ color: "#777" }}>General Volunteer</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

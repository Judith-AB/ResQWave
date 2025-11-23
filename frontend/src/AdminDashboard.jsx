import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import ChatBox from "./ChatBox";
import io from "socket.io-client";
import "./index.css";
import { useNavigate } from "react-router-dom"; 

const REQUEST_API_URL = "http://localhost:3001/api/requests";
const ASSIGNMENT_API_URL = "http://localhost:3001/api/assignments";
const API_AUTH_URL = "http://localhost:3001/api/auth";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

const UserIcon = () => (
  <span style={{ color: "#2196F3", marginRight: 6 }}>👤</span>
);

const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return { accent: "#4CAF50", background: "#e8f5e9", text: "#2e7d32" };
    case "Conflict":
    case "Reassign":
    case "Atmost":
      return { accent: "#d32f2f", background: "#ffebee", text: "#d32f2f" };
    case "Pending":
      return { accent: "#FF9800", background: "#fff3e0", text: "#ef6c00" };
    case "Assigned":
      return { accent: "#2196F3", background: "#e3f2fd", text: "#1565C0" };
    default:
      return { accent: "#999", background: "#f0f0f0", text: "#666" };
  }
};

const StatCard = ({ title, value, color }) => (
  <div
    style={{
      background: "white",
      padding: "1.4rem",
      borderRadius: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      borderLeft: `6px solid ${color}`,
    }}
  >
    <div style={{ color: "#666", fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
  </div>
);

const AdminDashboard = () => {
  const { logoutAdmin } = useAuth();
  const navigate = useNavigate(); 

  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
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

     
      const pv = await fetch(`${API_AUTH_URL}/pending-volunteers`);
      const pvData = await pv.json();
      setPendingVolunteers(pvData.pending || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!socket.connected) socket.connect();
    socket.emit("join_room", "admin_room");
    socket.on("system_notification", () => fetchData());

    // Cleanup on unmount
    return () => {
      socket.off("system_notification");
      socket.disconnect();
    }
  }, []);

  const handleAssign = async (requestId) => {
    const volunteerId = selectedVolunteer[requestId];
    if (!volunteerId) return alert("Select a volunteer first.");

    await fetch(`${ASSIGNMENT_API_URL}/admin-assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        volunteerId: parseInt(volunteerId),
      }),
    });

    fetchData();
  };


  const handleComplete = async (requestId) => {
    if (!window.confirm("Mark as completed?")) return;
    await fetch(`${ASSIGNMENT_API_URL}/resolve/${requestId}/admin`, {
      method: "PUT",
    });

    fetchData();
  };

  const handleVerifyMedical = async (userId) => {
    await fetch(`${API_AUTH_URL}/verify-medical/${userId}`, { method: "PUT" });
    alert("Medical proof verified! (The volunteer is now eligible for medical tasks)");
    fetchData();
  };

  const handleApproveVolunteer = async (userId) => {
    await fetch(`${API_AUTH_URL}/approve-volunteer/${userId}`, {
      method: "PUT",
    });
    alert("Volunteer approved! (The volunteer can now sign in)");
    fetchData();
  };

  const handleRejectVolunteer = async (userId) => {
    if (!window.confirm("Reject and delete this volunteer?")) return;

    await fetch(`${API_AUTH_URL}/reject-volunteer/${userId}`, {
      method: "DELETE",
    });

    alert("Volunteer rejected & deleted.");
    fetchData();
  };

  const handleLogout = () => {
    logoutAdmin(); 

    
    window.location.href = "/";
  };
  if (loading)
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        Loading dashboard...
      </div>
    );

  const totalRequests = requests.length;
  const conflictRequests = requests.filter((r) =>
    ["Conflict", "Reassign", "Atmost"].includes(r.status)
  ).length;
  const assignedRequests = requests.filter((r) => r.status === "Assigned")
    .length;
  const availableVols = volunteers.filter((v) => v.status === "Available")
    .length;

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "40px 20px" }}>

      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1>Coordination Dashboard</h1>

        <button
          onClick={handleLogout} 
          style={{
            background: "none",
            border: "none",
            color: "#d32f2f",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          LOG OUT
        </button>
      </header>

     
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
        }}
      >
        <StatCard title="Total Active" value={totalRequests} color="#f44336" />
        <StatCard title="Assigned" value={assignedRequests} color="#FF9800" />
        <StatCard title="Conflicts" value={conflictRequests} color="#d32f2f" />
        <StatCard title="Available Volunteers" value={availableVols} color="#2196F3" />
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "20px auto",
          display: "flex",
          borderBottom: "2px solid #ddd",
        }}
      >
        <button onClick={() => setActiveTab("requests")} style={tabStyle(activeTab === "requests", "red")}>
          Requests
        </button>
        <button onClick={() => setActiveTab("volunteers")} style={tabStyle(activeTab === "volunteers", "green")}>
          Volunteers
        </button>
        <button onClick={() => setActiveTab("new-volunteers")} style={tabStyle(activeTab === "new-volunteers", "#7953f3")}>
          New Volunteers ({pendingVolunteers.length})
        </button>
      </div>

      {/* ------------------ REQUESTS TAB ------------------ */}
      {activeTab === "requests" && (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {requests.length === 0 && <p style={{ opacity: 0.6, padding: 20 }}>No active requests.</p>}
          {requests.map((req) => {
            const statusColor = getStatusColor(req.status);
            const assigned = req.assignments?.[0];
            const assignedName =
              assigned?.volunteer?.fullName || "Unassigned";

            
            const candidates = volunteers.filter(
              (v) =>
                ((req.emergencyType || '').toLowerCase() !== "medical" ||
                  v.isMedicalVerified) &&
                v.status === "Available"
            );

            return (
              <div key={req.id} style={requestCardStyle(statusColor.accent)}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3>
                      {req.emergencyType} | {req.location}
                    </h3>
                    <p>
                      {req.victimName} | {req.contact}
                    </p>
                  </div>
                  <div style={statusLabelStyle(statusColor)}>
                    {req.status}
                  </div>
                </div>

                <div style={reqActionRow}>

                  {["Pending", "Reassign", "Atmost"].includes(req.status) ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={selectedVolunteer[req.id] || ""}
                        onChange={(e) =>
                          setSelectedVolunteer((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        style={selectStyle}
                      >
                        <option value="">Select Volunteer ({candidates.length} available)</option>
                        {candidates.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.fullName} {v.isMedicalVerified ? ' (Medical)' : ''}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAssign(req.id)}
                        style={assignBtn}
                      >
                        Assign
                      </button>
                    </div>
                  ) : (
                    <b>Assigned to: {assignedName}</b>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    {(req.status === "Assigned" ||
                      req.status === "Conflict") && (
                        <button
                          onClick={() =>
                            setActiveChat({
                              requestId: req.id,
                              senderName: "Admin",
                            })
                          }
                          style={chatBtn}
                        >
                          Chat
                        </button>
                      )}

                    {req.status !== "Completed" && (
                      <button
                        onClick={() => handleComplete(req.id)}
                        style={completeBtn}
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

    
      {activeTab === "volunteers" && (
        <div style={gridContainer}>
          {volunteers.length === 0 && <p style={{ opacity: 0.6, padding: 20 }}>No approved volunteers available.</p>}
          {volunteers.map((v) => (
            <VolunteerCard
              key={v.id}
              volunteer={v}
              handleVerify={handleVerifyMedical}
            />
          ))}
        </div>
      )}

      {activeTab === "new-volunteers" && (
        <div style={gridContainer}>
          {pendingVolunteers.length === 0 && (
            <div style={{ fontSize: "1.3rem", opacity: 0.6, gridColumn: 'span 3' }}>
              No pending volunteers.
            </div>
          )}

          {pendingVolunteers.map((v) => (
            <NewVolunteerCard
              key={v.id}
              volunteer={v}
              approve={handleApproveVolunteer}
              reject={handleRejectVolunteer}
              verify={handleVerifyMedical}
            />
          ))}
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


const VolunteerCard = ({ volunteer, handleVerify }) => {
  const needsVerify = volunteer.proofs?.length > 0 && !volunteer.isMedicalVerified;

  return (
    <div
      style={volunteerCardStyle(
        volunteer.isMedicalVerified,
        needsVerify,
        volunteer.status
      )}
    >
      <h3>
        <UserIcon /> {volunteer.fullName}
      </h3>
      <p>📍 {volunteer.location}</p>
      <p>📞 {volunteer.contact}</p>
      <p>
        🛠️ Skills: <b>{volunteer.skills || 'General'}</b>
      </p>

      <div style={volStatusRow}>
        <span style={volStatusBadge(volunteer.status)}>
          {volunteer.status}
        </span>

        {volunteer.isMedicalVerified ? (
          <span style={medVerifiedBadge}>MEDICAL VERIFIED</span>
        ) : needsVerify ? (
          <button
            onClick={() => handleVerify(volunteer.id)}
            style={verifyBtn}
          >
            VERIFY PROOF
          </button>
        ) : (
          <span style={{ color: "#555" }}>General Volunteer</span>
        )}
      </div>
    </div>
  );
};

const NewVolunteerCard = ({ volunteer, approve, reject, verify }) => {
  const hasPdf = volunteer.proofs?.length > 0;
  
  const needsVerify = hasPdf && !volunteer.isMedicalVerified;

  return (
    <div style={newVolCard}>
      <h3 style={{ marginBottom: "6px" }}>
        <UserIcon /> {volunteer.fullName}
      </h3>

      <p>📍 {volunteer.location}</p>
      <p>📞 {volunteer.contact}</p>
      <p>
        🛠️ Skills: <b>{volunteer.skills || 'General'}</b>
      </p>

   
      <div style={actionRow}>
   
        {hasPdf && (
          <a
            href={`http://localhost:3001${volunteer.proofs[0].proofUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={viewPdfBtn}
          >
            View Proof
          </a>
        )}

        <button
          onClick={() => approve(volunteer.id)}
          style={approveBtn}
        >
          Approve Access
        </button>

        {needsVerify && (
          <button
            onClick={() => verify(volunteer.id)}
            style={verifyBtn}
          >
            Verify Medical
          </button>
        )}

        <button
          onClick={() => reject(volunteer.id)}
          style={rejectBtn}
        >
          Reject
        </button>
      </div>
    </div>
  );
};


const actionRow = {
  marginTop: "14px",
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const tabStyle = (active, color) => ({
  padding: "10px 20px",
  border: "none",
  background: "none",
  borderBottom: active ? `4px solid ${color}` : "4px solid transparent",
  fontWeight: "bold",
  cursor: "pointer",
});

const requestCardStyle = (accent) => ({
  background: "white",
  padding: 20,
  marginBottom: 14,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  borderLeft: `6px solid ${accent}`,
});

const statusLabelStyle = (status) => ({
  background: status.background,
  color: status.text,
  padding: "6px 12px",
  borderRadius: 8,
  fontWeight: "bold",
});

const reqActionRow = {
  marginTop: 14,
  display: "flex",
  justifyContent: "space-between",
};

const selectStyle = {
  padding: 8,
  borderRadius: 8,
};

const assignBtn = {
  background: "#FF9800",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const chatBtn = {
  background: "#2196F3",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const completeBtn = {
  background: "#4CAF50",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const gridContainer = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.5rem",
  padding: "1.5rem 0",
};

const volunteerCardStyle = (verified, pending, status) => ({
  background: "white",
  padding: "1.4rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  borderLeft: `6px solid ${verified
    ? "#4CAF50"
    : pending
      ? "#FF9800"
      : status === "Available"
        ? "#2196F3"
        : "#FF9800"
    }`,
});

const volStatusRow = {
  borderTop: "1px solid #eee",
  marginTop: 12,
  paddingTop: 12,
  display: "flex",
  justifyContent: "space-between",
};

const volStatusBadge = (status) => ({
  background: status === "Available" ? "#e8f5e9" : "#fff3e0",
  padding: "6px 12px",
  borderRadius: 10,
  fontWeight: 600,
});

const medVerifiedBadge = {
  color: "#4CAF50",
  fontWeight: "bold",
};

const verifyBtn = {
  background: "#FF9800",
  padding: "8px 12px",
  borderRadius: 8,
  color: "white",
  border: "none",
  cursor: "pointer",
};

const newVolCard = {
  background: "white",
  padding: "1.4rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  borderLeft: "6px solid #7953f3",
};

const viewPdfBtn = {
  background: "#2196F3",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 600,
  flex: 1,
  textAlign: "center",
};

const approveBtn = {
  background: "#4CAF50",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  flex: 1,
};

const rejectBtn = {
  background: "#d32f2f",
  color: "white",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  flex: 1,
};

export default AdminDashboard;
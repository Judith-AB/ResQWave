// --- frontend/VolunteerDashboard.jsx (FINAL STABLE VERSION) ---
import React, { useEffect, useState } from "react";
import "./index.css";
import ChatBox from './ChatBox';
import io from 'socket.io-client';
import { useVolunteers } from "./context/VolunteerContext";
// Removed: import { useNavigate } from "react-router-dom"; 

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


const VolunteerDashboard = () => {

  // 1. ALL HOOKS AT THE TOP, UNCONDITIONALLY
  const { volunteerInfo, logoutVolunteer } = useVolunteers();
  const [requests, setRequests] = useState([]);
  const [myActiveAssignment, setMyActiveAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChatRequest, setActiveChatRequest] = useState(null);

  // 2. DERIVE VARIABLES SAFELY 
  const user = volunteerInfo;
  const volunteerId = user?.id; // CRITICAL FIX: Use optional chaining for safety

  // 3. CRITICAL RENDER GUARD (This must be the only conditional return)
  if (!volunteerInfo || !volunteerInfo.id) {
    return null; // Render nothing if unauthenticated, letting the Router handle the redirect.
  }

  // 4. DATA FETCHING FUNCTIONS 
  const fetchData = () => {
    setLoading(true);
    fetch(`${ASSIGNMENT_API_URL}/available-tasks/${volunteerId}`)
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch tasks error", err);
        setLoading(false);
      });
  };

  const fetchActiveAssignment = () => {
    fetch(`${ASSIGNMENT_API_URL}/my-active-task/${volunteerId}`)
      .then(res => res.json())
      .then(data => setMyActiveAssignment(data.activeRequest || null))
      .catch(err => console.error("Fetch active request error", err));
  };

  const handleCloseChat = () => {
    setActiveChatRequest(null);
    fetchData();
    fetchActiveAssignment();
  };

  // 5. USE EFFECT 
  useEffect(() => {
    if (volunteerId) {
      fetchData();
      fetchActiveAssignment();

      if (!socket.connected) socket.connect();

      const listener = () => {
        fetchData();
        fetchActiveAssignment();
      };

      socket.on("system_notification", listener);

      return () => socket.off("system_notification", listener);
    }
  }, [volunteerId]);


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
        alert(data.message || "Only medical volunteers can accept medical emergencies.");
        return;
      }

      if (res.ok) {
        setActiveChatRequest({
          requestId: reqId,
          participantName: user.fullName || user.username
        });
        alert("Request accepted — opening chat.");

        fetchData();
        fetchActiveAssignment();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to accept.");
      }
    } catch {
      alert("Network error while accepting.");
    }
  };

  const handleDecline = async (reqId) => {
    if (!confirm("Decline this task?")) return;

    try {
      const res = await fetch(`${ASSIGNMENT_API_URL}/decline/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.needsAdminAssign) {
          alert("3 declines. Admin will manually assign this request.");
        } else {
          alert("Declined — request returned to queue.");
        }
        // FIX for task list refresh after decline
        fetchData();
        fetchActiveAssignment();
        // End fix
      } else {
        alert(data.message || "Decline failed.");
      }

    } catch {
      alert("Network error declining request.");
    }
  };

  const handleResumeChat = (requestId) => {
    setActiveChatRequest({
      requestId,
      participantName: user.fullName || user.username
    });
  };

  const handleLogout = () => {
    logoutVolunteer();
    // 🔥 FINAL FAILSAFE: Use window.location.href to force hard redirect to Landing Page
    window.location.href = "/";
  };

  // TOP NAVBAR
  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: "Segoe UI" }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ fontWeight: 800 }}>
          🛟 Volunteer Task Board ({user.fullName || user.username || 'Volunteer'})
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: '#d32f2f',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
          LOG OUT
        </button>
      </div>


      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 20px' }}>

        {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading tasks...</div>}

        {/* ACTIVE ASSIGNMENT CARD */}
        {myActiveAssignment && (
          <div style={{
            background: '#e0f7fa',
            padding: 18,
            borderRadius: 10,
            marginBottom: 24
          }}>
            <h3 style={{ margin: 0 }}>⭐ Your Active Assignment — Request #{myActiveAssignment.id}</h3>

            <p style={{ margin: '8px 0', fontWeight: 700 }}>
              {myActiveAssignment.emergencyType} in {myActiveAssignment.location}
              (Score: {myActiveAssignment.urgencyScore?.toFixed(2)})
            </p>

            <p style={{ fontStyle: 'italic' }}>"{myActiveAssignment.details}"</p>

            <button
              onClick={() => handleResumeChat(myActiveAssignment.id)}
              style={buttonAction('#00bcd4')}
            >
              RESUME CHAT
            </button>
          </div>
        )}

        {/* REQUEST LIST */}
        {!loading && (
          <>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>
              Available Requests ({requests.length})
            </h2>

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
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No pending requests.
                    </td>
                  </tr>
                ) : (
                  requests.map(req => {
                    const urgency = getUrgencyStyle(req.urgencyScore);
                    const isMedical = (req.emergencyType || '').toLowerCase() === 'medical';

                    return (
                      <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>#{req.id}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{req.victimName}</div>
                          <small>{req.contact}</small>
                        </td>
                        <td style={tdStyle}>{req.location}</td>

                        <td style={tdStyle}>
                          {isMedical && (
                            <small style={{ color: "#d32f2f", fontWeight: 700 }}>
                              [MEDICAL]{" "}
                            </small>
                          )}
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 10,
                            background: urgency.background,
                            color: urgency.color,
                            fontWeight: 700
                          }}>
                            {req.urgencyScore.toFixed(1)} - {urgency.label}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          <button style={buttonAction("#22c55e")} onClick={() => handleAccept(req.id)}>
                            Accept
                          </button>

                          <button style={buttonAction("#ef4444")} onClick={() => handleDecline(req.id)}>
                            Decline
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* CHAT OVERLAY */}
      {activeChatRequest && (
        <ChatBox
          requestId={activeChatRequest.requestId}
          participantName={activeChatRequest.participantName}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default VolunteerDashboard;
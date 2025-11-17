// --- frontend/VolunteerDashboard.jsx ---
import React, { useEffect, useState } from "react";
import "./index.css";
import ChatBox from './ChatBox';
import io from 'socket.io-client';

const API_ASSIGNMENT_URL = "http://localhost:3001/api/assignments";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });


const thStyle = { padding: "14px 20px", textAlign: "left", fontWeight: 600, fontSize: "14px", borderBottom: "1px solid #e2e8f0" };
const tdStyle = { padding: "14px 20px", fontSize: "14px", color: "#334155" };
const buttonAction = (color) => ({
  backgroundColor: color, border: "none", padding: "7px 12px", borderRadius: "6px", fontSize: "13px",
  fontWeight: 600, color: "white", cursor: "pointer", marginRight: "8px", minWidth: "75px"
});

const getUrgencyStyle = (score) => {
  if (score >= 7.5) return { label: "Critical", background: "#fee2e2", color: "#b91c1c" };
  if (score >= 5.0) return { label: "High", background: "#fef3c7", color: "#b45309" };
  if (score >= 2.5) return { label: "Medium", background: "#e0f2fe", color: "#0369a1" };
  return { label: "Low", background: "#dcfce7", color: "#15803d" };
};

const VolunteerDashboard = ({ onClose, user }) => {
  const [requests, setRequests] = useState([]); // List of PENDING tasks
  const [myActiveAssignment, setMyActiveAssignment] = useState(null); // The single accepted task
  const [loading, setLoading] = useState(true);
  const [activeChatRequest, setActiveChatRequest] = useState(null);

  const volunteerId = user.id;
  const isVolunteerMedicallyVerified = user.isMedicalVerified;

  const refreshData = () => {
    setLoading(true);
    fetchData();
    fetchActiveAssignment(); // Always fetch the active task on refresh
  };


  const fetchData = () => {

    fetch(`http://localhost:3001/api/requests/pending`)
      .then((res) => res.json())
      .then((data) => {

        const availableTasks = data.requests.filter(req => {

          const isMedicalRequest = req.emergencyType.toLowerCase().includes('medical');

          if (req.status !== 'Pending') {
            return false;
          }

          if (isMedicalRequest && !isVolunteerMedicallyVerified) {
            return false;
          }

          return true;
        });

        setRequests(availableTasks || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      });
  };


  const fetchActiveAssignment = () => {

    fetch(`${API_ASSIGNMENT_URL}/my-active-task/${volunteerId}`)
      .then((res) => res.json())
      .then((data) => {
        setMyActiveAssignment(data.activeRequest);
      })
      .catch((err) => {
        console.error("Error fetching active assignment:", err);
      });
  };


  useEffect(() => {
    fetchData();
    fetchActiveAssignment(); 

    if (!socket.connected) {
      socket.connect();
    }

    const statusChangeListener = (data) => {
      if (data.status === 'Completed' || data.status === 'Conflict' || data.status === 'Assigned' || data.status === 'Pending') {
        refreshData();
      }
    };

    socket.on('system_notification', statusChangeListener);

    return () => {
      socket.off('system_notification', statusChangeListener);
    };
  }, []);




  const handleAccept = async (reqId) => {
    if (!confirm("Are you sure you want to accept this task?")) return;
    try {
      const response = await fetch(`${API_ASSIGNMENT_URL}/accept-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: reqId, volunteerId: volunteerId }),
      });

      if (response.ok) {
     
        setActiveChatRequest({
          requestId: reqId,
          participantName: user.fullName || user.username
        });

        alert("Request accepted! Starting chat...");
        refreshData();
        const data = await response.json();
        alert(`Failed to accept request: ${data.message}`);
      }
    } catch (err) {
      alert("Failed to connect to server during acceptance.");
    }
  };


  const handleDecline = async (reqId) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    try {
      const response = await fetch(`${API_ASSIGNMENT_URL}/decline/${reqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: volunteerId }),
      });

      if (response.ok) {
        alert("Request declined. It has been returned to the queue.");
        refreshData();
      } else {
        alert("Failed to decline request.");
      }
    } catch (err) {
      alert("Failed to connect to server during decline.");
    }
  };

  const handleResumeChat = (reqId) => {
    setActiveChatRequest({
      requestId: reqId,
      participantName: user.fullName || user.username
    });
  };


  if (loading) {
    return <div style={{ textAlign: "center", paddingTop: "50px", fontSize: "1.5rem" }}>Loading available tasks...</div>;
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#f6f8fb", minHeight: "100vh", color: "#1e293b", margin: 0 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "15px 30px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.4rem" }}>
          🛟 **Volunteer Task Board** ({user.fullName})
        </div>

        <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#f44336', cursor: 'pointer', fontWeight: 'bold' }}>LOG OUT</button>
      </div>

      <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px" }}>

        {myActiveAssignment && (
          <div style={{ padding: '20px', marginBottom: '40px', borderRadius: '12px', background: '#e0f7fa', border: '2px solid #00bcd4', boxShadow: '0 4px 10px rgba(0, 188, 212, 0.2)' }}>
            <h3 style={{ margin: 0, color: '#00838f', borderBottom: '1px solid #b2ebf2', paddingBottom: '10px' }}>
              ⭐ **Your Active Assignment** - Request #{myActiveAssignment.id}
            </h3>
            <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
              {myActiveAssignment.emergencyType} in {myActiveAssignment.location} (Score: {myActiveAssignment.urgencyScore?.toFixed(2)})
            </p>
            <p style={{ fontStyle: 'italic', color: '#555' }}>
              Details: "{myActiveAssignment.details}"
            </p>
            <button
              onClick={() => handleResumeChat(myActiveAssignment.id)}
              style={buttonAction('#00bcd4')}
            >
              RESUME CHAT / PROVIDE UPDATE
            </button>
          </div>
        )}


        <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", marginBottom: "20px" }}>
          Pending Requests ({requests.length})
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
              <th style={thStyle}>Request ID</th>
              <th style={thStyle}>Victim</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Urgency</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((req) => {
                const urgency = getUrgencyStyle(req.urgencyScore);
                const isMedical = req.emergencyType.toLowerCase().includes('medical');

                return (
                  <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fbff")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={tdStyle}>#{req.id}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{req.victimName || "Unknown"}</div>
                      <small style={{ color: "#475569" }}>{req.contact || "N/A"}</small>
                    </td>
                    <td style={tdStyle}>{req.location}</td>
                    <td style={tdStyle}>
                     
                      {isMedical && (
                        <small style={{ color: '#d32f2f', fontWeight: 'bold' }}>[MEDICAL TASK] </small>
                      )}
                      <span style={{ fontWeight: 600, padding: "4px 10px", borderRadius: "12px", fontSize: "13px", background: urgency.background, color: urgency.color }}>
                        {req.urgencyScore?.toFixed(1)} - {urgency.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                    
                      <button style={buttonAction("#22c55e")} onClick={() => handleAccept(req.id)}>Accept</button>
                      <button style={buttonAction("#ef4444")} onClick={() => handleDecline(req.id)}>Decline</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontStyle: "italic" }}>
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    
      {activeChatRequest && (
        <ChatBox
          requestId={activeChatRequest.requestId}
          participantName={activeChatRequest.participantName}
          onClose={() => setActiveChatRequest(null)}
        />
      )}
    </div>
  );
};

export default VolunteerDashboard;
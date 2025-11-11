import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const VolunteerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const volunteerId = localStorage.getItem("volunteerId"); // store volunteer id from login

  // Fetch live data from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/requests/pending")
      .then((res) => res.json())
      .then((data) => setRequests(data.requests || []))
      .catch((err) => console.error("Error fetching requests:", err));
  }, []);

  // ✅ Volunteer accepts request
  const handleAccept = async (reqId) => {
    try {
      await fetch(`http://localhost:5000/api/requests/${reqId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId }),
      });
      alert("Request accepted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to accept request.");
    }
  };

  // ✅ Mark request as completed
  const handleComplete = async (reqId) => {
    try {
      await fetch(`http://localhost:5000/api/requests/${reqId}/complete`, {
        method: "PUT",
      });
      alert("Marked as completed!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to mark as completed.");
    }
  };

  // ✅ Report conflict to admin
  const handleConflict = async (reqId) => {
    try {
      await fetch(`http://localhost:5000/api/requests/${reqId}/conflict`, {
        method: "PUT",
      });
      alert("Conflict reported to admin!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to report conflict.");
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f6f8fb",
        minHeight: "100vh",
        color: "#1e293b",
        margin: 0,
      }}
    >
      {/* Topbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: "15px 30px",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.4rem" }}>
          🛟 ResQWave
        </div>
        <input
          type="text"
          placeholder="Search requests..."
          style={{
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "8px 12px",
            width: "260px",
            border: "none",
            outline: "none",
            fontSize: "14px",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "15px",
            fontSize: "20px",
            color: "#475569",
          }}
        >
          🔔 💬
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "40px auto",
          padding: "0 20px",
        }}
      >
        <h2
          style={{
            fontSize: "1.7rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "20px",
          }}
        >
          Pending Requests ({requests.length})
        </h2>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
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
                const urgencyClass =
                  req.urgencyScore > 7
                    ? "critical"
                    : req.urgencyScore > 4
                    ? "high"
                    : req.urgencyScore > 2
                    ? "medium"
                    : "low";

                const urgencyColors = {
                  critical: { background: "#fee2e2", color: "#b91c1c" },
                  high: { background: "#fef3c7", color: "#b45309" },
                  medium: { background: "#e0f2fe", color: "#0369a1" },
                  low: { background: "#dcfce7", color: "#15803d" },
                };

                return (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9fbff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={tdStyle}>#{req.id}</td>
                    <td style={tdStyle}>
                      <div>{req.victimName || "Unknown"}</div>
                      <small style={{ color: "gray" }}>
                        {req.contact || "N/A"}
                      </small>
                    </td>
                    <td style={tdStyle}>{req.location}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          background:
                            urgencyColors[urgencyClass].background || "#eee",
                          color: urgencyColors[urgencyClass].color || "#333",
                        }}
                      >
                        {req.urgencyScore?.toFixed(1)}{" "}
                        {urgencyClass.charAt(0).toUpperCase() +
                          urgencyClass.slice(1)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {req.status === "Pending" && (
                        <button
                          style={buttonAccept}
                          onClick={() => handleAccept(req.id)}
                        >
                          Accept
                        </button>
                      )}
                      {req.status === "Assigned" && (
                        <button
                          style={buttonDecline}
                          onClick={() => handleComplete(req.id)}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        style={buttonConflict}
                        onClick={() => handleConflict(req.id)}
                      >
                        Conflict
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "30px 0",
                    color: "#64748b",
                    fontStyle: "italic",
                  }}
                >
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "15px",
            fontSize: "14px",
            color: "#475569",
          }}
        >
          Showing {requests.length > 0 ? 1 : 0} to {requests.length} results
        </div>
      </div>
    </div>
  );
};

// ======= Inline Style Constants =======
const thStyle = {
  padding: "14px 20px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "14px",
  borderBottom: "1px solid #f1f5f9",
};

const tdStyle = {
  padding: "14px 20px",
  fontSize: "14px",
  color: "#334155",
};

const buttonAccept = {
  backgroundColor: "#22c55e",
  border: "none",
  padding: "7px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  color: "white",
  cursor: "pointer",
  marginRight: "6px",
};

const buttonDecline = {
  backgroundColor: "#ef4444",
  border: "none",
  padding: "7px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  color: "white",
  cursor: "pointer",
  marginRight: "6px",
};

const buttonConflict = {
  backgroundColor: "#facc15",
  border: "none",
  padding: "7px 14px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#1e293b",
  cursor: "pointer",
};

export default VolunteerDashboard;

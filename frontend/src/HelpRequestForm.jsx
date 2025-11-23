// --- frontend/HelpRequestForm.jsx (FINAL CORRECTED VERSION) ---
import { useState, useEffect } from "react";
import "./index.css";
import { useRequests } from "./context/RequestsContext";
import { useChat } from "./context/ChatContext";
// 🛑 FIX 1: We no longer need the useVolunteers import, as it caused the crash.
// import { useVolunteers } from "./context/VolunteerContext"; 
import io from "socket.io-client";
import ConflictModal from "./ConflictModal";

const API_BASE_URL = "http://localhost:3001/api/requests";
const SOCKET_SERVER_URL = "http://localhost:3001";

const socket = io(SOCKET_SERVER_URL, { autoConnect: false });

/* =======================================================================
   VictimStatusChat  (RESUME HELP FIX)
======================================================================= */
const VictimStatusChat = ({ request, onClose }) => {
    const { getMessages, addMessage } = useChat();
    // 🛑 FIX 2: Removed the line below which caused the "undefined.find" error:
    // const { volunteers } = useVolunteers(); 
    const { updateRequestStatus } = useRequests();

    const [inputText, setInputText] = useState("");
    const [isSolvedConfirmed, setIsSolvedConfirmed] = useState(request.isResolvedByVictim || false);
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

    const messages = getMessages(request.id);
    const reqIdStr = String(request.id);

    // ✅ FIX 3: Simplify volunteer name lookup using data provided by the LookupModal
    const volunteerName =
        request.assignedVolunteerName || "A Volunteer";

    useEffect(() => {
        if (!socket.connected) socket.connect();
        socket.emit("join_room", reqIdStr);

        const messageListener = (data) => {
            addMessage(data.roomId, data.sender, data.text, data.timestamp);
        };

        const systemListener = (data) => {
            alert(data.text);
            updateRequestStatus(data.requestId, data.status);

            if (data.status === "COMPLETED") onClose();
        };

        socket.on("receive_message", messageListener);
        socket.on("system_notification", systemListener);

        return () => {
            socket.off("receive_message", messageListener);
            socket.off("system_notification", systemListener);
        };
    }, [request.id, addMessage, updateRequestStatus, onClose]);

    /* ---------------- Send Chat Message ---------------- */
    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const timestamp = new Date().toLocaleTimeString();

        const msg = {
            roomId: reqIdStr,
            sender: request.victimName,
            text: inputText.trim(),
            timestamp
        };

        socket.emit("send_message", msg);
        addMessage(request.id, msg.sender, msg.text, timestamp);
        setInputText("");
    };

    /* ---------------- Raise Conflict ---------------- */
    const handleConflictSubmit = (reason) => {
        socket.emit("raise_conflict", {
            requestId: reqIdStr,
            reporterRole: "Victim",
            reason
        });

        setIsConflictModalOpen(false);
        alert("Conflict reported. Admin will intervene.");
    };

    /* ---------------- Mark as Solved ---------------- */
    const handleMarkSolved = () => {
        if (window.confirm("Are you sure the issue is resolved?")) {
            setIsSolvedConfirmed(true);
            socket.emit("mark_solved", {
                requestId: reqIdStr,
                reporterRole: "Victim"
            });
        }
    };

    /* ---------------- UI ---------------- */
    return (
        <div className="form-overlay" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div
                className="form-container"
                style={{ width: "450px", padding: "0", overflow: "hidden" }}
            >
                {/* Header */}
                <div
                    style={{
                        background: request.assignedVolunteerId ? "#4CAF50" : "#f44336",
                        color: "white",
                        padding: "1rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                        {request.assignedVolunteerId
                            ? `Matched with ${volunteerName}`
                            : `🚨 Request ID: ${request.id} Pending... (Score: ${request.urgencyScore?.toFixed(2) || "?"
                            })`}
                    </h3>

                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            fontSize: "1.5rem",
                            cursor: "pointer"
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Info */}
                <div style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
                    <p>
                        Location: {request.location} | Type: {request.emergencyType}
                    </p>
                    {request.assignedVolunteerId ? (
                        <p style={{ color: "green", fontWeight: "bold" }}>
                            Volunteer is on the way.
                        </p>
                    ) : (
                        <p style={{ color: "red", fontWeight: "bold" }}>
                            Coordinators are assigning help.
                        </p>
                    )}
                </div>

                {/* Chat History */}
                <div
                    style={{
                        height: "250px",
                        overflowY: "auto",
                        padding: "1rem",
                        background: "#f0f2f5"
                    }}
                >
                    {messages.length === 0 && (
                        <p style={{ textAlign: "center", marginTop: "10%", color: "#666" }}>
                            Start the chat or wait for the volunteer.
                        </p>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                justifyContent:
                                    msg.sender === request.victimName
                                        ? "flex-end"
                                        : "flex-start",
                                marginBottom: "0.5rem"
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: "75%",
                                    padding: "0.5rem 1rem",
                                    borderRadius: "12px",
                                    background:
                                        msg.sender === request.victimName
                                            ? "#f44336"
                                            : "#2196F3",
                                    color: "white"
                                }}
                            >
                                <strong style={{ opacity: 0.8 }}>
                                    {msg.sender === request.victimName ? "You" : msg.sender}
                                </strong>
                                <p style={{ margin: "4px 0" }}>{msg.text}</p>
                                <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Conflict + Solved Buttons */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 1rem",
                        background: "#eee"
                    }}
                >
                    <button
                        onClick={() => setIsConflictModalOpen(true)}
                        style={{
                            padding: "0.4rem 0.8rem",
                            background: "#e53935",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        🚩 Report Conflict
                    </button>

                    <button
                        onClick={handleMarkSolved}
                        disabled={isSolvedConfirmed}
                        style={{
                            padding: "0.4rem 0.8rem",
                            background: isSolvedConfirmed ? "#999" : "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        {isSolvedConfirmed ? "✅ Confirmed" : "Mark as Solved"}
                    </button>
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSend}
                    style={{
                        padding: "1rem",
                        borderTop: "1px solid #ccc",
                        display: "flex"
                    }}
                >
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send message..."
                        style={{
                            flexGrow: 1,
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            borderRadius: "8px 0 0 8px"
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: "0.5rem 1rem",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "0 8px 8px 0"
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>

            {isConflictModalOpen && (
                <ConflictModal
                    onClose={() => setIsConflictModalOpen(false)}
                    onSubmit={handleConflictSubmit}
                />
            )}
        </div>
    );
};

/* =======================================================================
   HelpRequestForm – unchanged
======================================================================= */
const HelpRequestForm = ({ onClose }) => {
    const { addRequest, requests } = useRequests();
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [formData, setFormData] = useState({
        name: "", contact: "", location: "", emergencyType: "", details: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const validateForm = () => {
        if (!formData.name.trim()) return "Name is required";
        if (!/^[A-Za-z\s]+$/.test(formData.name)) return "Name must be letters only";
        if (!/^\d{10}$/.test(formData.contact)) return "Contact must be 10 digits";
        if (!formData.location.trim()) return "Location required";
        if (!formData.emergencyType) return "Select emergency type";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const err = validateForm();
        if (err) return setError(err);

        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    victimName: formData.name,
                    contact: formData.contact,
                    location: formData.location,
                    emergencyType: formData.emergencyType,
                    details: formData.details
                })
            });

            const data = await response.json();

            if (response.ok) {
                const newReq = {
                    ...formData,
                    id: data.requestId,
                    status: "Pending",
                    urgencyScore: data.urgencyScore,
                    victimName: formData.name
                };

                addRequest(newReq);
                setSubmittedRequest(newReq);
            } else {
                alert(data.message || "Failed to submit.");
            }
        } catch {
            alert("Network error");
        }
    };

    if (submittedRequest) {
        const live =
            requests.find((r) => r.id === submittedRequest.id) || submittedRequest;
        return <VictimStatusChat request={live} onClose={onClose} />;
    }

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h2>🚨 Request Help</h2>

                {error && (
                    <div
                        style={{
                            color: "white",
                            background: "#f44336",
                            padding: "10px",
                            borderRadius: "6px"
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label>
                        Full Name:
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Contact:
                        <input
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Location:
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Emergency Type:
                        <select
                            name="emergencyType"
                            value={formData.emergencyType}
                            onChange={handleChange}
                        >
                            <option value="">--Select--</option>
                            <option value="Medical">Medical</option>
                            <option value="Water">Water</option>
                            <option value="Food">Food</option>
                            <option value="Shelter">Shelter</option>
                            <option value="Flooding">Flooding</option>
                            <option value="Missing">Missing</option>
                            <option value="Electricity">Electricity</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>

                    <label>
                        Additional Details:
                        <textarea
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                        />
                    </label>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary">
                            Submit
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

HelpRequestForm.VictimStatusChat = VictimStatusChat;
export default HelpRequestForm;
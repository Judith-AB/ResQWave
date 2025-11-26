// --- frontend/LookupModal.jsx ---
import React, { useState } from "react";
import HelpRequestForm from "./HelpRequestForm";

const API_LOOKUP_URL = "http://localhost:3001/api/requests/lookup";

const LookupModal = ({ onClose }) => {
    const [lookupData, setLookupData] = useState({ contact: "", location: "" });
    const [foundRequest, setFoundRequest] = useState(null);
    const [lookupError, setLookupError] = useState("");

    const handleChange = (e) => {
        setLookupData({ ...lookupData, [e.target.name]: e.target.value });
    };

    const handleLookup = async (e) => {
        e.preventDefault();
        setLookupError("");

        if (!lookupData.contact) {
            setLookupError("Please enter your Contact Number to resume your session.");
            return;
        }

        try {
            const response = await fetch(API_LOOKUP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lookupData),
            });

            const data = await response.json();

            if (response.ok) {
                
                setFoundRequest({
                    ...data.request,
                    assignedVolunteerId: data.request.assignedVolunteerId || null,
                    urgencyScore: data.request.urgencyScore || 0,
                    assignedVolunteerName: data.request.assignedVolunteerName || null
                });
            } else {
                setLookupError(data.message || "Error retrieving your request.");
            }
        } catch (error) {
            setLookupError("Network connection failed. Ensure backend is running.");
        }
    };

    if (foundRequest) {
        return (
            <HelpRequestForm.VictimStatusChat
                request={foundRequest}
                onClose={onClose}
            />
        );
    }

    return (
        <div
            className="form-overlay"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: "100px",
                zIndex: 99999,
            }}
        >
            <div className="form-container" style={{ width: "400px" }}>
                <h2>🔍 Resume Active Request</h2>
                <p>Enter your contact information to resume your session.</p>

                <form onSubmit={handleLookup}>
                    <label>Contact Number:</label>
                    <input
                        type="text"
                        name="contact"
                        value={lookupData.contact}
                        onChange={handleChange}
                        placeholder="e.g., 9946554433"
                        required
                    />

                    <label>Location :</label>
                    <input
                        type="text"
                        name="location"
                        value={lookupData.location}
                        onChange={handleChange}
                        placeholder="City, Area"
                    />

                    {lookupError && (
                        <p style={{ color: "red", marginTop: "10px" }}>{lookupError}</p>
                    )}

                    <div className="form-actions" style={{ marginTop: "20px" }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={!lookupData.contact}
                        >
                            Resume Chat
                        </button>

                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LookupModal;

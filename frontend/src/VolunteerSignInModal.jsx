import React, { useState } from "react";
import "./index.css";

const API_BASE_URL = "http://localhost:3001/api/auth";

const VolunteerSignInModal = ({ onClose, onSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();

            if (response.ok && data.isVolunteer && data.role !== 'admin') {
                localStorage.setItem("volunteerId", data.id);
                localStorage.setItem("volunteerUsername", data.username);

                onSuccess(data); 
            } else {
                setError(data.message || "Sign In failed. Check credentials or ensure you registered as a volunteer.");
            }
        } catch (err) {
            setError("Network error. Ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container" style={{ width: '450px' }}>
                <h2 style={{ color: '#4CAF50', textAlign: 'center' }}>Volunteer Sign-In</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>Access your assigned tasks and communication portal.</p>

                <form onSubmit={handleSignIn}>
                    {error && <div style={{ color: 'white', background: '#f44336', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{error}</div>}

                    <label>Username:<input type="text" name="username" value={credentials.username} onChange={handleChange} required /></label>
                    <label>Password:<input type="password" name="password" value={credentials.password} onChange={handleChange} required /></label>

                    <div className="form-actions" style={{ justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ flex: 1, background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ flex: 1 }}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VolunteerSignInModal;
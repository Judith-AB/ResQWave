import React, { useState } from "react";
import "./index.css";

const API_BASE_URL = "http://localhost:3001/api/auth";

const EyeOff = () => <span>🙈</span>;
const Eye = () => <span>👁️</span>;

const VolunteerSignInModal = ({ onClose, onSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [responseError, setResponseError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setResponseError(null);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponseError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();

            if (response.ok) {

                if (data.role === 'volunteer') {

                    const { passwordHash, role, message, ...userData } = data;
                    onClose();
                    onSuccess(userData);

                } else if (data.role === 'admin') {
                    setResponseError("This account is for administrative access only.");

                } else {
                  
                    setResponseError(data.message || "Login failed due to unexpected role.");
                }

            } else {
      
                setResponseError(data.message || "Sign In failed. Check credentials or approval status.");
            }
        } catch (err) {
            setResponseError("Network error. Ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-overlay">
            <div className="form-container" style={{ width: '450px' }}>
                <h2 style={{ color: '#4CAF50', textAlign: 'center' }}>Volunteer Sign-In</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>
                    Access your assigned tasks and communication portal.
                </p>

                <form onSubmit={handleSignIn}>

                    {responseError && (
                        <div style={{
                            color: 'white',
                            background: '#e53935',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '10px',
                            fontWeight: 'bold'
                        }}>
                            {responseError}
                        </div>
                    )}

                    <label>
                        Username:
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                        />
                    </label>


                    <label>
                        Password:
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", paddingRight: "40px" }}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#555",
                                }}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </label>

                   
                    <div className="form-actions"
                        style={{ justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}
                    >
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        
                            style={{ flex: 1, background: 'linear-gradient(135deg, #4CAF50, #388E3C)' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                            style={{ flex: 1, background: '#e53935', color: 'white' }}
                        >
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VolunteerSignInModal;
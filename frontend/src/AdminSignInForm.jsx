import React, { useState } from "react";
import "./index.css";
import { useAuth } from "./context/AuthContext";

const API_BASE_URL = "http://localhost:3001/api/auth";

const Shield = () => <span style={{ marginRight: '8px' }}>🛡️</span>;
const X = () => <span style={{ fontSize: '1.2rem' }}>&times;</span>;
const User = () => <span style={{ marginRight: '5px' }}>👤</span>;
const Lock = () => <span style={{ marginRight: '5px' }}>🔒</span>;
const EyeOff = () => <span>🙈</span>;
const Eye = () => <span>👁️</span>;

const AdminSignInForm = ({ onClose }) => {
  const { loginAdmin } = useAuth();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.role === 'admin') {
            loginAdmin();
            alert("Admin authentication successful!");
            onClose();
        } else {
            setError(data.message || "Invalid username or password. Please try again.");
        }
    } catch (error) {
        console.error('Login Failed:', error);
        setError("Network error or server connection failed. Is the backend running?");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container" style={{ width: '380px', padding: '0' }}>

        
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: 'white', margin: 0 }}>
            <Shield /> Admin Access
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.5rem'
            }}
          >
            {X()}
          </button>
        </div>

      
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {error && (
            <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', padding: '0.75rem', borderRadius: '4px', color: '#dc2626', fontWeight: 'bold' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              <User /> <span>Username</span>
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '8px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              <Lock /> <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '8px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

        
          <div style={{ backgroundColor: '#fffbe6', borderLeft: '4px solid #fbbf24', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
            <h4 style={{ color: '#92400e', fontWeight: 'bold', margin: 0 }}>Demo Credentials:</h4>
            <p style={{ margin: '5px 0 0', color: '#92400e' }}>
              Username: <code style={{ backgroundColor: '#fde68a', padding: '2px 4px', borderRadius: '4px' }}>admin</code><br />
              Password: <code style={{ backgroundColor: '#fde68a', padding: '2px 4px', borderRadius: '4px' }}>admin123</code>
            </p>
          </div>


          <div className="form-actions" style={{ marginTop: '0.5rem', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ flex: 1, padding: '0.75rem', background: isSubmitting ? '#ccc' : 'linear-gradient(135deg, #4CAF50, #388E3C)' }}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.75rem', background: '#ccc', color: '#333' }}
            >
              Cancel
            </button>
          </div>


        </form>
      </div>
    </div>
  );
};

export default AdminSignInForm;
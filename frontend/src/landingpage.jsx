import React, { useState, useEffect } from "react";
import HelpRequestForm from "./HelpRequestForm";
import VolunteerForm from "./VolunteerForm";
import AdminSignInForm from "./AdminSignInForm";
import ChatBox from "./ChatBox";
import "./index.css";

import { useVolunteers } from "./context/VolunteerContext";
import { useRequests } from "./context/RequestsContext";

const API_BASE_URL = "http://localhost:3001/api/auth";
const VolunteerChooser = ({ onClose, openSignIn, openSignUp }) => (
  <div className="form-overlay">
    <div className="form-container" style={{ width: '350px', textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ color: '#1565C0', marginBottom: '1.5rem' }}>Volunteer Portal</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className="btn-primary"
          onClick={() => { onClose(); openSignIn(); }}
          style={{ background: 'linear-gradient(135deg, #4CAF50, #388E3C)', border: 'none' }}
        >
          ✅ Sign In / Check Status
        </button>
        <button
          className="btn-secondary"
          onClick={() => { onClose(); openSignUp(); }}
          style={{ background: 'linear-gradient(135deg, #2196F3, #1565C0)', border: 'none' }}
        >
          🤝 Join / Sign Up Now
        </button>
      </div>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        style={{ marginTop: '1.5rem', width: '100%', background: '#ccc', color: '#333' }}
      >
        Cancel
      </button>
    </div>
  </div>
);
// --- END Volunteer Chooser ---


// --- Volunteer Dashboard Component (Sign-In/Status Logic) ---
const VolunteerDashboard = ({ onClose }) => {
  const { volunteers } = useVolunteers();
  const { requests } = useRequests();

  // Credentials for Sign-In
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [volunteerData, setVolunteerData] = useState(null);
  const assignments = volunteerData ? requests.filter(req => req.assignedVolunteerId === volunteerData.id && req.status !== 'Completed') : [];

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

      if (response.ok && data.isVolunteer) {
        const matchedVolunteer = volunteers.find(v => v.username === data.username);

        setIsAuthenticated(true);
        setVolunteerData(matchedVolunteer || { fullName: data.username, status: 'Active' }); 
        setError(data.message || "Sign In failed. Check credentials.");
      }
    } catch (err) {
      setError("Network error. Ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---
  if (!isAuthenticated) {
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
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Checking...' : 'Sign In'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Close</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="form-overlay">
      <div className="form-container" style={{ width: '450px' }}>
        <h2 style={{ color: '#1565C0', textAlign: 'center' }}>{volunteerData.fullName}'s Tasks</h2>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', minHeight: '120px', marginTop: '1rem', color: '#333' }}>

          <p style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Status: {volunteerData.status || 'Available'}</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>Skills: **{volunteerData.skills || 'N/A'}**</p>

          {assignments.length > 0 ? (
            <div style={{ marginTop: '0.8rem' }}>
              <p style={{ color: '#4CAF50', fontWeight: '600' }}>✅ Assigned Tasks ({assignments.length}):</p>
              {assignments.map(req => (
                <div key={req.id} style={{ borderBottom: '1px solid #ddd', padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Req {req.id} in {req.location}</span>
                  <button
                    onClick={() => console.log('Open Chat Here')} // Placeholder for Chat function
                    className="btn-primary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: '#2196F3' }}
                  >
                    Open Chat
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: '0.8rem' }}>No active assignments found. Thank you for being available!</p>
          )}
        </div>
        <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button type="button" className="btn-primary" onClick={() => setIsAuthenticated(false)}>Sign Out</button>
          <button type="button" className="btn-secondary" onClick={onClose}>Close Portal</button>
        </div>
      </div>
    </div>
  );
};
// --- END Volunteer Dashboard Component ---


const LandingPage = () => {
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showVolunteerDashboard, setShowVolunteerDashboard] = useState(false);
  const [showVolunteerChooser, setShowVolunteerChooser] = useState(false); // NEW STATE FOR CHOOSER MODAL

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const elements = document.querySelectorAll(".process-step, .stat-item");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    });

    elements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "all 0.6s ease";
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="header">
        <nav className="nav-container">
          <div className="logo" onClick={() => scrollToSection("hero")}>
            <div className="logo-icon">❤️</div>ResQWave
          </div>

          <ul className="nav-menu">
            <li><button onClick={() => scrollToSection("hero")}>Home</button></li>
            <li><button onClick={() => scrollToSection("about")}>About</button></li>
            <li><button onClick={() => scrollToSection("how-it-works")}>How It Works</button></li>
            <li><button onClick={() => scrollToSection("contact")}>Contact</button></li>
          </ul>

          <div className="nav-buttons">
            <button
              className="btn-volunteer-portal "
              onClick={() => setShowVolunteerChooser(true)}
              
            >
              Volunteer Portal
            </button>

            <button className="btn-dashboard" onClick={() => setShowAdminForm(true)}>Admin Dashboard</button>
            <button className="btn-help" onClick={() => setShowHelpForm(true)}>Get Help Now</button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>
              Connecting Victims with Volunteers in <span className="highlight">Real Time</span> During Disasters
            </h1>
            <p className="hero-description">
              This student project connects people in need with volunteers quickly, helping to provide support and assistance during emergency situations.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => setShowHelpForm(true)}>❤️ Request Help</button>
              <button className="btn-secondary" onClick={() => setShowVolunteerForm(true)}>🤝 Join as Volunteer</button>
            </div>
          </div>

          <div className="stats-overlay">
            <div className="stat-item"><span className="stat-number">Fast</span><div className="stat-label">Response</div></div>
            <div className="stat-item"><span className="stat-number">Real-time</span><div className="stat-label">Matching</div></div>
            <div className="stat-item"><span className="stat-number">Secure</span><div className="stat-label">Platform</div></div>
            <div className="stat-item"><span className="stat-number">Reliable</span><div className="stat-label">Support</div></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">A simple flow that allows victims to request help and volunteers to respond quickly.</p>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-icon sos">SOS</div>
              <h3 className="step-title">Submit Request</h3>
              <p className="step-description">Victims submit structured help requests with location and details.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-icon handshake">🤝</div>
              <h3 className="step-title">Volunteer Signup</h3>
              <p className="step-description">Volunteers sign up and are matched with nearby requests.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-icon chat">💬</div>
              <h3 className="step-title">Real-time Updates</h3>
              <p className="step-description">Direct communication between volunteers and victims.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-icon check">✓</div>
              <h3 className="step-title">Task Completion</h3>
              <p className="step-description">Requests are resolved and tracked for accountability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="section-container">
          <h2 className="section-title">About This Project</h2>
          <p className="section-description">
            This is a student project to demonstrate a prototype disaster relief platform. Victims can submit requests, volunteers can join and respond, and coordinators can manage tasks. The platform emphasizes real-time assistance, simplicity, and educational value.
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="footer-container">
          <div>
            <div className="footer-brand"><div className="logo-icon">❤️</div> Disaster Relief Platform</div>
            <p className="footer-description">
              A student project demonstrating technology-driven disaster relief coordination.
            </p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><button onClick={() => scrollToSection("about")}>About</button></li>
              <li><button onClick={() => scrollToSection("how-it-works")}>How It Works</button></li>
              <li><button onClick={() => setShowVolunteerForm(true)}>Volunteer</button></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Emergency Contact</h3>
            <div className="emergency-contact">
              {/* --- UPDATED TO INDIA'S ALL-IN-ONE EMERGENCY NUMBER (112) --- */}
              <h4>24/7 Relief Helpline</h4>
              <div className="emergency-phone">91 (987) 654-3210</div>
              {/* --- END CHANGE --- */}
            </div>
          </div>
        </div>
      </footer>

      {/* Forms and Modals */}
      {showHelpForm && <HelpRequestForm onClose={() => setShowHelpForm(false)} />}
      {showVolunteerForm && <VolunteerForm onClose={() => setShowVolunteerForm(false)} />}
      {showAdminForm && <AdminSignInForm onClose={() => setShowAdminForm(false)} />}

      {/* NEW: RENDER VOLUNTEER CHOOSER */}
      {showVolunteerChooser && (
        <VolunteerChooser
          onClose={() => setShowVolunteerChooser(false)}
          openSignIn={() => setShowVolunteerDashboard(true)}
          openSignUp={() => setShowVolunteerForm(true)}
        />
      )}

      {/* Volunteer Dashboard (Used for Sign-In/Status Check) */}
      {showVolunteerDashboard && <VolunteerDashboard onClose={() => setShowVolunteerDashboard(false)} />}
    </div>
  );
};

export default LandingPage;
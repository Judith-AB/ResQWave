import React, { useState, useEffect } from "react";
import HelpRequestForm from "./HelpRequestForm";
import VolunteerForm from "./VolunteerForm";
import AdminSignInForm from "./AdminSignInForm";
import ChatBox from "./ChatBox";
import "./index.css";

// *** FIX: REQUIRED CONTEXT HOOK IMPORTS ***
import { useVolunteers } from "./context/VolunteerContext";
import { useRequests } from "./context/RequestsContext";

// --- Volunteer Dashboard Component (The Volunteer Sign-In/Status Modal) ---
const VolunteerDashboard = ({ onClose }) => {
  // Hooks are now available due to imports above
  const { volunteers } = useVolunteers();
  const { requests } = useRequests();
  const [nameSearch, setNameSearch] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  // Find the volunteer by name
  const volunteer = volunteers.find(v => v.name.toLowerCase() === nameSearch.toLowerCase() && nameSearch.trim() !== '');
  // Filter for active, uncompleted assignments
  const assignments = volunteer ? requests.filter(req => req.assignedVolunteerId === volunteer.id && req.status !== 'Completed') : [];

  return (
    <div className="form-overlay">
      <div className="form-container" style={{ width: '450px' }}>
        <h2 style={{ color: '#4CAF50', textAlign: 'center' }}>Volunteer Sign-In & Task Status</h2>
        <label>
          Enter Your Full Name:
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Enter your name (e.g., Jane Doe)"
            style={{ marginTop: '0.3rem' }}
          />
        </label>
        <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', minHeight: '120px', marginTop: '1rem', color: '#333' }}>

          {volunteer ? (
            <div>
              <p style={{ fontWeight: 'bold' }}>{volunteer.name} (Status: {volunteer.status})</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Skills: **{volunteer.skills || 'N/A'}**
              </p>

              {assignments.length > 0 ? (
                <div style={{ marginTop: '0.8rem' }}>
                  <p style={{ color: '#4CAF50', fontWeight: '600' }}>✅ Assigned Tasks ({assignments.length}):</p>
                  {assignments.map(req => (
                    <div key={req.id} style={{ borderBottom: '1px solid #ddd', padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Request ID {req.id} in {req.location}</span>
                      <button
                        onClick={() => setActiveChat({ requestId: req.id, senderName: volunteer.name })}
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
          ) : (
            <p style={{ marginTop: '0.5rem' }}>{nameSearch.trim() === '' ? 'Please enter your full name to check status.' : 'No registered volunteer found with that name.'}</p>
          )}
        </div>
        <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Render ChatBox when a chat is active */}
      {activeChat && (
        <ChatBox
          requestId={activeChat.requestId}
          participantName={activeChat.senderName}
          onClose={() => setActiveChat(null)}
          isVolunteerView={true}
        />
      )}
    </div>
  );
};
// --- END Volunteer Dashboard Component ---


const LandingPage = () => {
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showVolunteerDashboard, setShowVolunteerDashboard] = useState(false); // State for Volunteer Sign-In modal

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
            {/* NEW: Combined Volunteer Portal Button */}
            <button
              className="btn-dashboard btn-volunteer-portal"
              onClick={() => {
                // Default action: open the Volunteer Sign In/Status Dashboard
                setShowVolunteerDashboard(true);
                // Optional: You might add a prompt here to ask user if they want to Sign In or Sign Up
              }}
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
              <h4>24/7 Help Line</h4>
              <div className="emergency-phone">+1 (555) HELP-NOW</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Forms */}
      {showHelpForm && <HelpRequestForm onClose={() => setShowHelpForm(false)} />}
      {showVolunteerForm && <VolunteerForm onClose={() => setShowVolunteerForm(false)} />}
      {showAdminForm && <AdminSignInForm onClose={() => setShowAdminForm(false)} />}
      {/* The Volunteer Sign-In/Status Modal */}
      {showVolunteerDashboard && <VolunteerDashboard onClose={() => setShowVolunteerDashboard(false)} />}
    </div>
  );
};

export default LandingPage;
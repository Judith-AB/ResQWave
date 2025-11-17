import React, { useState, useEffect } from "react";
import HelpRequestForm from "./HelpRequestForm";
import VolunteerForm from "./VolunteerForm";
import AdminSignInForm from "./AdminSignInForm";
import VolunteerDashboard from "./VolunteerDashboard.jsx";
import VolunteerSignInModal from "./VolunteerSignInModal";
import LookupModal from "./LookupModal"; // You need this import if using the Resume Help feature

import "./index.css";

// 🚨 CRITICAL FIX: Ensure ALL context hooks used ANYWHERE in the file are imported
import { useVolunteers } from "./context/VolunteerContext"; // <-- UNCOMMENT/ENSURE THIS IS PRESENT
import { useRequests } from "./context/RequestsContext";

// --- Volunteer Chooser Modal Component ---
// This acts as a routing selection for volunteers
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
        style={{ marginTop: '1.5rem', width: '100%', background: '#f44336', color: '#f1f1f1' }}
      >
        Cancel
      </button>
    </div>
  </div>
);


const LandingPage = () => {
  // NOTE: This state is used for the volunteer dashboard conditional rendering
  // const { volunteers } = useVolunteers(); 

  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false); // Signup
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showVolunteerChooser, setShowVolunteerChooser] = useState(false);
  const [showVolunteerSignIn, setShowVolunteerSignIn] = useState(false);
  const [volunteerUser, setVolunteerUser] = useState(null); // Holds user data if signed in
  const [showLookupModal, setShowLookupModal] = useState(false);

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

  // Function run on successful Volunteer Sign-In 
  const handleVolunteerSuccess = (userData) => {
    if (userData && userData.id) {
      setVolunteerUser(userData);
      setShowVolunteerSignIn(false);
    }
  };


  if (volunteerUser) {
    return <VolunteerDashboard onClose={() => setVolunteerUser(null)} user={volunteerUser} />;
  }

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
              className="btn-volunteer-portal"
              onClick={() => setShowVolunteerChooser(true)}

            >
              Volunteer Portal
            </button>
            <button className="btn-dashboard" onClick={() => setShowAdminForm(true)}>Admin Dashboard</button>
            <button
              className="btn-resume-help" // Use a secondary style for clarity
              onClick={() => setShowLookupModal(true)}>Resume Help
            </button>
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
              <button className="btn-secondary" onClick={() => setShowVolunteerChooser(true)}>🤝 Join as Volunteer</button>
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

      {/* How It Works Section */}
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

      {/* About and Footer Section */}
      <section id="about" className="about">
        <div className="section-container">
          <h2 className="section-title">About This Project</h2>
          <p className="section-description">
            This is a student project to demonstrate a prototype disaster relief platform. Victims can submit requests, volunteers can join and respond, and coordinators can manage tasks. The platform emphasizes real-time assistance, simplicity, and educational value.
          </p>
        </div>
      </section>

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
              <h4>24/7 Relief Helpline</h4>
              <div className="emergency-phone">112</div>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Forms and Modals Rendering --- */}
      {showHelpForm && <HelpRequestForm onClose={() => setShowHelpForm(false)} />}
      {showVolunteerForm && <VolunteerForm onClose={() => setShowVolunteerForm(false)} />}
      {showAdminForm && <AdminSignInForm onClose={() => setShowAdminForm(false)} />}

      {/* RENDER VOLUNTEER CHOOSER */}
      {showVolunteerChooser && (
        <VolunteerChooser
          onClose={() => setShowVolunteerChooser(false)}
          openSignIn={() => { setShowVolunteerChooser(false); setShowVolunteerSignIn(true); }}
          openSignUp={() => { setShowVolunteerChooser(false); setShowVolunteerForm(true); }}
        />
      )}

      {/* RENDER VOLUNTEER SIGN-IN MODAL */}
      {showVolunteerSignIn && (
        <VolunteerSignInModal
          onClose={() => setShowVolunteerSignIn(false)}
          onSuccess={handleVolunteerSuccess}
        />
      )}
      {showLookupModal && <LookupModal onClose={() => setShowLookupModal(false)} />}
    </div>
  );
};

export default LandingPage;
import React, { useState, useEffect } from 'react';

const DisasterReliefLanding = () => {
  const [currentSection, setCurrentSection] = useState('hero');

  const showSection = (section) => {
    setCurrentSection(section);
  };

  const toggleSection = () => {
    setCurrentSection(currentSection === 'hero' ? 'how-it-works' : 'hero');
  };

  useEffect(() => {
    // Add smooth scrolling animation
    const elements = document.querySelectorAll('.process-step, .stat-item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    });
    
    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.6s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentSection]);

  const handleButtonClick = (e) => {
    const ripple = document.createElement('span');
    const rect = e.target.getBoundingClientRect();
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    
    e.target.style.position = 'relative';
    e.target.style.overflow = 'hidden';
    e.target.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          overflow-x: hidden;
        }

        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          text-decoration: none;
          cursor: pointer;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #4FC3F7, #29B6F6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }

        .nav-menu {
          display: flex;
          list-style: none;
          gap: 2rem;
          align-items: center;
        }

        .nav-menu button {
          background: none;
          border: none;
          color: #666;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.3s ease;
          font-size: 1rem;
        }

        .nav-menu button:hover {
          color: #2196F3;
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-dashboard {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 2px solid #2196F3;
          color: #2196F3;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-dashboard:hover {
          background: #2196F3;
          color: white;
        }

        .btn-help {
          padding: 0.5rem 1.5rem;
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
          cursor: pointer;
        }

        .btn-help:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
        }

        .hero {
          background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
          min-height: 100vh;
          display: ${currentSection === 'hero' ? 'flex' : 'none'};
          align-items: center;
          padding-top: 80px;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 2rem;
          color: #1565C0;
        }

        .hero-content h1 .highlight {
          color: #4CAF50;
        }

        .emergency-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(76, 175, 80, 0.1);
          color: #388E3C;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 2rem;
        }

        .emergency-badge::before {
          content: "●";
          color: #4CAF50;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .hero-description {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-primary {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(244, 67, 54, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(244, 67, 54, 0.4);
        }

        .btn-secondary {
          padding: 1rem 2rem;
          background: transparent;
          color: #4CAF50;
          border: 2px solid #4CAF50;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #4CAF50;
          color: white;
          transform: translateY(-3px);
        }

        .hero-image {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .hero-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .stats-overlay {
          position: absolute;
          bottom: 2rem;
          left: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2196F3;
          display: block;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .how-it-works {
          padding: 6rem 0;
          background: #f8f9ff;
          display: ${currentSection === 'how-it-works' ? 'block' : 'none'};
          min-height: 100vh;
          padding-top: 140px;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .section-title {
          text-align: center;
          font-size: 3rem;
          font-weight: 700;
          color: #1565C0;
          margin-bottom: 1rem;
        }

        .section-description {
          text-align: center;
          font-size: 1.3rem;
          color: #666;
          margin-bottom: 4rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .process-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-top: 4rem;
        }

        .process-step {
          background: white;
          border-radius: 20px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .process-step:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .process-step::after {
          content: "→";
          position: absolute;
          right: -1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 2rem;
          color: #2196F3;
          z-index: 10;
        }

        .process-step:last-child::after {
          display: none;
        }

        .step-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 1.5rem;
        }

        .step-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .step-icon.sos {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .step-icon.handshake {
          background: linear-gradient(135deg, #FF9800, #F57C00);
          color: white;
        }

        .step-icon.chat {
          background: linear-gradient(135deg, #9C27B0, #7B1FA2);
          color: white;
        }

        .step-icon.check {
          background: linear-gradient(135deg, #4CAF50, #388E3C);
          color: white;
        }

        .step-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1565C0;
          margin-bottom: 1rem;
        }

        .step-description {
          color: #666;
          line-height: 1.6;
        }

        .footer {
          background: linear-gradient(135deg, #1565C0, #0D47A1);
          color: white;
          padding: 4rem 0 2rem;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 4rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .footer-brand .logo-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .footer-description {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .footer-section h3 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .footer-links {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-links button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          transition: color 0.3s ease;
          font-size: 1rem;
        }

        .footer-links button:hover {
          color: white;
        }

        .emergency-contact {
          background: rgba(244, 67, 54, 0.2);
          padding: 1.5rem;
          border-radius: 12px;
          margin-top: 1rem;
        }

        .emergency-contact h4 {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .emergency-phone {
          font-size: 1.2rem;
          font-weight: 600;
          color: #ffeb3b;
        }

        .nav-toggle {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          cursor: pointer;
          font-size: 1.5rem;
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3);
          transition: all 0.3s ease;
        }

        .nav-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(33, 150, 243, 0.4);
        }

        .trust-indicators {
          display: flex;
          gap: 2rem;
          margin-top: 3rem;
          align-items: center;
          color: #666;
          font-size: 0.9rem;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trust-icon {
          width: 20px;
          height: 20px;
          background: #2196F3;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }

          .hero-content h1 {
            font-size: 2.5rem;
          }

          .process-steps {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .process-step::after {
            content: "↓";
            right: 50%;
            top: auto;
            bottom: -1rem;
            transform: translateX(50%);
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .stats-overlay {
            grid-template-columns: repeat(2, 1fr);
          }

          .nav-menu {
            display: none;
          }
        }
      `}</style>

      <div>
        {/* Header */}
        <header className="header">
          <nav className="nav-container">
            <div className="logo" onClick={() => showSection('hero')}>
              <div className="logo-icon">❤️</div>
              Disaster Relief Platform
            </div>
            
            <ul className="nav-menu">
              <li><button onClick={() => showSection('hero')}>Home</button></li>
              <li><button onClick={() => showSection('about')}>About</button></li>
              <li><button onClick={() => showSection('how-it-works')}>How It Works</button></li>
              <li><button onClick={() => showSection('volunteer')}>Volunteer</button></li>
              <li><button onClick={() => showSection('contact')}>Contact</button></li>
            </ul>
            
            <div className="nav-buttons">
              <button className="btn-dashboard">Dashboard</button>
              <button className="btn-help" onClick={handleButtonClick}>Get Help Now</button>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <div className="emergency-badge">
                24/7 Emergency Response
              </div>
              
              <h1>
                Connecting Victims with Volunteers in{' '}
                <span className="highlight">Real Time</span> During Disasters
              </h1>
              
              <p className="hero-description">
                A prototype platform designed to instantly connect people in need with nearby volunteers 
                during disasters, enabling rapid response coordination when every second counts.
              </p>
              
              <div className="hero-buttons">
                <button className="btn-primary" onClick={handleButtonClick}>❤️ Request Help</button>
                <button className="btn-secondary" onClick={handleButtonClick}>🤝 Join as Volunteer</button>
              </div>
              
              <div className="trust-indicators">
                <div className="trust-item">
                  <div className="trust-icon">✓</div>
                  Verified Volunteers
                </div>
                <div className="trust-item">
                  <div className="trust-icon">🔓</div>
                  Open Source
                </div>
              </div>
            </div>
            
            <div className="hero-image">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Cdefs%3E%3ClinearGradient id='water' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234FC3F7'/%3E%3Cstop offset='100%25' stop-color='%2329B6F6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='400' fill='%23E8F5E8'/%3E%3Cpath d='M0 300 Q150 280 300 300 T600 300 L600 400 L0 400 Z' fill='url(%23water)'/%3E%3Ccircle cx='150' cy='200' r='15' fill='%23f44336'/%3E%3Ccircle cx='200' cy='180' r='15' fill='%23FF9800'/%3E%3Ccircle cx='300' cy='220' r='12' fill='%23f44336'/%3E%3Crect x='380' y='160' width='80' height='40' rx='10' fill='%23fff' stroke='%23ddd' stroke-width='2'/%3E%3Ctext x='420' y='175' text-anchor='middle' font-size='12' fill='%23333'%3EBoat%3C/text%3E%3Ctext x='420' y='190' text-anchor='middle' font-size='12' fill='%23333'%3ERescue%3C/text%3E%3C/svg%3E" alt="Disaster Relief in Action" />
              
              <div className="stats-overlay">
                <div className="stat-item">
                  <span className="stat-number">Fast</span>
                  <div className="stat-label">Response</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Real-time</span>
                  <div className="stat-label">Matching</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">GPS</span>
                  <div className="stat-label">Location</div>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Secure</span>
                  <div className="stat-label">Platform</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <div className="section-container">
            <h2 className="section-title">Simple, Fast, Life-Saving</h2>
            <p className="section-description">
              This prototype demonstrates a streamlined process for rapid response and effective coordination between 
              those who need help and those ready to provide it.
            </p>
            
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-icon sos">SOS</div>
                <h3 className="step-title">Victims Submit Requests</h3>
                <p className="step-description">
                  Those in need quickly submit help requests with location and urgency details
                </p>
              </div>
              
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-icon handshake">🤝</div>
                <h3 className="step-title">Volunteers Get Matched</h3>
                <p className="step-description">
                  Our system automatically matches nearby volunteers with relevant skills
                </p>
              </div>
              
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-icon chat">💬</div>
                <h3 className="step-title">Real-time Chat & Updates</h3>
                <p className="step-description">
                  Direct communication between victims and volunteers with live location sharing
                </p>
              </div>
              
              <div className="process-step">
                <div className="step-number">4</div>
                <div className="step-icon check">✓</div>
                <h3 className="step-title">Request Resolution</h3>
                <p className="step-description">
                  Help is provided and verified, creating a complete assistance record
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div>
              <div className="footer-brand">
                <div className="logo-icon">❤️</div>
                Disaster Relief Platform
              </div>
              <p className="footer-description">
                A prototype platform demonstrating technology-driven volunteer coordination 
                and real-time response systems for disaster relief scenarios.
              </p>
            </div>
            
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><button>About Us</button></li>
                <li><button onClick={() => showSection('how-it-works')}>How It Works</button></li>
                <li><button>Volunteer</button></li>
                <li><button>Resources</button></li>
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

        {/* Navigation Toggle Button */}
        <button className="nav-toggle" onClick={toggleSection}>
          {currentSection === 'hero' ? 'ℹ️' : '🏠'}
        </button>
      </div>
    </>
  );
};

export default DisasterReliefLanding;
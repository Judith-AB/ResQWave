import React, { useState } from "react";

const VolunteerSignup = ({ onClose, volunteers, setVolunteers }) => {
  const [formData, setFormData] = useState({ name:"", contact:"", skills:"" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setVolunteers([...volunteers, { ...formData, id: Date.now() }]);
    onClose();
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>🤝 Volunteer Signup</h2>
        <form onSubmit={handleSubmit}>
          <label>Full Name:<input type="text" name="name" value={formData.name} onChange={handleChange} required /></label>
          <label>Contact:<input type="text" name="contact" value={formData.contact} onChange={handleChange} required /></label>
          <label>Skills / Expertise:<input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., Medical, Rescue" /></label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Sign Up</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerSignup;

import React, { useState } from "react";

const API_BASE_URL = "http://localhost:3001/api/auth";

const VolunteerForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    location: "",
    skills: "",
    username: "",
    password: "",
    isMedicalCertified: false,
    proofFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (formData.isMedicalCertified && !formData.proofFile) {
      setError("Please upload proof if you claim medical certification.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        contact: formData.contact,
        location: formData.location,
        skills: formData.skills,
        username: formData.username,
        password: formData.password,
        isMedicalCertified: formData.isMedicalCertified,
      };

      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Registration successful! You can now sign in.");
      } else {
        setError(data.message || "Registration failed. Please try a different username.");
      }
    } catch (err) {
      setError("Network error. Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container" style={{ maxWidth: '450px' }}>
        <h2>🤝 Volunteer Sign-Up</h2>
        <form onSubmit={handleSubmit}>

          {success && <div style={{ color: 'white', background: '#4CAF50', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{success}</div>}
          {error && <div style={{ color: 'white', background: '#f44336', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>{error}</div>}

          {/* Basic Info */}
          <label>Full Name:<input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required /></label>
          <label>Contact:<input type="text" name="contact" value={formData.contact} onChange={handleChange} required /></label>
          <label>Location (City/Area):<input type="text" name="location" value={formData.location} onChange={handleChange} required /></label>
          <label>Skills / Expertise:<input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., Rescue, Medical, Engineering" /></label>

          {/* Sign-In Credentials */}
          <h4 style={{ marginTop: '15px', marginBottom: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>Create Sign-In Credentials</h4>
          <label>Username:<input type="text" name="username" value={formData.username} onChange={handleChange} required /></label>
          <label>Password:<input type="password" name="password" value={formData.password} onChange={handleChange} required /></label>

          {/* Medical Certification and Proof */}
          <h4 style={{ marginTop: '15px', marginBottom: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>Verification (Optional)</h4>
          <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal', marginBottom: '10px' }}>
            <input
              type="checkbox"
              name="isMedicalCertified"
              checked={formData.isMedicalCertified}
              onChange={handleChange}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            I am a certified medical volunteer.
          </label>

          {formData.isMedicalCertified && (
            <label>
              Medical Proof (Upload Placeholder):
              <input type="file" name="proofFile" onChange={handleChange} required={formData.isMedicalCertified} />
            </label>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Sign Up'}
            </button>
            <button type="button" className="btn-primary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerForm;
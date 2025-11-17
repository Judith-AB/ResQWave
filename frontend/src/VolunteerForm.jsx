import React, { useState } from "react";

const API_BASE_URL = "http://localhost:3001/api/auth";


const EyeOff = () => <span>🙈</span>;
const Eye = () => <span>👁️</span>;

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

  const [showPassword, setShowPassword] = useState(false); // ← NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const validateForm = () => {
    if (!/^[A-Za-z\s]+$/.test(formData.fullName)) {
      return "Full Name cannot contain numbers or special characters.";
    }
    if (!formData.contact.trim()) return "Contact number is required.";
    if (!/^\d{10}$/.test(formData.contact)) return "Contact must be a 10-digit number.";
    if (!formData.location.trim()) return "Location is required.";
    if (!formData.username.trim()) return "Username is required.";
    if (!formData.password) return "Password is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters long.";

    if (formData.isMedicalCertified) {
      if (!formData.proofFile) return "Please upload proof if you claim medical certification.";
      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowedTypes.includes(formData.proofFile.type)) {
        return "Proof file must be PNG, JPEG, or PDF.";
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Registration successful! You can now sign in.");
        setFormData({
          fullName: "",
          contact: "",
          location: "",
          skills: "",
          username: "",
          password: "",
          isMedicalCertified: false,
          proofFile: null,
        });
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
      <div className="form-container" style={{ maxWidth: "450px" }}>
        <h2>🤝 Volunteer Sign-Up</h2>

        {success && (
          <div
            style={{
              color: "white",
              background: "#4CAF50",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            style={{
              color: "white",
              background: "#f44336",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Full Name:
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
          </label>

          <label>
            Contact:
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} />
          </label>

          <label>
            Location (City/Area):
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </label>

          <label>
            Skills / Expertise:
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., Rescue, Medical, Engineering"
            />
          </label>

          <h4 style={{ marginTop: "15px", marginBottom: "10px" }}>
            Create Sign-In Credentials
          </h4>

          <label>
            Username:
            <input type="text" name="username" value={formData.username} onChange={handleChange} />
          </label>

          
          <label>
            Password:
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
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
                }}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>
        

          <h4 style={{ marginTop: "15px", marginBottom: "10px" }}>Verification (Optional)</h4>

          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              name="isMedicalCertified"
              checked={formData.isMedicalCertified}
              onChange={handleChange}
              style={{ width: "auto", marginRight: "10px" }}
            />
            I am a certified medical volunteer.
          </label>

          {formData.isMedicalCertified && (
            <label>
              Medical Proof (PNG, JPEG, or PDF):
              <input type="file" name="proofFile" onChange={handleChange} />
            </label>
          )}

          <div className="form-actions" style={{ marginTop: "15px" }}>
            <button type="submit" className="btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Sign Up"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerForm;

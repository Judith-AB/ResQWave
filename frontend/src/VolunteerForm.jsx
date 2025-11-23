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

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (type === "file") {
      // Correctly set the file object to the 'proofFile' state key
      setFormData({ ...formData, proofFile: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const validateForm = () => {
    // FIX 1: Ensure all required fields are checked for emptiness
    if (!formData.fullName.trim()) return "Full Name is required.";
    if (!/^[A-Za-z\s]+$/.test(formData.fullName)) return "Full Name cannot contain numbers or special characters.";

    if (!formData.contact.trim()) return "Contact number is required.";
    if (!/^\d{10}$/.test(formData.contact)) return "Contact must be a 10-digit number.";

    if (!formData.location.trim()) return "Location is required.";
    if (!formData.username.trim()) return "Username is required.";

    if (!formData.password) return "Password is required.";
    if (formData.password.length < 6) return "Password must be at least 6 characters long.";

    // Medical proof enforcement logic
    if (formData.isMedicalCertified) {
      if (!formData.proofFile)
        return "Upload your medical certification proof."; // Validation Message Fix

      const allowed = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowed.includes(formData.proofFile.type))
        return "Proof must be PNG, JPEG, or PDF.";
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

    // FIX 2: CRITICAL - Use FormData for file upload
    const form = new FormData();

    form.append("fullName", formData.fullName);
    form.append("contact", formData.contact);
    form.append("location", formData.location);
    form.append("skills", formData.skills);
    form.append("username", formData.username);
    form.append("password", formData.password);
    form.append("isMedicalCertified", formData.isMedicalCertified);

    if (formData.isMedicalCertified && formData.proofFile) {
      form.append("medicalProof", formData.proofFile); // Matches backend Multer field
    }

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        body: form, // Send FormData object (browser sets the correct Content-Type)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Registration successful! Please wait for admin approval.");
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
      console.error(err);
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
          {/* Inputs for Full Name, Contact, Location, Skills */}
          <label>Full Name:<input type="text" name="fullName" value={formData.fullName} onChange={handleChange} /></label>
          <label>Contact:<input type="text" name="contact" value={formData.contact} onChange={handleChange} /></label>
          <label>Location (City/Area):<input type="text" name="location" value={formData.location} onChange={handleChange} /></label>
          <label>Skills / Expertise:<input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., Rescue, Medical, Engineering" /></label>

          <h4 style={{ marginTop: "15px", marginBottom: "10px" }}>Create Sign-In Credentials</h4>

          {/* Inputs for Username and Password */}
          <label>Username:<input type="text" name="username" value={formData.username} onChange={handleChange} /></label>
          <label>Password:
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} style={{ width: "100%", paddingRight: "40px" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          <h4 style={{ marginTop: "15px", marginBottom: "10px" }}>Verification (Optional)</h4>

          {/* Checkbox for Medical Certification */}
          <label style={{ display: "flex", alignItems: "center" }}>
            <input type="checkbox" name="isMedicalCertified" checked={formData.isMedicalCertified} onChange={handleChange} style={{ width: "auto", marginRight: "10px" }} />
            I am a certified medical volunteer.
          </label>

          {/* File Upload Input (Conditional) */}
          {formData.isMedicalCertified && (
            <label>
              Medical Proof (PNG, JPEG, or PDF):
              <input type="file" onChange={handleChange} />
            </label>
          )}

          <div className="form-actions" style={{ marginTop: "15px" }}>
            <button type="submit" className="btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Sign Up"}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-primary" style={{ marginLeft: "10px" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerForm;
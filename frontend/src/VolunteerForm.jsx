import React, { useState } from "react";

const API_BASE_URL = "http://localhost:3001/api/auth";

const EyeOff = () => <span>🙈</span>;
const Eye = () => <span>👁️</span>;

const VolunteerForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    location: "",
    skills: "", // now used as volunteer type
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
      setFormData({ ...formData, proofFile: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    setError("");
  };

  // ===============================
  // VALIDATION
  // ===============================
  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full Name is required.";
    if (!/^[A-Za-z\s]+$/.test(formData.fullName))
      return "Full Name must contain only letters.";

    if (!formData.contact.trim()) return "Contact number is required.";
    if (!/^\d{10}$/.test(formData.contact))
      return "Contact must be a 10-digit number.";

    if (!formData.location.trim()) return "Location is required.";
    if (!formData.username.trim()) return "Username is required.";

    if (!formData.password) return "Password is required.";
    if (formData.password.length < 6)
      return "Password must be 6+ characters.";

    if (!formData.skills) return "Please select volunteer type.";

    if (formData.skills === "Medical") {
      if (!formData.proofFile)
        return "Medical volunteers must upload proof.";
    }

    return null;
  };

  // ===============================
  // SUBMIT FORM
  // ===============================
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

    // Prepare FormData
    const form = new FormData();
    form.append("fullName", formData.fullName);
    form.append("contact", formData.contact);
    form.append("location", formData.location);

    // "skills" now stores volunteer type
    form.append("skills", formData.skills);

    form.append("username", formData.username);
    form.append("password", formData.password);

    form.append("isMedicalCertified", formData.skills === "Medical");

    if (formData.skills === "Medical" && formData.proofFile) {
      form.append("medicalProof", formData.proofFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.message || "Registration successful! Please wait for admin approval."
        );

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
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Server unreachable.");
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
          {/* Full Name */}
          <label>
            Full Name:
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
          </label>

          {/* Contact */}
          <label>
            Contact:
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} />
          </label>

          {/* Location */}
          <label>
            Location (City/Area):
            <input type="text" name="location" value={formData.location} onChange={handleChange} />
          </label>

          {/* Volunteer Type Dropdown */}
          <label>
            Volunteer Type:
            <select
              name="skills"
              value={formData.skills}
              onChange={(e) => {
                const value = e.target.value;

                setFormData({
                  ...formData,
                  skills: value,
                  isMedicalCertified: value === "Medical",
                  proofFile: null
                });
              }}
              required
            >
              <option value="">-- Select Volunteer Type --</option>
              <option value="General">General Volunteer</option>
              <option value="Medical">Medical Volunteer</option>
            </select>
          </label>

          {/* Medical Proof Upload */}
          {formData.skills === "Medical" && (
            <label>
              Upload Medical Certification (PNG / JPG / PDF):
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proofFile: e.target.files[0] || null,
                  })
                }
              />
            </label>
          )}

          {/* Username */}
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
            />
          </label>

          {/* Password */}
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

          {/* Buttons */}
          <div className="form-actions" style={{ marginTop: "15px" }}>
            <button type="submit" className="btn-secondary" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              disabled={isSubmitting}
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

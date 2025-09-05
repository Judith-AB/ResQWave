import { useState } from "react";
import "./index.css";

const HelpRequestForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        location: "",
        emergencyType: "",
        details: "",
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("✅ Request submitted!\n" + JSON.stringify(formData, null, 2));
        onClose();
    };

    return (
        <div className="form-overlay">
            <div className="form-container">
                <h2>🚨 Request Help</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Full Name:
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </label>
                    <label>
                        Contact:
                        <input type="text" name="contact" value={formData.contact} onChange={handleChange} required />
                    </label>
                    <label>
                        Location:
                        <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Area" required />
                    </label>
                    <label>
                        Emergency Type:
                        <select name="emergencyType" value={formData.emergencyType} onChange={handleChange} required>
                            <option value="">--Select--</option>
                            <option value="Flood">🌊 Flood</option>
                            <option value="Earthquake">🌍 Earthquake</option>
                            <option value="Fire">🔥 Fire</option>
                            <option value="Medical">🏥 Medical</option>
                            <option value="Other">⚠️ Other</option>
                        </select>
                    </label>
                    <label>
                        Additional Details:
                        <textarea name="details" value={formData.details} onChange={handleChange} placeholder="Describe the situation..." />
                    </label>
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Submit</button>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HelpRequestForm;

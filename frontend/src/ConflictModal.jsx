// --- frontend/ConflictModal.jsx ---
import React, { useState } from 'react';

const ConflictModal = ({ onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (reason.trim() === '') {
            alert("Please describe the issue in detail.");
            return;
        }
        onSubmit(reason);
    };

    const modalOverlayStyle = { 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0, 0, 0, 0.7)', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    };
    const modalContainerStyle = { 
        background: 'white', padding: '2rem', borderRadius: '8px', 
        width: '400px', maxWidth: '90%', 
        boxShadow: '0 5px 25px rgba(0,0,0,0.4)'
    };
    const textareaStyle = { 
        width: '100%', marginBottom: '1rem', padding: '0.75rem', 
        border: '1px solid #ccc', borderRadius: '4px', resize: 'none' 
    };
    const formActionsStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px' };
    const buttonStyle = { padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

    return (
        <div className="modal-overlay" style={modalOverlayStyle}>
            <div className="modal-container" style={modalContainerStyle}>
                <h3 style={{ marginTop: 0, color: '#e53935' }}>Report Conflict / Issue</h3>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                    Please explain why you need an administrator to intervene immediately.
                </p>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Volunteer is not responding, critical change in emergency, or safety concern."
                        required
                        rows="4"
                        style={textareaStyle}
                    />
                    <div style={formActionsStyle}>
                        <button type="button" onClick={onClose} style={{ ...buttonStyle, background: '#ccc', color: '#333' }}>
                            Cancel
                        </button>
                        <button type="submit" style={{ ...buttonStyle, background: '#e53935', color: 'white' }}>
                            Submit Report 🚩
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConflictModal;
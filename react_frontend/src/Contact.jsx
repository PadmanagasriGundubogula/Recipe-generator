import React, { useState } from 'react';
import './Contact.css';
import { API_URL } from './config';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // helper to post feedback (autosave = true for sheet-only autosaves)
    const postFeedback = async (payload) => {
        try {
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return response;
        } catch (err) {
            console.error('postFeedback error', err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await postFeedback({ ...formData, autosave: false });
            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message || 'Thank you! Your feedback has been sent.' });
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to send feedback.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Something went wrong. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-container">
            <div className="contact-card">
                <div className="contact-header">
                    <h1>Contact <span className="highlight">Us</span></h1>
                    <p>We'd love to hear from you. Send us your feedback or queries!</p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your Name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="How can we help?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            onBlur={async () => {
                                // Autosave when the user leaves the message box
                                const msg = formData.message && formData.message.trim();
                                if (!msg) return;

                                // avoid duplicate autosaves for same message
                                if (localStorage.getItem('last_autosaved_message') === msg) return;

                                try {
                                    const res = await postFeedback({ message: msg, name: formData.name || '', email: formData.email || '', subject: formData.subject || '', autosave: true });
                                    if (res && res.ok) {
                                        setStatus({ type: 'info', message: 'Message autosaved to Google Sheets.' });
                                        localStorage.setItem('last_autosaved_message', msg);
                                        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
                                    }
                                } catch (err) {
                                    console.error('Autosave failed', err);
                                }
                            }}
                            placeholder="Tell us more..."
                            rows="5"
                            required
                        ></textarea>
                    </div>

                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Feedback'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Contact;

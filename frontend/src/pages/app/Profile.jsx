import React, { useEffect, useState } from 'react';
import { PageHeader, AppButton, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import './Profile.css';

const COLORS = [
  '#a8d5c4', '#6b9fd4', '#d4a26b', '#c4a8d5', '#d46b6b',
  '#6bd4b3', '#d4d46b', '#6b8fd4', '#d46bb3', '#a8c4d5',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    color: user?.color || '#a8d5c4',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ category: 'ACCOUNT', subject: '', description: '' });
  const [complaintError, setComplaintError] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSaved, setComplaintSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    complaintService.getMine(user.id)
      .then((data) => { if (active) setComplaints(data); })
      .catch((error) => { if (active) setComplaintError(error.message); });
    return () => { active = false; };
  }, [user?.id]);

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePwSave = (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    // TODO: POST /api/users/password
    setPwSaved(true);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setTimeout(() => setPwSaved(false), 2000);
  };

  const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    setComplaintError('');
    setComplaintSaved(false);
    setComplaintLoading(true);
    try {
      const complaint = await complaintService.create({ ...complaintForm, userId: user.id });
      setComplaints((current) => [complaint, ...current]);
      setComplaintForm({ category: 'ACCOUNT', subject: '', description: '' });
      setComplaintSaved(true);
    } catch (error) {
      setComplaintError(error.message);
    } finally {
      setComplaintLoading(false);
    }
  };

  return (
    <div className="profile-page page-fade">
      <PageHeader title="Profile" subtitle="Manage your personal information" />

      {/* Avatar display */}
      <div className="profile-avatar-section">
        <div
          className="profile-avatar-large"
          style={{ background: form.color }}
        >
          {form.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2 className="profile-avatar-name">{form.name}</h2>
          <p className="profile-avatar-email">{form.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="app-card profile-card">
        <h3 className="profile-section-title">Personal Information</h3>
        <form onSubmit={handleSave} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Name</label>
            <input
              className="app-form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div className="app-form-group">
            <label className="app-form-label">Email</label>
            <input
              className="app-form-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
            />
          </div>

          {/* Color picker */}
          <div className="app-form-group">
            <label className="app-form-label">Profile color</label>
            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch${form.color === color ? ' selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <AppButton type="submit" variant="primary" size="md">
            {saved ? '✓ Saved!' : 'Save changes'}
          </AppButton>
        </form>
      </div>

      {/* Password change */}
      <div className="app-card profile-card">
        <h3 className="profile-section-title">Contact support</h3>
        <p className="support-intro">Send a complaint or report a problem. You can follow its progress here.</p>
        {complaintError && <p className="support-message is-error" role="alert">{complaintError}</p>}
        {complaintSaved && <p className="support-message is-success" role="status">Your complaint was sent to the support team.</p>}
        <form className="app-form" onSubmit={handleComplaintSubmit}>
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-category">Category</label>
            <select id="complaint-category" className="app-form-select" value={complaintForm.category} onChange={(event) => setComplaintForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="ACCOUNT">Account</option>
              <option value="HOUSEHOLD">Household</option>
              <option value="PAYMENT">Payments</option>
              <option value="BUG">Technical issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-subject">Subject</label>
            <input id="complaint-subject" className="app-form-input" minLength="5" maxLength="120" required value={complaintForm.subject} onChange={(event) => setComplaintForm((current) => ({ ...current, subject: event.target.value }))} placeholder="A short summary" />
          </div>
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-description">Details</label>
            <textarea id="complaint-description" className="app-form-textarea" minLength="20" maxLength="5000" required value={complaintForm.description} onChange={(event) => setComplaintForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe what happened and what you expected." />
            <span className="support-character-count">{complaintForm.description.length}/5000</span>
          </div>
          <AppButton type="submit" variant="primary" size="md" disabled={complaintLoading}>
            {complaintLoading ? 'Sending...' : 'Send complaint'}
          </AppButton>
        </form>
        <div className="support-history">
          <h4 className="profile-section-title">Your requests</h4>
          {complaints.length === 0 ? <p className="support-empty">No support requests yet.</p> : complaints.map((complaint) => (
            <article className="support-request" key={complaint.id}>
              <div className="support-request-heading">
                <div><strong>{complaint.subject}</strong><span>{complaint.category} · {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Just now'}</span></div>
                <span className={`support-status status-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
              </div>
              {complaint.adminResponse && <p className="support-admin-response">{complaint.adminResponse}</p>}
            </article>
          ))}
        </div>
      </div>

      <div className="app-card profile-card">
        <h3 className="profile-section-title">Change Password</h3>
        {pwError && (
          <div className="auth-error" style={{ marginBottom: '1rem', borderRadius: '10px' }}>
            {pwError}
          </div>
        )}
        <form onSubmit={handlePwSave} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Current password</label>
            <input
              className="app-form-input"
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="app-form-group">
            <label className="app-form-label">New password</label>
            <input
              className="app-form-input"
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="app-form-group">
            <label className="app-form-label">Confirm new password</label>
            <input
              className="app-form-input"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <AppButton type="submit" variant="ghost" size="md">
            {pwSaved ? '✓ Password updated!' : 'Update password'}
          </AppButton>
        </form>
      </div>
    </div>
  );
}

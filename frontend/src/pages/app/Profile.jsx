import React, { useState } from 'react';
import { PageHeader, AppButton, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
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

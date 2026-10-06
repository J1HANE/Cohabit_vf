import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './HouseholdOnboarding.css';

export default function HouseholdJoin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setHouseholdData } = useHousehold();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter an invitation code.'); return; }
    if (!user?.id) { setError('You must be logged in to join a household.'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8081/api/households/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code.trim(), userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join household. Please try again.');
        setLoading(false);
        return;
      }
      setHouseholdData(data.household, data.members || []);
      updateUser({ householdId: data.household.id });
      navigate('/dashboard');
    } catch {
      setError('Failed to join household. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <Link to="/" className="auth-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: '#fff', marginBottom: '2rem' }}>
          <div className="logo-icon" />
          <span className="brand-name">Cohabit</span>
        </Link>

        <div className="onboarding-icon">🔑</div>
        <h2 className="onboarding-title">Join a household</h2>
        <p className="onboarding-subtitle">
          Enter the invitation code shared by your roommate to join their household.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleJoin} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Invitation code</label>
            <input
              className="app-form-input join-code-input"
              placeholder="e.g. 8FJ29K"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join household'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <p>Want to create a new household? <Link to="/household/create">Create one</Link></p>
        </div>
      </div>

      <div className="onboarding-deco deco-1">🏠</div>
      <div className="onboarding-deco deco-2">🤝</div>
      <div className="onboarding-deco deco-3">✨</div>
    </div>
  );
}

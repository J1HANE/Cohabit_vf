import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './HouseholdOnboarding.css';

export default function HouseholdCreate() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setHouseholdData } = useHousehold();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a household name.'); return; }
    if (!user?.id) { setError('You must be logged in to create a household.'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8081/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create household. Please try again.');
        setLoading(false);
        return;
      }
      setHouseholdData(data.household, data.members || []);
      updateUser({ householdId: data.household.id });
      navigate('/dashboard');
    } catch {
      setError('Failed to create household. Please try again.');
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

        <div className="onboarding-icon">🏡</div>
        <h2 className="onboarding-title">Create your household</h2>
        <p className="onboarding-subtitle">
          Set up a shared space for you and your roommates. You'll get an invitation code to share.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleCreate} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Household name</label>
            <input
              className="app-form-input"
              placeholder="e.g. Appartement Maârif"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create household'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <p>Have an invite code? <Link to="/household/join">Join a household</Link></p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="onboarding-deco deco-1">🏠</div>
      <div className="onboarding-deco deco-2">💰</div>
      <div className="onboarding-deco deco-3">🧹</div>
    </div>
  );
}

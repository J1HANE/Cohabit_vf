import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Check if user is admin
      if (data.role !== 'ADMIN') {
        throw new Error('Access denied. Admin account required.');
      }

      // Store admin token/user info
      localStorage.setItem('adminUser', JSON.stringify(data));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Admin Portal</h1>
          <p>CoHabit Platform Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input
              type="email"
              className="admin-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@cohabit.com"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <input
              type="password"
              className="admin-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="admin-login-button">
            Sign In
          </button>
        </form>

        <div className="admin-login-footer">
          <button
            type="button"
            className="admin-back-link"
            onClick={() => navigate('/')}
          >
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  );
}

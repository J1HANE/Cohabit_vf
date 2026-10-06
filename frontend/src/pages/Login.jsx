import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setHouseholdData, clearHousehold } = useHousehold();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data); // saves user to AuthContext + localStorage

        // If user already has a household, fetch it and its members
        if (data.householdId) {
          try {
            const [householdRes, membersRes] = await Promise.all([
              fetch(`http://localhost:8081/api/households/${data.householdId}`),
              fetch(`http://localhost:8081/api/households/${data.householdId}/members`),
            ]);
            const household = householdRes.ok ? await householdRes.json() : { id: data.householdId };
            const members = membersRes.ok ? await membersRes.json() : [];
            setHouseholdData(household, members);
          } catch (_) {
            // silently ignore — user will just have empty members until refresh
          }
          navigate('/dashboard');
        } else {
          clearHousehold();
          navigate('/household/join');
        }
      } else {
        setError(data.error || 'Email ou mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon"></div>
            <span className="brand-name">Cohabit</span>
          </Link>
          <h2>Content de vous revoir !</h2>
          <p>Connectez-vous à votre foyer.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="votre@email.com"
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit">Se connecter</button>
        </form>
        
        <div className="auth-footer">
          <p>Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link></p>
        </div>
      </div>
    </div>
  );
}

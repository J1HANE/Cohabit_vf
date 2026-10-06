import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './Settlements.css';

export default function SettlementNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members } = useHousehold();
  const [form, setForm] = useState({
    from_user_id: user?.id || (members[0]?.id || ''),
    to_user_id: members.find((m) => m.id !== user?.id)?.id || (members[1]?.id || ''),
    amount: '',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (members.length > 0) {
      setForm((prev) => ({
        ...prev,
        from_user_id: prev.from_user_id || user?.id || members[0].id,
        to_user_id:
          prev.to_user_id ||
          members.find((m) => m.id !== (user?.id || members[0]?.id))?.id ||
          members[0].id,
      }));
    }
  }, [members, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST /api/settlements
    console.log('New settlement:', form);
    setSuccess(true);
    setTimeout(() => navigate('/settlements'), 1500);
  };

  return (
    <div className="settlements-page page-fade">
      <PageHeader
        title="Settle a Debt"
        subtitle="Record a payment between roommates"
        action={
          <AppButton variant="ghost" size="md" onClick={() => navigate('/balances')}>
            Cancel
          </AppButton>
        }
      />

      <div className="app-card settlement-form-card">
        {success ? (
          <div className="settlement-success">
            <div className="settlement-success-icon">✅</div>
            <h3>Settlement recorded!</h3>
            <p>Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form">
            <div className="app-form-group">
              <label className="app-form-label">From</label>
              <select
                className="app-form-select"
                value={form.from_user_id}
                onChange={(e) => setForm((f) => ({ ...f, from_user_id: parseInt(e.target.value) }))}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="settlement-arrow-label">→ pays</div>

            <div className="app-form-group">
              <label className="app-form-label">To</label>
              <select
                className="app-form-select"
                value={form.to_user_id}
                onChange={(e) => setForm((f) => ({ ...f, to_user_id: parseInt(e.target.value) }))}
              >
                {members.filter((m) => m.id !== form.from_user_id).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="app-form-group">
              <label className="app-form-label">Amount (MAD)</label>
              <input
                className="app-form-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>

            <AppButton type="submit" variant="primary" size="lg" fullWidth>
              Mark as settled
            </AppButton>
          </form>
        )}
      </div>
    </div>
  );
}


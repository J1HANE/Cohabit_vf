import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import './ExpenseNew.css';

const EMOJIS = ['🛒', '🍕', '⚡', '📡', '🏠', '🚗', '💊', '🎉', '☕', '🍔', '💸'];

export default function ExpenseNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, members } = useHousehold();

  const [form, setForm] = useState({
    label: '',
    amount: '',
    payer_id: user?.id || '',
    expense_date: new Date().toISOString().split('T')[0],
    emoji: '🛒',
  });
  const [shares, setShares] = useState(() =>
    members.map((m) => ({ user_id: m.id, selected: true, share_amount: '' }))
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = parseFloat(form.amount) || 0;
  const totalShares = shares
    .filter((s) => s.selected)
    .reduce((sum, s) => sum + (parseFloat(s.share_amount) || 0), 0);
  const remaining = totalAmount - totalShares;

  const splitEvenly = () => {
    const selected = shares.filter((s) => s.selected);
    if (!selected.length || !totalAmount) return;
    const perPerson = (totalAmount / selected.length).toFixed(2);
    setShares((prev) =>
      prev.map((s) =>
        s.selected ? { ...s, share_amount: perPerson } : { ...s, share_amount: '' }
      )
    );
  };

  const toggleMember = (userId) => {
    setShares((prev) =>
      prev.map((s) =>
        s.user_id === userId ? { ...s, selected: !s.selected, share_amount: '' } : s
      )
    );
  };

  const updateShare = (userId, value) => {
    setShares((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, share_amount: value } : s))
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.label.trim()) errs.label = 'Name is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Valid amount required';
    if (Math.abs(remaining) > 0.01)
      errs.shares = `Shares must equal total (${remaining > 0 ? remaining.toFixed(2) + ' MAD remaining' : Math.abs(remaining).toFixed(2) + ' MAD over'})`;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const householdId = household?.id || user?.householdId;
    if (!householdId) {
      setErrors({ submit: 'Join or create a household before adding expenses.' });
      return;
    }

    const payload = {
      householdId,
      payerId: form.payer_id,
      label: form.label,
      amount: parseFloat(form.amount),
      expenseDate: form.expense_date,
      emoji: form.emoji,
      shares: shares
        .filter((s) => s.selected)
        .map((s) => ({ userId: s.user_id, shareAmount: parseFloat(s.share_amount) })),
    };

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8081/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        navigate('/expenses');
      } else {
        const err = await res.json().catch(() => ({}));
        setErrors({ submit: err.message || 'Failed to save expense. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Could not reach the server. Check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expense-new-page page-fade">
      <PageHeader
        title="Add Expense"
        subtitle="Record a new household expense"
        action={
          <AppButton variant="ghost" size="md" onClick={() => navigate('/expenses')}>
            Cancel
          </AppButton>
        }
      />

      <div className="expense-new-card app-card">
        <form onSubmit={handleSubmit} className="app-form">
          {/* Emoji + Name row */}
          <div className="expense-name-row">
            <div className="emoji-picker-wrapper">
              <button
                type="button"
                className="emoji-trigger"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {form.emoji}
              </button>
              {showEmojiPicker && (
                <div className="emoji-dropdown">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className="emoji-option"
                      onClick={() => { setForm((f) => ({ ...f, emoji: e })); setShowEmojiPicker(false); }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="app-form-group" style={{ flex: 1 }}>
              <label className="app-form-label">Expense name</label>
              <input
                className={`app-form-input${errors.label ? ' error' : ''}`}
                placeholder="e.g. Carrefour groceries"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
              {errors.label && <span className="form-error">{errors.label}</span>}
            </div>
          </div>

          {/* Amount */}
          <div className="app-form-group">
            <label className="app-form-label">Amount (MAD)</label>
            <input
              className={`app-form-input${errors.amount ? ' error' : ''}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>

          {/* Paid by + Date */}
          <div className="expense-row-2">
            <div className="app-form-group">
              <label className="app-form-label">Paid by</label>
              <select
                className="app-form-select"
                value={form.payer_id}
                onChange={(e) => setForm((f) => ({ ...f, payer_id: parseInt(e.target.value) }))}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.id === user?.id ? ' (you)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-form-group">
              <label className="app-form-label">Date</label>
              <input
                className="app-form-input"
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Split section */}
          <div className="split-section">
            <div className="split-header">
              <span className="app-form-label">Split between</span>
              <button type="button" className="split-evenly-btn" onClick={splitEvenly}>
                Split evenly
              </button>
            </div>
            <div className="split-members">
              {shares.map((share) => {
                const member = members.find((m) => m.id === share.user_id);
                return (
                  <div key={share.user_id} className={`split-member-row${share.selected ? ' selected' : ''}`}>
                    <button
                      type="button"
                      className={`split-check${share.selected ? ' checked' : ''}`}
                      onClick={() => toggleMember(share.user_id)}
                    >
                      {share.selected ? '✓' : ''}
                    </button>
                    <HouseholdMemberAvatar member={member} size="sm" />
                    <span className="split-member-name">
                      {member?.name}{member?.id === user?.id ? ' (you)' : ''}
                    </span>
                    {share.selected && (
                      <div className="split-amount-input">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={share.share_amount}
                          onChange={(e) => updateShare(share.user_id, e.target.value)}
                          className="app-form-input split-input"
                        />
                        <span className="split-currency">MAD</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total indicator */}
            <div className={`split-total${Math.abs(remaining) < 0.01 ? ' balanced' : ''}`}>
              <span>Total: {totalShares.toFixed(2)} / {totalAmount.toFixed(2)} MAD</span>
              {Math.abs(remaining) > 0.01 && (
                <span className="split-remaining">
                  {remaining > 0 ? `${remaining.toFixed(2)} MAD remaining` : `${Math.abs(remaining).toFixed(2)} MAD over`}
                </span>
              )}
              {Math.abs(remaining) <= 0.01 && totalAmount > 0 && (
                <span className="split-ok">✓ Balanced</span>
              )}
            </div>
            {errors.shares && <span className="form-error">{errors.shares}</span>}
          </div>

          {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}

          <AppButton type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
            {submitting ? 'Saving...' : 'Add expense'}
          </AppButton>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { calculateBalances } from '../../data/mockData';
import { apiFetch } from '../../services/api';
import './Settlements.css';

export default function SettlementNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'request' ? 'request' : 'pay';
  const initialTarget = searchParams.get('target') || searchParams.get('to') || searchParams.get('from');
  const initialAmount = searchParams.get('amount') || '';

  const { user } = useAuth();
  const { household, members } = useHousehold();
  const [mode, setMode] = useState(initialMode); // 'pay' | 'request'

  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const otherMembers = members.filter((m) => m.id !== user?.id);

  const [form, setForm] = useState({
    from_user_id: user?.id || (members[0]?.id || ''),
    to_user_id: initialTarget ? parseInt(initialTarget) : (otherMembers[0]?.id || ''),
    amount: initialAmount,
    note: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch expenses & settlements to compute balances
  useEffect(() => {
    const householdId = household?.id || user?.householdId || user?.household_id;
    if (!householdId) return;

    apiFetch(`http://localhost:8081/api/expenses/household/${householdId}`)
      .then(async (res) => {
        const data = await res.json();
        if (Array.isArray(data)) {
          setExpenses(data.map((e) => ({
            ...e,
            expense_date: e.expenseDate || e.expense_date,
            payer_id: e.payerId || e.payer_id,
            household_id: e.householdId || e.household_id,
            shares: (e.shares || []).map((s) => ({
              id: s.id,
              user_id: s.userId || s.user_id,
              share_amount: s.shareAmount || s.share_amount,
            })),
          })));
        }
      })
      .catch(() => {});

    apiFetch(`http://localhost:8081/api/settlements/household/${householdId}`)
      .then(async (res) => {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSettlements(data.map((s) => ({
            ...s,
            from_user_id: s.fromUserId || s.from_user_id,
            to_user_id: s.toUserId || s.to_user_id,
            settled_at: s.settledAt || s.settled_at,
          })));
        }
      })
      .catch(() => {});
  }, [household?.id, user]);

  const balances = calculateBalances(expenses, settlements, user?.id, members);

  // Compute who owes the current user
  const posMembers = members.filter((m) => (balances[m.id] || 0) > 0);
  const negMembers = members.filter((m) => (balances[m.id] || 0) < 0);
  const debtPairs = [];
  const balCopy = { ...balances };
  const pos = posMembers.map((m) => ({ ...m, bal: balCopy[m.id] }));
  const neg = negMembers.map((m) => ({ ...m, bal: Math.abs(balCopy[m.id]) }));

  for (const debtor of neg) {
    for (const creditor of pos) {
      if (debtor.bal <= 0 || creditor.bal <= 0) continue;
      const amount = Math.min(debtor.bal, creditor.bal);
      if (amount > 0) {
        debtPairs.push({ from: debtor, to: creditor, amount: Math.round(amount * 100) / 100 });
        debtor.bal -= amount;
        creditor.bal -= amount;
      }
    }
  }

  // How much the selected member owes you
  const selectedMemberDebt = debtPairs.find((d) => d.from.id === form.to_user_id && d.to.id === user?.id)?.amount || 0;
  // How much you owe the selected member
  const youOweSelectedMember = debtPairs.find((d) => d.from.id === user?.id && d.to.id === form.to_user_id)?.amount || 0;

  useEffect(() => {
    if (otherMembers.length > 0 && !form.to_user_id) {
      setForm((prev) => ({
        ...prev,
        to_user_id: otherMembers[0].id,
      }));
    }
  }, [otherMembers, form.to_user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const householdId = user?.householdId || user?.household_id;
    setLoading(true);

    try {
      if (mode === 'request') {
        // Venmo-style payment request: requesting from debtor (form.to_user_id)
        const res = await apiFetch('http://localhost:8081/api/settlements/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toUserId: form.to_user_id,
            amount: amt,
            note: form.note.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to send payment request.');
        setSuccess('Payment request sent! Your roommate has been notified.');
        setTimeout(() => navigate('/balances'), 1500);
      } else {
        // Normal debt settlement: you pay roommate
        const payload = {
          householdId,
          fromUserId: user?.id,
          toUserId: form.to_user_id,
          amount: amt,
        };
        const res = await apiFetch('http://localhost:8081/api/settlements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to record settlement.');
        setSuccess('Settlement recorded!');
        setTimeout(() => navigate('/settlements'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === form.to_user_id);

  return (
    <div className="settlements-page page-fade">
      <PageHeader
        title={mode === 'request' ? 'Request Payment' : 'Settle a Debt'}
        subtitle={
          mode === 'request'
            ? 'Request or urge a roommate to pay what they owe you'
            : 'Record a payment you made to a roommate'
        }
        action={
          <AppButton variant="ghost" size="md" onClick={() => navigate('/balances')}>
            Cancel
          </AppButton>
        }
      />

      <div className="app-card settlement-form-card">
        {/* Mode Toggle Tabs */}
        <div className="settlement-tabs">
          <button
            type="button"
            className={`settlement-tab${mode === 'pay' ? ' active' : ''}`}
            onClick={() => {
              setMode('pay');
              setError('');
            }}
          >
            💸 Pay a debt
          </button>
          <button
            type="button"
            className={`settlement-tab${mode === 'request' ? ' active' : ''}`}
            onClick={() => {
              setMode('request');
              setError('');
            }}
          >
            📩 Request money
          </button>
        </div>

        {error && <p className="form-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</p>}

        {success ? (
          <div className="settlement-success">
            <div className="settlement-success-icon">✅</div>
            <h3>{success}</h3>
            <p>Redirecting to balances...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form">
            {mode === 'request' ? (
              <>
                {/* Request Mode: User requests money FROM someone */}
                <div className="app-form-group">
                  <label className="app-form-label">Request payment from</label>
                  <select
                    className="app-form-select"
                    value={form.to_user_id}
                    onChange={(e) => setForm((f) => ({ ...f, to_user_id: parseInt(e.target.value) }))}
                  >
                    {otherMembers.map((m) => {
                      const debt = debtPairs.find((d) => d.from.id === m.id && d.to.id === user?.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} {debt ? `(owes you ${debt.amount.toFixed(2)} MAD)` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {selectedMemberDebt > 0 && (
                    <div className="settlement-owed-badge">
                      <span>💡 {selectedMember?.name} owes you <strong>{selectedMemberDebt.toFixed(2)} MAD</strong></span>
                      <button
                        type="button"
                        className="settlement-quick-fill-btn"
                        onClick={() => setForm((f) => ({ ...f, amount: selectedMemberDebt.toString() }))}
                      >
                        Fill full amount
                      </button>
                    </div>
                  )}
                </div>

                <div className="settlement-arrow-label">→ pays to {user?.name || 'you'}</div>

                <div className="app-form-group">
                  <label className="app-form-label">Amount to request (MAD)</label>
                  <input
                    className="app-form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem', display: 'block' }}>
                    You can request any amount (full or partial payment).
                  </span>
                </div>

                <div className="app-form-group">
                  <label className="app-form-label">Note / Reason (optional)</label>
                  <input
                    className="app-form-input"
                    type="text"
                    placeholder="e.g. Groceries reimbursement, WiFi bill..."
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    maxLength={150}
                  />
                </div>

                <AppButton type="submit" variant="accent" size="lg" fullWidth disabled={loading}>
                  {loading ? 'Sending request...' : 'Send Payment Request'}
                </AppButton>
              </>
            ) : (
              <>
                {/* Pay Mode: User pays a roommate */}
                <div className="app-form-group">
                  <label className="app-form-label">From</label>
                  <input className="app-form-input" value={user?.name || ''} readOnly />
                </div>

                <div className="settlement-arrow-label">→ pays</div>

                <div className="app-form-group">
                  <label className="app-form-label">To</label>
                  <select
                    className="app-form-select"
                    value={form.to_user_id}
                    onChange={(e) => setForm((f) => ({ ...f, to_user_id: parseInt(e.target.value) }))}
                  >
                    {otherMembers.map((m) => {
                      const debt = debtPairs.find((d) => d.from.id === user?.id && d.to.id === m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} {debt ? `(you owe ${debt.amount.toFixed(2)} MAD)` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {youOweSelectedMember > 0 && (
                    <div className="settlement-owed-badge">
                      <span>💡 You owe {selectedMember?.name} <strong>{youOweSelectedMember.toFixed(2)} MAD</strong></span>
                      <button
                        type="button"
                        className="settlement-quick-fill-btn"
                        onClick={() => setForm((f) => ({ ...f, amount: youOweSelectedMember.toString() }))}
                      >
                        Fill full amount
                      </button>
                    </div>
                  )}
                </div>

                <div className="app-form-group">
                  <label className="app-form-label">Amount (MAD)</label>
                  <input
                    className="app-form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>

                <AppButton type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                  {loading ? 'Recording...' : 'Mark as settled'}
                </AppButton>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}


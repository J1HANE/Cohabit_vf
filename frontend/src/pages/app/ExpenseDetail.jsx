import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  AppButton,
  HouseholdMemberAvatar,
  Modal,
} from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './ExpenseDetail.css';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMemberById } = useHousehold();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Settlement state
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleUserId, setSettleUserId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchExpense = () => {
    return fetch(`http://localhost:8081/api/expenses/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Expense not found');
        const data = await res.json();
        setExpense({
          ...data,
          expense_date: data.expenseDate || data.expense_date,
          payer_id: data.payerId || data.payer_id,
          shares: (data.shares || []).map((s) => ({
            id: s.id,
            user_id: s.userId || s.user_id,
            share_amount: Number(s.shareAmount || s.share_amount || 0),
            paid_amount: Number(s.paidAmount || s.paid_amount || 0),
          })),
        });
      })
      .catch((err) => {
        console.error('Failed to fetch expense', err);
        setExpense(null);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchExpense().finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:8081/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        navigate('/expenses');
      } else {
        alert('Failed to delete expense');
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const payer = expense ? getMemberById(expense.payer_id) : null;

  // Compute unpaid shares
  const unpaidShares = (expense?.shares || []).filter((s) => {
    if (Number(s.user_id) === Number(expense.payer_id)) return false;
    const remaining = Number(s.share_amount || 0) - Number(s.paid_amount || 0);
    return remaining > 0.001;
  });

  const myUnpaidShare = unpaidShares.find((s) => Number(s.user_id) === Number(user?.id));

  const openSettleModal = () => {
    const defaultUserId = myUnpaidShare ? user?.id : unpaidShares[0]?.user_id;
    const targetShare = (expense?.shares || []).find(
      (s) => Number(s.user_id) === Number(defaultUserId)
    );
    const remaining = targetShare
      ? Math.max(0, Number(targetShare.share_amount || 0) - Number(targetShare.paid_amount || 0))
      : 0;

    setSettleUserId(defaultUserId || '');
    setSettleAmount(remaining > 0 ? remaining.toFixed(2) : '');
    setSettleError('');
    setIsSettleModalOpen(true);
  };

  const handleUserSelectChange = (newUserId) => {
    setSettleUserId(newUserId);
    const targetShare = (expense?.shares || []).find(
      (s) => Number(s.user_id) === Number(newUserId)
    );
    const remaining = targetShare
      ? Math.max(0, Number(targetShare.share_amount || 0) - Number(targetShare.paid_amount || 0))
      : 0;
    setSettleAmount(remaining > 0 ? remaining.toFixed(2) : '');
    setSettleError('');
  };

  const selectedTargetShare = (expense?.shares || []).find(
    (s) => Number(s.user_id) === Number(settleUserId)
  );
  const selectedTargetRemaining = selectedTargetShare
    ? Math.max(
        0,
        Number(selectedTargetShare.share_amount || 0) - Number(selectedTargetShare.paid_amount || 0)
      )
    : 0;

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(settleAmount);
    if (!settleUserId) {
      setSettleError('Please select a member');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setSettleError('Please enter a valid positive amount');
      return;
    }
    if (amountNum > selectedTargetRemaining + 0.01) {
      setSettleError(`Amount cannot exceed remaining debt (${selectedTargetRemaining.toFixed(2)} MAD)`);
      return;
    }

    setSettling(true);
    setSettleError('');

    try {
      const res = await fetch(`http://localhost:8081/api/expenses/${id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(settleUserId),
          amount: amountNum,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to settle debt');
      }

      await fetchExpense();
      setIsSettleModalOpen(false);
      setSuccessMessage(
        amountNum >= selectedTargetRemaining
          ? 'Debt fully settled and marked as paid! 🎉'
          : `Partial payment of ${amountNum.toFixed(2)} MAD recorded!`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setSettleError(err.message || 'Failed to settle debt');
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-fade" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading expense details...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="page-fade">
        <PageHeader title="Expense not found" />
        <AppButton variant="ghost" onClick={() => navigate('/expenses')}>
          Back to expenses
        </AppButton>
      </div>
    );
  }

  const allDebtsSettled = unpaidShares.length === 0;

  return (
    <div className="expense-detail-page page-fade">
      <PageHeader
        title="Expense Details"
        action={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <AppButton variant="ghost" size="md" onClick={() => navigate('/expenses')}>
              Back
            </AppButton>
            <AppButton
              variant="danger"
              size="md"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AppButton>
          </div>
        }
      />

      {successMessage && (
        <div className="settle-success-toast">
          {successMessage}
        </div>
      )}

      <div className="expense-detail-card app-card">
        {/* Header */}
        <div className="expense-detail-header">
          <div className="expense-detail-emoji">{expense.emoji || '💸'}</div>
          <div>
            <h2 className="expense-detail-label">{expense.label}</h2>
            <p className="expense-detail-date">
              {expense.expense_date &&
                new Date(expense.expense_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
            </p>
          </div>
          <div className="expense-detail-total">{Number(expense.amount).toFixed(2)} MAD</div>
        </div>

        {/* Paid by */}
        <div className="expense-detail-section">
          <span className="expense-detail-section-label">Paid by</span>
          <div className="expense-detail-payer">
            <HouseholdMemberAvatar member={payer || { name: 'Unknown' }} size="sm" />
            <span className="expense-detail-payer-name">{payer?.name || 'Unknown'}</span>
          </div>
        </div>

        {/* Shares breakdown */}
        <div className="expense-detail-section">
          <span className="expense-detail-section-label">Split breakdown</span>
          <div className="expense-shares-list">
            {(expense.shares || []).map((share) => {
              const member = getMemberById(share.user_id);
              const isPayer = Number(share.user_id) === Number(expense.payer_id);
              const shareAmount = Number(share.share_amount || 0);
              const paidAmount = Number(share.paid_amount || 0);
              const remaining = isPayer ? 0 : Math.max(0, shareAmount - paidAmount);
              const isFullyPaid = isPayer || remaining <= 0;

              return (
                <div key={share.id || share.user_id} className="expense-share-row">
                  <HouseholdMemberAvatar member={member || { name: 'Unknown' }} size="sm" />
                  <div className="expense-share-info">
                    <span className="expense-share-name">{member?.name || 'Unknown'}</span>
                    <span className="expense-share-status">
                      {isFullyPaid ? (
                        <span className="text-success">Paid</span>
                      ) : paidAmount > 0 ? (
                        <span className="text-warning">
                          Owes {payer?.name || 'payer'} {remaining.toFixed(2)} MAD ({paidAmount.toFixed(2)} MAD paid)
                        </span>
                      ) : (
                        <span className="text-warning">
                          Owes {payer?.name || 'payer'} {remaining.toFixed(2)} MAD
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="expense-share-amount">
                    {shareAmount.toFixed(2)} MAD
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="expense-detail-actions">
          <AppButton
            variant={allDebtsSettled ? 'ghost' : 'primary'}
            size="md"
            onClick={openSettleModal}
            disabled={allDebtsSettled}
          >
            {allDebtsSettled ? '✓ All debts settled' : 'Settle debt'}
          </AppButton>
        </div>
      </div>

      {/* Settle Debt Modal for this specific expense */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => !settling && setIsSettleModalOpen(false)}
        title={`Settle Debt for "${expense.label}"`}
      >
        <form onSubmit={handleSettleSubmit} className="settle-modal-content">
          <div className="settle-summary-box">
            <div className="settle-summary-row">
              <span className="settle-summary-label">Expense</span>
              <span className="settle-summary-value">{expense.emoji} {expense.label}</span>
            </div>
            <div className="settle-summary-row">
              <span className="settle-summary-label">Recipient</span>
              <span className="settle-summary-value">{payer?.name || 'Roommate'}</span>
            </div>
            <div className="settle-summary-row">
              <span className="settle-summary-label">Total Share</span>
              <span className="settle-summary-value">
                {selectedTargetShare ? Number(selectedTargetShare.share_amount).toFixed(2) : '0.00'} MAD
              </span>
            </div>
            <div className="settle-summary-row">
              <span className="settle-summary-label">Already Paid</span>
              <span className="settle-summary-value">
                {selectedTargetShare ? Number(selectedTargetShare.paid_amount).toFixed(2) : '0.00'} MAD
              </span>
            </div>
            <div className="settle-summary-row" style={{ paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="settle-summary-label">Remaining to Pay</span>
              <span className="settle-summary-value highlight">
                {selectedTargetRemaining.toFixed(2)} MAD
              </span>
            </div>
          </div>

          {unpaidShares.length > 1 && (
            <div className="app-form-group">
              <label className="app-form-label">Member Settling</label>
              <select
                className="app-form-select"
                value={settleUserId}
                onChange={(e) => handleUserSelectChange(e.target.value)}
              >
                {unpaidShares.map((s) => {
                  const m = getMemberById(s.user_id);
                  const rem = Math.max(0, Number(s.share_amount) - Number(s.paid_amount));
                  return (
                    <option key={s.user_id} value={s.user_id}>
                      {m?.name || 'User'} (owes {rem.toFixed(2)} MAD)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="app-form-group">
            <label className="app-form-label">Amount to Pay (MAD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedTargetRemaining}
              className="app-form-input"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            {selectedTargetRemaining > 0 && (
              <div className="settle-quick-buttons">
                <button
                  type="button"
                  className="settle-quick-btn"
                  onClick={() => setSettleAmount(selectedTargetRemaining.toFixed(2))}
                >
                  Pay full ({selectedTargetRemaining.toFixed(2)} MAD)
                </button>
                {selectedTargetRemaining > 10 && (
                  <button
                    type="button"
                    className="settle-quick-btn"
                    onClick={() => setSettleAmount((selectedTargetRemaining / 2).toFixed(2))}
                  >
                    Pay half ({(selectedTargetRemaining / 2).toFixed(2)} MAD)
                  </button>
                )}
              </div>
            )}
          </div>

          {settleError && (
            <div style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>
              {settleError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <AppButton
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsSettleModalOpen(false)}
              disabled={settling}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              disabled={settling || !settleAmount || parseFloat(settleAmount) <= 0}
            >
              {settling ? 'Settling...' : `Confirm Payment (${parseFloat(settleAmount || 0).toFixed(2)} MAD)`}
            </AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}



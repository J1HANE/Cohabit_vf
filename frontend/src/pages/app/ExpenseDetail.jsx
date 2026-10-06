import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, AppButton, HouseholdMemberAvatar } from '../../components/shared/SharedComponents';
import { MOCK_EXPENSES, MOCK_MEMBERS, getMemberById } from '../../data/mockData';
import './ExpenseDetail.css';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const expense = MOCK_EXPENSES.find((e) => e.id === parseInt(id));

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

  const payer = getMemberById(expense.payer_id);

  return (
    <div className="expense-detail-page page-fade">
      <PageHeader
        title="Expense Details"
        action={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <AppButton variant="ghost" size="md" onClick={() => navigate('/expenses')}>
              Back
            </AppButton>
            <AppButton variant="danger" size="md">
              Delete
            </AppButton>
          </div>
        }
      />

      <div className="expense-detail-card app-card">
        {/* Header */}
        <div className="expense-detail-header">
          <div className="expense-detail-emoji">{expense.emoji || '💸'}</div>
          <div>
            <h2 className="expense-detail-label">{expense.label}</h2>
            <p className="expense-detail-date">
              {new Date(expense.expense_date).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div className="expense-detail-total">{expense.amount} MAD</div>
        </div>

        {/* Paid by */}
        <div className="expense-detail-section">
          <span className="expense-detail-section-label">Paid by</span>
          <div className="expense-detail-payer">
            <HouseholdMemberAvatar member={payer} size="sm" />
            <span className="expense-detail-payer-name">{payer?.name}</span>
          </div>
        </div>

        {/* Shares breakdown */}
        <div className="expense-detail-section">
          <span className="expense-detail-section-label">Split breakdown</span>
          <div className="expense-shares-list">
            {expense.shares.map((share) => {
              const member = getMemberById(share.user_id);
              const isOwed = share.user_id !== expense.payer_id;
              return (
                <div key={share.id} className="expense-share-row">
                  <HouseholdMemberAvatar member={member} size="sm" />
                  <div className="expense-share-info">
                    <span className="expense-share-name">{member?.name}</span>
                    <span className="expense-share-status">
                      {isOwed ? (
                        <span className="text-warning">
                          Owes {payer?.name} {share.share_amount} MAD
                        </span>
                      ) : (
                        <span className="text-success">Paid</span>
                      )}
                    </span>
                  </div>
                  <span className="expense-share-amount">{share.share_amount} MAD</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="expense-detail-actions">
          <AppButton
            variant="ghost"
            size="md"
            onClick={() => navigate('/settlements/new')}
          >
            Settle debt
          </AppButton>
        </div>
      </div>
    </div>
  );
}

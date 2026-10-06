import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  AppButton,
  BalanceCard,
  HouseholdMemberAvatar,
} from '../../components/shared/SharedComponents';
import { MOCK_EXPENSES, MOCK_MEMBERS, MOCK_SETTLEMENTS, getMemberById, calculateBalances } from '../../data/mockData';
import './Balances.css';

export default function Balances() {
  const navigate = useNavigate();
  const currentUserId = 1;

  const balances = calculateBalances(MOCK_EXPENSES, MOCK_SETTLEMENTS, currentUserId);
  const myBalance = balances[currentUserId] || 0;

  // Calculate who owes who (simplified)
  const debts = [];
  MOCK_MEMBERS.forEach((from) => {
    MOCK_MEMBERS.forEach((to) => {
      if (from.id === to.id) return;
      // This is a simplified calculation for display
      // In production, use a debt minimization algorithm
    });
  });

  // Simple debt pairs from balance
  const posMembers = MOCK_MEMBERS.filter((m) => (balances[m.id] || 0) > 0);
  const negMembers = MOCK_MEMBERS.filter((m) => (balances[m.id] || 0) < 0);

  // Build simple debt list
  const debtPairs = [];
  const balCopy = { ...balances };
  const pos = posMembers.map((m) => ({ ...m, bal: balCopy[m.id] }));
  const neg = negMembers.map((m) => ({ ...m, bal: Math.abs(balCopy[m.id]) }));

  for (const debtor of neg) {
    for (const creditor of pos) {
      if (debtor.bal <= 0 || creditor.bal <= 0) continue;
      const amount = Math.min(debtor.bal, creditor.bal);
      if (amount > 0) {
        debtPairs.push({ from: debtor, to: creditor, amount: Math.round(amount) });
        debtor.bal -= amount;
        creditor.bal -= amount;
      }
    }
  }

  return (
    <div className="balances-page page-fade">
      <PageHeader
        title="Balances"
        subtitle="Household financial overview"
        action={
          <AppButton
            variant="primary"
            size="md"
            onClick={() => navigate('/settlements/new')}
          >
            Settle a debt
          </AppButton>
        }
      />

      {/* My balance hero */}
      <div className={`my-balance-hero ${myBalance >= 0 ? 'positive' : 'negative'}`}>
        <div className="my-balance-icon">{myBalance >= 0 ? '🎉' : '💸'}</div>
        <div className="my-balance-content">
          <span className="my-balance-label">
            {myBalance >= 0 ? 'You are owed' : 'You owe'}
          </span>
          <span className="my-balance-amount">
            {Math.abs(myBalance)} MAD
          </span>
        </div>
        {myBalance !== 0 && (
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settlements/new')}
          >
            {myBalance < 0 ? 'Pay now' : 'Request'}
          </AppButton>
        )}
      </div>

      {/* Who owes who */}
      <div className="section-block">
        <div className="section-block-header">
          <span className="section-block-title">Who owes who</span>
          <AppButton variant="ghost" size="sm" onClick={() => navigate('/settlements')}>
            History
          </AppButton>
        </div>
        <div className="debts-list">
          {debtPairs.length === 0 ? (
            <div className="app-card" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
              ✅ All settled up! No outstanding debts.
            </div>
          ) : (
            debtPairs.map((debt, i) => (
              <div key={i} className="debt-row">
                <div className="debt-from">
                  <HouseholdMemberAvatar member={debt.from} size="sm" />
                  <span>{debt.from.name}</span>
                </div>
                <div className="debt-arrow">
                  <span className="debt-amount">{debt.amount} MAD</span>
                  <span className="debt-arrow-icon">→</span>
                </div>
                <div className="debt-to">
                  <HouseholdMemberAvatar member={debt.to} size="sm" />
                  <span>{debt.to.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Household overview */}
      <div className="section-block">
        <div className="section-block-header">
          <span className="section-block-title">Household Overview</span>
        </div>
        <div className="balance-list">
          {MOCK_MEMBERS.map((member) => (
            <BalanceCard
              key={member.id}
              member={member}
              amount={balances[member.id] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

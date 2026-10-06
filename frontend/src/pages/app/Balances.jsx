import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import {
  PageHeader,
  AppButton,
  BalanceCard,
  HouseholdMemberAvatar,
} from '../../components/shared/SharedComponents';
import { calculateBalances, MOCK_SETTLEMENTS } from '../../data/mockData';
import './Balances.css';

export default function Balances() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const [expenses, setExpenses] = useState([]);
  const currentUserId = user?.id;

  useEffect(() => {
    const householdId = household?.id || user?.householdId || user?.household_id;
    const url = householdId
      ? `http://localhost:8081/api/expenses/household/${householdId}`
      : 'http://localhost:8081/api/expenses';

    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data?.message || 'Failed to fetch expenses');
        }
        const mappedData = data.map((e) => ({
          ...e,
          expense_date: e.expenseDate || e.expense_date,
          payer_id: e.payerId || e.payer_id,
          household_id: e.householdId || e.household_id,
          shares: (e.shares || []).map((s) => ({
            id: s.id,
            user_id: s.userId || s.user_id,
            share_amount: s.shareAmount || s.share_amount,
          })),
        }));
        setExpenses(mappedData);
      })
      .catch((err) => console.error('Failed to fetch expenses in Balances', err));
  }, [household?.id, user]);

  const balances = calculateBalances(expenses, MOCK_SETTLEMENTS, currentUserId, members);
  const myBalance = currentUserId ? (balances[currentUserId] || 0) : 0;

  // Simple debt pairs from balance
  const posMembers = members.filter((m) => (balances[m.id] || 0) > 0);
  const negMembers = members.filter((m) => (balances[m.id] || 0) < 0);

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
        debtPairs.push({ from: debtor, to: creditor, amount: Math.round(amount * 100) / 100 });
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
            {Math.abs(myBalance).toFixed(2)} MAD
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
                  <span className="debt-amount">{debt.amount.toFixed(2)} MAD</span>
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
          {members.length === 0 ? (
            <div className="app-card" style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.4)' }}>
              No household members found
            </div>
          ) : (
            members.map((member) => (
              <BalanceCard
                key={member.id}
                member={member}
                amount={balances[member.id] || 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}


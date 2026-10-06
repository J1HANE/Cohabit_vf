import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import {
  PageHeader,
  AppButton,
  ExpenseCard,
  EmptyState,
  SummaryCard,
} from '../../components/shared/SharedComponents';
import './Expenses.css';

const FILTERS = ['All', 'Mine', 'This month', 'Last month'];

export default function Expenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, getMemberById } = useHousehold();
  const [activeFilter, setActiveFilter] = useState('All');
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
            share_amount: Number(s.shareAmount || s.share_amount || 0),
            paid_amount: Number(s.paidAmount || s.paid_amount || 0),
          })),
        }));
        setExpenses(mappedData);
      })
      .catch((err) => console.error('Failed to fetch expenses', err));
  }, [household?.id, user]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredExpenses = expenses.filter((exp) => {
    const d = new Date(exp.expense_date);
    if (activeFilter === 'Mine') return Number(exp.payer_id) === Number(currentUserId);
    if (activeFilter === 'This month')
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (activeFilter === 'Last month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    }
    return true;
  });

  const totalSpend = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthSpend = expenses
    .filter((exp) => {
      const d = new Date(exp.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="expenses-page page-fade">
      <PageHeader
        title="Expenses"
        subtitle="Track all household spending"
        action={
          <AppButton
            variant="primary"
            size="md"
            onClick={() => navigate('/expenses/new')}
            icon="+"
          >
            Add expense
          </AppButton>
        }
      />

      {/* Summary row */}
      <div className="expenses-summary-row">
        <SummaryCard
          icon="💰"
          label="Total Spending"
          value={`${totalSpend.toFixed(2)} MAD`}
          sub="All time"
        />
        <SummaryCard
          icon="📅"
          label="This Month"
          value={`${monthSpend.toFixed(2)} MAD`}
          sub={now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        />
        <SummaryCard
          icon="🧾"
          label="Total Expenses"
          value={expenses.length}
          sub="Recorded"
        />
      </div>

      {/* Filters */}
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="expenses-list">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses found"
            description="Try a different filter or add a new expense."
            action={
              <AppButton
                variant="ghost"
                size="md"
                onClick={() => navigate('/expenses/new')}
                icon="+"
              >
                Add expense
              </AppButton>
            }
          />
        ) : (
          filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              payer={getMemberById(expense.payer_id)}
              onClick={() => navigate(`/expenses/${expense.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  AppButton,
  ExpenseCard,
  EmptyState,
  SummaryCard,
} from '../../components/shared/SharedComponents';
import { MOCK_MEMBERS, getMemberById } from '../../data/mockData';
import './Expenses.css';

const FILTERS = ['All', 'Mine', 'This month', 'Last month'];

export default function Expenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [expenses, setExpenses] = useState([]);
  const currentUserId = user?.id || 1;

  useEffect(() => {
    fetch('http://localhost:8081/api/expenses')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data?.message || 'Failed to fetch expenses');
        }
        const mappedData = data.map(e => ({
          ...e,
          expense_date: e.expenseDate,
          payer_id: e.payerId,
          household_id: e.householdId,
        }));
        setExpenses(mappedData);
      })
      .catch(err => console.error("Failed to fetch expenses", err));
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredExpenses = expenses.filter((exp) => {
    const d = new Date(exp.expense_date);
    if (activeFilter === 'Mine') return exp.payer_id === currentUserId;
    if (activeFilter === 'This month')
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (activeFilter === 'Last month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    }
    return true;
  });

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthSpend = expenses.filter((exp) => {
    const d = new Date(exp.expense_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, e) => sum + e.amount, 0);

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
          value={`${totalSpend} MAD`}
          sub="All time"
        />
        <SummaryCard
          icon="📅"
          label="This Month"
          value={`${monthSpend} MAD`}
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

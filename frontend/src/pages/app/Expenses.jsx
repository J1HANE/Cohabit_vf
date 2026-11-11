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
import { apiFetch } from '../../services/api';
import { EXPENSE_CATEGORIES, getExpenseCategory } from './expenseCategories';

const SCOPES = [
  ['all', 'All'],
  ['paid', 'Paid by me'],
  ['included', 'I’m included'],
];
const PAYMENT_STATUSES = ['Unpaid', 'Partially paid', 'Settled'];
const EMPTY_FILTERS = { query: '', category: '', payer: '', payment: '', period: '' };
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const formatMonth = (month) => monthFormatter.format(new Date(`${month}-01T00:00:00`));
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const toCents = (amount) => Math.round((Number(amount) || 0) * 100);
const formatAmount = (cents) => `${(cents / 100).toFixed(2)} MAD`;

function getPaymentStatus(shares, payerId) {
  const debts = shares.filter((share) =>
    Number(share.user_id) !== Number(payerId) && toCents(share.share_amount) > 0
  );
  if (debts.every((share) => toCents(share.paid_amount) >= toCents(share.share_amount))) return 'Settled';
  return debts.some((share) => toCents(share.paid_amount) > 0) ? 'Partially paid' : 'Unpaid';
}

export default function Expenses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, getMemberById } = useHousehold();
  const [scope, setScope] = useState('all');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [expenses, setExpenses] = useState([]);
  const currentUserId = user?.id;

  useEffect(() => {
    const householdId = household?.id || user?.householdId || user?.household_id;
    const url = householdId
      ? `http://localhost:8081/api/expenses/household/${householdId}`
      : 'http://localhost:8081/api/expenses';

    apiFetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data?.message || 'Failed to fetch expenses');
        }
        const mappedData = data.map((e) => {
          const payerId = e.payerId ?? e.payer_id;
          const shares = (e.shares || []).map((s) => ({
            id: s.id,
            user_id: s.userId ?? s.user_id,
            share_amount: s.shareAmount ?? s.share_amount,
            paid_amount: s.paidAmount ?? s.paid_amount,
          }));
          return {
            ...e,
            expense_date: e.expenseDate || e.expense_date,
            payer_id: payerId,
            category: getExpenseCategory(e.category),
            paymentStatus: getPaymentStatus(shares, payerId),
            shares,
          };
        });
        setExpenses(mappedData);
      })
      .catch((err) => console.error('Failed to fetch expenses', err));
  }, [household?.id, user]);

  const now = new Date();
  const currentMonth = monthKey(now);
  const previousMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const breakdownMonth = selectedMonth || currentMonth;
  const query = filters.query.trim().toLowerCase();
  const filteredExpenses = expenses.filter((expense) =>
    (!query || expense.label.toLowerCase().includes(query)) &&
    (!filters.category || expense.category === filters.category) &&
    (!filters.payer || String(expense.payer_id) === filters.payer) &&
    (!filters.payment || expense.paymentStatus === filters.payment) &&
    (!filters.period || expense.expense_date?.startsWith(filters.period)) &&
    (scope !== 'paid' || Number(expense.payer_id) === Number(currentUserId)) &&
    (scope !== 'included' || expense.shares.some((share) => Number(share.user_id) === Number(currentUserId)))
  );
  const payerOptions = [...new Set(expenses.map((expense) => expense.payer_id).filter((id) => id != null))]
    .map((id) => ({ id, name: getMemberById(id)?.name || `Member #${id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const availableMonths = new Set([currentMonth, previousMonth]);
  const categoryTotals = new Map();
  let totalSpend = 0;
  let monthSpend = 0;
  let breakdownTotal = 0;

  for (const expense of expenses) {
    const cents = toCents(expense.amount);
    const month = expense.expense_date?.slice(0, 7);
    totalSpend += cents;
    if (month) availableMonths.add(month);
    if (month === currentMonth) monthSpend += cents;
    if (month === breakdownMonth) {
      breakdownTotal += cents;
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + cents);
    }
  }
  const breakdown = [...categoryTotals].sort((a, b) => b[1] - a[1]);
  const hasFilters = scope !== 'all' || Object.values(filters).some(Boolean);
  const setFilter = (key, value) => setFilters((previous) => ({ ...previous, [key]: value }));
  const clearFilters = () => {
    setScope('all');
    setFilters(EMPTY_FILTERS);
  };

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
          value={formatAmount(totalSpend)}
          sub="All time"
        />
        <SummaryCard
          icon="📅"
          label="This Month"
          value={formatAmount(monthSpend)}
          sub={formatMonth(currentMonth)}
        />
        <SummaryCard
          icon="🧾"
          label="Total Expenses"
          value={expenses.length}
          sub="Recorded"
        />
      </div>

      <section className="expense-breakdown app-card" aria-labelledby="expense-breakdown-title">
        <div className="expense-breakdown-header">
          <div>
            <h2 id="expense-breakdown-title">Monthly spending by category</h2>
            <p>Household total · {formatAmount(breakdownTotal)}</p>
          </div>
          <label className="app-form-group">
            <span className="app-form-label">Breakdown month</span>
            <select className="app-form-select" value={breakdownMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {[...availableMonths].sort().reverse().map((month) => (
                <option key={month} value={month}>{formatMonth(month)}</option>
              ))}
            </select>
          </label>
        </div>
        {breakdown.length === 0 ? <p>No spending recorded for this month.</p> : (
          <ul className="expense-breakdown-list">
            {breakdown.map(([category, cents]) => (
              <li key={category}>
                <div className="expense-breakdown-row">
                  <span>{EXPENSE_CATEGORIES[category]}</span>
                  <strong>{formatAmount(cents)}</strong>
                </div>
                <div className="expense-breakdown-track" aria-hidden="true">
                  <div style={{ width: `${cents / breakdownTotal * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="expense-filters" aria-label="Filter expenses">
        <div className="filter-tabs">
          {SCOPES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`filter-tab${scope === value ? ' active' : ''}`}
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="expense-filter-fields">
          <label className="app-form-group">
            <span className="app-form-label">Search by name</span>
            <input type="search" className="app-form-input" placeholder="e.g. Internet bill"
              value={filters.query} onChange={(e) => setFilter('query', e.target.value)} />
          </label>
          <label className="app-form-group">
            <span className="app-form-label">Category</span>
            <select className="app-form-select" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
              <option value="">All categories</option>
              {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="app-form-group">
            <span className="app-form-label">Payer</span>
            <select className="app-form-select" value={filters.payer} onChange={(e) => setFilter('payer', e.target.value)}>
              <option value="">All payers</option>
              {payerOptions.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="app-form-group">
            <span className="app-form-label">Payment status</span>
            <select className="app-form-select" value={filters.payment} onChange={(e) => setFilter('payment', e.target.value)}>
              <option value="">All statuses</option>
              {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="app-form-group">
            <span className="app-form-label">Date</span>
            <select className="app-form-select" value={filters.period} onChange={(e) => setFilter('period', e.target.value)}>
              <option value="">All dates</option>
              <option value={currentMonth}>This month</option>
              <option value={previousMonth}>Last month</option>
            </select>
          </label>
        </div>
        <div className="expense-filter-summary">
          <span role="status">{filteredExpenses.length} of {expenses.length} expenses</span>
          {hasFilters && <AppButton variant="ghost" size="sm" onClick={clearFilters}>Clear filters</AppButton>}
        </div>
      </section>

      {/* List */}
      <div className="expenses-list">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses found"
            description={hasFilters ? 'Try a different search or clear the filters.' : 'Add an expense to track household spending.'}
            action={!hasFilters && (
              <AppButton
                variant="ghost"
                size="md"
                onClick={() => navigate('/expenses/new')}
              >
                Add expense
              </AppButton>
            )}
          />
        ) : (
          filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              payer={getMemberById(expense.payer_id)}
              details={`${EXPENSE_CATEGORIES[expense.category]} · ${expense.paymentStatus}`}
              onClick={() => navigate(`/expenses/${expense.id}`)}
              onEdit={expense.createdById != null && Number(expense.createdById) === Number(currentUserId)
                ? () => navigate(`/expenses/${expense.id}/edit`)
                : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import {
  SummaryCard,
  ExpenseCard,
  TaskCard,
  ShoppingItem,
  AppButton,
  EmptyState,
} from '../../components/shared/SharedComponents';
import {
  MOCK_SHOPPING,
  calculateBalances,
  MOCK_SETTLEMENTS,
} from '../../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const { household, members, getMemberById } = useHousehold();
  const navigate = useNavigate();

  const [shopping, setShopping] = useState(MOCK_SHOPPING);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8081/api/tasks')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data?.message || 'Failed to fetch tasks');
        }
        const mappedData = data.map((t) => ({
          ...t,
          due_date: t.dueDate || t.due_date,
          status: t.status,
          assigned_user_id: t.assignedUserId || t.assigned_user_id,
        }));
        setTasks(mappedData);
      })
      .catch((err) => console.error('Failed to fetch tasks in dashboard', err));

    const householdId = household?.id || user?.householdId || user?.household_id;
    const expenseUrl = householdId
      ? `http://localhost:8081/api/expenses/household/${householdId}`
      : 'http://localhost:8081/api/expenses';

    fetch(expenseUrl)
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
      .catch((err) => console.error('Failed to fetch expenses in dashboard', err));
  }, [household?.id, user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const balances = calculateBalances(expenses, MOCK_SETTLEMENTS, user?.id, members);
  const myBalance = balances[user?.id || 1] || 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const shoppingPending = shopping.filter((s) => !s.purchased).length;

  const todayTasks = tasks.filter(
    (t) =>
      t.status === 'pending' &&
      t.due_date &&
      new Date(t.due_date).toDateString() === new Date().toDateString()
  );

  const recentExpenses = expenses.slice(0, 3);
  const shoppingPreview = shopping.slice(0, 4);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
      )
    );
  };

  const toggleShop = (id) => {
    setShopping((prev) =>
      prev.map((s) => (s.id === id ? { ...s, purchased: !s.purchased } : s))
    );
  };

  return (
    <div className="dashboard">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <div>
          <h1 className="greeting-text">
            {greeting}, {user?.name || 'there'} 👋
          </h1>
          {household && (
            <p className="greeting-sub">
              🏡 {household.name} &bull; {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="greeting-actions">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/expenses/new')}
            icon="+"
          >
            Add expense
          </AppButton>
        </div>
      </div>

      {/* Summary cards */}
      <div className="dashboard-summary-grid">
        <SummaryCard
          icon="💰"
          label="Total Expenses"
          value={`${totalExpenses} MAD`}
          sub="All time"
          onClick={() => navigate('/expenses')}
        />
        <SummaryCard
          icon="⚖️"
          label="Your Balance"
          value={`${myBalance > 0 ? '+' : ''}${myBalance} MAD`}
          sub={myBalance >= 0 ? 'You are owed' : 'You owe'}
          accent={myBalance >= 0 ? '#a8d5c4' : '#ff6b6b'}
          onClick={() => navigate('/balances')}
        />
        <SummaryCard
          icon="🧹"
          label="Pending Tasks"
          value={pendingTasks}
          sub="Tasks remaining"
          onClick={() => navigate('/tasks')}
        />
        <SummaryCard
          icon="🛒"
          label="Shopping Items"
          value={shoppingPending}
          sub="Items to buy"
          onClick={() => navigate('/shopping')}
        />
      </div>

      <div className="dashboard-columns">
        {/* Left column */}
        <div className="dashboard-col">
          {/* Today's tasks */}
          <div className="section-block">
            <div className="section-block-header">
              <span className="section-block-title">Today's Tasks</span>
              <AppButton variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                View all
              </AppButton>
            </div>
            <div className="section-items">
              {todayTasks.length === 0 ? (
                <EmptyState
                  icon="✅"
                  title="All done for today!"
                  description="No tasks due today. Enjoy your free time."
                />
              ) : (
                todayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assignee={getMemberById(task.assigned_user_id)}
                    onComplete={toggleTask}
                  />
                ))
              )}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tasks/new')}
                icon="+"
              >
                Add task
              </AppButton>
            </div>
          </div>

          {/* Shopping preview */}
          <div className="section-block">
            <div className="section-block-header">
              <span className="section-block-title">Shopping List</span>
              <AppButton variant="ghost" size="sm" onClick={() => navigate('/shopping')}>
                View all
              </AppButton>
            </div>
            <div className="section-items">
              {shoppingPreview.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  adder={getMemberById(item.added_by)}
                  onToggle={toggleShop}
                />
              ))}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/shopping')}
                icon="+"
              >
                Add shopping item
              </AppButton>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="dashboard-col">
          {/* Recent expenses */}
          <div className="section-block">
            <div className="section-block-header">
              <span className="section-block-title">Recent Expenses</span>
              <AppButton variant="ghost" size="sm" onClick={() => navigate('/expenses')}>
                View all
              </AppButton>
            </div>
            <div className="section-items">
              {recentExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  payer={getMemberById(expense.payer_id)}
                  onClick={() => navigate(`/expenses/${expense.id}`)}
                />
              ))}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/expenses/new')}
                icon="+"
              >
                Add expense
              </AppButton>
            </div>
          </div>

          {/* Quick balance widget */}
          <div className="section-block">
            <div className="section-block-header">
              <span className="section-block-title">Household Balances</span>
              <AppButton variant="ghost" size="sm" onClick={() => navigate('/balances')}>
                Details
              </AppButton>
            </div>
            <div className="app-card">
              {members.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem' }}>
                  No members found
                </div>
              ) : (
                members.map((member) => {
                  const bal = balances[member.id] || 0;
                  return (
                    <div key={member.id} className="dash-balance-row">
                      <div
                        className="dash-balance-dot"
                        style={{ background: member.color || '#a8d5c4' }}
                      />
                      <span className="dash-balance-name">{member.name}</span>
                      <span
                        className={`dash-balance-amount ${bal >= 0 ? 'positive' : 'negative'}`}
                      >
                        {bal > 0 ? '+' : ''}{bal.toFixed(2)} MAD
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

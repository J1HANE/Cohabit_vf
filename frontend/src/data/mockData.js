// Mock data simulating backend responses
// Replace these with real API calls when connecting to the backend

export const MOCK_USER = {
  id: 1,
  name: 'Jihane',
  email: 'jihane@example.com',
  color: '#a8d5c4',
  household_id: 1,
};

export const MOCK_HOUSEHOLD = {
  id: 1,
  name: 'Appartement Maârif',
  invite_code: '8FJ29K',
  created_at: '2026-09-01T00:00:00Z',
};

export const MOCK_MEMBERS = [
  { id: 1, name: 'Jihane', email: 'jihane@example.com', color: '#a8d5c4', household_id: 1 },
  { id: 2, name: 'Sarah', email: 'sarah@example.com', color: '#6b9fd4', household_id: 1 },
  { id: 3, name: 'Adam', email: 'adam@example.com', color: '#d4a26b', household_id: 1 },
];

export const MOCK_EXPENSES = [
  {
    id: 1,
    household_id: 1,
    payer_id: 2,
    label: 'Carrefour groceries',
    amount: 340,
    expense_date: '2026-09-26',
    created_at: '2026-09-26T14:30:00Z',
    emoji: '🛒',
    shares: [
      { id: 1, expense_id: 1, user_id: 1, share_amount: 120 },
      { id: 2, expense_id: 1, user_id: 2, share_amount: 120 },
      { id: 3, expense_id: 1, user_id: 3, share_amount: 100 },
    ],
  },
  {
    id: 2,
    household_id: 1,
    payer_id: 1,
    label: 'Dinner restaurant',
    amount: 120,
    expense_date: '2026-09-27',
    created_at: '2026-09-27T20:00:00Z',
    emoji: '🍕',
    shares: [
      { id: 4, expense_id: 2, user_id: 1, share_amount: 40 },
      { id: 5, expense_id: 2, user_id: 2, share_amount: 40 },
      { id: 6, expense_id: 2, user_id: 3, share_amount: 40 },
    ],
  },
  {
    id: 3,
    household_id: 1,
    payer_id: 3,
    label: 'Electricity bill',
    amount: 240,
    expense_date: '2026-09-20',
    created_at: '2026-09-20T10:00:00Z',
    emoji: '⚡',
    shares: [
      { id: 7, expense_id: 3, user_id: 1, share_amount: 80 },
      { id: 8, expense_id: 3, user_id: 2, share_amount: 80 },
      { id: 9, expense_id: 3, user_id: 3, share_amount: 80 },
    ],
  },
  {
    id: 4,
    household_id: 1,
    payer_id: 2,
    label: 'Internet subscription',
    amount: 150,
    expense_date: '2026-09-15',
    created_at: '2026-09-15T09:00:00Z',
    emoji: '📡',
    shares: [
      { id: 10, expense_id: 4, user_id: 1, share_amount: 50 },
      { id: 11, expense_id: 4, user_id: 2, share_amount: 50 },
      { id: 12, expense_id: 4, user_id: 3, share_amount: 50 },
    ],
  },
];

export const MOCK_TASKS = [
  {
    id: 1,
    household_id: 1,
    name: 'Clean kitchen',
    frequency_days: 7,
    due_date: '2026-09-29',
    status: 'pending',
    assigned_user_id: 1,
    rotation_index: 0,
    last_completed_at: '2026-09-22',
  },
  {
    id: 2,
    household_id: 1,
    name: 'Take out trash',
    frequency_days: 2,
    due_date: '2026-09-29',
    status: 'pending',
    assigned_user_id: 2,
    rotation_index: 1,
    last_completed_at: '2026-09-27',
  },
  {
    id: 3,
    household_id: 1,
    name: 'Vacuum living room',
    frequency_days: 7,
    due_date: '2026-10-01',
    status: 'pending',
    assigned_user_id: 3,
    rotation_index: 2,
    last_completed_at: '2026-09-24',
  },
  {
    id: 4,
    household_id: 1,
    name: 'Clean bathroom',
    frequency_days: 7,
    due_date: '2026-09-28',
    status: 'completed',
    assigned_user_id: 1,
    rotation_index: 0,
    last_completed_at: '2026-09-28',
  },
  {
    id: 5,
    household_id: 1,
    name: 'Do laundry',
    frequency_days: 14,
    due_date: '2026-10-05',
    status: 'pending',
    assigned_user_id: 2,
    rotation_index: 1,
    last_completed_at: '2026-09-21',
  },
];

export const MOCK_SHOPPING = [
  { id: 1, household_id: 1, name: 'Milk', purchased: false, added_by: 2, created_at: '2026-09-29T08:00:00Z' },
  { id: 2, household_id: 1, name: 'Eggs', purchased: false, added_by: 1, created_at: '2026-09-29T07:00:00Z' },
  { id: 3, household_id: 1, name: 'Bread', purchased: true, added_by: 3, created_at: '2026-09-28T10:00:00Z' },
  { id: 4, household_id: 1, name: 'Olive oil', purchased: false, added_by: 2, created_at: '2026-09-28T09:00:00Z' },
  { id: 5, household_id: 1, name: 'Coffee', purchased: false, added_by: 1, created_at: '2026-09-27T18:00:00Z' },
  { id: 6, household_id: 1, name: 'Yogurt', purchased: true, added_by: 3, created_at: '2026-09-27T12:00:00Z' },
];

export const MOCK_SETTLEMENTS = [
  {
    id: 1,
    household_id: 1,
    from_user_id: 1,
    to_user_id: 2,
    amount: 80,
    settled_at: '2026-09-28T10:00:00Z',
  },
  {
    id: 2,
    household_id: 1,
    from_user_id: 3,
    to_user_id: 1,
    amount: 50,
    settled_at: '2026-09-21T14:00:00Z',
  },
];

// Helper: get member by id
export const getMemberById = (id) => MOCK_MEMBERS.find((m) => m.id === id);

// Helper: format date
export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Helper: calculate balances
export const calculateBalances = (expenses, settlements, userId) => {
  const balances = {};
  MOCK_MEMBERS.forEach((m) => { balances[m.id] = 0; });

  expenses.forEach((exp) => {
    // Payer gets credited
    exp.shares.forEach((share) => {
      if (share.user_id !== exp.payer_id) {
        balances[exp.payer_id] = (balances[exp.payer_id] || 0) + share.share_amount;
        balances[share.user_id] = (balances[share.user_id] || 0) - share.share_amount;
      }
    });
  });

  // Apply settlements
  settlements.forEach((s) => {
    balances[s.from_user_id] = (balances[s.from_user_id] || 0) + s.amount;
    balances[s.to_user_id] = (balances[s.to_user_id] || 0) - s.amount;
  });

  return balances;
};

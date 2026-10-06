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

export const MOCK_MEMBERS = [];

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

// Helper: get member by id (fallback)
export const getMemberById = (id) => null;

// Helper: format date
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Helper: calculate balances
export const calculateBalances = (expenses = [], settlements = [], userId, members = []) => {
  const balances = {};
  (members || []).forEach((m) => {
    balances[m.id] = 0;
  });

  (expenses || []).forEach((exp) => {
    const payerId = exp.payerId || exp.payer_id;
    if (payerId && balances[payerId] === undefined) balances[payerId] = 0;

    (exp.shares || []).forEach((share) => {
      const shareUserId = share.userId || share.user_id;
      const shareAmount = Number(share.shareAmount || share.share_amount || 0);

      if (shareUserId && balances[shareUserId] === undefined) balances[shareUserId] = 0;

      if (shareUserId !== payerId) {
        const paid = Number(share.paidAmount || share.paid_amount || 0);
        const remainingShare = Math.max(0, shareAmount - paid);
        balances[payerId] = (balances[payerId] || 0) + remainingShare;
        balances[shareUserId] = (balances[shareUserId] || 0) - remainingShare;
      }
    });
  });

  // Apply settlements
  (settlements || []).forEach((s) => {
    const fromId = s.fromUserId || s.from_user_id;
    const toId = s.toUserId || s.to_user_id;
    const amount = Number(s.amount || 0);
    if (fromId && balances[fromId] === undefined) balances[fromId] = 0;
    if (toId && balances[toId] === undefined) balances[toId] = 0;

    balances[fromId] = (balances[fromId] || 0) + amount;
    balances[toId] = (balances[toId] || 0) - amount;
  });

  return balances;
};


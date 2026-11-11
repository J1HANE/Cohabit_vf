export const EXPENSE_CATEGORIES = {
  UNCATEGORIZED: 'Uncategorized',
  GROCERIES: 'Groceries',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  HOUSEHOLD: 'Household supplies',
  TRANSPORT: 'Transport',
  OTHER: 'Other',
};

export function getExpenseCategory(category) {
  return Object.hasOwn(EXPENSE_CATEGORIES, category) ? category : 'UNCATEGORIZED';
}

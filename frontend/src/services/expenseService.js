const API_URL = 'http://localhost:8081/api/expenses';

export const getExpenses = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch expenses');
    }
    return response.json();
};

export const getExpensesByHousehold = async (householdId) => {
    const response = await fetch(`${API_URL}/household/${householdId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch expenses for household');
    }
    return response.json();
};

export const getExpense = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch expense with id ${id}`);
    }
    return response.json();
};

export const createExpense = async (expense) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
    });
    if (!response.ok) {
        throw new Error('Failed to create expense');
    }
    return response.json();
};

export const updateExpense = async (id, expense) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
    });
    if (!response.ok) {
        throw new Error(`Failed to update expense with id ${id}`);
    }
    return response.json();
};

export const deleteExpense = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Failed to delete expense with id ${id}`);
    }
};

export const settleExpense = async (id, userId, amount) => {
    const response = await fetch(`${API_URL}/${id}/settle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount }),
    });
    if (!response.ok) {
        throw new Error('Failed to settle expense');
    }
    return response.json();
};

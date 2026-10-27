const API_URL = '/api/shopping';

const readResponse = async (response, fallbackMessage) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || fallbackMessage);
  }
  return response.status === 204 ? null : response.json();
};

export const getShoppingItems = async (householdId) => {
  const response = await fetch(`${API_URL}/household/${householdId}`);
  return readResponse(response, 'Failed to load shopping items');
};

export const createShoppingItem = async ({ householdId, name, addedBy }) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ household_id: householdId, name, added_by: addedBy }),
  });
  return readResponse(response, 'Failed to add shopping item');
};

export const updateShoppingItem = async (id, householdId, purchased) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ household_id: householdId, purchased }),
  });
  return readResponse(response, 'Failed to update shopping item');
};

export const deleteShoppingItem = async (id, householdId) => {
  const response = await fetch(`${API_URL}/${id}?householdId=${householdId}`, {
    method: 'DELETE',
  });
  return readResponse(response, 'Failed to delete shopping item');
};

export const clearPurchasedShoppingItems = async (householdId) => {
  const response = await fetch(`${API_URL}/household/${householdId}/purchased`, {
    method: 'DELETE',
  });
  return readResponse(response, 'Failed to clear purchased items');
};
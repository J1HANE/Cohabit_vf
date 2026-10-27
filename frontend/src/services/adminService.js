const API_BASE_URL = '/api/admin';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  return data;
}

function sendJson(method, body) {
  return { method, body: JSON.stringify(body) };
}

export const adminService = {
  getStats: () => request('/stats'),
  getActivity: () => request('/stats/activity'),
  getComplaints: (status = 'ALL') => request(`/complaints?status=${encodeURIComponent(status)}`),
  updateComplaint: (id, updates) => request(`/complaints/${id}`, sendJson('PUT', updates)),
  getUsers: (query = '') => request(query ? `/users/search?query=${encodeURIComponent(query)}` : '/users'),
  updateUser: (id, updates) => request(`/users/${id}`, sendJson('PUT', updates)),
  suspendUser: (id) => request(`/users/${id}/suspend`, { method: 'POST' }),
  reactivateUser: (id) => request(`/users/${id}/reactivate`, { method: 'POST' }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getHouseholds: (query = '') => request(query ? `/households/search?query=${encodeURIComponent(query)}` : '/households'),
  getHouseholdMembers: (id) => request(`/households/${id}/members`),
  updateHousehold: (id, updates) => request(`/households/${id}`, sendJson('PUT', updates)),
  suspendHousehold: (id) => request(`/households/${id}/suspend`, { method: 'POST' }),
  deleteHousehold: (id) => request(`/households/${id}`, { method: 'DELETE' }),
};
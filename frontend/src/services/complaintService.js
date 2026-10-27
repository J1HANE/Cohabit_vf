async function request(path, options = {}) {
  const response = await fetch(`/api/complaints${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }
  return data;
}

export const complaintService = {
  getMine: (userId) => request(`/user/${userId}`),
  create: (complaint) => request('', { method: 'POST', body: JSON.stringify(complaint) }),
};
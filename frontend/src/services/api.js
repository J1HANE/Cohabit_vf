export async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const isPlatformAdminRequest = String(url).includes('/api/admin');
  const backendOrigin = 'http://localhost:8081';
  const requestUrl = typeof url === 'string' && url.startsWith(backendOrigin)
    ? url.slice(backendOrigin.length)
    : url;
  const isAuthRequest = String(requestUrl).includes('/api/auth/');
  const storedUser = isAuthRequest
    ? null
    : localStorage.getItem(isPlatformAdminRequest ? 'adminUser' : 'cohabit_user');

  if (storedUser) {
    try {
      const { token } = JSON.parse(storedUser);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // Ignore stale local identity data; the API will reject the request.
    }
  }

  const response = await fetch(requestUrl, { ...options, headers });
  if (response.status === 401 && !String(requestUrl).includes('/api/auth/')) {
    localStorage.removeItem(isPlatformAdminRequest ? 'adminUser' : 'cohabit_user');
    localStorage.removeItem('cohabit_household');
    window.dispatchEvent(new Event('cohabit:auth-required'));
  }
  return response;
}
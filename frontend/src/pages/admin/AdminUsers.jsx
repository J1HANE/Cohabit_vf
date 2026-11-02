import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');

  const loadUsers = async (search = query) => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminService.getUsers(search.trim()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await adminService.getUsers(query.trim());
        if (active) setUsers(result);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const runAction = async (user, action) => {
    setWorkingId(user.id);
    setError('');
    try {
      await action();
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorkingId(null);
    }
  };

  const deleteUser = (user) => {
    if (window.confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) {
      runAction(user, () => adminService.deleteUser(user.id));
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">ACCOUNT DIRECTORY</p><h1>User management</h1></div>
        <span className="admin-count">{users.length} accounts</span>
      </header>
      <div className="admin-toolbar">
        <label className="admin-search-label" htmlFor="user-search">Search users</label>
        <input id="user-search" className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" />
      </div>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Role</th><th>Household</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="admin-table-message">Loading users...</td></tr> : users.length === 0 ? <tr><td colSpan="6" className="admin-table-message">No users found.</td></tr> : users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name || 'Unnamed user'}</strong><span className="admin-cell-subtitle">{user.email}</span></td>
                <td>
                  <select aria-label={`Role for ${user.email}`} value={user.role || 'USER'} disabled={workingId === user.id} onChange={(event) => runAction(user, () => adminService.updateUser(user.id, { role: event.target.value }))}>
                    <option value="USER">User</option><option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>{user.householdId ?? '—'}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td><span className={`admin-status ${user.suspended ? 'is-suspended' : 'is-active'}`}>{user.suspended ? 'Suspended' : 'Active'}</span></td>
                <td className="admin-actions">
                  <button type="button" disabled={workingId === user.id} onClick={() => runAction(user, () => user.suspended ? adminService.reactivateUser(user.id) : adminService.suspendUser(user.id))}>{user.suspended ? 'Reactivate' : 'Suspend'}</button>
                  <button type="button" className="admin-danger-button" disabled={workingId === user.id} onClick={() => deleteUser(user)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
import { Fragment, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default function AdminHouseholds() {
  const [households, setHouseholds] = useState([]);
  const [members, setMembers] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHouseholds = async (search = query) => {
    setError('');
    setLoading(true);
    try {
      setHouseholds(await adminService.getHouseholds(search.trim()));
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
        const result = await adminService.getHouseholds(query.trim());
        if (active) setHouseholds(result);
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

  const toggleMembers = async (household) => {
    if (expandedId === household.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(household.id);
    if (members[household.id]) return;
    try {
      const result = await adminService.getHouseholdMembers(household.id);
      setMembers((current) => ({ ...current, [household.id]: result }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const renameHousehold = async (household) => {
    const name = window.prompt('Household name', household.name);
    if (!name?.trim() || name.trim() === household.name) return;
    try {
      await adminService.updateHousehold(household.id, { name: name.trim() });
      await loadHouseholds();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const deleteHousehold = async (household) => {
    if (!window.confirm(`Delete household "${household.name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteHousehold(household.id);
      await loadHouseholds();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const suspendHousehold = async (household) => {
    try {
      await adminService.suspendHousehold(household.id);
      await loadHouseholds();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">COMMUNITY DIRECTORY</p><h1>Household management</h1></div>
        <span className="admin-count">{households.length} households</span>
      </header>
      <div className="admin-toolbar">
        <label className="admin-search-label" htmlFor="household-search">Search households</label>
        <input id="household-search" className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Household name" />
      </div>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Household</th><th>Created</th><th>Members</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="admin-table-message">Loading households...</td></tr> : households.length === 0 ? <tr><td colSpan="5" className="admin-table-message">No households found.</td></tr> : households.map((household) => (
              <Fragment key={household.id}>
                <tr key={household.id}>
                  <td><strong>{household.name}</strong><span className="admin-cell-subtitle">ID {household.id}</span></td>
                  <td>{formatDate(household.createdAt)}</td>
                  <td><button type="button" className="admin-text-button" onClick={() => toggleMembers(household)}>{members[household.id]?.length ?? 'View'} members</button></td>
                  <td><span className={`admin-status ${household.suspended ? 'is-suspended' : 'is-active'}`}>{household.suspended ? 'Suspended' : 'Active'}</span></td>
                  <td className="admin-actions">
                    <button type="button" onClick={() => renameHousehold(household)}>Rename</button>
                    {!household.suspended && <button type="button" onClick={() => suspendHousehold(household)}>Suspend</button>}
                    <button type="button" className="admin-danger-button" onClick={() => deleteHousehold(household)}>Delete</button>
                  </td>
                </tr>
                {expandedId === household.id && (
                  <tr key={`${household.id}-members`}><td colSpan="5" className="admin-members-cell">
                    {!members[household.id] ? 'Loading members...' : members[household.id].length === 0 ? 'No members in this household.' : members[household.id].map((member) => <span className="admin-member" key={member.id}>{member.name} <small>{member.email}</small></span>)}
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
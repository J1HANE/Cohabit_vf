import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const filters = [
  { value: 'ALL', label: 'All requests' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In review' },
  { value: 'RESOLVED', label: 'Resolved' },
];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Just now';
}

function ComplaintTicket({ complaint, onSave, saving }) {
  const [status, setStatus] = useState(complaint.status);
  const [response, setResponse] = useState(complaint.adminResponse || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(complaint.status);
    setResponse(complaint.adminResponse || '');
  }, [complaint.status, complaint.adminResponse]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (status === 'RESOLVED' && !response.trim()) {
      setError('Add a reply before resolving this request.');
      return;
    }
    try {
      await onSave(complaint.id, { status, adminResponse: response.trim() });
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  return (
    <article className="admin-complaint-ticket">
      <header className="admin-complaint-heading">
        <div className="admin-complaint-title-wrap">
          <span className={`admin-status is-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
          <span className="admin-complaint-category">{complaint.category}</span>
          <time>{formatDate(complaint.createdAt)}</time>
        </div>
        <h2>{complaint.subject}</h2>
        <p className="admin-complaint-author">{complaint.userName} <span>{complaint.userEmail}</span></p>
      </header>
      <p className="admin-complaint-description">{complaint.description}</p>
      <form className="admin-complaint-response" onSubmit={handleSubmit}>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </label>
        <label className="admin-response-field">
          <span>Reply to user</span>
          <textarea maxLength="5000" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Write an update or resolution for the user." />
          <small>{response.length}/5000</small>
        </label>
        {error && <p className="admin-alert" role="alert">{error}</p>}
        <div className="admin-complaint-footer">
          <span>Request #{complaint.id}</span>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save update'}</button>
        </div>
      </form>
    </article>
  );
}

export default function AdminComplaints() {
  const [status, setStatus] = useState('OPEN');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminService.getComplaints(status)
      .then((data) => { if (active) setComplaints(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);

  const saveComplaint = async (id, updates) => {
    setSavingId(id);
    setError('');
    try {
      const saved = await adminService.updateComplaint(id, updates);
      setComplaints((current) => current.map((complaint) => complaint.id === id ? saved : complaint));
      if (status !== 'ALL' && saved.status !== status) {
        setComplaints((current) => current.filter((complaint) => complaint.id !== id));
      }
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">MEMBER SUPPORT</p><h1>Complaints</h1></div>
        <span className="admin-count">{complaints.length} {status === 'ALL' ? 'requests' : status.toLowerCase().replace('_', ' ')}</span>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-filter-bar" role="group" aria-label="Filter complaints by status">
        {filters.map((filter) => (
          <button type="button" className={status === filter.value ? 'is-selected' : ''} key={filter.value} onClick={() => setStatus(filter.value)}>{filter.label}</button>
        ))}
      </div>
      {loading ? <p className="admin-empty-state">Loading requests...</p> : complaints.length === 0 ? (
        <div className="admin-empty-state"><strong>No requests in this view</strong><span>New member complaints will appear here.</span></div>
      ) : (
        <div className="admin-complaint-list">
          {complaints.map((complaint) => (
            <ComplaintTicket key={complaint.id} complaint={complaint} onSave={saveComplaint} saving={savingId === complaint.id} />
          ))}
        </div>
      )}
    </section>
  );
}
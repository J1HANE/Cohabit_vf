import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getStats(), adminService.getActivity(), adminService.getComplaints()])
      .then(([nextStats, nextActivity, nextComplaints]) => {
        if (active) {
          setStats(nextStats);
          setActivity(nextActivity);
          setComplaints(nextComplaints.slice(0, 4));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  const metrics = [
    { label: 'Member accounts', value: stats?.totalUsers, tone: 'coral' },
    { label: 'Active households', value: stats?.activeHouseholds, tone: 'green' },
    { label: 'Needs attention', value: stats ? Number(stats.openComplaints || 0) + Number(stats.inReviewComplaints || 0) : null, tone: 'gold' },
    { label: 'Resolved complaints', value: stats?.resolvedComplaints, tone: 'blue' },
  ];

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">PLATFORM OVERVIEW</p><h1>Dashboard</h1></div>
        <span className="admin-live-indicator">Live overview</span>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-metric-grid">
        {metrics.map((metric) => (
          <article className={`admin-metric admin-metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value ?? '—'}</strong>
          </article>
        ))}
      </div>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-eyebrow">LAST 7 DAYS</p><h2>Recent activity</h2></div></div>
        <div className="admin-activity-grid">
          <div><strong>{activity?.newUsersLastWeek ?? '—'}</strong><span>New users</span></div>
          <div><strong>{activity?.newHouseholdsLastWeek ?? '—'}</strong><span>New households</span></div>
          <div><strong>{activity?.newComplaintsLastWeek ?? '—'}</strong><span>New complaints</span></div>
        </div>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-eyebrow">SUPPORT QUEUE</p><h2>Recent complaints</h2></div><Link className="admin-section-link" to="/admin/complaints">View all requests <span>→</span></Link></div>
        {complaints.length === 0 ? <p className="admin-empty-state">No complaints have been submitted.</p> : (
          <div className="admin-recent-complaints">
            {complaints.map((complaint) => (
              <Link className="admin-recent-complaint" to="/admin/complaints" key={complaint.id}>
                <span className={`admin-status is-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
                <span className="admin-recent-complaint-subject">{complaint.subject}</span>
                <span className="admin-recent-complaint-author">{complaint.userName}</span>
                <span className="admin-recent-complaint-date">{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Just now'}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
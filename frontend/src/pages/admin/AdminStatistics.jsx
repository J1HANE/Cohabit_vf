import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

const metrics = [
  { key: 'activeUsers', label: 'Active users', group: 'users', color: 'green' },
  { key: 'suspendedUsers', label: 'Suspended users', group: 'users', color: 'gold' },
  { key: 'openComplaints', label: 'Open complaints', group: 'complaints', color: 'coral' },
  { key: 'inReviewComplaints', label: 'In review', group: 'complaints', color: 'blue' },
  { key: 'resolvedComplaints', label: 'Resolved', group: 'complaints', color: 'green' },
  { key: 'activeHouseholds', label: 'Active households', group: 'households', color: 'blue' },
];

export default function AdminStatistics() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([adminService.getStats(), adminService.getActivity()])
      .then(([nextStats, nextActivity]) => {
        if (active) {
          setStats(nextStats);
          setActivity(nextActivity);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  const totalComplaints = Number(stats?.totalComplaints || 0);
  const resolutionRate = totalComplaints ? Math.round((Number(stats?.resolvedComplaints || 0) / totalComplaints) * 100) : 0;
  const overview = [
    { label: 'Total members', value: stats?.totalUsers, tone: 'coral' },
    { label: 'Active households', value: stats?.activeHouseholds, tone: 'green' },
    { label: 'Open requests', value: stats?.openComplaints, tone: 'gold' },
    { label: 'Resolution rate', value: stats ? `${resolutionRate}%` : null, tone: 'blue' },
  ];

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">PLATFORM HEALTH</p><h1>Statistics</h1></div>
        <span className="admin-live-indicator">Updated on page load</span>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <div className="admin-metric-grid">
        {overview.map((metric) => (
          <article className={`admin-metric admin-metric-${metric.tone}`} key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value ?? '—'}</strong>
          </article>
        ))}
      </div>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-eyebrow">ACCOUNT & SUPPORT HEALTH</p><h2>Current workload</h2></div></div>
      <div className="admin-statistics-grid">
        {metrics.map((metric) => {
          const value = Number(stats?.[metric.key] ?? 0);
          const total = Number(stats?.[metric.group === 'users' ? 'totalUsers' : metric.group === 'households' ? 'totalHouseholds' : 'totalComplaints'] ?? 0);
          const width = total ? Math.min(100, (value / total) * 100) : 0;
          return (
            <article className="admin-statistic" key={metric.key}>
              <div><span>{metric.label}</span><strong>{stats ? value : '—'}</strong></div>
              <div className="admin-stat-track"><span className={`admin-stat-fill fill-${metric.color}`} style={{ width: `${width}%` }} /></div>
            </article>
          );
        })}
      </div>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-eyebrow">WEEKLY ACTIVITY</p><h2>New in the last 7 days</h2></div></div>
        <div className="admin-activity-grid">
          <div><strong>{activity?.newUsersLastWeek ?? '—'}</strong><span>New users</span></div>
          <div><strong>{activity?.newHouseholdsLastWeek ?? '—'}</strong><span>New households</span></div>
          <div><strong>{activity?.newComplaintsLastWeek ?? '—'}</strong><span>New complaints</span></div>
        </div>
      </section>
    </section>
  );
}
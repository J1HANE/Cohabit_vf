import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import './AdminPages.css';

function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('adminUser'));
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const adminUser = getAdminUser();
  const navigate = useNavigate();

  if (adminUser?.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/admin/dashboard">
          <span className="admin-brand-mark">C</span>
          <span>CoHabit <small>CONTROL ROOM</small></span>
        </NavLink>
        <nav className="admin-nav" aria-label="Administration">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/households">Households</NavLink>
          <NavLink to="/admin/complaints">Complaints</NavLink>
          <NavLink to="/admin/statistics">Statistics</NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <span>{adminUser.name || adminUser.email}</span>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
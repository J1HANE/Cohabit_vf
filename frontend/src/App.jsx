import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/AppLayout/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/app/Dashboard';
import Expenses from './pages/app/Expenses';
import ExpenseNew from './pages/app/ExpenseNew';
import ExpenseDetail from './pages/app/ExpenseDetail';
import Tasks from './pages/app/Tasks';
import TaskNew from './pages/app/TaskNew';
import Balances from './pages/app/Balances';
import Settlements from './pages/app/Settlements';
import SettlementNew from './pages/app/SettlementNew';
import Shopping from './pages/app/Shopping';
import Profile from './pages/app/Profile';
import HouseholdSettings from './pages/app/HouseholdSettings';
import Notifications from './pages/app/Notifications';
import HouseholdCreate from './pages/household/HouseholdCreate';
import HouseholdJoin from './pages/household/HouseholdJoin';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHouseholds from './pages/admin/AdminHouseholds';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminComplaints from './pages/admin/AdminComplaints';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <NotificationProvider>
          <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="households" element={<AdminHouseholds />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="statistics" element={<AdminStatistics />} />
            </Route>

            {/* Household onboarding */}
            <Route path="/household/create" element={<HouseholdCreate />} />
            <Route path="/household/join" element={<HouseholdJoin />} />

            {/* Protected app routes */}
            <Route path="/" element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/new" element={<ExpenseNew />} />
              <Route path="expenses/:id" element={<ExpenseDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="tasks/new" element={<TaskNew />} />
              <Route path="balances" element={<Balances />} />
              <Route path="settlements" element={<Settlements />} />
              <Route path="settlements/new" element={<SettlementNew />} />
              <Route path="shopping" element={<Shopping />} />
              <Route path="profile" element={<Profile />} />
              <Route path="household/settings" element={<HouseholdSettings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </NotificationProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;

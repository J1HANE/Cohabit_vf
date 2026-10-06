import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
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
import HouseholdCreate from './pages/household/HouseholdCreate';
import HouseholdJoin from './pages/household/HouseholdJoin';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;

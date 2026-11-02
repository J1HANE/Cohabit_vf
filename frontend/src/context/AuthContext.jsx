import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cohabit_user');
    if (stored) {
      try {
        const storedUser = JSON.parse(stored);
        if (storedUser?.token) {
          setUser(storedUser);
        } else {
          localStorage.removeItem('cohabit_user');
          localStorage.removeItem('cohabit_household');
        }
      } catch {
        localStorage.removeItem('cohabit_user');
        localStorage.removeItem('cohabit_household');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthRequired = () => {
      setUser(null);
      localStorage.removeItem('cohabit_user');
      localStorage.removeItem('cohabit_household');
    };
    window.addEventListener('cohabit:auth-required', handleAuthRequired);
    return () => window.removeEventListener('cohabit:auth-required', handleAuthRequired);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('cohabit_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cohabit_user');
    localStorage.removeItem('cohabit_household');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('cohabit_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

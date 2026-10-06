import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('cohabit_household');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setHousehold(data.household);
        setMembers(data.members || []);
      } catch {
        localStorage.removeItem('cohabit_household');
      }
    }
  }, [user]);

  // Live-fetch household + members whenever we have a household id
  useEffect(() => {
    const stored = localStorage.getItem('cohabit_household');
    if (!stored) return;
    let householdId;
    try {
      householdId = JSON.parse(stored).household?.id;
    } catch {
      return;
    }
    if (!householdId) return;

    Promise.all([
      fetch(`http://localhost:8081/api/households/${householdId}`),
      fetch(`http://localhost:8081/api/households/${householdId}/members`),
    ])
      .then(async ([householdRes, membersRes]) => {
        if (!householdRes.ok) {
          // Stale mock/local household that no longer exists in DB
          setHousehold(null);
          setMembers([]);
          localStorage.removeItem('cohabit_household');
          return;
        }
        const householdData = await householdRes.json();
        const membersData = membersRes.ok ? await membersRes.json() : [];
        setHousehold(householdData);
        setMembers(membersData);
        localStorage.setItem('cohabit_household', JSON.stringify({
          household: householdData,
          members: membersData,
        }));
      })
      .catch(() => {}); // Silently fall back to cached data
  }, [user]);

  const setHouseholdData = (householdData, membersData = []) => {
    setHousehold(householdData);
    setMembers(membersData);
    localStorage.setItem('cohabit_household', JSON.stringify({
      household: householdData,
      members: membersData,
    }));
  };

  const clearHousehold = () => {
    setHousehold(null);
    setMembers([]);
    localStorage.removeItem('cohabit_household');
  };

  return (
    <HouseholdContext.Provider value={{ household, members, setHouseholdData, clearHousehold }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}

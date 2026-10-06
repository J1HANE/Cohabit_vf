import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);

  const refreshHousehold = useCallback(async () => {
    let householdId = user?.householdId || user?.household_id;
    if (!householdId) {
      const stored = localStorage.getItem('cohabit_household');
      if (stored) {
        try {
          householdId = JSON.parse(stored).household?.id;
        } catch {
          // ignore
        }
      }
    }

    if (!householdId) {
      setHousehold(null);
      setMembers([]);
      return;
    }

    try {
      const [householdRes, membersRes] = await Promise.all([
        fetch(`http://localhost:8081/api/households/${householdId}`),
        fetch(`http://localhost:8081/api/households/${householdId}/members`),
      ]);

      if (!householdRes.ok) {
        setHousehold(null);
        setMembers([]);
        localStorage.removeItem('cohabit_household');
        return;
      }

      const householdData = await householdRes.json();
      const membersData = membersRes.ok ? await membersRes.json() : [];
      setHousehold(householdData);
      setMembers(membersData);
      localStorage.setItem(
        'cohabit_household',
        JSON.stringify({
          household: householdData,
          members: membersData,
        })
      );
    } catch {
      // Silently fall back to cached data
    }
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('cohabit_household');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.household) setHousehold(data.household);
        if (Array.isArray(data.members)) setMembers(data.members);
      } catch {
        localStorage.removeItem('cohabit_household');
      }
    }
    refreshHousehold();
  }, [user, refreshHousehold]);

  const getMemberById = useCallback(
    (id) => {
      if (!id) return null;
      const numId = Number(id);
      const member = members.find((m) => Number(m.id) === numId);
      if (member) return member;
      if (user && Number(user.id) === numId) return user;
      return null;
    },
    [members, user]
  );

  const setHouseholdData = (householdData, membersData = []) => {
    setHousehold(householdData);
    setMembers(membersData);
    localStorage.setItem(
      'cohabit_household',
      JSON.stringify({
        household: householdData,
        members: membersData,
      })
    );
  };

  const clearHousehold = () => {
    setHousehold(null);
    setMembers([]);
    localStorage.removeItem('cohabit_household');
  };

  return (
    <HouseholdContext.Provider
      value={{
        household,
        members,
        getMemberById,
        refreshHousehold,
        setHouseholdData,
        clearHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}


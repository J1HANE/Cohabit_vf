import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import './Settlements.css';

export default function Settlements() {
  const navigate = useNavigate();
  const { getMemberById } = useHousehold();
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    const householdId = user?.householdId || user?.household_id;
    if (householdId) {
      fetch(`http://localhost:8081/api/settlements/household/${householdId}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || !Array.isArray(data)) {
            throw new Error(data?.message || 'Failed to fetch settlements');
          }
          const mappedData = data.map((s) => ({
            ...s,
            from_user_id: s.fromUserId || s.from_user_id,
            to_user_id: s.toUserId || s.to_user_id,
            settled_at: s.settledAt || s.settled_at,
          }));
          setSettlements(mappedData);
        })
        .catch((err) => console.error('Failed to fetch settlements', err));
    }
  }, [user]);

  return (
    <div className="settlements-page page-fade">
      <PageHeader
        title="Settlements"
        subtitle="Payment history between roommates"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <AppButton
              variant="ghost"
              size="md"
              onClick={() => navigate('/balances')}
            >
              Back to Balances
            </AppButton>
            <AppButton
              variant="primary"
              size="md"
              onClick={() => navigate('/settlements/new')}
            >
              Settle a debt
            </AppButton>
          </div>
        }
      />

      <div className="section-block-title" style={{ marginBottom: '1rem' }}>
        Settlement history
      </div>

      <div className="settlements-list">
        {settlements.length === 0 ? (
          <div className="app-card" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
            No settlements yet.
          </div>
        ) : (
          settlements.map((s) => {
            const from = getMemberById(s.from_user_id);
            const to = getMemberById(s.to_user_id);
            return (
              <div key={s.id} className="settlement-row">
                <div className="settlement-icon">💸</div>
                <div className="settlement-info">
                  <span className="settlement-names">
                    <strong>{from?.name || 'User'}</strong> paid <strong>{to?.name || 'User'}</strong>
                  </span>
                  <span className="settlement-date">
                    {new Date(s.settled_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="settlement-amount">{s.amount} MAD</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { MOCK_SETTLEMENTS } from '../../data/mockData';
import './Settlements.css';

export default function Settlements() {
  const navigate = useNavigate();
  const { getMemberById } = useHousehold();

  return (
    <div className="settlements-page page-fade">
      <PageHeader
        title="Settlements"
        subtitle="Payment history between roommates"
        action={
          <AppButton
            variant="primary"
            size="md"
            onClick={() => navigate('/settlements/new')}
          >
            Settle a debt
          </AppButton>
        }
      />

      <div className="section-block-title" style={{ marginBottom: '1rem' }}>
        Settlement history
      </div>

      <div className="settlements-list">
        {MOCK_SETTLEMENTS.length === 0 ? (
          <div className="app-card" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
            No settlements yet.
          </div>
        ) : (
          MOCK_SETTLEMENTS.map((s) => {
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


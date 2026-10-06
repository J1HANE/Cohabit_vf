import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  AppButton,
  HouseholdMemberAvatar,
  Modal,
} from '../../components/shared/SharedComponents';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { MOCK_MEMBERS, MOCK_HOUSEHOLD } from '../../data/mockData';
import './HouseholdSettings.css';

export default function HouseholdSettings() {
  const navigate = useNavigate();
  const { household, clearHousehold } = useHousehold();
  const { logout } = useAuth();
  const [householdName, setHouseholdName] = useState(
    household?.name || MOCK_HOUSEHOLD.name
  );
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const inviteCode = household?.invite_code || MOCK_HOUSEHOLD.invite_code;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    // TODO: PATCH /api/households/:id
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleLeave = () => {
    clearHousehold();
    logout();
    navigate('/login');
  };

  return (
    <div className="household-settings-page page-fade">
      <PageHeader
        title="Household Settings"
        subtitle="Manage your shared home"
      />

      {/* Household name */}
      <div className="app-card hs-card">
        <h3 className="profile-section-title">Household Name</h3>
        <form onSubmit={handleSaveName} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Name</label>
            <input
              className="app-form-input"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Household name"
            />
          </div>
          <AppButton type="submit" variant="primary" size="md">
            {nameSaved ? '✓ Saved!' : 'Save name'}
          </AppButton>
        </form>
      </div>

      {/* Members */}
      <div className="app-card hs-card">
        <h3 className="profile-section-title">Members</h3>
        <div className="members-list">
          {MOCK_MEMBERS.map((member) => (
            <div key={member.id} className="member-row">
              <HouseholdMemberAvatar member={member} size="md" />
              <div className="member-row-info">
                <span className="member-row-name">{member.name}</span>
                <span className="member-row-email">{member.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite code */}
      <div className="app-card hs-card">
        <h3 className="profile-section-title">Invite Roommates</h3>
        <p className="hs-invite-desc">
          Share this code with your roommates to let them join your household.
        </p>
        <div className="invite-code-row">
          <div className="invite-code-display">
            <span className="invite-code-label">Invitation Code</span>
            <span className="invite-code-value">{inviteCode}</span>
          </div>
          <AppButton
            variant={copied ? 'accent' : 'ghost'}
            size="md"
            onClick={copyCode}
          >
            {copied ? '✓ Copied!' : 'Copy code'}
          </AppButton>
        </div>
      </div>

      {/* Danger zone */}
      <div className="app-card hs-card hs-danger-zone">
        <h3 className="profile-section-title hs-danger-title">Danger Zone</h3>
        <p className="hs-danger-desc">
          Leaving the household will remove you from all shared expenses, tasks, and shopping lists.
        </p>
        <AppButton
          variant="danger"
          size="md"
          onClick={() => setShowLeaveModal(true)}
        >
          Leave household
        </AppButton>
      </div>

      {/* Leave confirmation modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave household?"
      >
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Are you sure you want to leave <strong style={{ color: '#fff' }}>{householdName}</strong>? You will lose access to all shared data. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <AppButton
            variant="ghost"
            size="md"
            onClick={() => setShowLeaveModal(false)}
            fullWidth
          >
            Cancel
          </AppButton>
          <AppButton
            variant="danger"
            size="md"
            onClick={handleLeave}
            fullWidth
          >
            Yes, leave
          </AppButton>
        </div>
      </Modal>
    </div>
  );
}

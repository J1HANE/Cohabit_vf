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
import './HouseholdSettings.css';

export default function HouseholdSettings() {
  const navigate = useNavigate();
  const { household, members, setHouseholdData, clearHousehold } = useHousehold();
  const { user, logout } = useAuth();
  const [householdName, setHouseholdName] = useState(
    household?.name || ''
  );
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const inviteCode = household?.invite_code || household?.inviteCode || '';

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

  const handleRegenerateCode = async () => {
    if (!household?.id) return;
    setRegenerating(true);
    try {
      const res = await fetch(`http://localhost:8081/api/households/${household.id}/regenerate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.household) {
        setHouseholdData(data.household, members);
        setShowRevokeModal(false);
        setRevokeSuccess('Nouveau code généré avec succès ! L\'ancien code est désormais annulé.');
        setTimeout(() => setRevokeSuccess(''), 4500);
      } else {
        alert(data.error || 'Erreur lors de la régénération du code');
      }
    } catch (err) {
      console.error('Failed to regenerate invite code', err);
      alert('Erreur lors de la régénération du code');
    } finally {
      setRegenerating(false);
    }
  };

  const handleLeave = async () => {
    try {
      if (user?.id) {
        await fetch('http://localhost:8081/api/households/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (err) {
      console.error('Failed to leave household on backend', err);
    }
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

      {revokeSuccess && (
        <div className="settle-success-toast" style={{ marginBottom: '1.5rem' }}>
          {revokeSuccess}
        </div>
      )}

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
          {members.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No members found</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="member-row">
                <HouseholdMemberAvatar member={member} size="md" />
                <div className="member-row-info">
                  <span className="member-row-name">{member.name}</span>
                  <span className="member-row-email">{member.email}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite code */}
      <div className="app-card hs-card">
        <h3 className="profile-section-title">Invite Roommates</h3>
        <p className="hs-invite-desc">
          Partagez ce code avec vos colocataires pour leur permettre de rejoindre votre foyer.
        </p>
        <div className="invite-code-row">
          <div className="invite-code-display">
            <span className="invite-code-label">Invitation Code</span>
            <span className="invite-code-value">{inviteCode}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AppButton
              variant={copied ? 'accent' : 'ghost'}
              size="md"
              onClick={copyCode}
            >
              {copied ? '✓ Copied!' : 'Copy code'}
            </AppButton>
            <AppButton
              variant="warning"
              size="md"
              onClick={() => setShowRevokeModal(true)}
            >
              Régénérer / Révoquer
            </AppButton>
          </div>
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

      {/* Revoke code confirmation modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => !regenerating && setShowRevokeModal(false)}
        title="Révocation du code d'invitation"
      >
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Êtes-vous sûr de vouloir révoquer ce code ? Un nouveau code sera généré et <strong style={{ color: '#ff6b6b' }}>l'ancien code sera instantanément annulé</strong> (utile si le code a été partagé par erreur).
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <AppButton
            variant="ghost"
            size="md"
            onClick={() => setShowRevokeModal(false)}
            disabled={regenerating}
            fullWidth
          >
            Annuler
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            onClick={handleRegenerateCode}
            disabled={regenerating}
            fullWidth
          >
            {regenerating ? 'Génération...' : 'Générer un nouveau code'}
          </AppButton>
        </div>
      </Modal>

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


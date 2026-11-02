import { useEffect, useState } from 'react';
import { AppButton, PageHeader } from '../components/shared/SharedComponents';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { complaintService } from '../services/complaintService';
import './app/Profile.css';

const emptyForm = { category: 'ACCOUNT', subject: '', description: '', reportedUserId: '' };

export default function Complaints() {
  const { user } = useAuth();
  const { members } = useHousehold();
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    complaintService.getMine(user.id)
      .then((data) => { if (active) setComplaints(data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [user?.id]);

  const submitComplaint = async (event) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const complaint = await complaintService.create({
        ...form,
        reportedUserId: form.category === 'USER_REPORT' ? Number(form.reportedUserId) : null,
      });
      setComplaints((current) => [complaint, ...current]);
      setForm(emptyForm);
      setSaved(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page page-fade">
      <PageHeader title="Réclamations" subtitle="Contacter l’équipe ou signaler un membre" />
      <div className="app-card profile-card">
        <h2 className="profile-section-title">Nouvelle demande</h2>
        {error && <p className="support-message is-error" role="alert">{error}</p>}
        {saved && <p className="support-message is-success" role="status">Votre demande a été envoyée.</p>}
        <form className="app-form" onSubmit={submitComplaint}>
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-category">Type</label>
            <select id="complaint-category" className="app-form-select" value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="ACCOUNT">Compte</option>
              <option value="HOUSEHOLD">Foyer</option>
              <option value="PAYMENT">Paiement</option>
              <option value="BUG">Problème technique</option>
              <option value="USER_REPORT">Signaler un utilisateur</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          {form.category === 'USER_REPORT' && (
            <div className="app-form-group">
              <label className="app-form-label" htmlFor="reported-user">Utilisateur concerné</label>
              <select id="reported-user" className="app-form-select" required value={form.reportedUserId}
                onChange={(event) => setForm((current) => ({ ...current, reportedUserId: event.target.value }))}>
                <option value="">Sélectionner un membre du foyer</option>
                {members.filter((member) => Number(member.id) !== Number(user?.id)).map((member) => (
                  <option value={member.id} key={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-subject">Objet</label>
            <input id="complaint-subject" className="app-form-input" minLength="5" maxLength="120"
              required value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
          </div>
          <div className="app-form-group">
            <label className="app-form-label" htmlFor="complaint-description">Détails</label>
            <textarea id="complaint-description" className="app-form-textarea" minLength="20" maxLength="5000"
              required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <span className="support-character-count">{form.description.length}/5000</span>
          </div>
          <AppButton type="submit" variant="primary" disabled={loading}>
            {loading ? 'Envoi…' : 'Envoyer'}
          </AppButton>
        </form>
      </div>

      <div className="app-card profile-card support-history">
        <h2 className="profile-section-title">Mes demandes</h2>
        {complaints.length === 0 ? <p className="support-empty">Aucune demande pour le moment.</p> : complaints.map((complaint) => (
          <article className="support-request" key={complaint.id}>
            <div className="support-request-heading">
              <div>
                <strong>{complaint.subject}</strong>
                <span>{complaint.category}{complaint.reportedUserName ? ` · Signalement de ${complaint.reportedUserName}` : ''}</span>
              </div>
              <span className={`support-status status-${complaint.status.toLowerCase()}`}>{complaint.status.replace('_', ' ')}</span>
            </div>
            {complaint.adminResponse && <p className="support-admin-response">{complaint.adminResponse}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
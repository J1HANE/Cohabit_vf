import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { apiFetch } from '../../services/api';
import './AdminEmailCampaignForm.css';

const CAMPAIGNS_URL = 'http://localhost:8081/api/admin/email-campaigns';

function toLocalDateTime(utcDateTime) {
  if (!utcDateTime) return '';
  const date = new Date(`${utcDateTime}Z`);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function AdminEmailCampaignForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    subject: '',
    content: '',
    scheduledAt: '',
  });
  const [loadedId, setLoadedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isLoading = isEdit && loadedId !== id;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    apiFetch(`${CAMPAIGNS_URL}/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load campaign');
        const campaign = await res.json();
        if (controller.signal.aborted) return;
        setForm({
          subject: campaign.subject,
          content: campaign.content,
          scheduledAt: toLocalDateTime(campaign.scheduledAt),
        });
        setLoadedId(id);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });

    return () => controller.abort();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || saving) return;

    const url = isEdit ? `${CAMPAIGNS_URL}/${id}` : CAMPAIGNS_URL;
    const method = isEdit ? 'PUT' : 'POST';
    const sendDate = form.scheduledAt ? new Date(form.scheduledAt) : null;
    if (sendDate && !(sendDate.getTime() > Date.now())) {
      setError('Choose a send date and time in the future.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledAt: sendDate ? sendDate.toISOString().slice(0, -1) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save campaign');
      }

      navigate('/admin/email-campaigns');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-campaign-form">
      <PageHeader
        title={isEdit ? 'Edit Campaign' : 'Create Campaign'}
        subtitle={isEdit ? 'Update email newsletter' : 'Create new email newsletter'}
        action={
          <AppButton
            variant="ghost"
            size="md"
            onClick={() => navigate('/admin/email-campaigns')}
          >
            Cancel
          </AppButton>
        }
      />

      <div className="campaign-form-card">
        {error && <p role="alert">{error}</p>}
        {isLoading ? (!error && <p>Loading campaign…</p>) : (
          <form onSubmit={handleSubmit} className="campaign-form">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="New Feature Announcement"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content (HTML supported)</label>
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your newsletter content here..."
                rows={10}
                required
              />
              <p className="form-hint">
                You can use HTML tags for formatting. Example: &lt;p&gt;Hello &lt;strong&gt;user&lt;/strong&gt;!&lt;/p&gt;
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="campaign-scheduled-at" className="form-label">Send date and time (optional)</label>
              <input
                id="campaign-scheduled-at"
                type="datetime-local"
                className="form-input"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                aria-describedby="campaign-schedule-hint"
              />
              <p id="campaign-schedule-hint" className="form-hint">
                Times use your browser’s time zone ({timezone}). Leave blank to save as a draft.
              </p>
            </div>

            <div className="form-actions">
              <AppButton type="submit" variant="primary" size="lg" disabled={saving}>
                {form.scheduledAt ? 'Schedule Campaign' : 'Save Draft'}
              </AppButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

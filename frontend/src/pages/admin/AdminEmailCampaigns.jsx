import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { apiFetch } from '../../services/api';
import './AdminEmailCampaigns.css';

export default function AdminEmailCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchCampaigns();
  }, [filter]);

  const fetchCampaigns = async () => {
    const url = filter === 'ALL' 
      ? 'http://localhost:8081/api/admin/email-campaigns'
      : `http://localhost:8081/api/admin/email-campaigns/status/${filter}`;
    
    try {
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  };

  const sendCampaign = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:8081/api/admin/email-campaigns/${id}/send`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to send campaign');
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to send campaign:', err);
      alert('Failed to send campaign');
    }
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const res = await apiFetch(`http://localhost:8081/api/admin/email-campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert('Failed to delete campaign');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return '#f59e0b';
      case 'SENT': return '#10b981';
      case 'SCHEDULED': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-email-campaigns">
      <PageHeader
        title="Email Campaigns"
        subtitle="Manage marketing newsletters"
        action={
          <AppButton
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/email-campaigns/new')}
          >
            Create Campaign
          </AppButton>
        }
      />

      <div className="campaign-filters">
        {['ALL', 'DRAFT', 'SENT', 'SCHEDULED'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="campaigns-list">
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <p>No campaigns found</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3 className="campaign-subject">{campaign.subject}</h3>
                <span 
                  className="campaign-status"
                  style={{ backgroundColor: getStatusColor(campaign.status) }}
                >
                  {campaign.status}
                </span>
              </div>
              
              <div className="campaign-content-preview">
                {campaign.content.substring(0, 150)}
                {campaign.content.length > 150 && '...'}
              </div>

              <div className="campaign-meta">
                <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                  <span>Scheduled: {new Date(`${campaign.scheduledAt}Z`).toLocaleString()}</span>
                )}
                {campaign.sentAt && (
                  <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                )}
                {campaign.recipientCount !== null && (
                  <span>Recipients: {campaign.recipientCount}</span>
                )}
              </div>

              <div className="campaign-actions">
                {campaign.status !== 'SENT' && (
                  <>
                    <AppButton
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/email-campaigns/${campaign.id}/edit`)}
                    >
                      Edit
                    </AppButton>
                    {campaign.status === 'DRAFT' && (
                      <AppButton
                        variant="primary"
                        size="sm"
                        onClick={() => sendCampaign(campaign.id)}
                      >
                        Send
                      </AppButton>
                    )}
                    <AppButton
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      Delete
                    </AppButton>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

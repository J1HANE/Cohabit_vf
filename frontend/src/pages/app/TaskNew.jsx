import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';

const FREQUENCIES = [
  { label: 'Every day', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Every week', value: 7 },
  { label: 'Every 2 weeks', value: 14 },
  { label: 'Every month', value: 30 },
];

export default function TaskNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const [form, setForm] = useState({
    name: '',
    assigned_user_id: user?.id || '',
    frequency_days: 7,
    due_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Task name is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const householdId = household?.id || user?.householdId;
    if (!householdId) {
      setErrors({ submit: 'Join or create a household before adding tasks.' });
      return;
    }
    
    const newTask = {
      name: form.name,
      householdId,
      frequencyDays: form.frequency_days,
      dueDate: form.due_date,
      status: 'pending',
      assignedUserId: form.assigned_user_id,
      rotationIndex: 0
    };

    fetch('http://localhost:8081/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTask)
    })
    .then(res => {
      if (!res.ok) throw new Error('Server returned ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('New task created:', data);
      navigate('/tasks');
    })
    .catch(err => {
      console.error("Failed to create task", err);
      setErrors({ submit: err.message || 'Failed to create task' });
    });
  };

  return (
    <div className="page-fade">
      <PageHeader
        title="Add Task"
        subtitle="Assign a new household chore"
        action={
          <AppButton variant="ghost" size="md" onClick={() => navigate('/tasks')}>
            Cancel
          </AppButton>
        }
      />

      <div className="app-card" style={{ maxWidth: '520px' }}>
        <form onSubmit={handleSubmit} className="app-form">
          <div className="app-form-group">
            <label className="app-form-label">Task name</label>
            <input
              className={`app-form-input${errors.name ? ' error' : ''}`}
              placeholder="e.g. Clean kitchen"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Assigned to</label>
            <select
              className="app-form-select"
              value={form.assigned_user_id}
              onChange={(e) => setForm((f) => ({ ...f, assigned_user_id: parseInt(e.target.value) }))}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}{m.id === user?.id ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Frequency</label>
            <select
              className="app-form-select"
              value={form.frequency_days}
              onChange={(e) => setForm((f) => ({ ...f, frequency_days: parseInt(e.target.value) }))}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="app-form-group">
            <label className="app-form-label">Due date</label>
            <input
              className="app-form-input"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>

          {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}

          <AppButton type="submit" variant="primary" size="lg" fullWidth>
            Create task
          </AppButton>
        </form>
      </div>
    </div>
  );
}

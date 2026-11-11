import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, AppButton } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import SpinWheel from '../../components/SpinWheel/SpinWheel';
import { apiFetch } from '../../services/api';

const FREQUENCIES = [
  { label: 'Every day', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Every week', value: 7 },
  { label: 'Every 2 weeks', value: 14 },
  { label: 'Every month', value: 30 },
];

export default function TaskNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { household, members } = useHousehold();
  const [form, setForm] = useState({
    name: '',
    assigned_user_id: user?.id || '',
    frequency_days: 7,
    due_date: new Date().toISOString().split('T')[0],
    rotationIndex: 0,
  });
  const [errors, setErrors] = useState({});
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [loadingTask, setLoadingTask] = useState(Boolean(id));
  const [createdById, setCreatedById] = useState(null);

  useEffect(() => {
    if (!id) return;

    apiFetch(`http://localhost:8081/api/tasks/${id}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Tâche introuvable.');
        setForm({
          name: data.name || '',
          assigned_user_id: data.assignedUserId || '',
          frequency_days: data.frequencyDays || 7,
          due_date: data.dueDate || new Date().toISOString().slice(0, 10),
          rotationIndex: data.rotationIndex,
        });
        setCreatedById(data.createdById);
      })
      .catch((loadError) => setErrors({ submit: loadError.message }))
      .finally(() => setLoadingTask(false));
  }, [id]);

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
    
    const taskData = {
      name: form.name,
      householdId,
      frequencyDays: form.frequency_days,
      dueDate: form.due_date,
      assignedUserId: form.assigned_user_id,
      rotationIndex: form.rotationIndex,
    };

    const url = id
      ? `http://localhost:8081/api/tasks/${id}`
      : 'http://localhost:8081/api/tasks';
    const method = id ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    })
    .then(res => {
      if (!res.ok) throw new Error('Server returned ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log(id ? 'Task updated:' : 'New task created:', data);
      navigate('/tasks');
    })
    .catch(err => {
      console.error("Failed to save task", err);
      setErrors({ submit: err.message || 'Failed to save task' });
    });
  };

  if (loadingTask) return <div className="page-fade" style={{ padding: '2rem' }}>Chargement...</div>;
  if (id && createdById != null && Number(createdById) !== Number(user?.id)) {
    return <div className="page-fade"><PageHeader title="Accès refusé" /><p>Seul le créateur peut modifier cette tâche.</p></div>;
  }

  return (
    <div className="page-fade">
      <PageHeader
        title={id ? 'Modifier la tâche' : 'Add Task'}
        subtitle={id ? 'Mettre à jour les détails de cette tâche' : 'Assign a new household chore'}
        action={
          <AppButton variant="ghost" size="md" onClick={() => navigate(id ? '/tasks' : '/tasks')}>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                className="app-form-select"
                value={form.assigned_user_id}
                onChange={(e) => setForm((f) => ({ ...f, assigned_user_id: parseInt(e.target.value) }))}
                style={{ flex: 1 }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}{m.id === user?.id ? ' (you)' : ''}</option>
                ))}
              </select>
              <AppButton
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setShowSpinWheel(true)}
                disabled={members.length === 0}
                title="Randomly assign task"
              >
                🎰
              </AppButton>
            </div>
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
            {id ? 'Save changes' : 'Create task'}
          </AppButton>
        </form>
      </div>

      {showSpinWheel && (
        <SpinWheel
          members={members}
          onClose={() => setShowSpinWheel(false)}
          onSelect={(member) => {
            setForm((f) => ({ ...f, assigned_user_id: member.id }));
            setShowSpinWheel(false);
          }}
        />
      )}
    </div>
  );
}

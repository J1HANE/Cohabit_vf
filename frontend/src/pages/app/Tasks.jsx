import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHousehold } from '../../context/HouseholdContext';
import {
  PageHeader,
  AppButton,
  TaskCard,
  EmptyState,
} from '../../components/shared/SharedComponents';
import './Tasks.css';

const TABS = ['Today', 'Upcoming', 'Completed'];

export default function Tasks() {
  const navigate = useNavigate();
  const { household, getMemberById } = useHousehold();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('Today');


  useEffect(() => {
    fetch('http://localhost:8081/api/tasks')
      .then(res => res.json())
      .then(data => {
        // Map backend properties to frontend if necessary, or just set it
        // The backend uses camelCase (dueDate) but frontend uses snake_case (due_date) in some places.
        // Wait, MOCK_TASKS had due_date. We can map it.
        const mappedData = data.map(t => ({
          ...t,
          due_date: t.dueDate,
          status: t.status,
          assigned_user_id: t.assignedUserId,
        }));
        setTasks(mappedData);
      })
      .catch(err => console.error("Failed to fetch tasks", err));
  }, []);

  const today = new Date().toDateString();

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'Today')
      return t.status === 'pending' && new Date(t.due_date).toDateString() === today;
    if (activeTab === 'Upcoming')
      return t.status === 'pending' && new Date(t.due_date).toDateString() !== today;
    if (activeTab === 'Completed') return t.status === 'completed';
    return true;
  });

  const toggleTask = (id) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;
    
    const updatedStatus = taskToUpdate.status === 'completed' ? 'pending' : 'completed';

    fetch(`http://localhost:8081/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...taskToUpdate,
        status: updatedStatus,
        dueDate: taskToUpdate.due_date,
        assignedUserId: taskToUpdate.assigned_user_id
      })
    })
    .then(res => res.json())
    .then(updatedTask => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { 
            ...t, 
            ...updatedTask,
            status: updatedTask.status,
            due_date: updatedTask.dueDate,
            assigned_user_id: updatedTask.assignedUserId
          } : t
        )
      );
    })
    .catch(err => console.error("Failed to update task", err));
  };

  return (
    <div className="tasks-page page-fade">
      <PageHeader
        title="Tasks"
        subtitle="Household chores & responsibilities"
        action={
          <AppButton
            variant="primary"
            size="md"
            onClick={() => navigate('/tasks/new')}
            icon="+"
          >
            Add task
          </AppButton>
        }
      />

      {/* Tab bar */}
      <div className="filter-tabs" style={{ marginBottom: '1.25rem' }}>
        {TABS.map((tab) => {
          const count = tasks.filter((t) => {
            if (tab === 'Today') return t.status === 'pending' && new Date(t.due_date).toDateString() === today;
            if (tab === 'Upcoming') return t.status === 'pending' && new Date(t.due_date).toDateString() !== today;
            if (tab === 'Completed') return t.status === 'completed';
            return false;
          }).length;
          return (
            <button
              key={tab}
              className={`filter-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {count > 0 && (
                <span className="tab-badge">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={activeTab === 'Completed' ? '📋' : '✅'}
            title={activeTab === 'Completed' ? 'No completed tasks yet' : 'All clear!'}
            description={
              activeTab === 'Today'
                ? 'No tasks due today. Enjoy your free time!'
                : activeTab === 'Upcoming'
                ? 'No upcoming tasks scheduled.'
                : 'Complete some tasks to see them here.'
            }
            action={
              activeTab !== 'Completed' && (
                <AppButton
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/tasks/new')}
                  icon="+"
                >
                  Add a task
                </AppButton>
              )
            }
          />
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={getMemberById(task.assigned_user_id)}
              onComplete={toggleTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

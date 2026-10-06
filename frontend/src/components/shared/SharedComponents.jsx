import React from 'react';
import './SharedComponents.css';

/* ── HouseholdMemberAvatar ── */
export function HouseholdMemberAvatar({ member, size = 'md', showName = false }) {
  const initials = member?.name ? member.name.slice(0, 1).toUpperCase() : '?';
  const sizeClass = `avatar-${size}`;

  return (
    <div className={`member-avatar-wrapper ${showName ? 'with-name' : ''}`}>
      <div
        className={`member-avatar ${sizeClass}`}
        style={{ background: member?.color || '#a8d5c4' }}
        title={member?.name}
      >
        {initials}
      </div>
      {showName && <span className="member-avatar-name">{member?.name}</span>}
    </div>
  );
}

/* ── SummaryCard ── */
export function SummaryCard({ icon, label, value, sub, accent, onClick }) {
  return (
    <div
      className={`summary-card${onClick ? ' clickable' : ''}`}
      onClick={onClick}
    >
      <div className="summary-card-icon" style={accent ? { background: `${accent}22`, color: accent } : {}}>
        {icon}
      </div>
      <div className="summary-card-body">
        <span className="summary-card-label">{label}</span>
        <span className="summary-card-value">{value}</span>
        {sub && <span className="summary-card-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── ExpenseCard ── */
export function ExpenseCard({ expense, payer, onClick }) {
  return (
    <div className="expense-card" onClick={onClick}>
      <div className="expense-card-emoji">{expense.emoji || '💸'}</div>
      <div className="expense-card-info">
        <span className="expense-card-label">{expense.label}</span>
        <span className="expense-card-meta">
          {payer?.name || 'Unknown'} &bull;{' '}
          {new Date(expense.expense_date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short',
          })}
        </span>
      </div>
      <span className="expense-card-amount">{expense.amount} MAD</span>
    </div>
  );
}

/* ── TaskCard ── */
export function TaskCard({ task, assignee, onComplete }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const isToday = task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString();

  return (
    <div className={`task-card${task.status === 'completed' ? ' completed' : ''}`}>
      <button
        className={`task-check${task.status === 'completed' ? ' checked' : ''}`}
        onClick={(e) => { e.stopPropagation(); onComplete && onComplete(task.id); }}
        aria-label="Mark complete"
      >
        {task.status === 'completed' ? '✓' : ''}
      </button>
      <div className="task-card-info">
        <span className="task-card-name">{task.name}</span>
        <span className="task-card-meta">
          {assignee?.name || 'Unassigned'} &bull;{' '}
          <span className={isOverdue ? 'text-danger' : isToday ? 'text-warning' : ''}>
            {isToday ? 'Due today' : isOverdue ? 'Overdue' : `Due ${new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </span>
        </span>
      </div>
      {task.frequency_days && (
        <span className="task-freq">
          Every {task.frequency_days === 1 ? 'day' : `${task.frequency_days} days`}
        </span>
      )}
    </div>
  );
}

/* ── ShoppingItem ── */
export function ShoppingItem({ item, adder, onToggle, onDelete }) {
  return (
    <div className={`shopping-item${item.purchased ? ' purchased' : ''}`}>
      <button
        className={`shopping-check${item.purchased ? ' checked' : ''}`}
        onClick={() => onToggle && onToggle(item.id)}
        aria-label={item.purchased ? 'Mark unpurchased' : 'Mark purchased'}
      >
        {item.purchased ? '✓' : ''}
      </button>
      <div className="shopping-item-info">
        <span className="shopping-item-name">{item.name}</span>
        <span className="shopping-item-meta">Added by {adder?.name || 'Unknown'}</span>
      </div>
      <button
        className="shopping-delete"
        onClick={() => onDelete && onDelete(item.id)}
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  );
}

/* ── BalanceCard ── */
export function BalanceCard({ member, amount }) {
  const positive = amount >= 0;
  return (
    <div className="balance-card">
      <HouseholdMemberAvatar member={member} size="sm" />
      <span className="balance-card-name">{member?.name}</span>
      <span className={`balance-card-amount ${positive ? 'positive' : 'negative'}`}>
        {positive ? '+' : ''}{amount} MAD
      </span>
    </div>
  );
}

/* ── Modal ── */
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action}
    </div>
  );
}

/* ── LoadingState ── */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}

/* ── PageHeader ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

/* ── AppButton ── */
export function AppButton({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled, fullWidth, icon }) {
  return (
    <button
      type={type}
      className={`app-btn app-btn-${variant} app-btn-${size}${fullWidth ? ' full-width' : ''}${disabled ? ' disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="app-btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export const DEPARTMENTS = [
  'Operations',
  'Sales',
  'Marketing',
  'Finance',
  'Engineering',
  'People',
];

export const TASK_STATUSES = [
  'Pending',
  'In progress',
  'Blocked',
  'Overdue',
  'Completed',
  'Cancelled',
];

export const OPEN_STATUSES = [
  'Pending',
  'In progress',
  'Blocked',
  'Overdue',
];

export const PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low',
];

export const AVAILABILITY_STATUSES = [
  'Available',
  'Limited',
  'On leave',
];

export const SENIORITY_LEVELS = [
  'Junior',
  'Mid',
  'Senior',
  'Lead',
];

export const STATUS_STYLES = {
  Pending: 'text-muted-foreground bg-white/[0.05] border-white/10',
  'In progress': 'text-chart-3 bg-chart-3/10 border-chart-3/25',
  Blocked: 'text-warn bg-warn/10 border-warn/25',
  Overdue: 'text-danger bg-danger/10 border-danger/25',
  Completed: 'text-ok bg-ok/10 border-ok/25',
  Cancelled: 'text-muted-foreground bg-white/[0.03] border-white/10',
};

export const PRIORITY_STYLES = {
  Critical: { dot: 'bg-danger', text: 'text-danger' },
  High: { dot: 'bg-warn', text: 'text-warn' },
  Medium: { dot: 'bg-chart-3', text: 'text-chart-3' },
  Low: { dot: 'bg-white/30', text: 'text-muted-foreground' },
};

export const RISK_STYLES = {
  low: 'text-ok bg-ok/10 border-ok/25',
  medium: 'text-warn bg-warn/10 border-warn/25',
  high: 'text-danger bg-danger/10 border-danger/25',
  critical: 'text-danger bg-danger/15 border-danger/40',
};

export const ACTOR_STYLES = {
  AI: 'text-signal bg-signal/10 border-signal/25',
  CEO: 'text-warn bg-warn/10 border-warn/25',
  Employee: 'text-chart-3 bg-chart-3/10 border-chart-3/25',
};

export const getTodayStr = () => new Date().toISOString().slice(0, 10);

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name = '') {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function isOverdue(task) {
  if (!task?.due_date || task.status === 'Completed' || task.status === 'Cancelled') {
    return false;
  }
  const today = getTodayStr();
  return task.due_date < today || task.status === 'Overdue';
}

export function getDaysOverdue(task) {
  if (!task?.due_date) return 0;
  const d = new Date(task.due_date).getTime();
  const now = new Date().getTime();
  return Math.max(1, Math.round((now - d) / 86400000));
}

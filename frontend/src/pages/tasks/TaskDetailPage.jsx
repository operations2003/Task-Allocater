import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  User,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  Sliders,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { StatusPill } from '../../components/common/StatusPill.jsx';
import { PriorityIndicator } from '../../components/common/PriorityIndicator.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import {
  formatDate,
  formatDateTime,
  isOverdue,
  getDaysOverdue,
  getInitials,
  ACTOR_STYLES,
  DEPARTMENTS,
  PRIORITIES,
} from '../../constants/neraTheme.js';

export const TaskDetailPage = () => {
  const { id } = useParams();
  const { user, isCeo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit / Reassign state
  const [editState, setEditState] = useState({
    assignee_id: '',
    due_date: '',
    priority: 'High',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empsRes, auditRes] = await Promise.allSettled([
        ceoTaskService.listAllTasks ? ceoTaskService.listAllTasks() : Promise.resolve([]),
        employeeService.listEmployees({ excludeCeo: true }),
        ceoTaskService.getTaskAuditTrail ? ceoTaskService.getTaskAuditTrail(id) : Promise.resolve([]),
      ]);

      const allTasks = tasksRes.status === 'fulfilled' ? (tasksRes.value?.data || tasksRes.value || []) : [];
      const emps = empsRes.status === 'fulfilled' ? (empsRes.value?.data || empsRes.value?.employees || empsRes.value || []) : [];
      const trail = auditRes.status === 'fulfilled' ? (auditRes.value?.data || auditRes.value || []) : [];

      const found = allTasks.find((t) => String(t.id) === String(id));
      if (found) {
        setTask(found);
        setEditState({
          assignee_id: found.assignee_id || found.assigned_to_id || '',
          due_date: found.due_date ? String(found.due_date).split('T')[0] : '',
          priority: found.priority || 'High',
        });
      }

      setEmployees(emps);
      setActivities(trail);
    } catch (err) {
      console.warn('Task detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApplyChanges = async (e) => {
    e.preventDefault();
    if (!task) return;

    try {
      setIsUpdating(true);
      if (editState.assignee_id && editState.assignee_id !== (task.assignee_id || task.assigned_to_id)) {
        await ceoTaskService.reassignTask(task.id, editState.assignee_id, 'Executive directive reassignment');
      }
      if (editState.due_date && editState.due_date !== task.due_date) {
        await ceoTaskService.modifyDeadline(task.id, editState.due_date, 'CEO deadline adjustment');
      }
      if (editState.priority && editState.priority !== task.priority) {
        await ceoTaskService.changePriority(task.id, editState.priority);
      }

      toast.success('Task updated and recorded in audit trail.');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update task.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground fade-up">
        Loading task directive…
      </div>
    );
  }

  if (!task) {
    return (
      <div className="panel px-5 py-16 text-center space-y-3 fade-up">
        <p className="font-display text-2xl text-foreground">This task could not be found</p>
        <Link to="/tasks" className="inline-block text-[12px] text-signal hover:underline">
          Back to the ledger
        </Link>
      </div>
    );
  }

  const overdue = isOverdue(task);
  const daysOverdue = getDaysOverdue(task);
  const assigneeName = task.assigned_to_name || task.assigneeName || 'Unassigned';
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  return (
    <div className="fade-up space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Task ledger</span>
        </Link>
      </div>

      {/* Main Task Layout: 2 Cols Left & 1 Col Right */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column (2 Cols): Task Content, Subtasks & Audit Trail */}
        <div className="space-y-5 lg:col-span-2">
          {/* Main Card */}
          <section className="panel p-6 space-y-4">
            {/* Meta Tags Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={task.status} />
              <PriorityIndicator priority={task.priority} />
              <span className="text-[10.5px] text-muted-foreground">
                {task.department || 'Operations'}
              </span>
              {task.initiated_by === 'AI' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-signal/25 bg-signal/10 px-2 py-0.5 text-[9.5px] text-signal font-medium">
                  <Bot className="h-2.5 w-2.5" />
                  <span>AI allocated</span>
                </span>
              )}
            </div>

            {/* Task Title & Description */}
            <div>
              <h1 className="font-display text-[26px] leading-tight text-foreground sm:text-[32px]">
                {task.title}
              </h1>
              {task.description && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {task.description}
                </p>
              )}
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 border-t border-white/[0.06] text-xs">
              <div>
                <p className="eyebrow">Owner</p>
                <p className="mt-1 font-medium text-foreground">{assigneeName}</p>
                <p className="text-[10px] text-muted-foreground">{task.department || 'Staff'}</p>
              </div>

              <div>
                <p className="eyebrow">Target Due Date</p>
                <p className={`mt-1 font-medium ${overdue ? 'text-danger' : 'text-foreground'}`}>
                  {formatDate(task.due_date)}
                  {overdue && <span className="ml-1 text-[10px] font-bold">+{daysOverdue}d</span>}
                </p>
                {task.original_due_date && task.original_due_date !== task.due_date && (
                  <p className="text-[10px] text-muted-foreground line-through">
                    {formatDate(task.original_due_date)}
                  </p>
                )}
              </div>

              <div>
                <p className="eyebrow">Created by</p>
                <p className="mt-1 font-medium text-foreground">
                  {task.created_by_name || 'Sheetal Bedi'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  via {task.initiated_by || 'CEO'}
                </p>
              </div>

              <div>
                <p className="eyebrow">Carried forward</p>
                <p className="num mt-1 font-medium text-foreground">
                  {task.carried_forward_count || 0}×
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {task.escalation_level || 'None'} escalation
                </p>
              </div>
            </div>

            {/* Progress Meter */}
            <div className="pt-2">
              <div className="flex items-baseline justify-between text-xs">
                <p className="eyebrow">Execution Progress</p>
                <span className="num font-semibold text-foreground">{task.progress || 0}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-signal/80 transition-all duration-500"
                  style={{ width: `${task.progress || 0}%` }}
                />
              </div>
            </div>
          </section>

          {/* Subtasks Section */}
          {subtasks.length > 0 && (
            <section className="panel p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-signal" />
                <h2 className="font-display text-lg text-foreground">Milestones & Subtasks</h2>
              </div>
              <div className="space-y-2">
                {subtasks.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-xs text-foreground/90"
                  >
                    <span className="truncate">{st.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        st.completed
                          ? 'bg-ok/10 text-ok border border-ok/20'
                          : 'bg-white/[0.05] text-muted-foreground border border-white/10'
                      }`}
                    >
                      {st.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Chronological Audit Trail Section */}
          <section className="panel p-5 space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-signal" />
              <h2 className="font-display text-lg text-foreground">Immutable Audit Trail</h2>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Who created, who assigned, AI or CEO, deadlines, priority changes, and evidence uploads.
            </p>

            {activities.length === 0 ? (
              <div className="p-4 rounded-lg bg-white/[0.02] text-center text-xs text-muted-foreground border border-white/[0.04]">
                Creation logged: Initial directive assigned with clear single ownership.
              </div>
            ) : (
              <ol className="relative space-y-4 pl-1">
                <span className="absolute left-[13px] top-2 h-[calc(100%-16px)] w-px bg-white/[0.08]" />
                {activities.map((act) => {
                  const actorType = act.actor_type || (act.actor_name?.toLowerCase().includes('ai') ? 'AI' : 'CEO');
                  const style = ACTOR_STYLES[actorType] || ACTOR_STYLES.Employee;

                  return (
                    <li key={act.id} className="relative flex gap-3 text-xs">
                      <span
                        className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${style}`}
                      >
                        {actorType === 'AI' ? (
                          <Bot className="h-3 w-3" />
                        ) : actorType === 'CEO' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{act.actor_name || actorType}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateTime(act.timestamp || act.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground leading-relaxed">
                          {act.action || act.details || act.note}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Right Column: Executive Controls & Policies */}
        <div className="space-y-4">
          {/* Executive Directive Management (CEO Only) */}
          {isCeo && (
            <section className="panel p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-signal" />
                <h3 className="font-display text-base text-foreground">Executive Directive Controls</h3>
              </div>

              <form onSubmit={handleApplyChanges} className="space-y-3.5">
                <div>
                  <label className="eyebrow block">Reassign Directive</label>
                  <select
                    className="field mt-1 text-xs"
                    value={editState.assignee_id}
                    onChange={(e) => setEditState({ ...editState, assignee_id: e.target.value })}
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-background text-foreground">
                        {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} · {emp.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="eyebrow block">Adjust Due Date</label>
                  <input
                    type="date"
                    className="field mt-1 text-xs"
                    value={editState.due_date}
                    onChange={(e) => setEditState({ ...editState, due_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="eyebrow block">Change Priority</label>
                  <select
                    className="field mt-1 text-xs"
                    value={editState.priority}
                    onChange={(e) => setEditState({ ...editState, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-background text-foreground">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full mt-2 py-2 rounded-lg bg-signal text-primary-foreground text-xs font-semibold hover:bg-signal/90 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Applying changes…' : 'Update directive'}
                </button>
              </form>
            </section>
          )}

          {/* Operational Policy Reminder */}
          <section className="panel p-5 space-y-2">
            <p className="eyebrow">Authority Matrix</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Deadlines, priority, and reassignments can only be officially altered by the CEO. Routine tasks progress automatically under AI oversight.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

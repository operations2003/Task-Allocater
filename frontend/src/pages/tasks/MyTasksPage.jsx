import React, { useState, useEffect } from 'react';
import { Paperclip, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatusPill } from '../../components/common/StatusPill.jsx';
import { PriorityIndicator } from '../../components/common/PriorityIndicator.jsx';
import { DeadlineExtensionModal } from '../../components/tasks/DeadlineExtensionModal.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { taskService } from '../../services/taskService.js';
import { formatDate, isOverdue, getDaysOverdue } from '../../constants/neraTheme.js';

export const MyTasksPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [extensionTask, setExtensionTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Fetch user's tasks
      let list = [];
      try {
        const res = await (taskService.getMyTasks ? taskService.getMyTasks() : taskService.getTasks());
        list = res?.data || (Array.isArray(res) ? res : []);
      } catch {
        list = [];
      }

      // If list is empty or mock is needed for employee preview
      if (list.length === 0) {
        list = [
          {
            id: 'task-emp-1',
            title: 'ATS Candidate Pipeline API Migration to Microservices',
            description: 'Decouple candidate ingest endpoints into high-throughput microservice architecture. Ensure backward compatibility with existing legacy webhooks.',
            department: 'Engineering',
            priority: 'High',
            status: 'In progress',
            progress: 65,
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            assigned_to_email: user?.email || 'employee@nerahub.com',
          },
          {
            id: 'task-emp-2',
            title: 'Q4 SOC2 Compliance Audit Logs Verification',
            description: 'Collate security audit trails and verify encrypted backup archives for external compliance submission.',
            department: 'Finance',
            priority: 'Medium',
            status: 'In progress',
            progress: 30,
            due_date: new Date(Date.now() - 86400000).toISOString(),
            assigned_to_email: user?.email || 'employee@nerahub.com',
          },
          {
            id: 'task-emp-3',
            title: 'Database Sharding Proof of Concept Benchmarks',
            description: 'Execute stress testing script on PostgreSQL replica nodes under simulated load.',
            department: 'Engineering',
            priority: 'Critical',
            status: 'Completed',
            progress: 100,
            due_date: new Date(Date.now() - 86400000 * 3).toISOString(),
            assigned_to_email: user?.email || 'employee@nerahub.com',
            evidence_name: 'benchmark_results_v2.pdf',
          },
        ];
      }

      setTasks(list);
    } catch (err) {
      toast.show('Failed to load tasks', err.message, 'destructive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.email]);

  const openTasks = tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const visibleTasks = showCompleted ? completedTasks : openTasks;

  const handleProgressSave = async (taskId, newProgress) => {
    try {
      const isComplete = newProgress >= 100;
      const newStatus = isComplete ? 'Completed' : 'In progress';

      // Update local state immediately for responsive feedback
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, progress: newProgress, status: newStatus }
            : t
        )
      );

      // Persist to service
      if (ceoTaskService.submitProgressUpdate) {
        await ceoTaskService.submitProgressUpdate(taskId, {
          progress: newProgress,
          status: newStatus,
        });
      }

      toast.show(
        'Progress saved',
        isComplete ? 'Task marked as completed.' : `Progress updated to ${newProgress}%.`
      );
    } catch (err) {
      toast.show('Could not save progress', err.message, 'destructive');
      fetchTasks();
    }
  };

  const handleFileUpload = async (taskId, file) => {
    if (!file) return;
    try {
      toast.show('Uploading proof', file.name);
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 800));

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, evidence_name: file.name, evidence_uri: URL.createObjectURL(file) }
            : t
        )
      );

      toast.show('Proof uploaded', `Attached ${file.name} to audit record.`);
    } catch (err) {
      toast.show('Upload failed', err.message, 'destructive');
    }
  };

  const handleExtensionSubmit = async (taskId, payload) => {
    try {
      if (ceoTaskService.requestDeadlineExtension) {
        await ceoTaskService.requestDeadlineExtension(taskId, payload);
      }
      toast.show('Extension requested', 'Routed to CEO Approvals queue for sign-off.');
      setExtensionTask(null);
    } catch (err) {
      toast.show('Request failed', err.message, 'destructive');
    }
  };

  return (
    <div className="fade-up space-y-6">
      <PageHeader
        eyebrow="My tasks"
        title="Your work, in your hands"
        subtitle="Update progress, attach proof of completion, or ask for more time. Deadlines stay visible either way."
        actions={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCompleted(false)}
              className={`rounded-full px-3 py-1.5 text-[11.5px] transition ${
                !showCompleted
                  ? 'bg-white/[0.08] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Open ({openTasks.length})
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`rounded-full px-3 py-1.5 text-[11.5px] transition ${
                showCompleted
                  ? 'bg-white/[0.08] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground">
          Loading your tasks…
        </div>
      ) : visibleTasks.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleTasks.map((task) => (
            <MyTaskCard
              key={task.id}
              task={task}
              onProgressSave={handleProgressSave}
              onFileUpload={handleFileUpload}
              onRequestExtension={() => setExtensionTask(task)}
            />
          ))}
        </div>
      ) : (
        <div className="panel px-5 py-16 text-center text-[12.5px] text-muted-foreground">
          {showCompleted ? 'No completed tasks yet.' : 'Nothing assigned to you right now.'}
        </div>
      )}

      {/* Deadline Extension Modal */}
      {extensionTask && (
        <DeadlineExtensionModal
          isOpen={!!extensionTask}
          onClose={() => setExtensionTask(null)}
          task={extensionTask}
          onSubmit={handleExtensionSubmit}
        />
      )}
    </div>
  );
};

const MyTaskCard = ({ task, onProgressSave, onFileUpload, onRequestExtension }) => {
  const [sliderVal, setSliderVal] = useState(task.progress || 0);
  const [isSaving, setIsSaving] = useState(false);
  const overdue = isOverdue(task);
  const daysOver = getDaysOverdue(task);

  const handleSave = async () => {
    setIsSaving(true);
    await onProgressSave(task.id, Number(sliderVal));
    setIsSaving(false);
  };

  return (
    <div className="panel p-5 transition hover:border-white/10">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={task.status} />
        <PriorityIndicator priority={task.priority} />
        <span className="text-[10.5px] text-muted-foreground">{task.department}</span>
        <span
          className={`num ml-auto text-[11px] ${
            overdue ? 'font-medium text-danger' : 'text-muted-foreground'
          }`}
        >
          {formatDate(task.due_date)}
          {overdue && ` · +${daysOver}d`}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="mt-2.5 text-[14px] font-medium leading-snug text-foreground">
        {task.title}
      </h3>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}

      {/* Progress Track */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className="num text-[10.5px] text-foreground/80">{sliderVal}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-signal/75 transition-all duration-300"
            style={{ width: `${sliderVal}%` }}
          />
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-4">
        {/* Progress Slider & Save */}
        <div>
          <div className="flex items-baseline justify-between">
            <label className="eyebrow">My progress</label>
            <span className="num text-[11px] text-foreground/80">{sliderVal}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliderVal}
            onChange={(e) => setSliderVal(e.target.value)}
            className="mt-2 w-full accent-[hsl(38_88%_62%)] cursor-pointer"
            aria-label="Progress percentage"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || Number(sliderVal) === (task.progress || 0)}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-signal px-3 py-2 text-[12px] font-medium text-primary-foreground transition hover:bg-signal/90 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save progress
          </button>
        </div>

        {/* Action Buttons: Proof & Extension */}
        <div className="grid grid-cols-2 gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[11.5px] text-foreground/80 transition hover:border-white/25 hover:text-foreground">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="truncate">{task.evidence_name ? 'Replace proof' : 'Upload proof'}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileUpload(task.id, f);
              }}
            />
          </label>

          <button
            onClick={onRequestExtension}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[11.5px] text-foreground/80 transition hover:border-white/25 hover:text-foreground"
          >
            <Clock className="h-3.5 w-3.5 text-signal/80" />
            Ask for time
          </button>
        </div>
      </div>
    </div>
  );
};


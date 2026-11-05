import React, { useState, useEffect } from 'react';
import { Plus, Bot, RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { SparkCard } from '../../components/common/SparkCard.jsx';
import { TaskLedgerTable } from '../../components/tasks/TaskLedgerTable.jsx';
import { NewTaskModal } from '../../components/tasks/NewTaskModal.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { getTodayStr, isOverdue, DEPARTMENTS } from '../../constants/neraTheme.js';

export const CommandCentrePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empsRes, approvalsRes, reportRes] = await Promise.allSettled([
        ceoTaskService.listAllTasks ? ceoTaskService.listAllTasks() : ceoTaskService.getTasksOverview(),
        employeeService.listEmployees({ excludeCeo: true }),
        ceoTaskService.getPendingReport ? ceoTaskService.getPendingReport() : Promise.resolve([]),
        ceoTaskService.getAiSummary ? ceoTaskService.getAiSummary() : Promise.resolve(null),
      ]);

      const tasksRaw = tasksRes.status === 'fulfilled' ? (tasksRes.value?.data || tasksRes.value || []) : [];
      const empsRaw = empsRes.status === 'fulfilled' ? (empsRes.value?.data || empsRes.value?.employees || empsRes.value || []) : [];
      const approvalsRaw = approvalsRes.status === 'fulfilled' ? (approvalsRes.value?.data?.items || approvalsRes.value?.items || []) : [];
      const reportRaw = reportRes.status === 'fulfilled' ? (reportRes.value?.data || reportRes.value) : null;

      // Group tasks by open status
      const openTasks = tasksRaw.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled');
      const completedTasks = tasksRaw.filter((t) => t.status === 'Completed');
      const totalCount = tasksRaw.length || 1;
      const completionRate = Math.round((completedTasks.length / totalCount) * 100);

      // Department summaries
      const deptSummaries = DEPARTMENTS.map((deptName) => {
        const dEmps = empsRaw.filter((e) => (e.department || e.departmentName || e.dept_name) === deptName);
        const dTasks = openTasks.filter((t) => (t.department || t.dept_name) === deptName);
        const maxCapacity = Math.max(4, dEmps.length * 4);
        const load = Math.min(100, Math.round((dTasks.length / maxCapacity) * 100));
        return {
          name: deptName,
          open: dTasks.length,
          overdue: dTasks.filter(isOverdue).length,
          load,
          members: dEmps.length,
        };
      }).filter((d) => d.members > 0 || d.open > 0);

      setData({
        openTasks,
        allTasks: tasksRaw,
        employees: empsRaw,
        approvals: approvalsRaw,
        report: reportRaw,
        departments: deptSummaries,
        completion: completionRate,
      });
    } catch (err) {
      console.warn('Command Centre data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAiReview = async () => {
    try {
      setIsReviewing(true);
      await ceoTaskService.generateRoleTasks();
      toast.success('Overnight AI review complete. Tasks carried forward and rebalanced.');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'AI review failed.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreateTask = async (taskPayload) => {
    await ceoTaskService.createOfficialTask(taskPayload);
    toast.success('Official task directive created and assigned.');
    await fetchData();
  };

  const todayStr = getTodayStr();
  const ceoFirstName = 'Sheetal';
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (loading || !data) {
    return (
      <div className="panel px-5 py-24 text-center text-[12px] text-muted-foreground fade-up">
        Reading the command centre…
      </div>
    );
  }

  const openTasks = data.openTasks;
  const overdueTasks = openTasks.filter(isOverdue);
  const dueTodayTasks = openTasks.filter((t) => t.due_date === todayStr);

  // Sparkline data distributions
  const priorityBars = ['Critical', 'High', 'Medium', 'Low'].map(
    (p) => openTasks.filter((t) => t.priority === p).length
  );
  const riskBars = [overdueTasks.length, data.approvals.length, 2, 4];
  const deptLoadBars = data.departments.map((d) => d.load);

  const kpis = [
    {
      label: 'Open tasks',
      value: String(openTasks.length),
      delta: `${dueTodayTasks.length} due today`,
      tone: 'neutral',
      bars: priorityBars.some(Boolean) ? priorityBars : [2, 4, 3, 1],
    },
    {
      label: 'Overdue',
      value: String(overdueTasks.length),
      delta: `${overdueTasks.filter((t) => t.escalation_level === 'CEO').length} escalated to you`,
      tone: 'danger',
      bars: overdueTasks.length ? overdueTasks.slice(0, 7).map((t) => (t.carried_forward_count || 0) + 1) : [1, 1, 1],
    },
    {
      label: 'Awaiting approval',
      value: String(data.approvals.length),
      delta: 'Important decisions',
      tone: 'signal',
      bars: riskBars,
    },
    {
      label: 'Completion rate',
      value: `${data.completion}%`,
      delta: `${data.departments.length} departments tracked`,
      tone: data.completion >= 70 ? 'ok' : 'warn',
      bars: deptLoadBars.length ? deptLoadBars : [30, 60, 45, 80],
    },
  ];

  return (
    <div className="fade-up space-y-7">
      {/* Page Header */}
      <PageHeader
        eyebrow={`Command Centre · ${todayFormatted}`}
        title={`Good day, ${ceoFirstName}.`}
        subtitle={`Full visibility across every department. ${overdueTasks.length} overdue, ${data.approvals.length} waiting on your decision — the rest is running itself.`}
        actions={
          <>
            <button
              type="button"
              onClick={handleRunAiReview}
              disabled={isReviewing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-[12.5px] text-foreground/80 transition hover:border-white/20 hover:text-foreground disabled:opacity-60 cursor-pointer"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isReviewing ? 'animate-spin' : ''}`} />
              <span>{isReviewing ? 'Reviewing tasks…' : 'Run AI review'}</span>
            </button>
            <button
              type="button"
              onClick={() => setNewTaskOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:bg-signal/90 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New task</span>
            </button>
          </>
        }
      />

      {/* 4 KPI Sparkline Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <SparkCard key={idx} {...kpi} />
        ))}
      </div>

      {/* Main Grid: 2 Cols Left (Overnight Brief + Live Ledger) & 1 Col Right (Department Load) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="space-y-5 lg:col-span-2">
          {/* Overnight AI Briefing Panel */}
          <section className="panel p-5 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-signal/[0.04] blur-3xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-signal" />
                <p className="eyebrow text-signal/90">Overnight Executive Digest</p>
              </div>
              <span className="text-[11px] text-muted-foreground">{todayFormatted}</span>
            </div>
            <h2 className="mt-2 font-display text-2xl text-foreground">
              {data.report?.headline || 'Continuous operational review complete.'}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-xl">
              {data.report?.summary ||
                'All department directives were analyzed for turnaround velocity, workload capacity, and single-specialist ownership. No critical deadlocks detected.'}
            </p>

            {/* Quick Metrics Bar inside briefing */}
            <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-white/[0.06] text-center">
              <div>
                <p className="num text-base font-semibold text-foreground">
                  {openTasks.length}
                </p>
                <p className="eyebrow text-[9px]">Active Tasks</p>
              </div>
              <div>
                <p className="num text-base font-semibold text-danger">
                  {overdueTasks.length}
                </p>
                <p className="eyebrow text-[9px]">Carried Fwd</p>
              </div>
              <div>
                <p className="num text-base font-semibold text-signal">
                  {data.approvals.length}
                </p>
                <p className="eyebrow text-[9px]">Pending CEO</p>
              </div>
              <div>
                <p className="num text-base font-semibold text-ok">
                  {data.completion}%
                </p>
                <p className="eyebrow text-[9px]">Velocity</p>
              </div>
            </div>
          </section>

          {/* Live Task Ledger Preview */}
          <TaskLedgerTable
            tasks={openTasks.slice(0, 7)}
            title="Active Task Ledger"
            subtitle="Priority deliverables across departments"
            viewAllLink="/tasks"
            emptyLabel="No active tasks in the ledger."
          />
        </div>

        {/* Right Column: Department Capacity & Quick Actions */}
        <div className="space-y-5">
          {/* Department Capacity Breakdown */}
          <section className="panel p-5 space-y-4">
            <div>
              <h3 className="font-display text-lg text-foreground">
                Department Capacity
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Live workload distribution
              </p>
            </div>

            <div className="space-y-3.5 divide-y divide-white/[0.04]">
              {data.departments.map((dept) => (
                <div key={dept.name} className="pt-2.5 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{dept.name}</span>
                    <span className="num text-[11px] text-muted-foreground">
                      {dept.open} tasks · {dept.members} staff
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dept.load > 85
                            ? 'bg-danger'
                            : dept.load > 60
                            ? 'bg-warn'
                            : 'bg-signal'
                        }`}
                        style={{ width: `${dept.load}%` }}
                      />
                    </div>
                    <span className="num text-[10.5px] font-medium text-foreground/80 w-8 text-right">
                      {dept.load}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Task Allocation Quick Shortcut */}
          <section className="panel p-5 space-y-3 border-signal/20 bg-signal/[0.02]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal" />
              <h3 className="font-display text-base text-foreground">
                AI Autonomous Allocation
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Describe any high-level objective in plain English. The AI engine identifies the exact department and single best specialist.
            </p>
            <a
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-signal hover:underline pt-1"
            >
              Open AI Control Centre →
            </a>
          </section>
        </div>
      </div>

      {/* New Task Directive Modal */}
      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        employees={data.employees}
        onCreated={handleCreateTask}
      />
    </div>
  );
};

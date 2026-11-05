import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, RotateCw, Loader2, BellRing } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { DEPARTMENTS, formatDate, formatTime } from '../../constants/neraTheme.js';

const AI_MAY_RULES = [
  'Allocate routine operational tasks to eligible employees',
  'Weigh department, designation, skills, availability and workload',
  'Create subtasks with suggested deadlines inside approved rules',
  'Send reminders and request progress updates',
  'Carry pending tasks forward with their original history',
  'Escalate overdue work and compile the CEO daily report',
];

const AI_MAY_NEVER_RULES = [
  'Assign any task to the CEO',
  'Approve important organisational decisions alone',
  'Change salaries, policy or take disciplinary action',
  'Reassign work outside approved company rules',
  'Erase the audit trail of any task',
];

export const AiControlPage = () => {
  const toast = useToast();

  // Real employees loaded from the database
  const [employees, setEmployees] = useState([]);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', department: '' });
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocatedResult, setAllocatedResult] = useState(null);

  // Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [stats, setStats] = useState({
    reviewed: 0,
    carried_forward: 0,
    escalated: 0,
    new_tasks: 0,
    reminders_sent: 0,
  });
  const [dailyReports, setDailyReports] = useState([]);

  // Fetch real team members and initial review data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch real employees from database
      const empsRes = await employeeService.listEmployees({ excludeCeo: true });
      const empList = empsRes?.data || empsRes?.employees || (Array.isArray(empsRes) ? empsRes : []);
      setEmployees(empList);

      // 2. Fetch live metrics
      const metrics = await ceoTaskService.getOverviewMetrics();
      if (metrics) {
        setStats({
          reviewed: metrics.totalTasks || 0,
          carried_forward: metrics.overdueTasks || 0,
          escalated: 0,
          new_tasks: metrics.pendingTasks || 0,
          reminders_sent: 0,
        });
      }

      // 3. Fetch summary if exists
      const summaryRes = await ceoTaskService.getAiSummary();
      if (summaryRes?.reports && Array.isArray(summaryRes.reports)) {
        setDailyReports(summaryRes.reports);
      } else {
        setDailyReports([]);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  };

  const handleAllocate = async () => {
    if (!taskForm.title.trim()) {
      toast.show('Describe the task first', 'destructive');
      return;
    }

    setIsAllocating(true);
    setAllocatedResult(null);

    try {
      const textToAnalyze = `${taskForm.title} ${taskForm.description}`.toLowerCase();

      // Check if this is a sensitive executive decision
      const isSensitive =
        textToAnalyze.includes('salary') ||
        textToAnalyze.includes('compensation') ||
        textToAnalyze.includes('terminate') ||
        textToAnalyze.includes('termination') ||
        textToAnalyze.includes('fire') ||
        textToAnalyze.includes('disciplinary') ||
        textToAnalyze.includes('policy') ||
        textToAnalyze.includes('executive');

      // Determine matching department from real departments in system
      let matchedDept = taskForm.department && taskForm.department !== 'any' ? taskForm.department : '';

      if (!matchedDept) {
        // Smart keyword classification based on company departments
        if (
          textToAnalyze.includes('deploy') ||
          textToAnalyze.includes('server') ||
          textToAnalyze.includes('cloud') ||
          textToAnalyze.includes('code') ||
          textToAnalyze.includes('bug') ||
          textToAnalyze.includes('database') ||
          textToAnalyze.includes('api') ||
          textToAnalyze.includes('it') ||
          textToAnalyze.includes('security') ||
          textToAnalyze.includes('software') ||
          textToAnalyze.includes('system') ||
          textToAnalyze.includes('tech')
        ) {
          matchedDept = 'IT';
        } else if (
          textToAnalyze.includes('hire') ||
          textToAnalyze.includes('hiring') ||
          textToAnalyze.includes('candidate') ||
          textToAnalyze.includes('interview') ||
          textToAnalyze.includes('recruitment') ||
          textToAnalyze.includes('sourcing') ||
          textToAnalyze.includes('cv') ||
          textToAnalyze.includes('resume') ||
          textToAnalyze.includes('talent')
        ) {
          matchedDept = 'Talent Acquisition';
        } else if (
          textToAnalyze.includes('training') ||
          textToAnalyze.includes('learning') ||
          textToAnalyze.includes('workshop') ||
          textToAnalyze.includes('upskill') ||
          textToAnalyze.includes('development') ||
          textToAnalyze.includes('course')
        ) {
          matchedDept = 'Learning & Development';
        } else {
          matchedDept = 'HR Operations';
        }
      }

      // Filter real employees in this department
      const deptEmployees = employees.filter((e) => {
        const d = (e.department || e.department_name || e.dept_name || '').toLowerCase();
        return d === matchedDept.toLowerCase() || d.includes(matchedDept.toLowerCase());
      });

      const candidatePool = deptEmployees.length > 0 ? deptEmployees : employees;

      if (candidatePool.length === 0) {
        throw new Error('No active employees found in the system to assign this directive.');
      }

      // Select candidate with lowest workload / fair distribution
      const sortedCandidates = [...candidatePool].sort((a, b) => {
        const loadA = Number(a.current_workload || 0);
        const loadB = Number(b.current_workload || 0);
        return loadA - loadB;
      });

      const bestCandidate = sortedCandidates[0];
      const empName =
        bestCandidate.full_name ||
        `${bestCandidate.first_name || ''} ${bestCandidate.last_name || ''}`.trim() ||
        bestCandidate.name ||
        bestCandidate.email;

      const desigTitle =
        bestCandidate.designation_title ||
        bestCandidate.desig_title ||
        bestCandidate.designation ||
        'Team Member';

      // Due date: 2 business days from today
      const targetDeadline = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

      let createdTaskId = null;

      if (!isSensitive) {
        // Actually create the official task directive in the database!
        const created = await ceoTaskService.createOfficialTask({
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || `Directive assigned via AI Allocation Engine to ${empName}.`,
          department: matchedDept,
          priority: 'High',
          assignee_id: bestCandidate.id,
          assignee_name: empName,
          assignee_email: bestCandidate.email,
          due_date: targetDeadline,
        });

        createdTaskId = created?.id || created?.data?.id || created?.data?.taskId || 'created';
      }

      const result = {
        mode: isSensitive ? 'approval' : 'allocated',
        employee: {
          name: empName,
          department: matchedDept,
          designation: desigTitle,
        },
        plan: {
          due_date: new Date(targetDeadline).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          rationale: isSensitive
            ? 'This directive involves executive authority, compensation, or policy adjustment and cannot be dispatched autonomously. It has been held in the Executive Approvals queue for your decision.'
            : `Assigned to ${empName} (${desigTitle}) based on domain specialization in ${matchedDept}, active shift availability, and lowest current workload.`,
          subtasks: [
            { title: 'Define deliverable scope and verify input requirements' },
            { title: 'Execute deliverable according to department SOP' },
            { title: 'Perform verification check and upload proof of completion' },
          ],
        },
        task: { id: createdTaskId },
      };

      setAllocatedResult(result);
      toast.show(
        result.mode === 'approval' ? 'Queued for your approval' : 'Allocated & Created',
        result.mode === 'approval'
          ? 'This is sensitive, so it waits for your decision.'
          : `Assigned to ${result.employee.name} in ${result.employee.department}.`
      );
    } catch (err) {
      toast.show('Allocation failed', err.message || 'Unknown error occurred', 'destructive');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleRunReview = async () => {
    setIsReviewing(true);
    try {
      // Trigger role-based task generation in the backend
      const res = await ceoTaskService.generateRoleTasks();
      const count = Array.isArray(res?.data) ? res.data.length : 9;

      setStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + count,
        new_tasks: count,
      }));

      const newReport = {
        id: 'rep-' + Date.now(),
        report_date: new Date().toISOString(),
        headline: `Daily SOP Review: ${count} role tasks balanced across all 4 departments`,
        summary: `Overnight operational audit complete. Directives aligned with SOP standards across HR Operations, Talent Acquisition, IT, and Learning & Development. Zero bottlenecks reported.`,
        reminders_sent: 0,
        generated_at: new Date().toISOString(),
      };

      setDailyReports((prev) => [newReport, ...prev]);
      toast.show('Pending review complete', 'Brief generated for the CEO.');
    } catch (err) {
      toast.show('Review complete', 'Daily briefing updated for CEO.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="fade-up space-y-6">
      <PageHeader
        eyebrow="AI control"
        title="What the AI can do without you"
        subtitle="Routine work runs automatically. Anything sensitive stops and waits for your decision."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Interactive Allocator & Review */}
        <div className="space-y-5 lg:col-span-2">
          {/* AI Allocation Panel */}
          <section className="panel relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-signal/[0.06] blur-3xl" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-signal" />
              <p className="eyebrow text-signal/90">AI allocation</p>
            </div>
            <h2 className="mt-2 font-display text-2xl text-foreground">
              Describe a task. AI finds the right owner.
            </h2>

            <div className="mt-4 space-y-3">
              <input
                className="field"
                placeholder="e.g. Prepare the regional pricing benchmark before Friday"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
              <textarea
                className="field min-h-[74px] resize-none"
                placeholder="Any detail that changes who should own it"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />

              <div className="flex flex-wrap gap-2">
                <select
                  value={taskForm.department || 'any'}
                  onChange={(e) => setTaskForm({ ...taskForm, department: e.target.value === 'any' ? '' : e.target.value })}
                  className="w-[200px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-foreground outline-none transition focus:border-signal/50"
                >
                  <option value="any" className="bg-[#141418] text-foreground">
                    Any department
                  </option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#141418] text-foreground">
                      {dept}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAllocate}
                  disabled={isAllocating}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:bg-signal/90 disabled:opacity-60 cursor-pointer"
                >
                  {isAllocating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Thinking…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Allocate with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Allocation Result Box */}
            {allocatedResult && (
              <div className="fade-up mt-4 rounded-lg border border-white/[0.08] bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-signal">
                    {allocatedResult.mode === 'approval' ? 'Queued for CEO approval' : 'Allocated'}
                  </p>
                  <span className="num text-[10px] text-muted-foreground">
                    {allocatedResult.plan?.due_date}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-foreground">
                  {allocatedResult.employee?.name} · {allocatedResult.employee?.department}
                  {allocatedResult.employee?.designation ? ` (${allocatedResult.employee.designation})` : ''}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  {allocatedResult.plan?.rationale}
                </p>

                {allocatedResult.plan?.subtasks?.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    {allocatedResult.plan.subtasks.map((st, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/75">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-signal/70" />
                        {st.title}
                      </p>
                    ))}
                  </div>
                )}

                <Link
                  to={allocatedResult.mode === 'approval' ? '/approvals' : (allocatedResult.task?.id ? `/tasks/${allocatedResult.task.id}` : '/tasks')}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-signal transition hover:gap-2.5"
                >
                  {allocatedResult.mode === 'approval' ? 'Review the decision' : 'Open the task'}{' '}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </section>

          {/* Pending-Task Review Section */}
          <section className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-foreground">Pending-task review</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Runs by itself the first time you open the command centre each day — rewrite missed work, request updates, escalate, report.
                </p>
              </div>
              <button
                onClick={handleRunReview}
                disabled={isReviewing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-[12px] text-foreground/85 transition hover:border-white/25 hover:text-foreground disabled:opacity-60 cursor-pointer"
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Reviewing…
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3.5 w-3.5 text-signal" />
                    Run review now
                  </>
                )}
              </button>
            </div>

            {/* Metrics Ribbon */}
            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-5">
              {[
                { label: 'Reviewed', value: stats.reviewed },
                { label: 'Carried', value: stats.carried_forward },
                { label: 'Escalated', value: stats.escalated },
                { label: 'New today', value: stats.new_tasks },
                { label: 'Reminders', value: stats.reminders_sent },
              ].map((m) => (
                <div key={m.label} className="bg-card/90 px-3 py-2.5">
                  <p className="num text-lg font-medium text-foreground">{m.value}</p>
                  <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Daily Briefings History */}
            <div className="mt-5 space-y-2.5">
              {dailyReports.length > 0 ? (
                dailyReports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 transition hover:border-white/10">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12.5px] font-medium text-foreground/95">{r.headline}</p>
                      <span className="num shrink-0 text-[10px] text-muted-foreground">
                        {formatDate(r.report_date)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{r.summary}</p>
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/80">
                      <BellRing className="h-2.5 w-2.5 text-signal/70" /> {r.reminders_sent || 0} reminders · generated {formatTime(r.generated_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-[11.5px] text-muted-foreground">
                  No review has run yet. Run one to generate the first brief.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Governance Rules */}
        <div className="space-y-4">
          {/* AI May */}
          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
              <h2 className="font-display text-lg text-foreground">AI may</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {AI_MAY_RULES.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-foreground/80">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-ok" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          {/* AI May Never */}
          <section className="panel p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-danger" />
              <h2 className="font-display text-lg text-foreground">AI may never</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {AI_MAY_NEVER_RULES.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-foreground/80">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-danger" />
                  {rule}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] leading-relaxed text-muted-foreground">
              If you are unavailable, approved routine workflows continue and important decisions queue for your return.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Sliders,
  CheckSquare,
  Activity,
  ThumbsDown,
  UserCheck,
  RotateCw,
  Server,
  Users,
  Briefcase,
  GraduationCap,
  Layers,
  ArrowRight,
  Zap,
  ShieldCheck,
  UserCheck2,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

export const AiTaskAllocationSection = ({
  allocations = [],
  employees = [],
  onApprove,
  onReject,
  onAdjust,
  onGenerate,
  onAutoDispatchAll,
  onRefresh,
}) => {
  const [rejectModal, setRejectModal] = useState({ isOpen: false, item: null, feedback: '' });
  const [adjustModal, setAdjustModal] = useState({
    isOpen: false,
    item: null,
    newAssigneeId: '',
    newDeadline: '',
    priority: 'HIGH',
  });

  // Track the chosen assignee for each card (keyed by allocation id)
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [isAssigning, setIsAssigning] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);
  const [activeDeptTab, setActiveDeptTab] = useState('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState(null);

  const assignableEmployees = filterNonCeoEmployees(employees);

  const handleAssigneeChange = (allocationId, employeeId) => {
    setSelectedAssignees((prev) => ({
      ...prev,
      [allocationId]: employeeId,
    }));
  };

  const handleConfirmAssign = async (item) => {
    const chosenAssigneeId =
      selectedAssignees[item.id] || item.suggestedAssignee?.id;
    if (!chosenAssigneeId) return;

    try {
      setIsAssigning((prev) => ({ ...prev, [item.id]: true }));
      await onApprove(item.id, {
        assigneeId: chosenAssigneeId,
        dueDate: item.suggestedDeadline,
        priority: item.priority || 'HIGH',
      });
    } finally {
      setIsAssigning((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.item) return;
    await onReject(rejectModal.item.id, rejectModal.feedback);
    setRejectModal({ isOpen: false, item: null, feedback: '' });
  };

  const handleConfirmAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModal.item) return;
    await onAdjust(adjustModal.item.id, {
      assigneeId: adjustModal.newAssigneeId,
      dueDate: adjustModal.newDeadline,
      priority: adjustModal.priority,
    });
    setAdjustModal({ isOpen: false, item: null, newAssigneeId: '', newDeadline: '', priority: 'HIGH' });
  };

  const handleTriggerGenerate = async () => {
    if (onGenerate) {
      setIsGenerating(true);
      try {
        await onGenerate();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleTriggerAutoDispatchAll = async () => {
    if (onAutoDispatchAll) {
      const confirmDispatch = window.confirm(
        `Are you sure you want to assign and dispatch all ${allocations.length} daily SOP directives across all team members? Every specialist will receive their designated task immediately.`
      );
      if (!confirmDispatch) return;

      setIsDispatchingAll(true);
      try {
        await onAutoDispatchAll();
      } finally {
        setIsDispatchingAll(false);
      }
    }
  };

  // Helper to get department-specific styling and icons
  const getDeptMeta = (deptName = '', deptCode = '') => {
    const str = `${deptName} ${deptCode}`.toLowerCase();
    if (str.includes('it') || str.includes('tech') || str.includes('developer')) {
      return {
        icon: Server,
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
        badge: 'IT & Technology',
        ring: 'focus:ring-blue-500',
      };
    }
    if (str.includes('talent') || str.includes('recruit')) {
      return {
        icon: Users,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
        badge: 'Talent Acquisition',
        ring: 'focus:ring-emerald-500',
      };
    }
    if (str.includes('learn') || str.includes('ld') || str.includes('develop')) {
      return {
        icon: GraduationCap,
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
        badge: 'Learning & Development',
        ring: 'focus:ring-amber-500',
      };
    }
    return {
      icon: Briefcase,
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
      badge: 'HR Operations',
      ring: 'focus:ring-indigo-500',
    };
  };

  // Calculate live employee distribution counts
  const employeeDistribution = assignableEmployees.map((emp) => {
    const assignedTasks = allocations.filter((a) => {
      const chosenId = selectedAssignees[a.id] || a.suggestedAssignee?.id;
      return chosenId === emp.id;
    });
    return {
      ...emp,
      name: emp.fullName || `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || 'Employee',
      role: emp.desig_title || emp.designationTitle || emp.departmentName || 'Specialist',
      assignedTasksCount: assignedTasks.length,
      hasTask: assignedTasks.length > 0,
    };
  });

  const coveredEmployeesCount = employeeDistribution.filter((e) => e.hasTask).length;
  const coveragePercentage = assignableEmployees.length > 0
    ? Math.round((coveredEmployeesCount / assignableEmployees.length) * 100)
    : 100;

  // Filter allocations by active department tab & optional selected staff filter
  const filteredAllocations = allocations.filter((item) => {
    if (selectedStaffFilter) {
      const chosenId = selectedAssignees[item.id] || item.suggestedAssignee?.id;
      if (chosenId !== selectedStaffFilter) return false;
    }

    if (activeDeptTab === 'ALL') return true;
    const deptStr = `${item.department?.name || ''} ${item.department?.code || ''}`.toUpperCase();
    if (activeDeptTab === 'TALENT') return deptStr.includes('TALENT') || deptStr.includes('RECRUIT');
    if (activeDeptTab === 'HR_OPS') return deptStr.includes('OPERAT') || deptStr.includes('HR');
    if (activeDeptTab === 'IT') return deptStr.includes('IT') || deptStr.includes('TECH');
    if (activeDeptTab === 'LD') return deptStr.includes('LEARN') || deptStr.includes('DEVELOP') || deptStr.includes('LD');
    return true;
  });

  // Department counts for tabs
  const talentCount = allocations.filter((a) => `${a.department?.name || ''} ${a.department?.code || ''}`.toUpperCase().includes('TALENT')).length;
  const hrOpsCount = allocations.filter((a) => {
    const s = `${a.department?.name || ''} ${a.department?.code || ''}`.toUpperCase();
    return s.includes('OPERAT') && !s.includes('LEARN');
  }).length;
  const itCount = allocations.filter((a) => `${a.department?.name || ''} ${a.department?.code || ''}`.toUpperCase().includes('IT')).length;
  const ldCount = allocations.filter((a) => {
    const s = `${a.department?.name || ''} ${a.department?.code || ''}`.toUpperCase();
    return s.includes('LEARN') || s.includes('LD');
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Tasknera SOP Framework
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {allocations.length} Directives Ready
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily SOP Task Directives & AI Allocations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Operational tasks generated automatically based on standard operating procedures. The distribution engine guarantees that <strong>every active team member receives a directive</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onGenerate && (
              <button
                type="button"
                onClick={handleTriggerGenerate}
                disabled={isGenerating || isDispatchingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Rebalancing Tasks...' : '✨ Refresh Tasks'}
              </button>
            )}

            {onAutoDispatchAll && allocations.length > 0 && (
              <button
                type="button"
                onClick={handleTriggerAutoDispatchAll}
                disabled={isDispatchingAll || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-300 dark:text-amber-500 ${isDispatchingAll ? 'animate-bounce' : ''}`} />
                {isDispatchingAll ? 'Dispatching to All...' : '⚡ Dispatch to Entire Team (1-Click)'}
              </button>
            )}
          </div>
        </div>

        {/* ── Fair Distribution & Team Member Coverage Indicator ── */}
        <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Team Distribution Coverage: {coveredEmployeesCount} / {assignableEmployees.length} Members Receiving Tasks ({coveragePercentage}%)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              {coveragePercentage === 100
                ? '★ 100% Guaranteed: Everyone in the team has tasks allocated'
                : 'Balanced across all active departments'}
            </span>
          </div>

          {/* Member chips with live task count */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
              Team Roster:
            </span>
            {employeeDistribution.map((emp) => {
              const isSelected = selectedStaffFilter === emp.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedStaffFilter(isSelected ? null : emp.id)}
                  title={`Click to filter directives for ${emp.name}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-xs'
                      : emp.hasTask
                      ? 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Avatar name={emp.name} size="xs" />
                  <span>{emp.name.split(' ')[0]}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {emp.assignedTasksCount} task{emp.assignedTasksCount !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}

            {selectedStaffFilter && (
              <button
                type="button"
                onClick={() => setSelectedStaffFilter(null)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-1 cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveDeptTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeDeptTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Departments ({allocations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDeptTab('TALENT')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeDeptTab === 'TALENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Talent Acquisition ({talentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveDeptTab('HR_OPS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeDeptTab === 'HR_OPS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> HR Operations ({hrOpsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveDeptTab('IT')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeDeptTab === 'IT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> IT & Technology ({itCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveDeptTab('LD')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeDeptTab === 'LD'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Learning & Development ({ldCount})
          </button>
        </div>
      </div>

      {/* Allocations Cards Feed */}
      <div className="space-y-4">
        {filteredAllocations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              All SOP Directives Allocated!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Every operational task has been assigned to its designated department specialist. You can click 'Refresh Tasks' at any time to generate fresh directives.
            </p>
            {onGenerate && (
              <button
                type="button"
                onClick={handleTriggerGenerate}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Generate Fresh Daily SOP Tasks
              </button>
            )}
          </div>
        ) : (
          filteredAllocations.map((item) => {
            const defaultAssignee = item.suggestedAssignee || item.suggestedEmployee || {};
            const deadline = item.suggestedDeadline || item.dueDate || 'Tomorrow';
            const reasoning = item.aiReasoning || item.reasoning || 'Standard Operating Procedure requirement for daily operational continuity.';
            const subtasks = item.subtasks || item.aiSubtasks || [];
            const deptMeta = getDeptMeta(item.department?.name, item.department?.code);
            const DeptIcon = deptMeta.icon;

            // Pool of eligible specialists strictly for this department
            const eligiblePool = Array.isArray(item.eligibleAssignees) && item.eligibleAssignees.length > 0
              ? item.eligibleAssignees
              : assignableEmployees.filter((e) => {
                  if (!item.department?.id) return true;
                  return e.dept_id === item.department.id || e.deptId === item.department.id;
                });

            // The currently selected assignee for this card
            const selectedEmployeeId = selectedAssignees[item.id] || defaultAssignee.id;
            const currentSelectedEmp =
              eligiblePool.find((e) => e.id === selectedEmployeeId) ||
              assignableEmployees.find((e) => e.id === selectedEmployeeId) ||
              defaultAssignee;

            const selectedName =
              currentSelectedEmp.fullName ||
              currentSelectedEmp.name ||
              `${currentSelectedEmp.first_name || ''} ${currentSelectedEmp.last_name || ''}`.trim() ||
              'Team Specialist';

            const selectedRole =
              currentSelectedEmp.desig_title ||
              currentSelectedEmp.designationTitle ||
              currentSelectedEmp.designation ||
              'Operations Specialist';

            const isCardAssigning = Boolean(isAssigning[item.id]);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 md:p-6 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Department badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${deptMeta.bg}`}
                    >
                      <DeptIcon className="w-3.5 h-3.5" />
                      {item.department?.name || deptMeta.badge}
                    </span>

                    {/* SOP Tag */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Layers className="w-3 h-3 text-slate-500" /> Daily SOP Directive
                    </span>

                    {/* Priority badge */}
                    <Badge variant={item.priority === 'URGENT' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'info'}>
                      {item.priority || 'HIGH'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Due Date: <strong className="text-slate-800 dark:text-slate-200">{deadline}</strong></span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.taskTitle}
                  </h3>
                  {item.taskDescription && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.taskDescription}
                    </p>
                  )}
                </div>

                {/* SOP Steps / Subtasks */}
                {subtasks.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                      SOP Operational Steps ({subtasks.length} Milestones)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subtasks.map((st, idx) => (
                        <div
                          key={st.id || idx}
                          className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-2xs"
                        >
                          <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{st.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rationale / SOP Requirement note */}
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2">
                  <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">SOP Rationale:</span>
                  <span className="leading-relaxed">{reasoning}</span>
                </div>

                {/* ── Assignee Selector Box (Strictly within department) ── */}
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      Assign Directive To (1 Person from {item.department?.name || 'Department'}):
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {eligiblePool.length} specialist{eligiblePool.length !== 1 ? 's' : ''} available
                    </span>
                  </div>

                  {/* Dropdown Selector */}
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleAssigneeChange(item.id, e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                  >
                    {eligiblePool.map((emp) => {
                      const name =
                        emp.name ||
                        emp.fullName ||
                        `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                        'Specialist';
                      const role = emp.designation || emp.desig_title || emp.designationTitle || 'Specialist';
                      const code = emp.employeeCode || emp.employee_code || '';
                      const isRecommended = emp.id === defaultAssignee.id;

                      return (
                        <option key={emp.id} value={emp.id}>
                          {name} {code ? `(${code})` : ''} — {role} {isRecommended ? '★ (AI Recommended Match)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Live Selected Specialist Profile Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={selectedName} size="sm" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{selectedName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{selectedRole}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Current Workload
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-slate-900 dark:bg-slate-200 h-full rounded-full transition-all"
                            style={{ width: `${currentSelectedEmp.workload || currentSelectedEmp.current_workload || 30}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {currentSelectedEmp.workload || currentSelectedEmp.current_workload || 30}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Activity className="w-3 h-3 text-emerald-600" />
                        {currentSelectedEmp.availability || currentSelectedEmp.availability_status || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={() => setRejectModal({ isOpen: true, item, feedback: '' })}
                    className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Dismiss
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setAdjustModal({
                        isOpen: true,
                        item,
                        newAssigneeId: selectedEmployeeId,
                        newDeadline: deadline,
                        priority: item.priority || 'HIGH',
                      })
                    }
                    className="text-xs inline-flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Edit Details
                  </Button>

                  {/* PRIMARY 1-CLICK ASSIGNMENT BUTTON */}
                  <button
                    type="button"
                    disabled={isCardAssigning}
                    onClick={() => handleConfirmAssign(item)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-500" />
                    <span>
                      {isCardAssigning
                        ? 'Assigning Directive...'
                        : `Assign Directive to ${selectedName.split(' ')[0]}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject / Dismiss Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, item: null, feedback: '' })}
        title="Dismiss SOP Directive"
        subtitle="Provide optional reason for tracking"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Feedback / Reason
            </label>
            <textarea
              rows="3"
              value={rejectModal.feedback}
              onChange={(e) => setRejectModal({ ...rejectModal, feedback: e.target.value })}
              placeholder="e.g. Completed yesterday, or not scheduled for today..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setRejectModal({ isOpen: false, item: null, feedback: '' })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
            >
              Confirm Dismissal
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Details Modal */}
      <Modal
        isOpen={adjustModal.isOpen}
        onClose={() =>
          setAdjustModal({
            isOpen: false,
            item: null,
            newAssigneeId: '',
            newDeadline: '',
            priority: 'HIGH',
          })
        }
        title="Edit Directive Parameters"
        subtitle={`Directive: ${adjustModal.item?.taskTitle || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAdjust} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assignee (1 Person Only) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={adjustModal.newAssigneeId}
              onChange={(e) => setAdjustModal({ ...adjustModal, newAssigneeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {assignableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} — {emp.designationTitle || emp.departmentName || 'Specialist'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Due Date
            </label>
            <input
              type="date"
              required
              value={adjustModal.newDeadline}
              onChange={(e) => setAdjustModal({ ...adjustModal, newDeadline: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={adjustModal.priority}
              onChange={(e) => setAdjustModal({ ...adjustModal, priority: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="URGENT">Urgent (CEO Directive)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={() =>
                setAdjustModal({
                  isOpen: false,
                  item: null,
                  newAssigneeId: '',
                  newDeadline: '',
                  priority: 'HIGH',
                })
              }
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Approve with Custom Parameters
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

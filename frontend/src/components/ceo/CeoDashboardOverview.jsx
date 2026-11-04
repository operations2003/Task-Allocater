import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Building2,
  Users,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';

export const CeoDashboardOverview = ({
  metrics = {},
  departmentPerformance = [],
  employeeProgress = [],
  aiSummary = {},
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="p-1 rounded bg-slate-100 text-slate-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.totalTasks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all departments</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {metrics.completedTasks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">{metrics.completionRate ?? 0}%</span> completion
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
            <div className="p-1 rounded bg-blue-50 text-blue-600">
              <PlayCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.inProgressTasks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Currently active</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {metrics.pendingTasks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Waiting to start</p>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Overdue</span>
            <div className="p-1 rounded bg-rose-50 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {metrics.overdueTasks ?? 0}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">Past due date</p>
        </div>

        {/* Approvals */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('approvals')}
          className="bg-slate-900 text-white rounded-xl p-4 shadow-xs hover:bg-slate-800 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Approvals</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.awaitingCeoApprovalCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires review</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <Sparkles className="w-3 h-3 text-slate-600" />
                Team Summary
              </span>
              <span className="text-xs text-slate-400">
                Updated today
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {aiSummary.summaryText ||
                'Team progress is on track. Most tasks are advancing steadily. Recommended actions below highlight items that may need reassignment or deadline review.'}
            </p>

            {aiSummary.keyRiskAreas && aiSummary.keyRiskAreas.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Needs Attention:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiSummary.keyRiskAreas.map((risk, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="w-full lg:w-64 bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 shrink-0">
            <div className="text-xs font-semibold text-slate-700">
              Quick Navigation
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('ai-allocation')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200"
              >
                <span>Suggested Allocations</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('pending')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200"
              >
                <span>Pending Tasks</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('approvals')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 rounded-md transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-slate-200"
              >
                <span>Pending Approvals</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Department Performance + Employee Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Department Performance
              </h3>
            </div>
            <span className="text-xs text-slate-400">Completion rate</span>
          </div>

          <div className="space-y-3.5">
            {departmentPerformance.map((dept) => {
              const rate = dept.completionRate || Math.round((dept.completed / (dept.totalTasks || 1)) * 100);
              return (
                <div key={dept.deptId || dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{dept.name}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-500">
                        {dept.completed}/{dept.totalTasks} done
                      </span>
                      {dept.overdue > 0 && (
                        <span className="text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                          {dept.overdue} overdue
                        </span>
                      )}
                      <span className="font-semibold text-slate-900 w-8 text-right">{rate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate >= 75
                          ? 'bg-emerald-500'
                          : rate >= 40
                          ? 'bg-slate-700'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Employee Workload */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Team Workload
              </h3>
            </div>
            <span className="text-xs text-slate-400">Active tasks</span>
          </div>

          <div className="divide-y divide-slate-100">
            {employeeProgress.slice(0, 5).map((emp) => (
              <div key={emp.employeeId || emp.name} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={emp.name} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {emp.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {emp.designation || emp.department}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="text-right">
                    <div className="font-medium text-slate-800">
                      {emp.activeTasks} tasks
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {emp.onTimeRate}% on-time
                    </div>
                  </div>

                  <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        emp.workloadIndex > 85 ? 'bg-rose-500' : emp.workloadIndex > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${emp.workloadIndex}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

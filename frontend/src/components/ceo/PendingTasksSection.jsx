import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Calendar,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';

export const PendingTasksSection = ({ report = {} }) => {
  const [activeSubTab, setActiveSubTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'CARRIED' | 'NO_UPDATE'

  const metrics = report.metrics || {
    totalDelayed: 5,
    previousDayIncomplete: 3,
    carriedForward: 4,
    missingUpdatesCount: 2,
  };

  const records = report.records || [];

  const filteredRecords = records.filter((r) => {
    if (activeSubTab === 'ALL') return true;
    if (activeSubTab === 'OVERDUE') return r.delayDays > 0;
    if (activeSubTab === 'CARRIED') return r.delayDays >= 2;
    if (activeSubTab === 'NO_UPDATE') return !r.hasRecentUpdate;
    return true;
  });

  const handleExportCSV = () => {
    if (!records.length) return;
    const headers = [
      'Task Title',
      'Assignee',
      'Department',
      'Original Due Date',
      'Current Due Date',
      'Delay',
      'Progress %',
      'Notes',
      'Status',
    ];
    const rows = records.map((r) => [
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      r.originalDeadline,
      r.currentDeadline,
      `"${r.delayDuration}"`,
      `${r.progressPercentage}%`,
      `"${(r.reasonForDelay || '').replace(/"/g, '""')}"`,
      r.escalationStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pending_Tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Total Overdue
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{metrics.totalDelayed}</div>
          <p className="text-[11px] text-slate-400 mt-1">Past due date</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Carried Forward
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics.carriedForward}</div>
          <p className="text-[11px] text-slate-400 mt-1">Moved from previous days</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Incomplete Yesterday
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{metrics.previousDayIncomplete}</div>
          <p className="text-[11px] text-slate-400 mt-1">Still open today</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Needs Update
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{metrics.missingUpdatesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">No progress in 48h</p>
        </div>
      </div>

      {/* Pending Tasks Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pending & Delayed Tasks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review tasks that have passed their deadline or need follow-up.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All Pending' },
            { id: 'OVERDUE', label: 'Overdue Only' },
            { id: 'CARRIED', label: 'Carried Forward (2+ days)' },
            { id: 'NO_UPDATE', label: 'Needs Progress Update' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-3">Assignee</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Delay</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No pending tasks under this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Task Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={r.title}>
                        {r.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Created: {r.createdAt}
                      </div>
                    </td>

                    {/* Employee & Dept */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{r.department}</div>
                    </td>

                    {/* Deadlines */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <div>Current: <span className="font-medium">{r.currentDeadline}</span></div>
                      {r.originalDeadline !== r.currentDeadline && (
                        <div className="text-[10px] text-slate-400">
                          Original: {r.originalDeadline}
                        </div>
                      )}
                    </td>

                    {/* Delay */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-rose-600">
                        {r.delayDuration}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="w-20 space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                          <span>{r.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.progressPercentage >= 70 ? 'bg-emerald-500' : 'bg-slate-800'
                            }`}
                            style={{ width: `${r.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-[11px] text-slate-600 line-clamp-2" title={r.reasonForDelay}>
                        {r.reasonForDelay || '—'}
                      </div>
                      {!r.hasRecentUpdate && (
                        <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                          No recent update in 48h
                        </span>
                      )}
                    </td>

                    {/* Escalation Badge */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <Badge variant={r.escalationStatus === 'ESCALATED' ? 'danger' : 'neutral'}>
                        {r.escalationStatus === 'ESCALATED' ? 'Attention Needed' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

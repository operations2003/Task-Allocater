import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Sliders,
  Clock,
  Search,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { TaskProgressUpdateModal } from './TaskProgressUpdateModal.jsx';
import { DeadlineExtensionModal } from './DeadlineExtensionModal.jsx';

export const EmployeeTaskView = ({
  tasks = [],
  currentUser,
  onUpdateProgress,
  onRequestExtension,
}) => {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'
  const [search, setSearch] = useState('');
  const [progressModalTask, setProgressModalTask] = useState(null);
  const [extensionModalTask, setExtensionModalTask] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks belonging specifically to this employee
  const myTasks = tasks.filter((t) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    const dueDateStr = t.due_date ? String(t.due_date).split('T')[0] : '';
    const isCompleted = t.status === 'COMPLETED';
    const isOverdue = t.is_overdue || (dueDateStr && dueDateStr < todayStr && !isCompleted);
    const isToday = dueDateStr === todayStr && !isCompleted;
    const isUpcoming = dueDateStr > todayStr && !isCompleted;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'TODAY') return isToday;
    if (activeTab === 'UPCOMING') return isUpcoming;
    if (activeTab === 'OVERDUE') return isOverdue;
    if (activeTab === 'COMPLETED') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>My Tasks</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {myTasks.length} tasks
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View assigned work, log progress, and request deadline adjustments.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'TODAY', label: "Due Today" },
          { id: 'UPCOMING', label: 'Upcoming' },
          { id: 'OVERDUE', label: 'Overdue' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Tasks in this View</h3>
            <p className="text-xs text-slate-400 mt-1">You are up to date on all items for this filter.</p>
          </div>
        ) : (
          myTasks.map((t) => {
            const isCompleted = t.status === 'COMPLETED';
            const isOverdue =
              t.is_overdue ||
              (t.due_date && String(t.due_date).split('T')[0] < todayStr && !isCompleted);

            return (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {t.status || 'TODO'}
                    </span>
                    <Badge variant={t.priority === 'URGENT' ? 'danger' : 'neutral'}>
                      {t.priority || 'MEDIUM'}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2" title={t.title}>
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1" title={t.description}>
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-800">{t.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (t.progress || 0) >= 100
                            ? 'bg-emerald-500'
                            : (t.progress || 0) >= 50
                            ? 'bg-slate-800'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${t.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline Info */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {t.due_date ? String(t.due_date).split('T')[0] : 'No deadline'}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProgressModalTask(t)}
                    className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Update Progress
                  </button>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => setExtensionModalTask(t)}
                      className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Request Extension"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <TaskProgressUpdateModal
        isOpen={!!progressModalTask}
        onClose={() => setProgressModalTask(null)}
        task={progressModalTask}
        onSubmit={onUpdateProgress}
      />

      <DeadlineExtensionModal
        isOpen={!!extensionModalTask}
        onClose={() => setExtensionModalTask(null)}
        task={extensionModalTask}
        onSubmit={onRequestExtension}
      />
    </div>
  );
};

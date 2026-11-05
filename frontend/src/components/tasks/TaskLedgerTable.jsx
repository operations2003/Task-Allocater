import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, AlertTriangle } from 'lucide-react';
import { StatusPill } from '../common/StatusPill.jsx';
import { PriorityIndicator } from '../common/PriorityIndicator.jsx';
import { formatDate, isOverdue, getDaysOverdue, getInitials } from '../../constants/neraTheme.js';

export const TaskLedgerTable = ({
  tasks = [],
  title = 'Task ledger',
  subtitle = 'Every department · live status',
  viewAllLink = '/tasks',
  emptyLabel = 'No tasks found.',
  className = '',
}) => {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="font-display text-lg text-foreground">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-white/20 hover:text-foreground"
          >
            All tasks →
          </Link>
        )}
      </div>

      {/* Rows */}
      {tasks.length === 0 ? (
        <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] text-xs">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            const daysOverdue = getDaysOverdue(task);
            const assigneeName = task.assigned_to_name || task.assigneeName || 'Unassigned';
            const assigneeInitials = getInitials(assigneeName);
            const isAi = task.initiated_by === 'AI' || task.assigned_by === 'AI';

            return (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="group flex flex-col gap-2.5 px-5 py-3.5 transition-colors hover:bg-white/[0.025] sm:grid sm:grid-cols-[2fr_1.2fr_1fr_100px_90px] sm:items-center sm:gap-3"
              >
                {/* Col 1: Title & Meta */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isAi && (
                      <Bot
                        className="h-3 w-3 shrink-0 text-signal/90"
                        title="Allocated by AI"
                      />
                    )}
                    <p className="truncate text-[13px] text-foreground/90 transition group-hover:text-foreground font-medium">
                      {task.title}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <PriorityIndicator priority={task.priority} />
                    <span className="text-white/15">·</span>
                    <span className="text-[10.5px] text-muted-foreground">
                      {task.department || 'Operations'}
                    </span>
                    {task.escalation_level && task.escalation_level !== 'None' && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                          task.escalation_level === 'CEO' ? 'text-danger' : 'text-warn'
                        }`}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>{task.escalation_level} escalation</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Col 2: Assignee */}
                <div className="flex items-center gap-2 sm:block">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] text-foreground/80 sm:hidden">
                    {assigneeInitials}
                  </span>
                  <p className="truncate text-[12px] text-foreground/80">
                    {assigneeName}
                  </p>
                </div>

                {/* Col 3: Due Date */}
                <div className="sm:block">
                  <p className={`text-[11.5px] ${overdue ? 'text-danger font-medium' : 'text-muted-foreground'}`}>
                    {formatDate(task.due_date)}
                    {overdue && (
                      <span className="ml-1.5 text-[10px] font-bold">
                        +{daysOverdue}d
                      </span>
                    )}
                  </p>
                  {task.carried_forward_count > 0 && (
                    <p className="text-[9.5px] text-muted-foreground/80">
                      carried {task.carried_forward_count}×
                    </p>
                  )}
                </div>

                {/* Col 4: Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-signal/70 transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                  <span className="num text-[10px] text-muted-foreground font-medium">
                    {task.progress || 0}%
                  </span>
                </div>

                {/* Col 5: Status */}
                <div className="sm:text-right">
                  <StatusPill status={task.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

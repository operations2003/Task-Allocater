import React, { useState } from 'react';
import {
  Plus,
  ShieldCheck,
  Sparkles,
  Calendar,
  Trash2,
  CheckCircle2,
  RotateCcw,
  History,
  ArrowRightLeft,
  CheckSquare,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { CeoTaskCreateModal } from './CeoTaskCreateModal.jsx';
import { TaskAuditTrailModal } from './TaskAuditTrailModal.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

export const CeoTaskManagement = ({
  tasks = [],
  employees = [],
  departments = [],
  onCreateTask,
  onUpdateStatus,
  onReassignTask,
  onModifyDeadline,
  onChangePriority,
  onDeleteTask,
  onReopenTask,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAuditTask, setSelectedAuditTask] = useState(null);

  // Reassignment Modal State
  const [reassignModal, setReassignModal] = useState({ isOpen: false, task: null, newAssigneeId: '', reason: '' });
  // Deadline Modal State
  const [deadlineModal, setDeadlineModal] = useState({ isOpen: false, task: null, newDate: '', reason: '' });
  // Delete Dialog State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, task: null });
  // Reopen Dialog State
  const [reopenModal, setReopenModal] = useState({ isOpen: false, task: null, reason: '' });

  // Filter out CEO from assignee options
  const assignableEmployees = filterNonCeoEmployees(employees);

  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!reassignModal.newAssigneeId) return;
    await onReassignTask(reassignModal.task.id, reassignModal.newAssigneeId, reassignModal.reason);
    setReassignModal({ isOpen: false, task: null, newAssigneeId: '', reason: '' });
  };

  const handleConfirmDeadline = async (e) => {
    e.preventDefault();
    if (!deadlineModal.newDate) return;
    await onModifyDeadline(deadlineModal.task.id, deadlineModal.newDate, deadlineModal.reason);
    setDeadlineModal({ isOpen: false, task: null, newDate: '', reason: '' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.task) return;
    await onDeleteTask(deleteConfirm.task.id);
    setDeleteConfirm({ isOpen: false, task: null });
  };

  const handleConfirmReopen = async (e) => {
    e.preventDefault();
    if (!reopenModal.task) return;
    await onReopenTask(reopenModal.task.id, { reason: reopenModal.reason });
    setReopenModal({ isOpen: false, task: null, reason: '' });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Company Tasks</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {tasks.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View, assign, and manage deliverables across all teams.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-3">Assignee</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const assigneeName =
                    task.assignee_first
                      ? `${task.assignee_first} ${task.assignee_last || ''}`.trim()
                      : task.assigneeName || 'Assigned Staff';
                  const dept = task.assignee_dept_name || task.department_name || task.department || 'Operations';
                  const isOverdue =
                    task.is_overdue ||
                    (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED');
                  const isAi = task.assigned_by === 'AI' || task.is_ai_assigned;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Description */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={task.title}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 truncate" title={task.description}>
                            {task.description}
                          </div>
                        )}
                        {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                            <CheckSquare className="w-3 h-3 text-slate-400" />
                            <span>
                              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Assignee & Dept */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{assigneeName}</div>
                        <div className="text-[10px] text-slate-400">{dept}</div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isAi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            <Sparkles className="w-2.5 h-2.5 text-slate-500" /> AI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            <ShieldCheck className="w-2.5 h-2.5 text-slate-500" /> Executive
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={task.priority || 'MEDIUM'}
                          onChange={(e) => onChangePriority && onChangePriority(task.id, e.target.value)}
                          className="text-[11px] font-medium rounded px-2 py-0.5 border border-slate-200 bg-white cursor-pointer text-slate-700"
                        >
                          <option value="URGENT">Urgent</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className={`font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {task.due_date ? String(task.due_date).split('T')[0] : 'No date'}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-semibold block">Overdue</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700'
                              : task.status === 'BLOCKED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.status || 'TODO'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Reassign */}
                          <button
                            type="button"
                            title="Reassign Task"
                            onClick={() =>
                              setReassignModal({
                                isOpen: true,
                                task,
                                newAssigneeId: task.assignee_id || '',
                                reason: '',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Deadline */}
                          <button
                            type="button"
                            title="Change Due Date"
                            onClick={() =>
                              setDeadlineModal({
                                isOpen: true,
                                task,
                                newDate: task.due_date ? String(task.due_date).split('T')[0] : '',
                                reason: '',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Complete / Reopen */}
                          {task.status === 'COMPLETED' ? (
                            <button
                              type="button"
                              title="Reopen Task"
                              onClick={() => setReopenModal({ isOpen: true, task, reason: '' })}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Mark as Complete"
                              onClick={() => onUpdateStatus && onUpdateStatus(task.id, 'COMPLETED')}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Activity History */}
                          <button
                            type="button"
                            title="View Activity History"
                            onClick={() => setSelectedAuditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete Task"
                            onClick={() => setDeleteConfirm({ isOpen: true, task })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Creation Modal */}
      <CeoTaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateTask}
        employees={employees}
        departments={departments}
      />

      {/* Reassignment Modal */}
      <Modal
        isOpen={reassignModal.isOpen}
        onClose={() => setReassignModal({ isOpen: false, task: null, newAssigneeId: '', reason: '' })}
        title="Reassign Task"
        subtitle={`Task: ${reassignModal.task?.title || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReassign} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Assignee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={reassignModal.newAssigneeId}
              onChange={(e) => setReassignModal({ ...reassignModal, newAssigneeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="">Select team member</option>
              {assignableEmployees.map((emp) => {
                const name = emp.fullName || `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || emp.name || 'Employee';
                const role = emp.desig_title || emp.designationTitle || emp.departmentName || emp.dept_name || 'Staff';
                return (
                  <option key={emp.id} value={emp.id}>
                    {name} — {role}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note (optional)
            </label>
            <textarea
              rows="2"
              value={reassignModal.reason}
              onChange={(e) => setReassignModal({ ...reassignModal, reason: e.target.value })}
              placeholder="Reason for reassignment..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setReassignModal({ isOpen: false, task: null, newAssigneeId: '', reason: '' })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modify Deadline Modal */}
      <Modal
        isOpen={deadlineModal.isOpen}
        onClose={() => setDeadlineModal({ isOpen: false, task: null, newDate: '', reason: '' })}
        title="Change Due Date"
        subtitle={`Task: ${deadlineModal.task?.title || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmDeadline} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={deadlineModal.newDate}
              onChange={(e) => setDeadlineModal({ ...deadlineModal, newDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note (optional)
            </label>
            <textarea
              rows="2"
              value={deadlineModal.reason}
              onChange={(e) => setDeadlineModal({ ...deadlineModal, reason: e.target.value })}
              placeholder="Reason for change..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setDeadlineModal({ isOpen: false, task: null, newDate: '', reason: '' })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Update Due Date
            </button>
          </div>
        </form>
      </Modal>

      {/* Reopen Task Modal */}
      <Modal
        isOpen={reopenModal.isOpen}
        onClose={() => setReopenModal({ isOpen: false, task: null, reason: '' })}
        title="Reopen Task"
        subtitle={`Task: ${reopenModal.task?.title || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReopen} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for reopening <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows="3"
              value={reopenModal.reason}
              onChange={(e) => setReopenModal({ ...reopenModal, reason: e.target.value })}
              placeholder="What still needs to be completed?"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setReopenModal({ isOpen: false, task: null, reason: '' })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Reopen Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, task: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm.task?.title}"?`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Activity History Modal */}
      <TaskAuditTrailModal
        isOpen={!!selectedAuditTask}
        onClose={() => setSelectedAuditTask(null)}
        task={selectedAuditTask}
      />
    </div>
  );
};

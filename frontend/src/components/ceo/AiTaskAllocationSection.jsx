import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Sliders,
  CheckSquare,
  Activity,
  ThumbsUp,
  ThumbsDown,
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
}) => {
  const [rejectModal, setRejectModal] = useState({ isOpen: false, item: null, feedback: '' });
  const [adjustModal, setAdjustModal] = useState({
    isOpen: false,
    item: null,
    newAssigneeId: '',
    newDeadline: '',
    priority: 'HIGH',
  });

  const assignableEmployees = filterNonCeoEmployees(employees);

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Suggested Allocations</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {allocations.length} pending review
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Recommended assignments based on team member capacity, existing tasks, and skills.
          </p>
        </div>
      </div>

      {/* Allocations Cards */}
      <div className="space-y-4">
        {allocations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">All Suggestions Reviewed</h3>
            <p className="text-xs text-slate-400 mt-1">There are no pending recommendations at this time.</p>
          </div>
        ) : (
          allocations.map((item) => {
            const assignee = item.suggestedAssignee || item.suggestedEmployee || {};
            const deadline = item.suggestedDeadline || item.dueDate || 'Flexible';
            const reasoning = item.aiReasoning || item.reasoning || 'Matched based on relevant department and skills.';
            const subtasks = item.aiSubtasks || item.subtasks || [];

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      <Sparkles className="w-2.5 h-2.5 text-slate-500" /> Suggested Task
                    </span>
                    <Badge variant={item.priority === 'URGENT' ? 'danger' : 'warning'}>
                      {item.priority || 'HIGH'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Date: <strong>{deadline}</strong></span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.taskTitle}</h3>
                  {item.taskDescription && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.taskDescription}
                    </p>
                  )}
                </div>

                {/* Assignee Card */}
                <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={assignee.name} size="sm" />
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Suggested For
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {assignee.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {assignee.designation || assignee.department || 'Specialist'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Workload
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-800 h-full rounded-full" style={{ width: `${assignee.workload || 45}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {assignee.workload || 45}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                      Availability
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <Activity className="w-3 h-3 text-emerald-500" />
                      {assignee.availability || 'Available'}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-200">
                  <span className="font-semibold text-slate-900">Why this match: </span>
                  <span>{reasoning}</span>
                </div>

                {/* Subtasks */}
                {subtasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Included Steps:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subtasks.map((st, idx) => (
                        <div
                          key={st.id || idx}
                          className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 text-xs text-slate-700"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setAdjustModal({
                        isOpen: true,
                        item,
                        newAssigneeId: assignee.id,
                        newDeadline: deadline,
                        priority: item.priority || 'HIGH',
                      })
                    }
                    className="text-xs inline-flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Edit Details
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setRejectModal({ isOpen: true, item, feedback: '' })}
                    className="text-xs text-slate-600 hover:text-rose-600"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Dismiss
                  </Button>

                  <button
                    type="button"
                    onClick={() => onApprove(item.id, item)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Approve Task
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, item: null, feedback: '' })}
        title="Dismiss Recommendation"
        subtitle="Optional reason for feedback"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback
            </label>
            <textarea
              rows="3"
              value={rejectModal.feedback}
              onChange={(e) => setRejectModal({ ...rejectModal, feedback: e.target.value })}
              placeholder="e.g. Needs to be assigned to someone else..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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

      {/* Adjust Allocation Modal */}
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
        title="Edit Task Details"
        subtitle={`Task: ${adjustModal.item?.taskTitle || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmAdjust} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={adjustModal.newAssigneeId}
              onChange={(e) => setAdjustModal({ ...adjustModal, newAssigneeId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              {assignableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} — {emp.designationTitle || emp.departmentName || 'Operations'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={adjustModal.newDeadline}
              onChange={(e) => setAdjustModal({ ...adjustModal, newDeadline: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={adjustModal.priority}
              onChange={(e) => setAdjustModal({ ...adjustModal, priority: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
              Approve with Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

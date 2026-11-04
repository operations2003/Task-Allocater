import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

const DEFAULT_COMPANY_EMPLOYEES = [
  { id: 'emp-aarav-1', first_name: 'Aarav', last_name: 'Sharma', desig_title: 'Lead Software Architect', dept_id: 'dept-eng', dept_name: 'Engineering & Technology' },
  { id: 'emp-priya-2', first_name: 'Priya', last_name: 'Patel', desig_title: 'Senior Software Engineer', dept_id: 'dept-eng', dept_name: 'Engineering & Technology' },
  { id: 'emp-rohan-3', first_name: 'Rohan', last_name: 'Verma', desig_title: 'Lead Product Manager', dept_id: 'dept-prod', dept_name: 'Product & Design' },
  { id: 'emp-ananya-4', first_name: 'Ananya', last_name: 'Iyer', desig_title: 'Head of Operations', dept_id: 'dept-ops', dept_name: 'Global Operations' },
  { id: 'emp-kabir-5', first_name: 'Kabir', last_name: 'Mehta', desig_title: 'Enterprise Sales Director', dept_id: 'dept-sales', dept_name: 'Enterprise Sales & Growth' },
  { id: 'emp-sneha-6', first_name: 'Sneha', last_name: 'Kapoor', desig_title: 'Growth Marketing Lead', dept_id: 'dept-mktg', dept_name: 'Brand & Marketing' },
];

const DEFAULT_COMPANY_DEPARTMENTS = [
  { id: 'dept-eng', name: 'Engineering & Technology' },
  { id: 'dept-prod', name: 'Product & Design' },
  { id: 'dept-ops', name: 'Global Operations' },
  { id: 'dept-sales', name: 'Enterprise Sales & Growth' },
  { id: 'dept-mktg', name: 'Brand & Marketing' },
  { id: 'dept-fin', name: 'Finance & Strategy' },
];

export const CeoTaskCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  departments = [],
}) => {
  const activeEmployees = Array.isArray(employees) && employees.length > 0 ? employees : DEFAULT_COMPANY_EMPLOYEES;
  const activeDepartments = Array.isArray(departments) && departments.length > 0 ? departments : DEFAULT_COMPANY_DEPARTMENTS;

  // Filter out CEO so they never appear in assignee dropdown
  const nonCeoStaff = filterNonCeoEmployees(activeEmployees);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    deptId: '',
    priority: 'HIGH',
    dueDate: '',
  });

  const [subtasks, setSubtasks] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Department-filtered staff pool
  const filteredAssignees = nonCeoStaff.filter((emp) => {
    if (!formData.deptId) return true;
    const empDept = emp.dept_id || emp.deptId || emp.department_id;
    return empDept === formData.deptId || emp.dept_name === formData.deptId;
  });

  const handleSubtaskChange = (index, value) => {
    const updated = [...subtasks];
    updated[index] = value;
    setSubtasks(updated);
  };

  const addSubtaskField = () => {
    setSubtasks([...subtasks, '']);
  };

  const removeSubtaskField = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    if (!formData.assigneeId) {
      setError('Please select an assignee.');
      return;
    }

    if (!formData.dueDate) {
      setError('Please specify a due date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const filteredSubtasks = subtasks
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title, idx) => ({ id: `sub-${Date.now()}-${idx}`, title, completed: false }));

      await onSubmit({
        ...formData,
        subtasks: filteredSubtasks,
        isOfficial: true,
        assignedBy: 'CEO',
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        assigneeId: '',
        deptId: '',
        priority: 'HIGH',
        dueDate: '',
      });
      setSubtasks(['']);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      subtitle="Assign a task to any team member"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Update infrastructure documentation"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key deliverables, requirements, or links..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        {/* 2-column Grid: Department & Assignee (with Optgroups) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <select
              value={formData.deptId}
              onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="">All Departments</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id || dept.dept_id} value={dept.id || dept.dept_id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign to <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.assigneeId}
              onChange={(e) => {
                const emp = activeEmployees.find((x) => x.id === e.target.value);
                setFormData({
                  ...formData,
                  assigneeId: e.target.value,
                  deptId: emp?.dept_id || emp?.deptId || formData.deptId,
                });
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="">Select team member</option>
              {activeDepartments.map((dept) => {
                const deptId = dept.id || dept.dept_id;
                const members = filteredAssignees.filter(
                  (e) => (e.dept_id || e.deptId) === deptId || e.dept_name === dept.name
                );
                if (members.length === 0) return null;

                return (
                  <optgroup key={deptId} label={dept.name}>
                    {members.map((emp) => {
                      const name = emp.fullName || `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || 'Employee';
                      const desig = emp.desig_title || emp.designationTitle || emp.designation?.title || emp.dept_name || emp.departmentName || '';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {name} {desig ? `— ${desig}` : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}

              {/* Members without explicit department */}
              {filteredAssignees.filter((e) => !e.dept_id && !e.deptId && !e.dept_name).length > 0 && (
                <optgroup label="General Staff">
                  {filteredAssignees
                    .filter((e) => !e.dept_id && !e.deptId && !e.dept_name)
                    .map((emp) => {
                      const name = emp.fullName || `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || 'Employee';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {name}
                        </option>
                      );
                    })}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* 2-column Grid: Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Subtasks (optional)
            </label>
            <button
              type="button"
              onClick={addSubtaskField}
              className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subtask
            </button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {subtasks.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold w-4 text-center">{idx + 1}.</span>
                <input
                  type="text"
                  value={st}
                  onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}...`}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
                {subtasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubtaskField(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Calendar, AlertCircle, Users, Tag, Clock, Building2 } from 'lucide-react';
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

  // CRITICAL BUSINESS RULE: Filter out CEO so they NEVER appear in assignee dropdown
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
      setError('Please select an operational employee to assign this task.');
      return;
    }

    if (!formData.dueDate) {
      setError('Please specify a due date for this directive.');
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
      setError(err.message || 'Failed to issue official task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Official Organisational Task"
      subtitle="Direct executive assignment across company departments"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* CEO Directive Banner & Assigner Identification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 text-brand-800 dark:text-brand-200 text-xs">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>
              <strong>Official Executive Directive:</strong> As CEO, tasks assigned here bypass reporting hierarchies and are issued company-wide with highest priority visibility.
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                CEO
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Assigned By (Task Issuer)
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Vikram Malhotra</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    Chief Executive Officer
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
              Executive Authority
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Task Directive Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Conduct Q4 Security Architecture & Encryption Key Audit"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Directive Scope & Deliverables
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detail objectives, acceptance criteria, sensitive constraints, or dependencies..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* 2-column Grid: Target Department & Assignee (with Department Breakdown Optgroups) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Target Department
            </label>
            <select
              value={formData.deptId}
              onChange={(e) => {
                const newDeptId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  deptId: newDeptId,
                  // Reset assignee if they belong to a different department
                  assigneeId: prev.assigneeId,
                }));
              }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All / Cross-Department</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id || dept.dept_id} value={dept.id || dept.dept_id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Assign To (Team Member) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-medium text-slate-400 normal-case">
                {filteredAssignees.length} Available Staff
              </span>
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
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select Team Member to Execute Directive</option>
              
              {/* Department-Categorized Breakdown */}
              {activeDepartments.map((dept) => {
                const deptMembers = filteredAssignees.filter((emp) => {
                  const empDept = emp.dept_id || emp.deptId || emp.department_id;
                  const deptId = dept.id || dept.dept_id;
                  return empDept === deptId || (emp.dept_name && emp.dept_name === dept.name);
                });

                if (deptMembers.length === 0) return null;

                return (
                  <optgroup key={dept.id || dept.name} label={`── ${dept.name} ──`}>
                    {deptMembers.map((emp) => {
                      const name = emp.fullName || `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || emp.name || 'Employee';
                      const desig = emp.desig_title || emp.designationTitle || emp.designation?.title || 'Specialist';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {name} — {desig}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}

              {/* Staff without direct department mapping */}
              {filteredAssignees.filter((e) => !e.dept_id && !e.deptId && !e.dept_name).length > 0 && (
                <optgroup label="── General Operational Staff ──">
                  {filteredAssignees.filter((e) => !e.dept_id && !e.deptId && !e.dept_name).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* 2-column Grid: Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="URGENT">Urgent (CEO Directive)</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Structured Milestone Subtasks */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Operational Subtasks & Milestones
            </label>
            <button
              type="button"
              onClick={addSubtaskField}
              className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subtask
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {subtasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={task}
                  onChange={(e) => handleSubtaskChange(index, e.target.value)}
                  placeholder={`Milestone #${index + 1} specification...`}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {subtasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubtaskField(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Issuing Directive...' : 'Issue Official Directive'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

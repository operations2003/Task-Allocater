import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeService } from '../../services/employeeService.js';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

export const CeoTaskCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  employees: employeesProp = [],
  departments: departmentsProp = [],
}) => {
  const { user } = useAuth();

  // Self-fetch employees & departments if the parent hasn't passed them yet
  const [localEmployees, setLocalEmployees] = useState([]);
  const [localDepartments, setLocalDepartments] = useState([]);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!isOpen) return; // only fetch when modal opens

    const loadData = async () => {
      try {
        const [empRes, deptRes] = await Promise.allSettled([
          employeeService.listEmployees({ excludeCeo: true }),
          employeeService.listDepartments(),
        ]);

        if (empRes.status === 'fulfilled') {
          const rawEmps =
            empRes.value?.data ||
            empRes.value?.employees ||
            (Array.isArray(empRes.value) ? empRes.value : []);
          setLocalEmployees(filterNonCeoEmployees(rawEmps));
        }

        if (deptRes.status === 'fulfilled') {
          const rawDepts = Array.isArray(deptRes.value?.data)
            ? deptRes.value.data
            : Array.isArray(deptRes.value)
            ? deptRes.value
            : [];
          setLocalDepartments(rawDepts);
        }
      } catch (err) {
        console.warn('CeoTaskCreateModal: failed to self-fetch data', err);
        setFetchError('Could not load staff list. Please close and try again.');
      }
    };

    loadData();
  }, [isOpen]);

  // Use props if they have data, otherwise use locally fetched data
  const activeEmployees =
    Array.isArray(employeesProp) && employeesProp.length > 0
      ? employeesProp
      : localEmployees;

  const activeDepartments =
    Array.isArray(departmentsProp) && departmentsProp.length > 0
      ? departmentsProp
      : localDepartments;

  // CRITICAL BUSINESS RULE: CEO must NEVER appear in assignee dropdown
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

  // Reset form state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', description: '', assigneeId: '', deptId: '', priority: 'HIGH', dueDate: '' });
      setSubtasks(['']);
      setError('');
      setFetchError('');
    }
  }, [isOpen]);

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

  const addSubtaskField = () => setSubtasks([...subtasks, '']);

  const removeSubtaskField = (index) =>
    setSubtasks(subtasks.filter((_, i) => i !== index));

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

      setFormData({ title: '', description: '', assigneeId: '', deptId: '', priority: 'HIGH', dueDate: '' });
      setSubtasks(['']);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to issue official task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CEO display name (dynamic from auth context)
  const ceoName = user
    ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || 'CEO'
    : 'CEO';

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
              <strong>Official Executive Directive:</strong> As CEO, tasks assigned here bypass reporting
              hierarchies and are issued company-wide with highest priority visibility.
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
                  <span>{ceoName}</span>
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

        {/* Error Messages */}
        {(error || fetchError) && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error || fetchError}</span>
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

        {/* 2-column Grid: Target Department & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department Filter */}
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
                  assigneeId: '', // reset assignee when dept changes
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

          {/* Assignee Dropdown — Department-Categorized */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>
                Assign To (Team Member) <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 normal-case">
                {filteredAssignees.length} Available
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
              <option value="">
                {nonCeoStaff.length === 0
                  ? 'Loading staff...'
                  : 'Select Operational Assignee'}
              </option>

              {/* Group employees by department */}
              {activeDepartments.map((dept) => {
                const deptId = dept.id || dept.dept_id;
                const deptMembers = filteredAssignees.filter((emp) => {
                  const empDept = emp.dept_id || emp.deptId || emp.department_id;
                  return empDept === deptId || (emp.dept_name && emp.dept_name === dept.name);
                });

                if (deptMembers.length === 0) return null;

                return (
                  <optgroup key={deptId} label={`── ${dept.name} ──`}>
                    {deptMembers.map((emp) => {
                      const name =
                        emp.fullName ||
                        `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() ||
                        emp.name ||
                        'Employee';
                      const desig =
                        emp.desig_title ||
                        emp.designationTitle ||
                        emp.designation?.title ||
                        'Specialist';
                      return (
                        <option key={emp.id} value={emp.id}>
                          {name} — {desig}
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}

              {/* Staff without department mapping (fallback) */}
              {filteredAssignees.filter(
                (e) => !e.dept_id && !e.deptId && !e.dept_name && !e.department_id
              ).length > 0 && (
                <optgroup label="── General Staff ──">
                  {filteredAssignees
                    .filter((e) => !e.dept_id && !e.deptId && !e.dept_name && !e.department_id)
                    .map((emp) => (
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

        {/* Subtasks */}
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

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, AlertCircle, Sparkles, Bot, Layers, CheckSquare } from 'lucide-react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { employeeService } from '../../services/employeeService.js';
import { ceoTaskService } from '../../services/ceoTaskService.js';
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
  const [sopCatalog, setSopCatalog] = useState([]);
  const [selectedSopCode, setSelectedSopCode] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!isOpen) return; // only fetch when modal opens

    const loadData = async () => {
      try {
        const [empRes, deptRes, catalogRes] = await Promise.allSettled([
          employeeService.listEmployees({ excludeCeo: true }),
          employeeService.listDepartments(),
          ceoTaskService.getRoleTaskCatalog(),
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

        if (catalogRes.status === 'fulfilled') {
          const rawCatalog = Array.isArray(catalogRes.value?.data)
            ? catalogRes.value.data
            : Array.isArray(catalogRes.value)
            ? catalogRes.value
            : [];
          setSopCatalog(rawCatalog);
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
    assigneeId: '', // Default: empty string = AI Auto-Allocation
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
      setFormData({
        title: '',
        description: '',
        assigneeId: '',
        deptId: '',
        priority: 'HIGH',
        dueDate: '',
      });
      setSelectedSopCode('');
      setSubtasks(['']);
      setError('');
      setFetchError('');
    }
  }, [isOpen]);

  // Handle selecting an item from the SOP catalog
  const handleSelectSopBlueprint = (sopCode) => {
    setSelectedSopCode(sopCode);
    if (!sopCode) return;

    const blueprint = sopCatalog.find((b) => (b.sopCode || b.title) === sopCode);
    if (!blueprint) return;

    setFormData((prev) => ({
      ...prev,
      title: blueprint.title,
      description: blueprint.description,
      deptId: blueprint.deptId || prev.deptId,
      priority: blueprint.priority || 'HIGH',
    }));

    if (Array.isArray(blueprint.subtasks) && blueprint.subtasks.length > 0) {
      setSubtasks(blueprint.subtasks);
    }
  };

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
      setError('Please provide a directive title or pick an SOP task.');
      return;
    }

    try {
      setIsSubmitting(true);
      const filteredSubtasks = subtasks
        .map((s) => s.trim())
        .filter(Boolean)
        .map((title, idx) => ({ id: `sub-${Date.now()}-${idx}`, title, completed: false }));

      // If user left assignee blank, it triggers AI Auto-Allocation to 1 department member
      await onSubmit({
        ...formData,
        assigneeId: formData.assigneeId || 'AUTO',
        subtasks: filteredSubtasks,
        isOfficial: true,
        assignedBy: 'CEO',
      });

      setFormData({ title: '', description: '', assigneeId: '', deptId: '', priority: 'HIGH', dueDate: '' });
      setSubtasks(['']);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to issue task directive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CEO display name (dynamic from auth context)
  const ceoName = user
    ? `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || 'CEO (Sheetal Bedi)'
    : 'CEO (Sheetal Bedi)';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Organizational Task Directive"
      subtitle="Select a pre-configured SOP directive or specify your directive requirements"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* CEO Directive Banner & Assigner Identification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 text-xs">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              <strong>Role-Based Generation Active:</strong> Pick any pre-configured directive from the SOP catalog below, or define a new directive. The system isolates assignment strictly to 1 team member of the chosen department.
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                CEO
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Task Issuer (CEO Authority)
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{ceoName}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    Chief Executive Officer
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:block">
              Executive Directives
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

        {/* ── Pre-Configured SOP Catalog Picker ── */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
          <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ✨ Select from Daily SOP Catalog (Auto-fills title, scope, department & subtasks):
          </label>
          <select
            value={selectedSopCode}
            onChange={(e) => handleSelectSopBlueprint(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="">-- Custom Task Directive (or pick from 18 SOP tasks below) --</option>
            {sopCatalog.map((item) => (
              <option key={item.sopCode || item.title} value={item.sopCode || item.title}>
                [{item.deptName || item.deptCode}] {item.sopCode ? `${item.sopCode}: ` : ''}{item.title}
              </option>
            ))}
          </select>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Work on new project deployment"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description & Scope
          </label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe deliverables, requirements or technical scope..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* 2-column Grid: Target Department & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department <span className="text-slate-400 font-normal">(Assignment strictly within department)</span>
            </label>
            <select
              value={formData.deptId}
              onChange={(e) => {
                const newDeptId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  deptId: newDeptId,
                  assigneeId: '', // Reset to auto-assign 1 person in the newly selected department
                }));
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">All Departments (Auto-detect department)</option>
              {activeDepartments.map((dept) => (
                <option key={dept.id || dept.dept_id} value={dept.id || dept.dept_id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Selection (Strictly 1 Person) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Assign To (1 Person Only)</span>
              <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 normal-case flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 1 Specialist
              </span>
            </label>
            <select
              value={formData.assigneeId}
              onChange={(e) => {
                const emp = activeEmployees.find((x) => x.id === e.target.value);
                setFormData({
                  ...formData,
                  assigneeId: e.target.value,
                  deptId: emp?.dept_id || emp?.deptId || formData.deptId,
                });
              }}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">
                {formData.deptId
                  ? `✨ Auto-Assign 1 person from ${activeDepartments.find((d) => (d.id || d.dept_id) === formData.deptId)?.name || 'this department'} (AI Recommended)`
                  : '✨ Auto-Assign 1 optimal person (AI selects department & specialist)'}
              </option>

              {/* Group employees by department for optional manual single-person override */}
              {activeDepartments
                .filter((dept) => !formData.deptId || (dept.id || dept.dept_id) === formData.deptId)
                .map((dept) => {
                  const deptId = dept.id || dept.dept_id;
                  const deptMembers = filteredAssignees.filter((emp) => {
                    const empDept = emp.dept_id || emp.deptId || emp.department_id;
                    return empDept === deptId || (emp.dept_name && emp.dept_name === dept.name);
                  });

                  if (deptMembers.length === 0) return null;

                  return (
                    <optgroup key={deptId} label={`── ${dept.name} Specialists (Select 1) ──`}>
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
            </select>
          </div>
        </div>

        {/* 2-column Grid: Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="URGENT">Urgent (CEO Directive)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date <span className="text-slate-400 font-normal">(Optional — defaults to tomorrow)</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subtasks & Milestones ({subtasks.filter(Boolean).length} configured)
            </label>
            <button
              type="button"
              onClick={addSubtaskField}
              className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 font-medium cursor-pointer"
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
                  placeholder={`Milestone ${idx + 1}...`}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {isSubmitting
              ? 'Allocating with AI...'
              : formData.assigneeId
              ? 'Create Task'
              : 'Create & Auto-Assign with AI'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import { getTodayStr, DEPARTMENTS, PRIORITIES } from '../../constants/neraTheme.js';

export const NewTaskModal = ({
  open,
  onOpenChange,
  employees = [],
  onCreated,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Operations',
    priority: 'High',
    assignee: '',
    due_date: getTodayStr(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignee) {
      setError('A task title and an assignee are required.');
      return;
    }

    const selectedEmp = employees.find((emp) => emp.id === formData.assignee);
    if (!selectedEmp) return;

    try {
      setIsSubmitting(true);
      setError('');
      await onCreated({
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department,
        priority: formData.priority,
        assignee_id: selectedEmp.id,
        assignee_name: selectedEmp.full_name || `${selectedEmp.first_name || ''} ${selectedEmp.last_name || ''}`.trim(),
        assignee_email: selectedEmp.email,
        due_date: formData.due_date,
      });

      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create task directive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[hsl(240_6%_7%)] text-foreground p-6 shadow-2xl space-y-5 fade-up">
        {/* Header */}
        <div>
          <h2 className="font-display text-2xl font-normal text-foreground">
            New organisational task
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            CEO authority · assign to anyone, across any department.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="eyebrow block">Task title</label>
            <input
              type="text"
              required
              className="field mt-1.5"
              placeholder="e.g. Finalise Q4 board pack"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="eyebrow block">Detail</label>
            <textarea
              className="field mt-1.5 min-h-[76px] resize-none"
              placeholder="What exactly needs to be delivered?"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* 2-Col: Department & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block">Department</label>
              <select
                className="field mt-1.5"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-background text-foreground">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow block">Priority</label>
              <select
                className="field mt-1.5"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-background text-foreground">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Col: Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block">Assignee</label>
              <select
                required
                className="field mt-1.5"
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
              >
                <option value="" className="bg-background text-muted-foreground">
                  Choose employee
                </option>
                {employees.map((emp) => {
                  const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name;
                  const dept = emp.department || emp.departmentName || 'General';
                  return (
                    <option key={emp.id} value={emp.id} className="bg-background text-foreground">
                      {name} · {dept}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="eyebrow block">Due date</label>
              <input
                type="date"
                required
                className="field mt-1.5"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:bg-signal/90 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Creating task…' : 'Create task directive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


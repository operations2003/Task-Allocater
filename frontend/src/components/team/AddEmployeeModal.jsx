import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { DEPARTMENTS, SENIORITY_LEVELS, AVAILABILITY_STATUSES } from '../../constants/neraTheme.js';

export const AddEmployeeModal = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: 'Operations',
    designation: '',
    seniority: 'Mid',
    availability: 'Available',
    capacity_hours: 40,
    skills: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.designation.trim()) {
      setError('Name, email, and designation are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onCreated({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        seniority: formData.seniority,
        availability: formData.availability,
        capacity_hours: Number(formData.capacity_hours) || 40,
        skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to add employee.');
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
            Add team member
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            New specialists are factored into AI task allocation immediately.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-danger text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block">Full name</label>
              <input
                type="text"
                required
                className="field mt-1.5"
                placeholder="e.g. Maya Chen"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
              />
            </div>
            <div>
              <label className="eyebrow block">Email address</label>
              <input
                type="email"
                required
                className="field mt-1.5"
                placeholder="e.g. maya@tasknera.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

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
              <label className="eyebrow block">Designation</label>
              <input
                type="text"
                required
                className="field mt-1.5"
                placeholder="e.g. Senior Recruiter"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow block">Seniority</label>
              <select
                className="field mt-1.5"
                value={formData.seniority}
                onChange={(e) => handleChange('seniority', e.target.value)}
              >
                {SENIORITY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-background text-foreground">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow block">Availability</label>
              <select
                className="field mt-1.5"
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
              >
                {AVAILABILITY_STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-background text-foreground">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="eyebrow block">Skills & competencies (comma separated)</label>
            <input
              type="text"
              className="field mt-1.5"
              placeholder="e.g. Tech Sourcing, Candidate Screening, Boolean Search"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />
          </div>

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
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Adding to roster…' : 'Add employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

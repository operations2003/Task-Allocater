import React, { useState, useEffect } from 'react';
import { UserPlus, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AddEmployeeModal } from '../../components/team/AddEmployeeModal.jsx';
import { employeeService } from '../../services/employeeService.js';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { AVAILABILITY_STATUSES, getInitials, DEPARTMENTS } from '../../constants/neraTheme.js';

export const PeopleLoadPage = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEmpOpen, setAddEmpOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empsRes, tasksRes] = await Promise.allSettled([
        employeeService.listEmployees({ excludeCeo: true }),
        ceoTaskService.listAllTasks ? ceoTaskService.listAllTasks() : Promise.resolve([]),
      ]);

      const rawEmps = empsRes.status === 'fulfilled' ? (empsRes.value?.data || empsRes.value?.employees || empsRes.value || []) : [];
      const rawTasks = tasksRes.status === 'fulfilled' ? (tasksRes.value?.data || tasksRes.value || []) : [];

      setEmployees(rawEmps);
      setTasks(rawTasks);
    } catch (err) {
      console.warn('People & Load fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEmployee = async (payload) => {
    await employeeService.createEmployee(payload);
    toast.success(`Employee ${payload.full_name} added to roster.`);
    await fetchData();
  };

  const handleAvailabilityChange = async (empId, newStatus) => {
    try {
      await employeeService.updateEmployee(empId, { availability: newStatus });
      toast.success(`Availability updated to ${newStatus}.`);
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? { ...e, availability: newStatus } : e))
      );
    } catch (err) {
      toast.error('Failed to update availability.');
    }
  };

  // Group employees by department
  const groupedByDept = employees.reduce((acc, emp) => {
    const dept = emp.department || emp.departmentName || emp.dept_name || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  return (
    <div className="fade-up space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="People & load"
        title="Your roster, and who is carrying what"
        subtitle="AI weighs department, designation, availability and workload before allocating any task."
        actions={
          <button
            type="button"
            onClick={() => setAddEmpOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:bg-signal/90 cursor-pointer shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add employee</span>
          </button>
        }
      />

      {loading ? (
        <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground">
          Loading the roster…
        </div>
      ) : Object.keys(groupedByDept).length === 0 ? (
        <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground">
          No team members registered yet.
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(groupedByDept).map(([deptName, deptMembers]) => {
            const deptTasks = tasks.filter(
              (t) => (t.department || '').toLowerCase() === deptName.toLowerCase()
            );

            return (
              <section key={deptName} className="space-y-3">
                {/* Department Section Title */}
                <div className="flex items-baseline justify-between border-b border-white/[0.04] pb-2">
                  <h2 className="font-display text-xl text-foreground">{deptName}</h2>
                  <span className="text-[11px] text-muted-foreground">
                    {deptMembers.length} {deptMembers.length === 1 ? 'person' : 'people'} ·{' '}
                    {deptTasks.length} open tasks
                  </span>
                </div>

                {/* Personnel Cards Grid */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {deptMembers.map((emp) => {
                    const name =
                      emp.full_name ||
                      `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                      emp.name ||
                      'Specialist';
                    const initials = getInitials(name);
                    const desig = emp.designation || emp.designationTitle || emp.role || 'Specialist';
                    const seniority = emp.seniority || 'Mid';

                    const empTasks = tasks.filter(
                      (t) =>
                        t.assignee_id === emp.id ||
                        (t.assigned_to_email && t.assigned_to_email === emp.email)
                    );
                    const overdueCount = empTasks.filter(
                      (t) => t.status === 'Overdue' || (t.is_overdue && t.status !== 'Completed')
                    ).length;

                    // Capacity load formula: max 4 tasks benchmark
                    const loadPct = Math.min(100, Math.round((empTasks.length / 4) * 100));

                    return (
                      <div key={emp.id} className="panel p-4 space-y-3 flex flex-col justify-between">
                        <div>
                          {/* Avatar & Header */}
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-xs font-semibold text-foreground">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-foreground">
                                {name}
                              </p>
                              <p className="truncate text-[10.5px] text-muted-foreground">
                                {desig} · <span className="text-white/60">{seniority}</span>
                              </p>
                            </div>
                            {/* Availability Selector */}
                            <select
                              value={emp.availability || 'Available'}
                              onChange={(e) => handleAvailabilityChange(emp.id, e.target.value)}
                              className="bg-transparent border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-foreground font-medium cursor-pointer"
                            >
                              {AVAILABILITY_STATUSES.map((st) => (
                                <option key={st} value={st} className="bg-background text-foreground">
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Workload Metric */}
                          <div className="mt-3.5 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">Workload load</span>
                              <span className="num font-semibold text-foreground">{loadPct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  loadPct > 80 ? 'bg-danger' : loadPct > 50 ? 'bg-warn' : 'bg-signal'
                                }`}
                                style={{ width: `${loadPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10.5px] text-muted-foreground">
                          <span>{empTasks.length} active assignments</span>
                          {overdueCount > 0 && (
                            <span className="text-danger font-semibold">
                              {overdueCount} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        open={addEmpOpen}
        onOpenChange={setAddEmpOpen}
        onCreated={handleCreateEmployee}
      />
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Briefcase, Mail, Phone, CheckCircle, AlertTriangle, ShieldCheck, Plus } from 'lucide-react';
import { employeeService } from '../../services/employeeService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Badge } from '../../components/common/Badge.jsx';

export const EmployeeDirectoryPage = () => {
  const { isCeo } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeeService.listEmployees({
          search,
          deptId: selectedDept || undefined,
          availability: selectedAvailability || undefined,
        }),
        employeeService.listDepartments().catch(() => []),
      ]);
      const list = empRes.data || empRes.employees || (Array.isArray(empRes) ? empRes : []);
      setEmployees(list);
      setDepartments(Array.isArray(deptRes.data || deptRes) ? (deptRes.data || deptRes) : []);
    } catch (err) {
      console.warn('Failed to fetch employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [search, selectedDept, selectedAvailability]);

  const getAvailabilityBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">Available</Badge>;
      case 'MODERATE':
        return <Badge variant="info">Moderate Workload</Badge>;
      case 'OVERLOADED':
        return <Badge variant="danger">Overloaded</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="neutral">On Leave</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Employee Directory & Capacity
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wide">
              {employees.length} Members
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organizational source of truth for task assignment, skills matrix, and workload capacity.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, role, skills, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="MODERATE">Moderate</option>
            <option value="OVERLOADED">Overloaded</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No employees found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const workload = emp.current_workload || emp.currentWorkload || 0;
            const isOverloaded = workload >= 80;
            const isModerate = workload >= 50 && workload < 80;

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm">
                        {emp.first_name?.[0]}
                        {emp.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {emp.first_name} {emp.last_name}
                        </h3>
                        <span className="text-[11px] font-medium text-slate-500 block">
                          {emp.desig_title || emp.designation_title || 'Specialist'}
                        </span>
                      </div>
                    </div>
                    {getAvailabilityBadge(emp.availability_status || emp.availabilityStatus)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">
                        {emp.dept_name || emp.department_name || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-600">{emp.email}</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {Array.isArray(emp.skills) && emp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {emp.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {emp.skills.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-semibold px-1">
                          +{emp.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Workload Meter */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">Workload Capacity</span>
                    <span
                      className={`font-black ${
                        isOverloaded
                          ? 'text-rose-600'
                          : isModerate
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {workload}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverloaded
                          ? 'bg-rose-500'
                          : isModerate
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, workload)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { TaskLedgerTable } from '../../components/tasks/TaskLedgerTable.jsx';
import { NewTaskModal } from '../../components/tasks/NewTaskModal.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { DEPARTMENTS, isOverdue, OPEN_STATUSES } from '../../constants/neraTheme.js';

const STATUS_FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'Overdue', label: 'Overdue' },
  { key: 'Completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export const TaskLedgerPage = () => {
  const { isCeo } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empsRes] = await Promise.allSettled([
        ceoTaskService.listAllTasks ? ceoTaskService.listAllTasks() : ceoTaskService.getTasksOverview(),
        employeeService.listEmployees({ excludeCeo: true }),
      ]);

      const tasksRaw = tasksRes.status === 'fulfilled' ? (tasksRes.value?.data || tasksRes.value || []) : [];
      const empsRaw = empsRes.status === 'fulfilled' ? (empsRes.value?.data || empsRes.value?.employees || empsRes.value || []) : [];

      setTasks(tasksRaw);
      setEmployees(empsRaw);
    } catch (err) {
      console.warn('Task Ledger fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (payload) => {
    await ceoTaskService.createOfficialTask(payload);
    toast.success('Task directive issued successfully.');
    await fetchData();
  };

  // Filter tasks based on status, department, and search text
  const filteredTasks = tasks.filter((task) => {
    // 1. Status Filter
    if (statusFilter === 'open') {
      if (!OPEN_STATUSES.includes(task.status) && task.status !== 'TODO' && task.status !== 'IN_PROGRESS') {
        return false;
      }
    } else if (statusFilter === 'Overdue') {
      if (!isOverdue(task)) return false;
    } else if (statusFilter === 'Completed') {
      if (task.status !== 'Completed') return false;
    }

    // 2. Department Filter
    if (deptFilter !== 'All') {
      const taskDept = task.department || task.department_name || task.dept_name || task.departmentName || '';
      if (taskDept.toLowerCase() !== deptFilter.toLowerCase()) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (task.title || '').toLowerCase();
      const assignee = (task.assigned_to_name || task.assigneeName || '').toLowerCase();
      const dept = (task.department || '').toLowerCase();
      if (!title.includes(q) && !assignee.includes(q) && !dept.includes(q)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="fade-up space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Task ledger"
        title="Every task, every department"
        subtitle="Complete oversight of organisational work, with the full audit trail behind each task."
        actions={
          isCeo && (
            <button
              type="button"
              onClick={() => setNewTaskOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground transition hover:bg-signal/90 cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New task</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`rounded-full px-3 py-1.5 text-[11.5px] transition cursor-pointer font-medium ${
                statusFilter === filter.key
                  ? 'bg-white/[0.08] text-foreground shadow-inner'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search input & Department selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or people"
              className="field w-full pl-8 text-[12px] sm:w-56"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="field w-[150px] text-[12px]"
          >
            <option value="All" className="bg-background text-foreground">
              All departments
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="bg-background text-foreground">
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      {loading ? (
        <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground">
          Loading the ledger…
        </div>
      ) : (
        <TaskLedgerTable
          tasks={filteredTasks}
          title="Directives Ledger"
          subtitle={`${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} in view`}
          viewAllLink={null}
          emptyLabel={
            isCeo
              ? 'No tasks in this view yet.'
              : 'Nothing assigned to you in this view.'
          }
        />
      )}

      {/* Footer Info */}
      <p className="text-[10.5px] text-muted-foreground">
        {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} shown · statuses tracked: 6 · every change is logged in the permanent audit trail.
      </p>

      {/* New Task Modal */}
      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        employees={employees}
        onCreated={handleCreateTask}
      />
    </div>
  );
};


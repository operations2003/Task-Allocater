import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { taskService } from '../../services/taskService.js';
import { employeeService } from '../../services/employeeService.js';
import { departmentService } from '../../services/departmentService.js';
import { CeoDashboardOverview } from '../../components/ceo/CeoDashboardOverview.jsx';
import { CeoTaskManagement } from '../../components/ceo/CeoTaskManagement.jsx';
import { AiTaskAllocationSection } from '../../components/ceo/AiTaskAllocationSection.jsx';
import { PendingTasksSection } from '../../components/ceo/PendingTasksSection.jsx';
import { CeoApprovalCentre } from '../../components/ceo/CeoApprovalCentre.jsx';
import { CeoFilterBar } from '../../components/ceo/CeoFilterBar.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Button } from '../../components/common/Button.jsx';

export const CeoCommandCentrePage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tasks' | 'ai-allocation' | 'pending' | 'approvals'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data Stores
  const [metrics, setMetrics] = useState({});
  const [tasks, setTasks] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [employeeProgress, setEmployeeProgress] = useState([]);
  const [aiSummary, setAiSummary] = useState({});
  const [aiAllocations, setAiAllocations] = useState([]);
  const [pendingReport, setPendingReport] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    assigneeId: '',
    status: '',
    priority: '',
    assignedBy: '',
    dateScope: '',
  });

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        metricsRes,
        tasksRes,
        deptPerfRes,
        empProgRes,
        aiSumRes,
        aiAllocRes,
        pendingRepRes,
        approvalsRes,
        employeesRes,
        departmentsRes,
      ] = await Promise.allSettled([
        ceoTaskService.getOverviewMetrics(),
        taskService.getTasks(),
        ceoTaskService.getDepartmentPerformance(),
        ceoTaskService.getEmployeeProgress(),
        ceoTaskService.getAiSummary(),
        ceoTaskService.getAiAllocations(),
        ceoTaskService.getPendingTasksReport(),
        ceoTaskService.getExecutiveApprovals(),
        (employeeService.getEmployees ? employeeService.getEmployees() : employeeService.getAllEmployees()),
        departmentService.getDepartments(),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value) {
        const raw = tasksRes.value;
        setTasks(Array.isArray(raw) ? raw : (raw?.data || []));
      }
      if (deptPerfRes.status === 'fulfilled' && deptPerfRes.value) {
        setDepartmentPerformance(Array.isArray(deptPerfRes.value) ? deptPerfRes.value : []);
      }
      if (empProgRes.status === 'fulfilled' && empProgRes.value) {
        setEmployeeProgress(Array.isArray(empProgRes.value) ? empProgRes.value : []);
      }
      if (aiSumRes.status === 'fulfilled' && aiSumRes.value) {
        setAiSummary(typeof aiSumRes.value === 'object' ? aiSumRes.value : {});
      }
      if (aiAllocRes.status === 'fulfilled' && aiAllocRes.value) {
        setAiAllocations(Array.isArray(aiAllocRes.value) ? aiAllocRes.value : []);
      }
      if (pendingRepRes.status === 'fulfilled' && pendingRepRes.value) {
        setPendingReport(typeof pendingRepRes.value === 'object' ? pendingRepRes.value : {});
      }
      if (approvalsRes.status === 'fulfilled' && approvalsRes.value) {
        setApprovals(Array.isArray(approvalsRes.value) ? approvalsRes.value : []);
      }
      if (employeesRes.status === 'fulfilled' && employeesRes.value) {
        const raw = employeesRes.value;
        setEmployees(Array.isArray(raw) ? raw : (raw?.employees || raw?.data || []));
      }
      if (departmentsRes.status === 'fulfilled' && departmentsRes.value) {
        const raw = departmentsRes.value;
        setDepartments(Array.isArray(raw) ? raw : (raw?.departments || raw?.data || []));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Task Actions
  const handleCreateTask = async (taskData) => {
    try {
      await ceoTaskService.createOfficialTask(taskData);
      toast.success('Task created successfully.');
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to create task.');
      throw err;
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await taskService.updateStatus(taskId, status);
      toast.success(`Task status updated to ${status}.`);
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleReassignTask = async (taskId, newAssigneeId, reason) => {
    try {
      await ceoTaskService.reassignTask(taskId, newAssigneeId, reason);
      toast.success('Task reassigned.');
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to reassign task.');
    }
  };

  const handleModifyDeadline = async (taskId, newDate, reason) => {
    try {
      await ceoTaskService.modifyDeadline(taskId, newDate, reason);
      toast.success('Deadline updated.');
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update deadline.');
    }
  };

  const handleChangePriority = async (taskId, priority) => {
    try {
      await ceoTaskService.changePriority(taskId, priority);
      toast.success(`Priority set to ${priority}.`);
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update priority.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await ceoTaskService.deleteTask(taskId);
      toast.success('Task deleted.');
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to delete task.');
    }
  };

  const handleReopenTask = async (taskId, data) => {
    try {
      await taskService.reopenTask(taskId, data);
      toast.success('Task reopened.');
      loadAllData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to reopen task.');
    }
  };

  // AI Allocation Actions
  const handleApproveAiAllocation = async (id, item) => {
    try {
      await ceoTaskService.actOnAiAllocation(id, 'APPROVE', {
        title: item.taskTitle,
        description: item.taskDescription,
        assigneeId: item.suggestedAssignee.id,
        priority: item.priority,
        dueDate: item.suggestedDeadline,
        subtasks: item.aiSubtasks,
      });
      toast.success('Allocation approved and task created.');
      setAiAllocations((prev) => prev.filter((a) => a.id !== id));
      loadAllData(true);
    } catch (err) {
      toast.error('Failed to approve allocation.');
    }
  };

  const handleRejectAiAllocation = async (id, feedback) => {
    try {
      await ceoTaskService.actOnAiAllocation(id, 'REJECT', { feedback });
      toast.success('Recommendation dismissed.');
      setAiAllocations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error('Failed to dismiss allocation.');
    }
  };

  const handleAdjustAiAllocation = async (id, adjustments) => {
    try {
      await ceoTaskService.actOnAiAllocation(id, 'APPROVE', adjustments);
      toast.success('Task created with your adjustments.');
      setAiAllocations((prev) => prev.filter((a) => a.id !== id));
      loadAllData(true);
    } catch (err) {
      toast.error('Failed to adjust allocation.');
    }
  };

  // Approvals Actions
  const handleExecutiveDecision = async (id, decision, comment) => {
    try {
      await ceoTaskService.actOnExecutiveApproval(id, decision, comment);
      toast.success(`Request ${decision.toLowerCase()}d.`);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.error('Failed to record decision.');
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchAssignee = `${t.assignee_first || ''} ${t.assignee_last || ''}`.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    if (filters.department && t.dept_id !== filters.department && t.assignee_dept_id !== filters.department) {
      return false;
    }
    if (filters.assigneeId && t.assignee_id !== filters.assigneeId) {
      return false;
    }
    if (filters.status && t.status !== filters.status) {
      return false;
    }
    if (filters.priority && t.priority !== filters.priority) {
      return false;
    }
    if (filters.assignedBy) {
      if (filters.assignedBy === 'CEO' && t.assigned_by !== 'CEO' && !t.is_official) return false;
      if (filters.assignedBy === 'AI' && t.assigned_by !== 'AI' && !t.is_ai_assigned) return false;
    }
    if (filters.dateScope) {
      const today = new Date().toISOString().split('T')[0];
      const due = t.due_date ? String(t.due_date).split('T')[0] : '';
      if (filters.dateScope === 'today' && due !== today) return false;
      if (filters.dateScope === 'overdue' && (!due || due >= today || t.status === 'COMPLETED')) return false;
    }
    return true;
  });

  if (loading) {
    return <LoadingSpinner fullPage message="Loading workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor tasks, review recommendations, and approve team requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadAllData(true)}
            loading={refreshing}
            className="text-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'tasks', label: 'All Tasks', icon: CheckSquare, count: tasks.length },
          { id: 'ai-allocation', label: 'Suggested Allocations', icon: Sparkles, count: aiAllocations.length },
          { id: 'pending', label: 'Pending Tasks', icon: Clock, count: pendingReport.metrics?.totalDelayed },
          { id: 'approvals', label: 'Approvals', icon: ShieldCheck, count: approvals.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <CeoDashboardOverview
          metrics={metrics}
          departmentPerformance={departmentPerformance}
          employeeProgress={employeeProgress}
          aiSummary={aiSummary}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <CeoFilterBar
            search={search}
            setSearch={setSearch}
            filters={filters}
            setFilters={setFilters}
            departments={departments}
            employees={employees}
            onReset={() => {
              setSearch('');
              setFilters({
                department: '',
                assigneeId: '',
                status: '',
                priority: '',
                assignedBy: '',
                dateScope: '',
              });
            }}
          />
          <CeoTaskManagement
            tasks={filteredTasks}
            employees={employees}
            departments={departments}
            onCreateTask={handleCreateTask}
            onUpdateStatus={handleUpdateStatus}
            onReassignTask={handleReassignTask}
            onModifyDeadline={handleModifyDeadline}
            onChangePriority={handleChangePriority}
            onDeleteTask={handleDeleteTask}
            onReopenTask={handleReopenTask}
          />
        </div>
      )}

      {activeTab === 'ai-allocation' && (
        <AiTaskAllocationSection
          allocations={aiAllocations}
          employees={employees}
          onApprove={handleApproveAiAllocation}
          onReject={handleRejectAiAllocation}
          onAdjust={handleAdjustAiAllocation}
        />
      )}

      {activeTab === 'pending' && <PendingTasksSection report={pendingReport} />}

      {activeTab === 'approvals' && (
        <CeoApprovalCentre approvals={approvals} onDecision={handleExecutiveDecision} />
      )}
    </div>
  );
};

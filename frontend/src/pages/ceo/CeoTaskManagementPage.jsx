import React, { useState, useEffect } from 'react';
import { CeoTaskManagement } from '../../components/ceo/CeoTaskManagement.jsx';
import { CeoFilterBar } from '../../components/ceo/CeoFilterBar.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

export const CeoTaskManagementPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    deptId: '',
    assigneeId: '',
    status: '',
    priority: '',
    origin: '',
    search: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, empRes, deptRes] = await Promise.allSettled([
        ceoTaskService.listAllTasks(filters),
        employeeService.listEmployees({ excludeCeo: true }),
        employeeService.listDepartments(),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const val = tasksRes.value;
        const tasksList = val?.data || (Array.isArray(val) ? val : []);
        setTasks(tasksList);
      }

      if (empRes.status === 'fulfilled') {
        const val = empRes.value;
        const rawEmps = val?.data || val?.employees || (Array.isArray(val) ? val : []);
        const filtered = filterNonCeoEmployees(rawEmps);
        setEmployees(filtered);
      }

      if (deptRes.status === 'fulfilled') {
        const val = deptRes.value;
        const deptList = Array.isArray(val?.data) ? val.data : (Array.isArray(val) ? val : []);
        setDepartments(deptList);
      }
    } catch (err) {
      console.warn('Failed to load task directives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleCreateTask = async (payload) => {
    await ceoTaskService.createOfficialTask(payload);
    await fetchData();
  };

  const handleReassignTask = async (taskId, newAssigneeId, reason) => {
    await ceoTaskService.reassignTask(taskId, newAssigneeId, reason);
    await fetchData();
  };

  const handleModifyDeadline = async (taskId, newDate, reason) => {
    await ceoTaskService.modifyDeadline(taskId, newDate, reason);
    await fetchData();
  };

  const handleChangePriority = async (taskId, priority) => {
    await ceoTaskService.changePriority(taskId, priority);
    await fetchData();
  };

  const handleDeleteTask = async (taskId) => {
    await ceoTaskService.deleteTask(taskId);
    await fetchData();
  };

  return (
    <div className="space-y-6">
      <CeoFilterBar
        filters={filters}
        setFilters={setFilters}
        departments={departments}
        employees={employees}
        onReset={() =>
          setFilters({
            deptId: '',
            assigneeId: '',
            status: '',
            priority: '',
            origin: '',
            search: '',
          })
        }
      />

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : (
        <CeoTaskManagement
          tasks={tasks}
          employees={employees}
          departments={departments}
          currentUser={user}
          onCreateTask={handleCreateTask}
          onReassignTask={handleReassignTask}
          onModifyDeadline={handleModifyDeadline}
          onChangePriority={handleChangePriority}
          onDeleteTask={handleDeleteTask}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};

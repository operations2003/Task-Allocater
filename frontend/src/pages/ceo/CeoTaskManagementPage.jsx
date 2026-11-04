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
      const [tasksRes, empRes, deptRes] = await Promise.all([
        ceoTaskService.listAllTasks(filters),
        employeeService.listEmployees({ excludeCeo: true }),
        employeeService.listDepartments().catch(() => []),
      ]);

      setTasks(tasksRes.data || (Array.isArray(tasksRes) ? tasksRes : []));
      setEmployees(filterNonCeoEmployees(empRes.data || empRes.employees || (Array.isArray(empRes) ? empRes : [])));
      setDepartments(Array.isArray(deptRes.data || deptRes) ? (deptRes.data || deptRes) : []);
    } catch (err) {
      console.warn('Failed to load task directives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div className="space-y-6">
      <CeoFilterBar
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
        employees={employees}
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
          onRefresh={fetchData}
        />
      )}
    </div>
  );
};


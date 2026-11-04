import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmployeeTaskView } from '../../components/tasks/EmployeeTaskView.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const EmployeeWorkspacePage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await taskService.getMyTasks();
      const list = res.data || (Array.isArray(res) ? res : []);
      setTasks(list);
    } catch (err) {
      console.warn('Failed to fetch assigned tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeTaskView
        currentUser={user}
        tasks={tasks}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
};

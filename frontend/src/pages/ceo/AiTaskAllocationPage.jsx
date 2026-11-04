import React, { useState, useEffect } from 'react';
import { AiTaskAllocationSection } from '../../components/ceo/AiTaskAllocationSection.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';

export const AiTaskAllocationPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, empRes] = await Promise.all([
        ceoTaskService.getAiAllocations(),
        employeeService.listEmployees({ excludeCeo: true }),
      ]);
      setAllocations(allocRes.data || (Array.isArray(allocRes) ? allocRes : []));
      setEmployees(filterNonCeoEmployees(empRes.data || empRes.employees || (Array.isArray(empRes) ? empRes : [])));
    } catch (err) {
      console.warn('Failed to load AI allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <AiTaskAllocationSection
        allocations={allocations}
        employees={employees}
        onRefresh={fetchData}
      />
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { AiTaskAllocationSection } from '../../components/ceo/AiTaskAllocationSection.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { employeeService } from '../../services/employeeService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { filterNonCeoEmployees } from '../../utils/roleUtils.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AiTaskAllocationPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
      toast.error('Failed to load operational allocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (allocationId, overrides = {}) => {
    try {
      await ceoTaskService.actOnAiAllocation(allocationId, 'APPROVE', overrides);
      toast.success('Task directive successfully assigned and allocated!');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign directive.');
    }
  };

  const handleReject = async (allocationId, reason = '') => {
    try {
      await ceoTaskService.actOnAiAllocation(allocationId, 'REJECT', { reason });
      toast.success('Directive recommendation dismissed.');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to dismiss recommendation.');
    }
  };

  const handleAdjust = async (allocationId, adjustments = {}) => {
    try {
      await ceoTaskService.actOnAiAllocation(allocationId, 'APPROVE', adjustments);
      toast.success('Directive approved with updated parameters.');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to apply adjustments.');
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await ceoTaskService.generateRoleTasks();
      toast.success('Generated fresh SOP daily operational directives!');
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to generate role tasks.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col justify-center items-center gap-3">
        <LoadingSpinner />
        <span className="text-xs text-slate-500 font-medium">Loading SOP task directives...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AiTaskAllocationSection
        allocations={allocations}
        employees={employees}
        onApprove={handleApprove}
        onReject={handleReject}
        onAdjust={handleAdjust}
        onGenerate={handleGenerate}
        onRefresh={fetchData}
      />
    </div>
  );
};

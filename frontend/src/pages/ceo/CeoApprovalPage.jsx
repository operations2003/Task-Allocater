import React, { useState, useEffect } from 'react';
import { CeoApprovalCentre } from '../../components/ceo/CeoApprovalCentre.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const CeoApprovalPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await ceoTaskService.getExecutiveApprovals();
      setApprovals(res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.warn('Failed to load executive approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
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
      <CeoApprovalCentre
        approvals={approvals}
        onRefresh={fetchApprovals}
      />
    </div>
  );
};


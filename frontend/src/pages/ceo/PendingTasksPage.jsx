import React, { useState, useEffect } from 'react';
import { PendingTasksSection } from '../../components/ceo/PendingTasksSection.jsx';
import { ceoTaskService } from '../../services/ceoTaskService.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const PendingTasksPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await ceoTaskService.getPendingTasksReport();
      setReportData(res.data || res);
    } catch (err) {
      console.warn('Failed to load pending tasks report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
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
      <PendingTasksSection
        reportData={reportData}
        onRefresh={fetchReport}
      />
    </div>
  );
};

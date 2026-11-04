import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  UserMinus,
  BookOpen,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';

export const CeoApprovalCentre = ({ approvals = [], onDecision }) => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    item: null,
    action: 'APPROVE', // 'APPROVE' | 'REJECT'
    comment: '',
  });

  const categories = [
    { id: 'ALL', label: 'All Requests' },
    { id: 'SALARY_CHANGE', label: 'Compensation' },
    { id: 'DISCIPLINARY', label: 'Disciplinary' },
    { id: 'TERMINATION', label: 'Departures' },
    { id: 'POLICY_CHANGE', label: 'Policy Updates' },
  ];

  const filteredApprovals = approvals.filter((a) => {
    if (activeCategory === 'ALL') return true;
    return a.category === activeCategory;
  });

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal.item) return;
    await onDecision(decisionModal.item.id, decisionModal.action, decisionModal.comment);
    setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', comment: '' });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'SALARY_CHANGE':
        return <DollarSign className="w-3.5 h-3.5 text-slate-600" />;
      case 'DISCIPLINARY':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'TERMINATION':
        return <UserMinus className="w-3.5 h-3.5 text-rose-500" />;
      case 'POLICY_CHANGE':
        return <BookOpen className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Approvals</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {approvals.length} pending
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and decide on compensation, team departures, and policy updates.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              activeCategory === c.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Approvals Cards */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Pending Approvals</h3>
            <p className="text-xs text-slate-400 mt-1">
              All requests in this category have been processed.
            </p>
          </div>
        ) : (
          filteredApprovals.map((appr) => (
            <div
              key={appr.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1 rounded bg-slate-100">
                    {getCategoryIcon(appr.category)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {appr.category ? appr.category.replace(/_/g, ' ') : 'General'}
                  </span>
                  <Badge variant={appr.priority === 'URGENT' ? 'danger' : 'neutral'}>
                    {appr.priority || 'NORMAL'}
                  </Badge>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted {appr.date || 'recently'}</span>
                </div>
              </div>

              {/* Title & Subject */}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{appr.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                  {appr.subjectEmployee && <span>Subject: <strong className="text-slate-700">{appr.subjectEmployee}</strong></span>}
                  {appr.department && <span>• {appr.department}</span>}
                  {appr.submittedBy && <span>• Submitted by {appr.submittedBy}</span>}
                </div>
              </div>

              {/* Justification Box */}
              {appr.reason && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Notes:</span>
                  <p className="leading-relaxed">{appr.reason}</p>
                </div>
              )}

              {/* Supporting Details */}
              {appr.details && Object.keys(appr.details).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 text-xs border border-slate-100">
                  {Object.entries(appr.details).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-medium text-slate-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setDecisionModal({
                      isOpen: true,
                      item: appr,
                      action: 'REJECT',
                      comment: '',
                    })
                  }
                  className="text-xs text-slate-600 hover:text-rose-600"
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>

                <button
                  type="button"
                  onClick={() =>
                    setDecisionModal({
                      isOpen: true,
                      item: appr,
                      action: 'APPROVE',
                      comment: '',
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Comment Modal */}
      <Modal
        isOpen={decisionModal.isOpen}
        onClose={() => setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', comment: '' })}
        title={decisionModal.action === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
        subtitle={`Request: ${decisionModal.item?.title || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmDecision} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {decisionModal.action === 'APPROVE' ? 'Notes (optional)' : 'Reason for rejection *'}
            </label>
            <textarea
              required={decisionModal.action === 'REJECT'}
              rows="3"
              value={decisionModal.comment}
              onChange={(e) => setDecisionModal({ ...decisionModal, comment: e.target.value })}
              placeholder={
                decisionModal.action === 'APPROVE'
                  ? 'Add any instructions or notes...'
                  : 'Specify why this request cannot be approved...'
              }
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', comment: '' })}
            >
              Cancel
            </Button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer ${
                decisionModal.action === 'APPROVE' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {decisionModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { RISK_STYLES, formatDateTime } from '../../constants/neraTheme.js';
import { ceoTaskService } from '../../services/ceoTaskService.js';

export const ApprovalsPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch approvals from backend
      const res = await (ceoTaskService.getPendingReport ? ceoTaskService.getPendingReport() : Promise.resolve([]));
      const rawList = res?.data || res?.items || (Array.isArray(res) ? res : []);

      setPendingApprovals(rawList.filter((a) => a.status === 'Pending'));
      setDecisionHistory(rawList.filter((a) => a.status !== 'Pending'));
    } catch (err) {
      console.warn('Approvals fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (approvalId, decision) => {
    try {
      setBusyId(approvalId);
      const note = decisionNotes[approvalId] || '';

      // Call API
      if (ceoTaskService.decideApproval) {
        await ceoTaskService.decideApproval(approvalId, decision, note);
      }

      // Update local state smoothly
      const target = pendingApprovals.find((a) => a.id === approvalId);
      if (target) {
        setPendingApprovals((prev) => prev.filter((a) => a.id !== approvalId));
        setDecisionHistory((prev) => [
          { ...target, status: decision, decided_at: new Date().toISOString(), decision_note: note },
          ...prev,
        ]);
      }

      toast.success(
        decision === 'Approved'
          ? 'Approved: Directive dispatched and recorded in audit log.'
          : 'Rejected: Decision logged in permanent executive audit.'
      );
    } catch (err) {
      toast.error(err.message || 'Could not record decision.');
    } finally {
      setBusyId(null);
    }
  };

  const currentList = activeTab === 'pending' ? pendingApprovals : decisionHistory;

  return (
    <div className="fade-up space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Approval-based authority"
        title="Decisions only you can take"
        subtitle="Routine work runs on its own. Sensitive assignments, compensation, disciplinary action and policy changes wait for the CEO."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { key: 'pending', label: `Pending (${pendingApprovals.length})` },
          { key: 'history', label: `Decision history (${decisionHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3 py-1.5 text-[11.5px] transition cursor-pointer font-medium ${
              activeTab === tab.key
                ? 'bg-white/[0.08] text-foreground shadow-inner'
                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="panel px-5 py-16 text-center text-[12px] text-muted-foreground">
          Loading decisions…
        </div>
      ) : currentList.length === 0 ? (
        <div className="panel px-5 py-16 text-center text-[12.5px] text-muted-foreground">
          {activeTab === 'pending'
            ? 'Nothing waiting on you. AI is running routine workflows smoothly.'
            : 'No decisions recorded in this cycle yet.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {currentList.map((appr) => {
            const riskStyle = RISK_STYLES[appr.risk] || RISK_STYLES.medium;
            const isBusy = busyId === appr.id;

            return (
              <div key={appr.id} className="panel p-5 space-y-4 flex flex-col justify-between">
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${riskStyle}`}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span>{appr.risk || 'Risk'}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(appr.created_at || appr.decided_at)}
                    </span>
                  </div>

                  {/* Title & Detail */}
                  <h3 className="mt-2.5 font-display text-xl text-foreground">
                    {appr.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {appr.justification || appr.description || 'Action requires direct executive confirmation.'}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">{appr.employee_name || 'Staff'}</span>
                    <span>·</span>
                    <span>{appr.department || 'Operations'}</span>
                  </div>
                </div>

                {/* Actions or Decision Result */}
                {activeTab === 'pending' ? (
                  <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                    <input
                      type="text"
                      placeholder="Add an executive note (optional)…"
                      value={decisionNotes[appr.id] || ''}
                      onChange={(e) =>
                        setDecisionNotes({ ...decisionNotes, [appr.id]: e.target.value })
                      }
                      className="field text-xs py-1.5"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecision(appr.id, 'Rejected')}
                        className="flex-1 py-2 rounded-lg border border-white/10 text-xs font-medium text-muted-foreground hover:bg-white/[0.03] hover:text-danger transition cursor-pointer disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5 inline mr-1" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecision(appr.id, 'Approved')}
                        className="flex-1 py-2 rounded-lg bg-signal text-primary-foreground text-xs font-semibold hover:bg-signal/90 transition cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5 inline mr-1" />
                        <span>{isBusy ? 'Confirming…' : 'Approve Directive'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        appr.status === 'Approved' ? 'text-ok' : 'text-danger'
                      }`}
                    >
                      {appr.status}
                    </span>
                    {appr.decision_note && (
                      <span className="text-muted-foreground italic truncate max-w-xs">
                        "{appr.decision_note}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


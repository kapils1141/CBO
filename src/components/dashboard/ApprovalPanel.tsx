import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, X } from 'lucide-react';
import type { Approval } from '../../services/bankingApi';
import { approvePayment, rejectPayment } from '../../services/bankingApi';

interface Props {
  approvals: Approval[];
  onUpdate: (updated: Approval[]) => void;
  compact?: boolean;
  onViewAll?: () => void;
}

function formatCurrency(amount: number, currency = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'High', color: 'bg-red-100 text-red-700' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
};

export const ApprovalPanel: React.FC<Props> = ({ approvals, onUpdate, compact = false, onViewAll }) => {
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const displayed = compact ? pending.slice(0, 3) : pending;

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approvePayment(id);
      onUpdate(approvals.map((a) => a.approvalId === id ? { ...a, status: 'APPROVED' } : a));
    } catch {
      // silent
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setProcessing(rejectTarget);
    try {
      await rejectPayment(rejectTarget, rejectReason);
      onUpdate(approvals.map((a) => a.approvalId === rejectTarget ? { ...a, status: 'REJECTED' } : a));
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      // silent
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Clock size={16} className="text-lloyds-green" />
          Pending Approvals
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h3>
        {compact && onViewAll && pending.length > 3 && (
          <button onClick={onViewAll} className="text-xs text-lloyds-green hover:underline">
            View all
          </button>
        )}
      </div>

      {displayed.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No pending approvals</p>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'overflow-x-auto'}>
        {!compact && displayed.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium">Description</th>
                <th className="text-right py-2 pr-4 font-medium">Amount</th>
                <th className="text-left py-2 pr-4 font-medium">Requested By</th>
                <th className="text-left py-2 pr-4 font-medium">Due Date</th>
                <th className="text-left py-2 pr-4 font-medium">Method</th>
                <th className="text-left py-2 pr-4 font-medium">Urgency</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((a) => {
                const urg = urgencyConfig[a.urgency] ?? urgencyConfig.LOW;
                return (
                  <tr key={a.approvalId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">{a.description}</p>
                    </td>
                    <td className="py-3 pr-4 text-right font-bold text-gray-900">
                      {formatCurrency(a.amount, a.currency)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{a.requestedBy}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatDate(a.dueDate)}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {a.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${urg.color}`}>
                        {urg.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(a.approvalId)}
                          disabled={processing === a.approvalId}
                          className="flex items-center gap-1 text-xs bg-lloyds-green text-white px-2.5 py-1.5 rounded-md hover:bg-lloyds-dark disabled:opacity-50"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => { setRejectTarget(a.approvalId); setRejectReason(''); }}
                          disabled={processing === a.approvalId}
                          className="flex items-center gap-1 text-xs bg-red-500 text-white px-2.5 py-1.5 rounded-md hover:bg-red-600 disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {compact && displayed.map((a) => {
          const urg = urgencyConfig[a.urgency] ?? urgencyConfig.LOW;
          return (
            <div key={a.approvalId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.description}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${urg.color}`}>
                    {urg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatCurrency(a.amount, a.currency)} · {a.requestedBy} · Due {formatDate(a.dueDate)}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => handleApprove(a.approvalId)}
                  disabled={processing === a.approvalId}
                  className="text-xs bg-lloyds-green text-white px-2 py-1 rounded hover:bg-lloyds-dark disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setRejectTarget(a.approvalId); setRejectReason(''); }}
                  disabled={processing === a.approvalId}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Reject Payment
              </h4>
              <button onClick={() => setRejectTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payment.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus-lloyds resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!processing}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

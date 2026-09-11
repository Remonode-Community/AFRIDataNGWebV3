'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCw,
  MessageSquare,
  Copy,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { adminService } from '@/services/admin.service';
import { Spinner } from '@/components/shared/Spinner';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format.utils';
import { AirtimeConversion } from '@/types/api.types';

const STATUSES = [
  { value: 'pending',    label: 'Pending',    color: 'yellow' },
  { value: 'confirmed',  label: 'Confirmed',  color: 'blue'   },
  { value: 'processing', label: 'Processing', color: 'purple' },
  { value: 'completed',  label: 'Completed',  color: 'green'  },
  { value: 'rejected',   label: 'Rejected',   color: 'red'    },
  { value: 'failed',     label: 'Failed',     color: 'red'    },
];

export default function AirtimeConversionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const [conversion, setConversion] = useState<AirtimeConversion | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comment, setComment] = useState('');

  const conversionId = params.id as string;

  // ── Fetch conversion details ────────────────────────────────────────────
  useEffect(() => {
    const fetchConversion = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAirtimeConversion(Number(conversionId));

        console.log('[Detail Page] full response:', response);
        console.log('[Detail Page] response.data:', response.data);

        // API returns { success, message, data: <conversion> }
        // response.data IS the conversion object — no extra .data nesting
        const conversionData = response.data;
        console.log('[Detail Page] conversionData:', conversionData);

        if (conversionData && conversionData.id) {
          console.log('[Detail Page] Setting conversion with id:', conversionData.id);
          setConversion(conversionData);
        } else {
          console.warn('[Detail Page] No conversion data or missing id');
          addToast({ type: 'error', message: 'Conversion data not found in response' });
        }
      } catch (error) {
        console.error('[Detail Page] Error fetching conversion:', error);
        addToast({ type: 'error', message: 'Error fetching conversion details' });
      } finally {
        setLoading(false);
      }
    };

    fetchConversion();
  }, [conversionId, addToast]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const safeFormatCurrency = (value: any): string => {
    if (!value && value !== 0) return formatCurrency(0);
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return formatCurrency(isNaN(numValue) ? 0 : numValue);
  };

  const safeFormatDateTime = (date: any): string => {
    if (!date) return 'N/A';
    try {
      return formatDateTime(date);
    } catch (error) {
      console.error('[Detail Page] Date format error:', date, error);
      return 'Invalid date';
    }
  };

  const safeFormatDate = (date: any): string => {
    if (!date) return 'N/A';
    try {
      return formatDate(date);
    } catch (error) {
      console.error('[Detail Page] Date format error:', date, error);
      return 'Invalid date';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast({ type: 'success', message: 'Copied to clipboard' });
    });
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'success' | 'danger' | 'warning' | 'info' => {
    const statusObj = STATUSES.find((s) => s.value === status);
    const colorMap: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      yellow: 'warning',
      blue:   'info',
      purple: 'info',
      green:  'success',
      red:    'danger',
      gray:   'default',
    };
    return colorMap[statusObj?.color || 'gray'] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'processing':
      case 'confirmed':
        return <Clock className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!conversion) return;
    try {
      setActionLoading(true);
      const response = await adminService.updateAirtimeConversionStatus(conversion.id, {
        status: 'confirmed',
        notes: 'Receipt verified. User in good standing. Ready for payout.',
      });
      if (response.success) {
        addToast({ type: 'success', message: 'Conversion approved successfully' });
        setConversion({ ...conversion, status: 'confirmed' });
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to approve conversion' });
      }
    } catch (error) {
      console.error('Error approving conversion:', error);
      addToast({ type: 'error', message: 'Error approving conversion' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!conversion || !rejectionReason.trim()) {
      addToast({ type: 'error', message: 'Please provide a reason for rejection' });
      return;
    }
    try {
      setActionLoading(true);
      const response = await adminService.updateAirtimeConversionStatus(conversion.id, {
        status: 'rejected',
        reason_for_rejection: rejectionReason,
      });
      if (response.success) {
        addToast({ type: 'success', message: 'Conversion rejected successfully' });
        setConversion({ ...conversion, status: 'rejected' });
        setShowRejectModal(false);
        setRejectionReason('');
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to reject conversion' });
      }
    } catch (error) {
      console.error('Error rejecting conversion:', error);
      addToast({ type: 'error', message: 'Error rejecting conversion' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFund = async () => {
    if (!conversion) return;
    try {
      setActionLoading(true);
      const response = await adminService.fundAirtimeConversionWallet(conversion.id, {
        authorization_notes:
          'Payout initiated. Funds should reflect in wallet within 5-10 minutes.',
      });
      if (response.success) {
        addToast({ type: 'success', message: 'Wallet funded successfully' });
        setConversion({ ...conversion, status: 'completed' });
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to fund wallet' });
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      addToast({ type: 'error', message: 'Error funding wallet' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!conversion || !comment.trim()) {
      addToast({ type: 'error', message: 'Please enter a comment' });
      return;
    }
    try {
      setActionLoading(true);
      const response = await adminService.addAirtimeConversionComment(conversion.id, {
        comment,
        visibility: 'internal',
      });
      if (response.success) {
        addToast({ type: 'success', message: 'Comment added successfully' });
        setComment('');
        setShowCommentModal(false);

        // Refresh conversion — response.data IS the conversion (same fix as fetchConversion)
        const refreshResponse = await adminService.getAirtimeConversion(conversion.id);
        if (refreshResponse.success && refreshResponse.data) {
          setConversion(refreshResponse.data);
        }
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to add comment' });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      addToast({ type: 'error', message: 'Error adding comment' });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // ── Not found state ──────────────────────────────────────────────────────
  if (!conversion) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Conversion not found</p>
          </Card>
        </div>
      </div>
    );
  }

  const commission_percentage = conversion.commission_percentage || 10;
  const statusObj = STATUSES.find((s) => s.value === conversion.status);

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {getStatusIcon(conversion.status)}
            <Badge variant={getStatusBadgeVariant(conversion.status)} size="md">
              {statusObj?.label || conversion.status}
            </Badge>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Conversion Info */}
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Details</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all">
                      {conversion.transaction_id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(conversion.transaction_id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Receipt Number</p>
                  <p className="font-medium text-gray-900">{conversion.receipt_number}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Network</p>
                  <Badge variant="default">{conversion.network}</Badge>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone Number</p>
                  <p className="font-medium text-gray-900">{conversion.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Transaction Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {conversion.transaction_type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Retry Count</p>
                  <p className="font-medium text-gray-900">{conversion.retry_count ?? 0}</p>
                </div>
                {conversion.last_error_message && (
                  <div className="col-span-2">
                    <p className="text-gray-600 mb-1">Last Error</p>
                    <p className="font-medium text-red-600 text-xs">{conversion.last_error_message}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Amount Breakdown */}
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Original Amount</span>
                  <span className="font-medium text-gray-900">
                    {safeFormatCurrency(conversion.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Commission ({commission_percentage}%)</span>
                  <span className="font-medium text-red-600">
                    -{safeFormatCurrency(conversion.commission)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-gray-900">User Receives</span>
                  <span className="text-lg font-bold text-green-600">
                    {safeFormatCurrency(conversion.discounted_amount)}
                  </span>
                </div>
              </div>
            </Card>

            {/* User Information */}
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-gray-600 mb-1">Name</p>
                  <p className="font-medium text-gray-900 truncate">
                    {conversion.user?.first_name} {conversion.user?.last_name}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900 break-all text-xs sm:text-sm">{conversion.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{conversion.user?.phone}</p>
                </div>
                {conversion.user?.account_balance !== undefined && (
                  <div>
                    <p className="text-gray-600 mb-1">Account Balance</p>
                    <p className="font-medium text-gray-900">
                      {safeFormatCurrency(conversion.user.account_balance)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 mb-1">Verified</p>
                  <Badge variant={conversion.user?.email_verified_at ? 'success' : 'warning'}>
                    {conversion.user?.email_verified_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Status History */}
            {conversion.status_histories && conversion.status_histories.length > 0 ? (
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
                <div className="space-y-3">
                  {conversion.status_histories.map((history: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        {index < conversion.status_histories!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="font-medium text-gray-900">
                          {STATUSES.find((s) => s.value === history.status)?.label ||
                            history.status}
                        </p>
                        <p className="text-sm text-gray-600">
                          {safeFormatDateTime(history.changed_at)}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-700 mt-1">{history.notes}</p>
                        )}
                        {history.changed_by_admin && (
                          <p className="text-xs text-gray-500 mt-1">
                            by {history.changed_by_admin.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Status History</h2>
                <p className="text-sm text-gray-500">No status changes recorded yet.</p>
              </Card>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Admin Actions */}
            <Card className="p-5 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>
              <div className="space-y-2">
                {conversion.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve & Confirm
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Request
                    </Button>
                  </>
                )}

                {conversion.status === 'confirmed' && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleFund}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Spinner /> : <Send className="h-4 w-4" />}
                    Fund Wallet Now
                  </Button>
                )}

                {conversion.status === 'failed' && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleFund}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
                    Retry Funding
                  </Button>
                )}

                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowCommentModal(true)}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Comment
                </Button>
              </div>
            </Card>

            {/* Admin Comments */}
            {conversion.comments && conversion.comments.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Admin Comments</h3>
                <div className="space-y-3">
                  {conversion.comments.map((c: any) => (
                    <div key={c.id} className="text-sm border-l-2 border-blue-300 pl-3">
                      <p className="font-medium text-gray-900">{c.admin?.name}</p>
                      <p className="text-xs text-gray-600">{safeFormatDate(c.created_at)}</p>
                      <p className="text-gray-700 mt-1">{c.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Timestamps */}
            <Card className="p-6 bg-gray-50">
              <p className="text-xs text-gray-600 mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900 mb-4">
                {safeFormatDateTime(conversion.created_at)}
              </p>
              <p className="text-xs text-gray-600 mb-2">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {safeFormatDateTime(conversion.updated_at)}
              </p>
              {conversion.confirmed_at && (
                <>
                  <p className="text-xs text-gray-600 mb-1 mt-4">Confirmed At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(conversion.confirmed_at)}
                  </p>
                </>
              )}
              {conversion.funded_at && (
                <>
                  <p className="text-xs text-gray-600 mb-1 mt-4">Funded At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(conversion.funded_at)}
                  </p>
                </>
              )}
              {conversion.rejected_at && (
                <>
                  <p className="text-xs text-gray-600 mb-1 mt-4">Rejected At</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(conversion.rejected_at)}
                  </p>
                </>
              )}
            </Card>

            {/* Rejection reason (if rejected) */}
            {conversion.rejection_reason && (
              <Card className="p-6 border border-red-200 bg-red-50">
                <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                <p className="text-sm text-red-700">{conversion.rejection_reason}</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Conversion Request
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 min-h-24 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? <Spinner /> : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Comment Modal ── */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Admin Comment</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 min-h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddComment}
                disabled={actionLoading || !comment.trim()}
              >
                {actionLoading ? <Spinner /> : 'Add Comment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
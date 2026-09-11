'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { Modal } from '@/components/shared/Modal';
import { adminService } from '@/services/admin.service';
import { useUIStore } from '@/store/ui.store';
import { formatCurrency, formatDate } from '@/utils/format.utils';

interface FundRequest {
  id: number;
  agent_id: number;
  amount: number;
  type: string;
  status: string;
  admin_note: string | null;
  processed_at: string | null;
  created_at: string;
  agent: { id: number; user: { first_name: string; last_name: string; email: string } };
  admin: { first_name: string; last_name: string } | null;
}

export default function AdminFundRequestsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [activeTab, setActiveTab] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => { fetchRequests(1); }, [activeTab]);

  const fetchRequests = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminService.getAgentFundRequests(page, 20, {
        status: activeTab === 'all' ? undefined : activeTab,
      });
      const data = response.data;
      setRequests(data.data || []);
      setPagination({
        currentPage: data.pagination?.current_page || 1,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching fund requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    if (!confirm('Approve this fund request?')) return;
    try {
      setProcessingId(requestId);
      await adminService.approveAgentFundRequest(requestId);
      addToast({ message: 'Fund request approved', type: 'success' });
      fetchRequests(pagination.currentPage);
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to approve', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      setProcessingId(rejectingId);
      await adminService.rejectAgentFundRequest(rejectingId, rejectNote || undefined);
      addToast({ message: 'Fund request rejected', type: 'success' });
      setShowRejectModal(false);
      setRejectingId(null);
      setRejectNote('');
      fetchRequests(pagination.currentPage);
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to reject', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (requestId: number) => {
    setRejectingId(requestId);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      completed: 'info',
    };
    return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
  };

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filteredRequests = requests.filter((r) => {
    if (!searchInput) return true;
    const s = searchInput.toLowerCase();
    return (
      r.agent?.user?.first_name?.toLowerCase().includes(s) ||
      r.agent?.user?.last_name?.toLowerCase().includes(s) ||
      r.agent?.user?.email?.toLowerCase().includes(s) ||
      formatCurrency(r.amount).toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Agent Fund Requests</h1>
        <p className="text-xs sm:text-sm text-[#6b7280] mt-1">Review and process agent withdrawal and transfer requests</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#111827] text-white'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f8fafc]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search agent name, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<FileText size={16} />}
            />
          </div>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] flex-shrink-0"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc]">
              <FileText className="h-6 w-6 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No requests found</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              {activeTab === 'pending' ? 'No pending requests to review.' : `No ${activeTab} requests found.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Agent</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Type</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Note</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {request.agent?.user?.first_name?.[0]}{request.agent?.user?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {request.agent?.user?.first_name} {request.agent?.user?.last_name}
                            </p>
                            <p className="text-xs text-[#6b7280]">{request.agent?.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {request.type === 'withdrawal' ? (
                            <ArrowDownRight className="h-4 w-4 text-[#dc2626]" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-[#4a5ff7]" />
                          )}
                          <span className="text-sm capitalize">{request.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-[#111827]">
                        {formatCurrency(request.amount)}
                      </td>
                      <td className="px-5 py-3 text-center">{getStatusBadge(request.status)}</td>
                      <td className="px-5 py-3 text-xs text-[#6b7280]">{formatDate(request.created_at)}</td>
                      <td className="px-5 py-3 text-xs text-[#6b7280] max-w-[150px] truncate">{request.admin_note || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        {request.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={processingId === request.id}
                              className="p-1.5 rounded-lg bg-emerald-50 text-[#059669] hover:bg-emerald-100 transition-colors"
                            >
                              {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={16} />}
                            </button>
                            <button
                              onClick={() => openRejectModal(request.id)}
                              disabled={processingId === request.id}
                              className="p-1.5 rounded-lg bg-red-50 text-[#dc2626] hover:bg-red-100 transition-colors"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : request.admin ? (
                          <span className="text-xs text-[#6b7280]">by {request.admin.first_name}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {filteredRequests.map((request) => (
                <div key={request.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {request.agent?.user?.first_name?.[0]}{request.agent?.user?.last_name?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {request.agent?.user?.first_name} {request.agent?.user?.last_name}
                        </p>
                        <p className="text-[11px] text-[#6b7280] truncate">{request.agent?.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#111827] flex-shrink-0 ml-2">
                      {formatCurrency(request.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(request.status)}
                      <div className="flex items-center gap-1">
                        {request.type === 'withdrawal' ? (
                          <ArrowDownRight className="h-3 w-3 text-[#dc2626]" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-[#4a5ff7]" />
                        )}
                        <span className="text-[11px] text-[#6b7280] capitalize">{request.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9ca3af]">{formatDate(request.created_at)}</span>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-[#059669] text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        {processingId === request.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-[#dc2626] text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                  {request.admin && (
                    <p className="text-[11px] text-[#9ca3af]">Processed by {request.admin.first_name}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-[#f1f5f9] px-4 sm:px-5 py-3">
                <div className="text-xs text-[#6b7280]">
                  <span className="font-semibold text-[#111827]">{pagination.currentPage}</span>/{pagination.lastPage} · {pagination.total}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs px-2.5"
                    onClick={() => fetchRequests(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="rounded-lg bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#111827]">
                    {pagination.currentPage}/{pagination.lastPage}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs px-2.5"
                    onClick={() => fetchRequests(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Fund Request">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <Input
              placeholder="Enter reason for rejection"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={processingId !== null}
              className="flex-1 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c]">
              {processingId ? <Loader2 className="animate-spin" size={18} /> : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

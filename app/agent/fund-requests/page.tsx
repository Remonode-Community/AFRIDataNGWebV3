'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  X,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Spinner } from '@/components/shared/Spinner';
import { agentService, AgentFundRequest } from '@/services/agent.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';

export default function AgentFundRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AgentFundRequest[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await agentService.getFundRequests({
        status: activeTab === 'all' ? undefined : activeTab,
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching fund requests:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredRequests = requests.filter((r) => {
    if (!searchInput) return true;
    const s = searchInput.toLowerCase();
    return (
      r.type?.toLowerCase().includes(s) ||
      formatCurrency(r.amount).toLowerCase().includes(s)
    );
  });

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Fund Requests</h1>
        <p className="text-sm text-[#6b7280] mt-1">Track your withdrawal and transfer requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
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
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by type or amount..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Clock className="h-6 w-6 text-[#475569]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No requests found</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              {activeTab === 'all'
                ? "You haven't made any fund requests yet."
                : `No ${activeTab} requests found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Type</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Admin Note</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Processed At</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3 text-sm text-[#111827]">{formatDate(request.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
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
                    <td className="px-5 py-3 text-sm text-[#6b7280]">{request.admin_note || '—'}</td>
                    <td className="px-5 py-3 text-sm text-[#6b7280]">
                      {request.processed_at ? formatDate(request.processed_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

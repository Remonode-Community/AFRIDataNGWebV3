'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { agentService, AgentTransaction } from '@/services/agent.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';

export default function AgentCommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<AgentTransaction[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  useEffect(() => { fetchCommissions(1); }, [dateFilter]);

  const fetchCommissions = async (page: number) => {
    try {
      setLoading(true);
      const response = await agentService.getCommissions({
        date_from: dateFilter.from || undefined,
        date_to: dateFilter.to || undefined,
        per_page: 20,
      });
      const data = response.data;
      setCommissions(data.data || []);
      setTotalEarned(data.total_earned || 0);
      setPagination({
        currentPage: data.pagination?.current_page || 1,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => { setDateFilter({ from: '', to: '' }); };
  const hasActiveFilters = dateFilter.from || dateFilter.to;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Commissions</h1>
        <p className="text-sm text-[#6b7280] mt-1">Track your commission earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Earned</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#059669]">
                {formatCurrency(totalEarned)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-[#059669]" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Commissions</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{pagination.total}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Average Commission</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {pagination.total > 0 ? formatCurrency(totalEarned / pagination.total) : formatCurrency(0)}
          </p>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-[#6b7280] flex-shrink-0" />
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[11px] font-medium text-[#6b7280] mb-1">From</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, from: e.target.value }))}
                className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5ff7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#6b7280] mb-1">To</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, to: e.target.value }))}
                className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5ff7] focus:border-transparent"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Commissions Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f1f5f9] px-5 py-4">
          <h2 className="text-base font-bold text-[#111827]">Commission History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : commissions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <TrendingUp className="h-6 w-6 text-[#059669]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No commissions yet</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              Commissions will appear here when your customers make transactions.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Description</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Reference</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3 text-sm text-[#111827]">{formatDate(commission.created_at)}</td>
                      <td className="px-5 py-3 text-sm text-[#111827]">{commission.description}</td>
                      <td className="px-5 py-3 text-sm font-mono text-[#6b7280]">{commission.reference}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-bold text-[#059669]">+{formatCurrency(commission.amount)}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">
                        {formatCurrency(commission.balance_after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-[#f1f5f9] px-5 py-3">
                <div className="text-xs text-[#6b7280]">
                  Page <span className="font-semibold text-[#111827]">{pagination.currentPage}</span> of{' '}
                  <span className="font-semibold text-[#111827]">{pagination.lastPage}</span> ·{' '}
                  <span className="font-semibold text-[#111827]">{pagination.total}</span> total
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => fetchCommissions(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </Button>
                  <span className="rounded-lg bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#111827]">
                    {pagination.currentPage} / {pagination.lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => fetchCommissions(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { Modal } from '@/components/shared/Modal';
import { agentService, AgentWallet, AgentTransaction } from '@/services/agent.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { useUIStore } from '@/store/ui.store';

export default function AgentWalletPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [wallet, setWallet] = useState<AgentWallet | null>(null);
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    amount: '',
    type: 'withdrawal' as 'withdrawal' | 'transfer_to_wallet',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchWallet(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { fetchTransactions(1); }, [filters]);

  const fetchWallet = async () => {
    try {
      const response = await agentService.getWallet();
      setWallet(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page: number) => {
    try {
      setTransactionsLoading(true);
      const response = await agentService.getWalletTransactions({
        ...filters,
        page,
        per_page: 15,
      });
      const data = response.data;
      setTransactions(data.data || []);
      setPagination({
        currentPage: data.pagination?.current_page || 1,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0,
        perPage: data.pagination?.per_page || 15,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestForm.amount || parseFloat(requestForm.amount) <= 0) {
      addToast({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await agentService.createFundRequest({
        amount: parseFloat(requestForm.amount),
        type: requestForm.type,
      });
      addToast({ message: 'Fund request submitted successfully', type: 'success' });
      setShowRequestModal(false);
      setRequestForm({ amount: '', type: 'withdrawal' });
      fetchWallet();
    } catch (error: any) {
      addToast({
        message: error?.response?.data?.message || 'Failed to submit request',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'commission': return <ArrowUpRight className="h-4 w-4 text-[#059669]" />;
      case 'withdrawal':
      case 'transfer_out': return <ArrowDownRight className="h-4 w-4 text-[#dc2626]" />;
      default: return <ArrowUpRight className="h-4 w-4 text-[#4a5ff7]" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
      commission: 'success',
      withdrawal: 'danger',
      transfer_out: 'danger',
      transfer_in: 'info',
      adjustment: 'warning',
    };
    return <Badge variant={variants[type] || 'info'}>{type.replace(/_/g, ' ')}</Badge>;
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ type: '', search: '' });
  };

  const hasActiveFilters = filters.type || filters.search;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">My Wallet</h1>
          <p className="text-sm text-[#6b7280] mt-1">View your balance and transaction history</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)} className="rounded-xl">
          Request Funds
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Available Balance</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-[#eef2ff] p-2.5">
              <Wallet className="h-5 w-5 text-[#4a5ff7]" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Earned</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#059669]">
            {formatCurrency(wallet?.total_earned || 0)}
          </p>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Withdrawn</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {formatCurrency(wallet?.total_withdrawn || 0)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by reference..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'commission', label: 'Commission' },
              { value: 'withdrawal', label: 'Withdrawal' },
              { value: 'transfer_in', label: 'Transfer In' },
              { value: 'transfer_out', label: 'Transfer Out' },
            ]}
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f1f5f9] px-5 py-4">
          <h2 className="text-base font-bold text-[#111827]">Transaction History</h2>
        </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[#6b7280]">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Type</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Description</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Reference</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3 text-sm text-[#111827]">{formatDate(tx.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          {getTypeBadge(tx.type)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#111827]">{tx.description}</td>
                      <td className="px-5 py-3 text-sm font-mono text-[#6b7280]">{tx.reference}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-bold ${
                          tx.type === 'commission' || tx.type === 'transfer_in' ? 'text-[#059669]' : 'text-[#dc2626]'
                        }`}>
                          {tx.type === 'commission' || tx.type === 'transfer_in' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">
                        {formatCurrency(tx.balance_after)}
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
                  Showing <span className="font-semibold text-[#111827]">{transactions.length}</span> of{' '}
                  <span className="font-semibold text-[#111827]">{pagination.total}</span> transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => fetchTransactions(pagination.currentPage - 1)}
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
                    onClick={() => fetchTransactions(pagination.currentPage + 1)}
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

      {/* Fund Request Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request Funds">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={requestForm.amount}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, amount: e.target.value }))}
              min="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
            <Select
              options={[
                { value: 'withdrawal', label: 'Withdraw to Bank' },
                { value: 'transfer_to_wallet', label: 'Transfer to Main Wallet' },
              ]}
              value={requestForm.type}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  type: e.target.value as 'withdrawal' | 'transfer_to_wallet',
                }))
              }
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleRequestSubmit} disabled={submitting} className="flex-1 rounded-xl">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

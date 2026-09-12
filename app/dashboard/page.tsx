'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  TrendingUp,
  Wallet,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatRelativeTime } from '@/utils/format.utils';
import { TRANSACTION_STATUSES } from '@/utils/constants';

type WalletData = {
  balance: number;
  currency?: string;
  total_spent?: number;
};

type TransactionData = {
  id: string | number;
  type?: string;
  transaction_type?: string;
  provider?: string;
  amount: number | string;
  status: string;
  created_at?: string;
  transaction_date?: string;
  reference?: string;
  metadata?: Record<string, any>;
  service_logo?: string | null;
};

const getTransactionIcon = (type: string, status: string) => {
  const normalizedType = type?.toLowerCase?.() || '';
  const normalizedStatus = status?.toLowerCase?.() || '';

  if (normalizedStatus === 'success') {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  } else if (normalizedStatus === 'pending') {
    return <Clock className="h-5 w-5 text-amber-500" />;
  } else if (normalizedStatus === 'failed') {
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  }

  return <CreditCard className="h-5 w-5 text-[#4a5ff7]" />;
};

const quickActions = [
  {
    href: '/dashboard/airtime',
    label: 'Buy Airtime',
    description: 'Top up any network instantly',
    image:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    href: '/dashboard/data',
    label: 'Buy Data',
    description: 'Activate data plans in seconds',
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    href: '/dashboard/bills',
    label: 'Pay Bills',
    description: 'Electricity, TV and utilities',
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    href: '/dashboard/settings',
    label: 'Account Settings',
    description: 'Manage profile and preferences',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [walletRes, transactionsRes] = await Promise.all([
          walletService.getBalance(),
          user?.id ? transactionService.getTransactions(String(user.id), { page: currentPage, per_page: 10 }) : Promise.resolve(null),
        ]);

        if (walletRes?.data) {
          setWallet(walletRes.data);
        }

        // Handle transaction response - it has nested structure with data.data
        if (transactionsRes && transactionsRes?.data?.data) {
          console.log('[Dashboard] Loaded transactions:', transactionsRes.data.data);
          setTransactions(transactionsRes.data.data);
          
          // Update pagination info
          if (transactionsRes.data.pagination) {
            setPagination({
              currentPage: transactionsRes.data.pagination.current_page || currentPage,
              lastPage: transactionsRes.data.pagination.last_page || 1,
              total: transactionsRes.data.pagination.total || 0,
              perPage: transactionsRes.data.pagination.per_page || 10,
            });
          }
        } else if (transactionsRes?.data) {
          console.log('[Dashboard] Transaction response:', transactionsRes.data);
          // Fallback in case structure is different
          const txData = transactionsRes.data as any;
          if (Array.isArray(txData)) {
            setTransactions(txData);
          }
        } else {
          console.warn('[Dashboard] No transaction data found in response:', transactionsRes);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, currentPage]);

  const monthlyTransactionsCount = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions.filter((transaction) => {
      const dateStr = transaction.created_at || transaction.transaction_date;
      if (!dateStr) return false;
      const createdAt = new Date(dateStr);
      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    }).length;
  }, [transactions]);

  const successfulTransactionsCount = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.status?.toLowerCase() === 'success'
    ).length;
  }, [transactions]);

  const getTransactionTimestamp = (transaction: TransactionData): string => {
    const dateStr = transaction.created_at || transaction.transaction_date;
    if (!dateStr) return 'Unknown';
    return dateStr;
  };

  const getTransactionTypeLabel = (transaction: TransactionData): string => {
    return transaction.transaction_type || transaction.type || 'Transaction';
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <section className="flex overflow-x-auto gap-5 pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-x-visible">
        <Card className="min-w-full md:min-w-auto rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] snap-start md:snap-start">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#6b7280]">Available Balance</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '₦0.00'}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                Ready for airtime, data, and bill payments
              </p>
            </div>

            <div className="rounded-2xl bg-[#eef2ff] p-3">
              <Wallet className="h-5 w-5 text-[#4a5ff7]" />
            </div>
          </div>
        </Card>

        <Card className="min-w-full md:min-w-auto rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] snap-start md:snap-start">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#6b7280]">Transactions This Month</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">
                {monthlyTransactionsCount}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                Completed activities for the current month
              </p>
            </div>

            <div className="rounded-2xl bg-[#eef2ff] p-3">
              <CreditCard className="h-5 w-5 text-[#4a5ff7]" />
            </div>
          </div>
        </Card>

        <Card className="min-w-full md:min-w-auto rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] snap-start md:snap-start">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#6b7280]">Lifetime Spend</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">
                {wallet ? formatCurrency(wallet.total_spent || 0, wallet.currency) : '₦0.00'}
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                Total value of all processed transactions
              </p>
            </div>

            <div className="rounded-2xl bg-[#eef2ff] p-3">
              <TrendingUp className="h-5 w-5 text-[#4a5ff7]" />
            </div>
          </div>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Jump straight into the most common services.
            </p>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-5 pb-2 snap-x snap-mandatory scrollbar-hide">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block min-w-full sm:min-w-[calc(50%-10px)] xl:min-w-[calc(25%-15px)] snap-start">
              <div className="overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div
                  className="relative h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${action.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold text-white">{action.label}</h3>
                    <p className="mt-1 text-sm text-white/85">{action.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-semibold text-[#111827]">
                    Open service
                  </span>
                  <div className="rounded-full bg-[#eef2ff] p-2 transition-colors group-hover:bg-[#4a5ff7]">
                    <ArrowRight className="h-4 w-4 text-[#4a5ff7] group-hover:text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                Recent Transactions
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Your latest account activity at a glance.
              </p>
            </div>

            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5ff7] hover:underline"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d1d5db] bg-[#fafafa] px-6 py-14 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#eef2ff]" />
              <h3 className="text-lg font-semibold text-[#111827]">
                No transactions yet
              </h3>
              <p className="mt-2 text-sm text-[#6b7280]">
                Once you start transacting, your latest activity will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Table Container - Hidden on mobile */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase">Transaction</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase">Details</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#6b7280] uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#6b7280] uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#6b7280] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const status =
                        TRANSACTION_STATUSES[
                          transaction.status as keyof typeof TRANSACTION_STATUSES
                        ];
                      const typeLabel = getTransactionTypeLabel(transaction);
                      const timestamp = getTransactionTimestamp(transaction);

                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-[#e5e7eb] transition-colors hover:bg-[#f9fafb]"
                        >
                          {/* Transaction Type */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {getTransactionIcon(typeLabel, transaction.status)}
                              </div>
                              <span className="text-sm font-semibold text-[#111827]">
                                {typeLabel}
                              </span>
                            </div>
                          </td>

                          {/* Reference */}
                          <td className="px-4 py-4">
                            {transaction.reference ? (
                              <code className="rounded bg-[#eef2ff] px-2 py-1 text-xs font-mono text-[#4a5ff7]">
                                {transaction.reference}
                              </code>
                            ) : (
                              <span className="text-xs text-[#9ca3af]">—</span>
                            )}
                          </td>

                          {/* Details (Service & Phone) */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-0.5 text-xs text-[#6b7280]">
                              {(() => {
                                const type = transaction.transaction_type || transaction.type;
                                if (type === 'Wallet Funding' || type === 'wallet_topup') {
                                  return <span className="capitalize text-[#111827] font-medium">Wallet Funding</span>;
                                }
                                if (type === 'Airtime Conversion' || type === 'airtime_conversion') {
                                  return <span className="capitalize text-[#111827] font-medium">Airtime Conversion</span>;
                                }
                                return null;
                              })()}
                              {transaction.metadata?.serviceID && (
                                <span className="capitalize text-[#111827] font-medium">
                                  {transaction.metadata.serviceID}
                                </span>
                              )}
                              {transaction.metadata?.phone && (
                                <span>{transaction.metadata.phone}</span>
                              )}
                              {!transaction.metadata?.serviceID && !transaction.metadata?.phone && (() => {
                                const type = transaction.transaction_type || transaction.type;
                                if (type !== 'Wallet Funding' && type !== 'wallet_topup' && type !== 'Airtime Conversion' && type !== 'airtime_conversion') {
                                  return <span className="text-[#9ca3af]">—</span>;
                                }
                                return null;
                              })()}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-[#111827]">
                              {typeof transaction.amount === 'string'
                                ? formatCurrency(parseFloat(transaction.amount), wallet?.currency)
                                : formatCurrency(transaction.amount, wallet?.currency)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <Badge variant={status?.color as any} size="sm">
                              {status?.label || transaction.status}
                            </Badge>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-xs text-[#6b7280]">
                              {formatRelativeTime(timestamp)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards view */}
              <div className="space-y-3 md:hidden">
                {transactions.map((transaction) => {
                  const status =
                    TRANSACTION_STATUSES[
                      transaction.status as keyof typeof TRANSACTION_STATUSES
                    ];
                  const typeLabel = getTransactionTypeLabel(transaction);
                  const timestamp = getTransactionTimestamp(transaction);

                  return (
                    <div
                      key={transaction.id}
                      className="rounded-[18px] border border-[#edf2f7] bg-[#fcfcfd] p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-bold text-[#111827]">
                            {typeLabel}
                          </p>
                          <p className="text-xs text-[#6b7280] mt-0.5">
                            {(() => {
                              const type = transaction.transaction_type || transaction.type;
                              if (type === 'Wallet Funding' || type === 'wallet_topup') {
                                return 'Wallet Funding';
                              }
                              if (type === 'Airtime Conversion' || type === 'airtime_conversion') {
                                return 'Airtime Conversion';
                              }
                              return transaction.metadata?.serviceID || '—';
                            })()}
                          </p>
                        </div>
                        <Badge variant={status?.color as any} size="sm">
                          {status?.label || transaction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-[#9ca3af] uppercase tracking-wide">Amount</p>
                          <p className="mt-1 font-bold text-[#111827]">
                            {typeof transaction.amount === 'string'
                              ? formatCurrency(parseFloat(transaction.amount), wallet?.currency)
                              : formatCurrency(transaction.amount, wallet?.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-[#9ca3af] uppercase tracking-wide">Date</p>
                          <p className="mt-1 text-[#6b7280]">{formatRelativeTime(timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col gap-4 border-t border-[#e5e7eb] pt-6 sm:gap-6">
                <div className="text-xs sm:text-sm text-[#6b7280]">
                  Showing <span className="font-semibold text-[#111827]">{transactions.length > 0 ? 1 : 0}</span> to{' '}
                  <span className="font-semibold text-[#111827]">{transactions.length}</span> of{' '}
                  <span className="font-semibold text-[#111827]">{pagination.total}</span> transactions
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-[#d1d5db] bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-1 sm:px-2">
                    <span className="text-xs sm:text-sm font-medium text-[#111827]">Page {currentPage}/{pagination.lastPage}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.lastPage, currentPage + 1))}
                    disabled={currentPage === pagination.lastPage}
                    className="inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-[#d1d5db] bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
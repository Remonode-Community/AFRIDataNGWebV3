'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Activity,
  Network,
  Zap,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { AdminTable } from '@/components/admin/AdminTable';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/shared/Spinner';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { adminService } from '@/services/admin.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  overview: {
    users: {
      total: number;
      verified: number;
      verification_rate: number;
      active_last_30_days: number;
      new_today: number;
      new_this_month: number;
    };
    transactions: {
      total_volume: number;
      volume_today: number;
      volume_this_month: number;
      month_growth_rate: string;
      total_count: number;
      completed_count: number;
      pending_count: number;
      failed_count: number;
    };
    vtu: {
      completed_transactions: number;
      volume: number;
      commission_earned: number;
      failed_count: number;
      success_rate: number;
    };
    wallet: {
      total_transactions: number;
      volume: number;
      active_wallets: number;
    };
    revenue: {
      total_commission: number;
      commission_today: number;
    };
    referrals: {
      total_referrals: number;
      active_referrers: number;
    };
    timestamp: string;
  };
  services: {
    vtu_by_network: Array<{
      network: string;
      transaction_count: number;
      volume: number;
      commission: number;
    }>;
    service_distribution: Array<{
      type: string;
      count: number;
      volume: number;
      percentage: number;
    }>;
    timestamp: string;
  };
  performance: {
    daily_trend_30_days: Array<{
      date: string;
      transaction_count: number;
      volume: number;
    }>;
    hourly_trend_today: Array<{
      hour: number;
      transaction_count: number;
      volume: number;
    }>;
    success_rate_by_type: Array<{
      type: string;
      total: number;
      successful: number;
      success_rate: number;
    }>;
    timestamp: string;
  };
  top_performers: {
    top_networks: Array<{
      network: string;
      transaction_count: number;
      volume: number;
    }>;
    top_users_by_volume: Array<{
      user_id: number;
      name: string;
      email: string;
      transaction_count: number;
      total_volume: number;
    }>;
    top_referrers: Array<{
      user_id: number;
      name: string;
      referral_count: number;
    }>;
    timestamp: string;
  };
  health: {
    transaction_health: {
      failed_last_24h: number;
      pending_stuck: number;
      status: string;
    };
    user_health: {
      unverified_users: number;
      email_unverified: number;
    };
    notification_health: {
      unread_count: number;
    };
    offers: {
      active_codes: number;
    };
    alerts: Array<{
      level: 'info' | 'warning' | 'error';
      message: string;
    }>;
    timestamp: string;
  };
  timestamp: string;
}

interface Transaction {
  id: string | number;
  user_id: number;
  transaction_type: string;
  amount: number;
  status: string;
  transaction_date: string;
  reference: string;
  metadata?: Record<string, any>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₦${(value / 1_000).toFixed(0)}K`;
  }
  return `₦${value.toLocaleString()}`;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: any; text: string }> = {
    completed: { variant: 'success', text: 'Completed' },
    pending: { variant: 'warning', text: 'Pending' },
    failed: { variant: 'error', text: 'Failed' },
  };

  const config = statusConfig[status?.toLowerCase()] || { variant: 'default', text: status };
  return <Badge variant={config.variant}>{config.text}</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[AdminDashboard] Fetching dashboard data...');
        
        // Use adminService to fetch dashboard data
        const response = await adminService.getDashboard();

        console.log('[AdminDashboard] Response received:', {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
        });

        if (response.success && response.data) {
          console.log('[AdminDashboard] Setting dashboard data');
          // response.data already contains the full dashboard object
          setData(response.data as unknown as DashboardData);
        } else {
          throw new Error(response.message || 'Invalid dashboard response');
        }
      } catch (err: any) {
        console.error('[AdminDashboard] Error fetching dashboard:', {
          message: err?.message,
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          url: err?.config?.url,
        });
        const errorMessage = err?.response?.data?.message 
          || err?.message 
          || 'Failed to load dashboard data. Please check your connection and try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setError(null);
    
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[AdminDashboard] Retrying dashboard fetch...');
        
        const response = await adminService.getDashboard();

        if (response.success && response.data) {
          console.log('[AdminDashboard] Retry successful');
          setData(response.data as unknown as DashboardData);
        } else {
          throw new Error(response.message || 'Invalid dashboard response');
        }
      } catch (err: any) {
        console.error('[AdminDashboard] Retry failed:', {
          message: err?.message,
          status: err?.response?.status,
        });
        const errorMessage = err?.response?.data?.message 
          || err?.message 
          || 'Failed to load dashboard data. Please check your connection and try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
        setRetrying(false);
      }
    };
    
    fetchDashboard();
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Spinner />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-[24px] border border-[#e5e7eb] bg-white p-8 text-center shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-sm text-[#6b7280] mb-6">
            {error || 'Failed to load dashboard data. Please check your connection and try again.'}
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4a5ff7] px-6 py-2 text-sm font-medium text-white hover:bg-[#3a4fe7] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Total Users',
      value: data.overview.users.total.toLocaleString(),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      subtext: `${data.overview.users.verified} verified (${data.overview.users.verification_rate.toFixed(1)}%)`,
    },
    {
      label: 'Monthly Volume',
      value: formatCompactCurrency(data.overview.transactions.volume_this_month),
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
      subtext: `Growth: ${data.overview.transactions.month_growth_rate}`,
    },
    {
      label: 'Daily Revenue',
      value: formatCurrency(data.overview.revenue.commission_today),
      icon: Wallet,
      color: 'bg-purple-50 text-purple-600',
      subtext: `Total: ${formatCompactCurrency(data.overview.revenue.total_commission)}`,
    },
    {
      label: 'VTU Success Rate',
      value: `${data.overview.vtu.success_rate.toFixed(1)}%`,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      subtext: `${data.overview.vtu.completed_transactions.toLocaleString()} completed`,
    },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-gray-50">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      <div className="space-y-5 p-3 sm:p-6 md:p-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section>
          <h1 className="text-3xl font-bold text-[#111827]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            Real-time system metrics and performance analytics
          </p>
        </section>

        {/* ── KPI Cards (Horizontally Scrollable) ────────────────────────── */}
        <section>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-x-visible lg:grid-cols-4">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card
                  key={kpi.label}
                  className="min-w-[280px] snap-start rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 md:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:min-w-0"
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#6b7280]">
                        {kpi.label}
                      </p>
                      <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-[#111827]">
                        {kpi.value}
                      </p>
                      <p className="mt-1 sm:mt-2 text-xs text-[#6b7280]">
                        {kpi.subtext}
                      </p>
                    </div>
                    <div className={`rounded-2xl ${kpi.color} p-2 sm:p-3 flex-shrink-0`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── Charts Grid ────────────────────────────────────────────────── */}
        <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Service Distribution */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-4 sm:mb-6 flex items-start gap-3 sm:gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-2 sm:p-3 flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#4a5ff7]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[#111827]">
                  Service Distribution
                </h3>
                <p className="text-xs text-[#6b7280]">
                  Transaction breakdown by service type
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {data.services.service_distribution && data.services.service_distribution.length > 0 ? (
                data.services.service_distribution.map((service) => (
                  <div key={service.type}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium text-[#111827] truncate">
                        {service.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#4a5ff7] flex-shrink-0">
                        {service.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                      <div
                        className="h-full rounded-full bg-[#4a5ff7]"
                        style={{ width: `${Math.max(service.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-[#6b7280]">No service distribution data available</p>
              )}
            </div>
          </Card>

          {/* Network Performance */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-4 sm:mb-6 flex items-start gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-2 sm:p-3 flex-shrink-0">
                <Network className="h-4 w-4 sm:h-5 sm:w-5 text-[#4a5ff7]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[#111827]">
                  Network Performance
                </h3>
                <p className="text-xs text-[#6b7280]">
                  VTU transactions by network
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {data.services.vtu_by_network && data.services.vtu_by_network.length > 0 ? (
                data.services.vtu_by_network.map((network) => (
                  <div
                    key={network.network}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#f1f5f9] pb-3 sm:pb-4 last:border-b-0 gap-2 sm:gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827]">
                        {network.network}
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        {network.transaction_count} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111827]">
                        {formatCompactCurrency(network.volume)}
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        {formatCompactCurrency(network.commission)} commission
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b7280]">No network performance data available</p>
              )}
            </div>
          </Card>
        </section>

        {/* ── Performance & Top Performers Grid ──────────────────────────– */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Success Rate by Type */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-3">
                <TrendingUp className="h-5 w-5 text-[#4a5ff7]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">
                  Success Rates
                </h3>
                <p className="text-xs text-[#6b7280]">
                  By transaction type
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.performance?.success_rate_by_type && data.performance.success_rate_by_type.length > 0 ? (
                data.performance.success_rate_by_type.map((type) => (
                  <div key={type.type}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#111827]">
                        {type.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {type.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${type.success_rate}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      {type.successful} of {type.total} successful
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b7280]">No success rate data available</p>
              )}
            </div>
          </Card>

          {/* Top Performers */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-3">
                <Zap className="h-5 w-5 text-[#4a5ff7]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">
                  Top Networks
                </h3>
                <p className="text-xs text-[#6b7280]">
                  By transaction volume
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data.top_performers?.top_networks && data.top_performers.top_networks.length > 0 ? (
                data.top_performers.top_networks.slice(0, 4).map((network, idx) => (
                  <div key={network.network} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#4a5ff7]">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-[#111827]">
                        {network.network}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#111827]">
                      {formatCompactCurrency(network.volume)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b7280]">No network data available</p>
              )}
            </div>
          </Card>
        </section>

        {/* ── Recent & Health Grid ───────────────────────────────────────– */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Top Users */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-3">
                <Users className="h-5 w-5 text-[#4a5ff7]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">
                  Top Users
                </h3>
                <p className="text-xs text-[#6b7280]">
                  By transaction volume
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {data.top_performers?.top_users_by_volume && data.top_performers.top_users_by_volume.length > 0 ? (
                data.top_performers.top_users_by_volume.slice(0, 5).map((user, idx) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#4a5ff7]">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {user.name}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {user.transaction_count} transactions
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#111827]">
                      {formatCompactCurrency(user.total_volume)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b7280]">No user data available</p>
              )}
            </div>
          </Card>

          {/* System Health */}
          <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-3">
                <Activity className="h-5 w-5 text-[#4a5ff7]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#111827]">
                  System Health
                </h3>
                <p className="text-xs text-[#6b7280]">
                  Status and alerts
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6b7280]">
                    Failed Transactions (24h)
                  </span>
                  <span className="text-lg font-bold text-[#111827]">
                    {data.health.transaction_health.failed_last_24h}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6b7280]">
                    Unverified Users
                  </span>
                  <span className="text-lg font-bold text-[#111827]">
                    {data.health.user_health.unverified_users}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6b7280]">
                    Active Offer Codes
                  </span>
                  <span className="text-lg font-bold text-[#111827]">
                    {data.health.offers.active_codes}
                  </span>
                </div>
              </div>

              {data.health?.alerts && data.health.alerts.length > 0 && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-xs font-semibold text-yellow-700">
                    Alerts
                  </p>
                  <div className="mt-2 space-y-2">
                    {data.health.alerts.slice(0, 2).map((alert, idx) => (
                      <p key={idx} className="text-xs text-yellow-600">
                        • {alert.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* ── Transaction Trends ─────────────────────────────────────────– */}
        <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef2ff] p-3">
              <Clock className="h-5 w-5 text-[#4a5ff7]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#111827]">
                Hourly Breakdown (Today)
              </h3>
              <p className="text-xs text-[#6b7280]">
                Transaction volume by hour
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            {data.performance?.hourly_trend_today && data.performance.hourly_trend_today.filter((h) => h.transaction_count > 0).length > 0 ? (
              data.performance.hourly_trend_today.filter((h) => h.transaction_count > 0).map((hour) => (
                <div
                  key={hour.hour}
                  className="rounded-2xl bg-[#f8fafc] p-4 text-center"
                >
                  <p className="text-xs font-medium text-[#6b7280]">
                    {hour.hour}:00
                  </p>
                  <p className="mt-2 text-lg font-bold text-[#111827]">
                    {hour.transaction_count}
                  </p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {formatCompactCurrency(hour.volume)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6b7280] col-span-full text-center">No hourly trend data available</p>
            )}
          </div>
        </Card>

        {/* ── Footer ─────────────────────────────────────────────────────– */}
        <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 text-center">
          <p className="text-xs text-[#6b7280]">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

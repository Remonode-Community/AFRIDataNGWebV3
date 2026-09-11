'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Users2,
  CheckCircle2,
  Smartphone,
  Shield,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { Spinner } from '@/components/shared/Spinner';
import { formatCurrency } from '@/utils/format.utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletStats {
  total_balance_all_users: number;
  active_wallets: number;
  average_balance: number;
  total_transactions: number;
  transaction_success_rate: number;
  daily_volume?: { count: number; value: number };
}

interface VTUStats {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  success_rate: number;
  total_volume: number;
  total_commission: number;
  average_transaction: number;
  by_network?: Record<string, { count: number; volume: number; success_rate?: number }>;
}

interface UserStats {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  active_users_30days: number;
  new_users_this_month: number;
  new_users_this_week: number;
  email_verified_users: number;
  verification_rate: number;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [vtuStats, setVTUStats] = useState<VTUStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const [walletResponse, vtuResponse, userResponse] = await Promise.all([
          adminService.getWalletStatistics().catch(() => null),
          adminService.getVTUTransactionStats().catch(() => null),
          adminService.getUserStats?.().catch(() => null),
        ]);

        if (walletResponse?.data) setWalletStats(walletResponse.data);
        if (vtuResponse?.data) setVTUStats(vtuResponse.data);
        if (userResponse?.data) setUserStats(userResponse.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ── Guard render ────────────────────────────────────────────────────────────

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Spinner />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">
            Loading analytics dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-5"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>


      {/* ── Wallet Stats Section ──────────────────────────────────────────── */}
      {walletStats && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">Wallet Statistics</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Platform wallet balances and transaction metrics
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Balance',
                value: formatCompactCurrency(walletStats.total_balance_all_users),
                icon: Wallet,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Active Wallets',
                value: walletStats.active_wallets.toLocaleString(),
                icon: Users2,
                color: 'bg-purple-50 text-purple-600',
              },
              {
                label: 'Avg. Balance',
                value: formatCurrency(walletStats.average_balance),
                icon: CreditCard,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Success Rate',
                value: `${walletStats.transaction_success_rate.toFixed(1)}%`,
                icon: CheckCircle2,
                color: 'bg-green-50 text-green-600',
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6b7280]">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-bold text-[#111827]">
                        {metric.value}
                      </p>
                    </div>
                    <div className={`rounded-2xl ${metric.color} p-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {walletStats.daily_volume && (
            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Today's Volume</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Transactions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#111827]">
                    {walletStats.daily_volume.count.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Volume
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#111827]">
                    {formatCompactCurrency(walletStats.daily_volume.value)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* ── VTU Stats Section ────────────────────────────────────────────── */}
      {vtuStats && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">VTU Transactions</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Airtime, data, bills, and other VTU service performance
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Transactions',
                value: vtuStats.total_transactions.toLocaleString(),
                icon: CreditCard,
                color: 'bg-orange-50 text-orange-600',
              },
              {
                label: 'Successful',
                value: vtuStats.successful_transactions.toLocaleString(),
                icon: CheckCircle2,
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Success Rate',
                value: `${vtuStats.success_rate.toFixed(1)}%`,
                icon: TrendingUp,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Total Volume',
                value: formatCompactCurrency(vtuStats.total_volume),
                icon: Wallet,
                color: 'bg-purple-50 text-purple-600',
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6b7280]">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-bold text-[#111827]">
                        {metric.value}
                      </p>
                    </div>
                    <div className={`rounded-2xl ${metric.color} p-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Commissions</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {formatCompactCurrency(vtuStats.total_commission)}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Total earned commissions
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Avg. Transaction</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {formatCurrency(vtuStats.average_transaction)}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Average per transaction
              </p>
            </Card>
          </div>

          {/* Network Breakdown */}
          {vtuStats.by_network && Object.keys(vtuStats.by_network).length > 0 && (
            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Network Performance</h3>
              <div className="mt-4 space-y-4">
                {Object.entries(vtuStats.by_network).map(([network, data]) => (
                  <div key={network} className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 last:border-b-0">
                    <div>
                      <p className="font-semibold text-[#111827]">{network}</p>
                      <p className="text-sm text-[#6b7280]">
                        {data.count} transactions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#111827]">
                        {formatCompactCurrency(data.volume)}
                      </p>
                      <p className="text-sm text-green-600">
                        {(data.success_rate ?? 0).toFixed(1)}% success
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      {/* ── User Stats Section ────────────────────────────────────────────── */}
      {userStats && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">User Statistics</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              User growth, verification rates, and active sessions
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Users',
                value: userStats.total_users.toLocaleString(),
                icon: Users2,
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Verified Users',
                value: userStats.verified_users.toLocaleString(),
                icon: Shield,
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Active (30d)',
                value: userStats.active_users_30days.toLocaleString(),
                icon: TrendingUp,
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Verification Rate',
                value: `${userStats.verification_rate.toFixed(1)}%`,
                icon: CheckCircle2,
                color: 'bg-purple-50 text-purple-600',
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6b7280]">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-bold text-[#111827]">
                        {metric.value}
                      </p>
                    </div>
                    <div className={`rounded-2xl ${metric.color} p-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">New This Month</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {userStats.new_users_this_month.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                New user registrations this month
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">New This Week</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {userStats.new_users_this_week.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                New user registrations this week
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Email Verified</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {userStats.email_verified_users.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Users with verified email addresses
              </p>
            </Card>

            <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-[#111827]">Unverified</h3>
              <p className="mt-2 text-3xl font-bold text-[#111827]">
                {userStats.unverified_users.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Users pending verification
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* ── Empty State ────────────────────────────────────────────────────– */}
      {!walletStats && !vtuStats && !userStats && (
        <Card className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 sm:p-8 text-center">
          <Smartphone className="mx-auto h-12 w-12 text-[#d1d5db]" />
          <p className="mt-4 text-sm font-medium text-[#6b7280]">
            No analytics data available yet
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">
            Statistics will appear here once transactions and users are recorded.
          </p>
        </Card>
      )}
    </div>
  );
}

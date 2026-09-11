'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { agentService, AgentDashboard } from '@/services/agent.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';

export default function AgentPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);

  useEffect(() => {
    if (user && !user.roles?.some((r) => r === 'agent')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await agentService.getDashboard();
        setDashboard(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.roles?.some((r) => r === 'agent')) {
      fetchDashboard();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Welcome back, {user?.first_name || 'Agent'}
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7280] mt-1">
          Here&apos;s an overview of your agent performance
        </p>
      </div>

      {/* Stats Cards — horizontally scrollable on mobile */}
      <section className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 sm:overflow-visible scrollbar-hide">
        {[
          { label: 'Wallet Balance', value: formatCurrency(dashboard?.wallet_balance || 0), sub: 'Available for withdrawal', icon: Wallet },
          { label: 'Total Earned', value: formatCurrency(dashboard?.total_earned || 0), sub: 'Lifetime commissions', icon: TrendingUp, valueColor: '#059669' },
          { label: 'This Month', value: formatCurrency(dashboard?.this_month_earnings || 0), sub: 'Monthly earnings', icon: CreditCard },
          { label: 'Customers', value: dashboard?.total_customers || 0, sub: 'Assigned to you', icon: Users },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 flex-shrink-0 w-[200px] sm:w-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wider">{stat.label}</p>
                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight" style={{ color: stat.valueColor || '#111827' }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] text-[#6b7280]">{stat.sub}</p>
              </div>
              <div className="rounded-xl bg-[#eef2ff] p-2 sm:p-2.5">
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#4a5ff7]" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-1">
        {[
          { label: 'My Wallet', href: '/agent/wallet', icon: Wallet },
          { label: 'Customers', href: '/agent/customers', icon: Users },
          { label: 'Commissions', href: '/agent/commissions', icon: TrendingUp },
          { label: 'Fund Requests', href: '/agent/fund-requests', icon: Clock },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-[140px] sm:w-auto">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#eef2ff] flex items-center justify-center mb-2 sm:mb-3">
                <action.icon size={18} className="text-[#4a5ff7]" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#111827]">{action.label}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f1f5f9] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#111827]">Recent Commissions</h2>
            <p className="mt-0.5 text-[11px] text-[#6b7280]">Your latest commission earnings</p>
          </div>
          <Link href="/agent/commissions">
            <Button variant="outline" size="sm" className="rounded-lg text-xs">
              View All
            </Button>
          </Link>
        </div>

        {!dashboard?.recent_commissions?.length ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc]">
              <TrendingUp className="h-6 w-6 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No commissions yet</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              Commissions will appear here when your customers make transactions.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Description</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Reference</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {dashboard.recent_commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3 text-sm text-[#6b7280]">{formatDate(commission.created_at)}</td>
                      <td className="px-5 py-3 text-sm text-[#111827] max-w-[200px] truncate">{commission.description}</td>
                      <td className="px-5 py-3 text-sm font-mono text-[#6b7280] max-w-[150px] truncate">{commission.reference}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-[#059669]">+{formatCurrency(commission.amount)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">{formatCurrency(commission.balance_after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {dashboard.recent_commissions.map((commission) => (
                <div key={commission.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#111827] truncate max-w-[70%]">{commission.description}</p>
                    <span className="text-sm font-bold text-[#059669] flex-shrink-0 ml-2">+{formatCurrency(commission.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#6b7280] truncate max-w-[60%] font-mono">{commission.reference}</p>
                    <span className="text-[11px] text-[#9ca3af]">{formatDate(commission.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { TrendingUp, Calendar } from 'lucide-react';

export default function AgentPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    setPerformance({
      sales_volume: 450,
      commission_earned: 22500,
      customer_count: 125,
      transaction_growth: '+18%',
      avg_daily_sales: 15,
      conversion_rate: '2.5%',
      top_service: 'Airtime',
      retention_rate: '78%',
      top_customer_orders: 12,
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Performance Metrics</h1>
          <p className="text-sm text-[#6b7280] mt-1">Track your sales and performance analytics</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5ff7]"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sales Volume', value: performance.sales_volume.toString(), subtitle: 'transactions' },
          { label: 'Commission Earned', value: `₦${performance.commission_earned.toLocaleString()}`, subtitle: 'total' },
          { label: 'Active Customers', value: performance.customer_count.toString(), subtitle: 'unique' },
          { label: 'Growth Rate', value: performance.transaction_growth, subtitle: 'vs last period' },
        ].map((metric) => (
          <Card key={metric.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{metric.value}</p>
            <p className="mt-1 text-xs text-[#6b7280]">{metric.subtitle}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-bold text-[#111827] mb-4">Key Performance Indicators</h2>
          <div className="space-y-3">
            {[
              { label: 'Avg Daily Sales', value: performance.avg_daily_sales + ' transactions' },
              { label: 'Conversion Rate', value: performance.conversion_rate },
              { label: 'Top Service', value: performance.top_service },
              { label: 'Customer Retention', value: performance.retention_rate },
            ].map((kpi) => (
              <div key={kpi.label} className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-xl">
                <span className="text-sm text-[#6b7280]">{kpi.label}</span>
                <span className="text-sm font-semibold text-[#111827]">{kpi.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-bold text-[#111827] mb-4">Weekly Sales Trend</h2>
          <div className="space-y-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const sales = Math.floor(Math.random() * 50 + 10);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#6b7280] w-10">{day}</span>
                  <div className="flex-1 bg-[#e5e7eb] rounded-full h-2">
                    <div
                      className="bg-[#4a5ff7] h-2 rounded-full"
                      style={{ width: Math.floor(Math.random() * 80 + 20) + '%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#111827] w-8 text-right">{sales}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <h2 className="text-base font-bold text-[#111827] mb-4">Performance by Service Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: 'Airtime', transactions: 225, commission: 11250, percentage: 50 },
            { name: 'Data', transactions: 154, commission: 8470, percentage: 34 },
            { name: 'Bills', transactions: 71, commission: 2780, percentage: 16 },
          ].map((service) => (
            <div key={service.name} className="border border-[#e5e7eb] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">{service.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Transactions</span>
                  <span className="font-medium text-[#111827]">{service.transactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Commission</span>
                  <span className="font-medium text-[#059669]">₦{service.commission.toLocaleString()}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#6b7280]">Of total sales</span>
                    <span className="text-xs font-medium text-[#111827]">{service.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#e5e7eb] rounded-full h-2">
                    <div className="bg-[#4a5ff7] h-2 rounded-full" style={{ width: service.percentage + '%' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
        <h2 className="text-base font-bold text-[#111827] mb-3">Performance Rewards</h2>
        <p className="text-sm text-[#6b7280] mb-4">
          Achieve higher sales targets to unlock bonus commission tiers and exclusive rewards.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { tier: 'Silver', sales: 500, bonus: '0.5%', status: 'active' },
            { tier: 'Gold', sales: 1000, bonus: '1%', status: 'progress' },
            { tier: 'Platinum', sales: 2000, bonus: '2%', status: 'locked' },
          ].map((tier) => (
            <div key={tier.tier} className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
              <p className="text-sm font-semibold text-[#111827]">{tier.tier}</p>
              <p className="text-xs text-[#6b7280] mt-1">{tier.sales} sales/month</p>
              <p className="text-sm text-[#059669] font-medium mt-2">+{tier.bonus} bonus</p>
              <span
                className={`inline-block text-xs px-2 py-1 rounded-lg mt-3 font-medium ${
                  tier.status === 'active'
                    ? 'bg-emerald-50 text-[#059669]'
                    : tier.status === 'progress'
                    ? 'bg-[#eef2ff] text-[#4a5ff7]'
                    : 'bg-[#f8fafc] text-[#6b7280]'
                }`}
              >
                {tier.status === 'active' ? 'Active' : tier.status === 'progress' ? 'In Progress' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

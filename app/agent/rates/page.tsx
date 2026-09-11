'use client';

import { useState, useEffect } from 'react';
import { Percent, DollarSign, CheckCircle, XCircle } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { agentService, AgentRate } from '@/services/agent.service';

export default function AgentRatesPage() {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<AgentRate[]>([]);

  useEffect(() => { fetchRates(); }, []);

  const fetchRates = async () => {
    try {
      const response = await agentService.getRates();
      setRates(response.data || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">My Rates</h1>
        <p className="text-sm text-[#6b7280] mt-1">Your agent-specific service rates</p>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f1f5f9] px-5 py-4">
          <h2 className="text-base font-bold text-[#111827]">
            Service Rates ({rates.length})
          </h2>
          <p className="mt-0.5 text-xs text-[#6b7280]">
            These are the rates configured for your agent account
          </p>
        </div>

        {rates.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Percent className="h-6 w-6 text-[#475569]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No custom rates</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              You don&apos;t have any custom service rates configured yet. Contact admin to set up your rates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Service ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Type</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Value</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Min Cap</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Max Cap</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-[#111827]">{rate.service_id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {rate.subsidy_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-[#6b7280]" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-[#6b7280]" />
                        )}
                        <span className="text-sm capitalize">{rate.subsidy_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-[#111827]">
                        {rate.subsidy_type === 'percentage' ? `${rate.subsidy_value}%` : `₦${rate.subsidy_value}`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-[#6b7280]">
                      {rate.min_discount_cap != null ? `₦${rate.min_discount_cap}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-[#6b7280]">
                      {rate.max_discount_cap != null ? `₦${rate.max_discount_cap}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {rate.enabled ? (
                        <Badge variant="success">
                          <CheckCircle size={14} className="mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <XCircle size={14} className="mr-1" />
                          Inactive
                        </Badge>
                      )}
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

'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft,
  Wallet,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
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

interface AgentDetail {
  id: number;
  user_id: number;
  status: string;
  commission_rate: number;
  notes: string | null;
  created_at: string;
  user: { id: number; first_name: string; last_name: string; email: string; phone_number: string };
  wallet: { balance: number; total_earned: number; total_withdrawn: number } | null;
  assignedBy: { id: number; first_name: string; last_name: string } | null;
}

interface AgentRate {
  id: number;
  service_id: string;
  subsidy_type: string;
  subsidy_value: number;
  min_discount_cap: number | null;
  max_discount_cap: number | null;
  enabled: boolean;
}

export default function AdminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rates, setRates] = useState<AgentRate[]>([]);
  const [editingRates, setEditingRates] = useState(false);
  const [rateForm, setRateForm] = useState<any[]>([]);
  const [savingRates, setSavingRates] = useState(false);
  const [updatingAgent, setUpdatingAgent] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');

  useEffect(() => { fetchAgent(); }, [id]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAdminAgent(parseInt(id));
      setAgent(response.data);
      // Also fetch related data
      const [walletRes, customersRes] = await Promise.all([
        adminService.getAdminAgentWallet(parseInt(id)),
        adminService.getAdminAgentCustomers(parseInt(id)),
      ]);
      setWallet(walletRes.data);
      setCustomers(customersRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async () => {
    try {
      const response = await adminService.getAdminAgent(parseInt(id));
      const agentData = response.data;
      // Rates come from the agent model relationships
      const ratesRes = await adminService.getAdminAgentCommissions(parseInt(id));
      setRates(agentData.service_rates || []);
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const handleToggleStatus = async (newStatus: string) => {
    if (!agent) return;
    try {
      setUpdatingAgent(true);
      await adminService.updateAdminAgent(agent.id, { status: newStatus });
      addToast({ message: `Agent ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`, type: 'success' });
      setAgent({ ...agent, status: newStatus });
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to update agent', type: 'error' });
    } finally {
      setUpdatingAgent(false);
    }
  };

  const handleSaveRates = async () => {
    if (!agent) return;
    try {
      setSavingRates(true);
      await adminService.updateAdminAgentRates(agent.id, rateForm);
      addToast({ message: 'Rates updated successfully', type: 'success' });
      setEditingRates(false);
      fetchAgent();
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to update rates', type: 'error' });
    } finally {
      setSavingRates(false);
    }
  };

  const handleAssignCustomer = async () => {
    if (!agent || !assignUserId) return;
    try {
      await adminService.assignAgentCustomer(agent.id, parseInt(assignUserId));
      addToast({ message: 'Customer assigned successfully', type: 'success' });
      setShowAssignModal(false);
      setAssignUserId('');
      fetchAgent();
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to assign customer', type: 'error' });
    }
  };

  const handleRemoveCustomer = async (userId: number) => {
    if (!agent) return;
    if (!confirm('Remove this customer from the agent?')) return;
    try {
      await adminService.removeAgentCustomer(agent.id, userId);
      addToast({ message: 'Customer removed successfully', type: 'success' });
      fetchAgent();
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to remove customer', type: 'error' });
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'customers', label: 'Customers' },
    { key: 'rates', label: 'Service Rates' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6b7280]">Agent not found</p>
        <Link href="/admin/agents" className="text-[#4a5ff7] text-sm mt-2 inline-block">Back to agents</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/agents" className="mt-1 p-2 rounded-lg hover:bg-[#f8fafc] transition-colors">
            <ArrowLeft size={20} className="text-[#6b7280]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              {agent.user?.first_name} {agent.user?.last_name}
            </h1>
            <p className="text-sm text-[#6b7280]">{agent.user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={agent.status === 'active' ? 'success' : agent.status === 'suspended' ? 'danger' : 'warning'}>
                {agent.status}
              </Badge>
              <span className="text-xs text-[#6b7280]">Commission: {agent.commission_rate}%</span>
              {agent.assignedBy && (
                <span className="text-xs text-[#6b7280]">
                  Assigned by: {agent.assignedBy.first_name} {agent.assignedBy.last_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agent.status === 'active' ? (
            <Button variant="outline" className="rounded-xl text-[#dc2626] border-[#dc2626]/30"
              onClick={() => handleToggleStatus('suspended')} disabled={updatingAgent}>
              {updatingAgent ? <Loader2 className="animate-spin" size={16} /> : 'Suspend Agent'}
            </Button>
          ) : (
            <Button className="rounded-xl" onClick={() => handleToggleStatus('active')} disabled={updatingAgent}>
              {updatingAgent ? <Loader2 className="animate-spin" size={16} /> : 'Activate Agent'}
            </Button>
          )}
        </div>
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Balance</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
                  {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-[#eef2ff] p-2.5"><Wallet className="h-5 w-5 text-[#4a5ff7]" /></div>
            </div>
          </Card>
          <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Earned</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[#059669]">
                  {formatCurrency(wallet?.total_earned || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2.5"><TrendingUp className="h-5 w-5 text-[#059669]" /></div>
            </div>
          </Card>
          <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Customers</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{customers.length}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5"><Users className="h-5 w-5 text-[#475569]" /></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'wallet' && wallet && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h3 className="text-base font-bold text-[#111827] mb-4">Wallet Details</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#f8fafc] rounded-xl">
              <p className="text-xs text-[#6b7280]">Balance</p>
              <p className="text-lg font-bold text-[#111827]">{formatCurrency(wallet.balance)}</p>
            </div>
            <div className="p-4 bg-[#f8fafc] rounded-xl">
              <p className="text-xs text-[#6b7280]">Total Earned</p>
              <p className="text-lg font-bold text-[#059669]">{formatCurrency(wallet.total_earned)}</p>
            </div>
            <div className="p-4 bg-[#f8fafc] rounded-xl">
              <p className="text-xs text-[#6b7280]">Total Withdrawn</p>
              <p className="text-lg font-bold text-[#111827]">{formatCurrency(wallet.total_withdrawn)}</p>
            </div>
          </div>
          {wallet.recent_transactions?.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-[#111827] mb-3">Recent Transactions</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#f1f5f9]">
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Date</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Type</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Description</th>
                      <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase text-[#6b7280]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.recent_transactions.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-[#f8fafc] last:border-0">
                        <td className="px-4 py-2 text-sm text-[#111827]">{formatDate(tx.created_at)}</td>
                        <td className="px-4 py-2 text-sm capitalize">{tx.type}</td>
                        <td className="px-4 py-2 text-sm text-[#6b7280]">{tx.description}</td>
                        <td className={`px-4 py-2 text-right text-sm font-bold ${
                          tx.type === 'commission' ? 'text-[#059669]' : 'text-[#dc2626]'
                        }`}>
                          {tx.type === 'commission' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {activeTab === 'customers' && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
          <div className="border-b border-[#f1f5f9] px-5 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Customers ({customers.length})</h3>
            <Button size="sm" className="rounded-lg text-xs" onClick={() => setShowAssignModal(true)}>
              Assign Customer
            </Button>
          </div>
          {customers.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#6b7280]">No customers assigned</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Customer</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Email</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-[#6b7280]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: any) => (
                    <tr key={customer.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa]">
                      <td className="px-5 py-3 text-sm font-semibold text-[#111827]">
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td className="px-5 py-3 text-sm text-[#6b7280]">{customer.email}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleRemoveCustomer(customer.id)}
                          className="p-1.5 rounded-lg text-[#dc2626] hover:bg-red-50 transition-colors"
                          title="Remove customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'rates' && (
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
          <div className="border-b border-[#f1f5f9] px-5 py-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Service Rates</h3>
            {!editingRates ? (
              <Button variant="outline" size="sm" className="rounded-lg text-xs"
                onClick={() => {
                  setRateForm(rates.length > 0 ? rates.map(r => ({
                    service_id: r.service_id,
                    subsidy_type: r.subsidy_type,
                    subsidy_value: r.subsidy_value,
                    min_discount_cap: r.min_discount_cap,
                    max_discount_cap: r.max_discount_cap,
                    enabled: r.enabled,
                  })) : [
                    { service_id: 'mtn-data', subsidy_type: 'percentage', subsidy_value: 2, min_discount_cap: null, max_discount_cap: null, enabled: true },
                    { service_id: 'mtn-airtime', subsidy_type: 'percentage', subsidy_value: 2, min_discount_cap: null, max_discount_cap: null, enabled: true },
                  ]);
                  setEditingRates(true);
                }}
              >
                Edit Rates
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg text-xs"
                  onClick={() => setEditingRates(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="rounded-lg text-xs" onClick={handleSaveRates} disabled={savingRates}>
                  {savingRates ? <Loader2 className="animate-spin" size={14} /> : 'Save Rates'}
                </Button>
              </div>
            )}
          </div>

          {!editingRates ? (
            rates.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Percent className="h-6 w-6 text-[#475569]" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#111827]">No custom rates</h3>
                <p className="mt-1 text-xs text-[#6b7280]">Click "Edit Rates" to configure agent-specific rates.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Service</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-[#6b7280]">Type</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-[#6b7280]">Value</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-[#6b7280]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate) => (
                      <tr key={rate.id} className="border-b border-[#f8fafc] last:border-0">
                        <td className="px-5 py-3 text-sm font-semibold text-[#111827]">{rate.service_id}</td>
                        <td className="px-5 py-3 text-sm capitalize">{rate.subsidy_type}</td>
                        <td className="px-5 py-3 text-right text-sm font-bold text-[#111827]">
                          {rate.subsidy_type === 'percentage' ? `${rate.subsidy_value}%` : `₦${rate.subsidy_value}`}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {rate.enabled ? (
                            <Badge variant="success"><CheckCircle size={14} className="mr-1" />Active</Badge>
                          ) : (
                            <Badge variant="danger"><XCircle size={14} className="mr-1" />Inactive</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="p-5 space-y-4">
              {rateForm.map((rate, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 border border-[#e5e7eb] rounded-xl">
                  <div>
                    <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Service ID</label>
                    <Input value={rate.service_id} onChange={(e) => {
                      const updated = [...rateForm];
                      updated[idx].service_id = e.target.value;
                      setRateForm(updated);
                    }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Type</label>
                    <Select
                      options={[{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed' }]}
                      value={rate.subsidy_type}
                      onChange={(e) => {
                        const updated = [...rateForm];
                        updated[idx].subsidy_type = e.target.value;
                        setRateForm(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Value</label>
                    <Input type="number" value={rate.subsidy_value} onChange={(e) => {
                      const updated = [...rateForm];
                      updated[idx].subsidy_value = parseFloat(e.target.value) || 0;
                      setRateForm(updated);
                    }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Min Cap</label>
                    <Input type="number" value={rate.min_discount_cap || ''} placeholder="Optional"
                      onChange={(e) => {
                        const updated = [...rateForm];
                        updated[idx].min_discount_cap = e.target.value ? parseFloat(e.target.value) : null;
                        setRateForm(updated);
                      }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6b7280] mb-1">Max Cap</label>
                    <Input type="number" value={rate.max_discount_cap || ''} placeholder="Optional"
                      onChange={(e) => {
                        const updated = [...rateForm];
                        updated[idx].max_discount_cap = e.target.value ? parseFloat(e.target.value) : null;
                        setRateForm(updated);
                      }} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="rounded-lg text-xs"
                onClick={() => setRateForm([...rateForm, {
                  service_id: '', subsidy_type: 'percentage', subsidy_value: 2,
                  min_discount_cap: null, max_discount_cap: null, enabled: true,
                }])}
              >
                + Add Rate
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Assign Customer Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Customer">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <Input
              type="number"
              placeholder="Enter user ID to assign"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAssignCustomer} className="flex-1 rounded-xl">
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

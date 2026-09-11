'use client';

import { useState, useEffect, useRef } from 'react';
import { Briefcase, Search, Eye, Plus, X, ChevronLeft, ChevronRight, Loader2, User } from 'lucide-react';
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

interface AdminAgent {
  id: number;
  user_id: number;
  status: string;
  commission_rate: number;
  notes: string | null;
  assigned_by: number | null;
  created_at: string;
  user: { id: number; first_name: string; last_name: string; email: string; phone_number: string };
  wallet: { balance: number; total_earned: number; total_withdrawn: number } | null;
}

interface SearchableUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export default function AdminAgentsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState({ total_agents: 0, active_agents: 0, suspended_agents: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ commission_rate: '2', notes: '' });
  const [creating, setCreating] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [searchableUsers, setSearchableUsers] = useState<SearchableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAgents(1); }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Search users when userSearchInput changes
  useEffect(() => {
    if (!showCreateModal) return;
    const timer = setTimeout(async () => {
      if (userSearchInput.length < 2) {
        setSearchableUsers([]);
        return;
      }
      try {
        setSearchingUsers(true);
        const response = await adminService.getUsers(1, 20, { search: userSearchInput });
        const users = response.data || [];
        setSearchableUsers((response.data as any) || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchInput, showCreateModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    if (showCreateModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCreateModal]);

  const fetchAgents = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminService.getAdminAgents(page, 20, {
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      const data = response.data;
      setAgents(data.data || []);
      setPagination({
        currentPage: data.pagination?.current_page || 1,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0,
      });
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!selectedUser) {
      addToast({ message: 'Please select a user', type: 'error' });
      return;
    }
    try {
      setCreating(true);
      await adminService.createAdminAgent({
        user_id: selectedUser.id,
        commission_rate: parseFloat(createForm.commission_rate) || 2,
        notes: createForm.notes || undefined,
      });
      addToast({ message: `Agent created for ${selectedUser.first_name} ${selectedUser.last_name}`, type: 'success' });
      setShowCreateModal(false);
      setCreateForm({ commission_rate: '2', notes: '' });
      setSelectedUser(null);
      setUserSearchInput('');
      setSearchableUsers([]);
      fetchAgents(1);
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || 'Failed to create agent', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning'> = {
      active: 'success',
      suspended: 'danger',
      inactive: 'warning',
    };
    return <Badge variant={variants[status] || 'warning'}>{status}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Agent Management</h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">Manage agents, their rates, and customers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="rounded-xl self-start sm:self-auto">
          <Plus size={16} className="mr-2" />
          Add Agent
        </Button>
      </div>

      {/* Stats — horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible scrollbar-hide">
        {[
          { label: 'Total Agents', value: stats.total_agents, color: '#111827' },
          { label: 'Active', value: stats.active_agents, color: '#059669' },
          { label: 'Suspended', value: stats.suspended_agents, color: '#dc2626' },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 flex-shrink-0 w-[160px] sm:w-auto">
            <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wider">{s.label}</p>
            <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex-1 min-w-[180px] sm:min-w-0">
            <Input
              placeholder="Search agents..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-36 flex-shrink-0">
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            />
          </div>
          {(filters.status || filters.search) && (
            <button
              onClick={() => { setSearchInput(''); setFilters({ status: '', search: '' }); }}
              className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] flex-shrink-0"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Agents Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : agents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc]">
              <Briefcase className="h-6 w-6 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No agents found</h3>
            <p className="mt-1 text-xs text-[#6b7280]">Create an agent to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Agent</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Rate</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Balance</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Earned</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Created</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {agent.user?.first_name?.[0]}{agent.user?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {agent.user?.first_name} {agent.user?.last_name}
                            </p>
                            <p className="text-xs text-[#6b7280]">{agent.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#111827]">{agent.commission_rate}%</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">{formatCurrency(agent.wallet?.balance || 0)}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-[#059669]">{formatCurrency(agent.wallet?.total_earned || 0)}</td>
                      <td className="px-5 py-3 text-center">{getStatusBadge(agent.status)}</td>
                      <td className="px-5 py-3 text-xs text-[#6b7280]">{formatDate(agent.created_at)}</td>
                      <td className="px-5 py-3 text-center">
                        <Link href={`/admin/agents/${agent.id}`}>
                          <Button variant="outline" size="sm" className="rounded-lg text-xs">
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {agents.map((agent) => (
                <div key={agent.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {agent.user?.first_name?.[0]}{agent.user?.last_name?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {agent.user?.first_name} {agent.user?.last_name}
                        </p>
                        <p className="text-[11px] text-[#6b7280] truncate">{agent.user?.email}</p>
                      </div>
                    </div>
                    <Link href={`/admin/agents/${agent.id}`}>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2">
                        <Eye size={16} />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(agent.status)}
                    <span className="text-[11px] text-[#6b7280]">{agent.commission_rate}% rate</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7280]">Balance: <span className="font-semibold text-[#111827]">{formatCurrency(agent.wallet?.balance || 0)}</span></span>
                    <span className="text-[#059669] font-semibold">{formatCurrency(agent.wallet?.total_earned || 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-[#f1f5f9] px-4 sm:px-5 py-3">
                <div className="text-xs text-[#6b7280]">
                  <span className="font-semibold text-[#111827]">{pagination.currentPage}</span>/{pagination.lastPage} · {pagination.total}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs px-2.5"
                    onClick={() => fetchAgents(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="rounded-lg bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#111827]">
                    {pagination.currentPage}/{pagination.lastPage}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs px-2.5"
                    onClick={() => fetchAgents(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Agent Modal */}
      <Modal isOpen={showCreateModal} onClose={() => {
        setShowCreateModal(false);
        setSelectedUser(null);
        setUserSearchInput('');
        setSearchableUsers([]);
      }} title="Add Agent">
        <div className="space-y-4">
          {/* User Search / Select */}
          <div ref={userSearchRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#eef2ff] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#4a5ff7]">
                      {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                    <p className="text-xs text-[#6b7280]">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserSearchInput('');
                  }}
                  className="p-1.5 rounded-lg hover:bg-white transition-colors text-[#6b7280]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Type at least 2 characters to search users..."
                  value={userSearchInput}
                  onChange={(e) => {
                    setUserSearchInput(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  icon={<Search size={16} />}
                />
                {showUserDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white shadow-lg max-h-60 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <Spinner size="sm" />
                        <span className="ml-2 text-sm text-[#6b7280]">Searching...</span>
                      </div>
                    ) : searchableUsers.length === 0 ? (
                      <div className="px-4 py-4 text-center">
                        <p className="text-sm text-[#6b7280]">
                          {userSearchInput.length < 2
                            ? 'Type at least 2 characters to search'
                            : 'No users found'}
                        </p>
                      </div>
                    ) : (
                      searchableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDropdown(false);
                            setUserSearchInput('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                        >
                          <div className="h-9 w-9 rounded-full bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#4a5ff7]">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#111827] truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                          </div>
                          <span className="text-[10px] text-[#6b7280] flex-shrink-0">ID: {user.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <Input
              type="number"
              placeholder="2.00"
              value={createForm.commission_rate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, commission_rate: e.target.value }))}
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Input
              placeholder="Optional notes"
              value={createForm.notes}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setSelectedUser(null);
              setUserSearchInput('');
              setSearchableUsers([]);
            }} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreateAgent} disabled={creating || !selectedUser} className="flex-1 rounded-xl">
              {creating ? <Loader2 className="animate-spin" size={18} /> : 'Create Agent'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

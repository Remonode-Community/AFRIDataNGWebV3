'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Send,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  Mail,
  MessageSquare,
  Megaphone,
  Smartphone,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { Modal } from '@/components/shared/Modal';
import { adminService } from '@/services/admin.service';
import { useUIStore } from '@/store/ui.store';
import { formatDate } from '@/utils/format.utils';

interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string;
  priority: string;
  read_at: string | null;
  created_at: string;
  user?: { id: number; first_name: string; last_name: string; email: string };
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

interface SearchableUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminNotificationsPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', priority: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMode, setSendMode] = useState<'single' | 'bulk' | 'broadcast'>('single');
  const [formData, setFormData] = useState({ title: '', body: '', type: 'system', priority: 'normal', channel: 'both' });
  const [sending, setSending] = useState(false);

  const [userSearchInput, setUserSearchInput] = useState('');
  const [searchableUsers, setSearchableUsers] = useState<SearchableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<SearchableUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchNotifications(1); fetchStats(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { fetchNotifications(1); }, [filters]);

  useEffect(() => {
    if (!showSendModal) return;
    const timer = setTimeout(async () => {
      if (userSearchInput.length < 2) { setSearchableUsers([]); return; }
      try {
        setSearchingUsers(true);
        const response = await adminService.getUsers(1, 20, { search: userSearchInput });
        setSearchableUsers((response.data as any) || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearchInput, showSendModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    if (showSendModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSendModal]);

  const fetchNotifications = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminService.getAdminNotifications(page, 20, {
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
      });
      const data = response.data;
      setNotifications(data.data || []);
      setPagination({
        currentPage: data.pagination?.current_page || 1,
        lastPage: data.pagination?.last_page || 1,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminService.getNotificationStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.body) {
      addToast({ message: 'Please fill in title and message', type: 'error' });
      return;
    }
    if (sendMode === 'single' && !selectedUser) {
      addToast({ message: 'Please select a user', type: 'error' });
      return;
    }
    if (sendMode === 'bulk' && selectedUsers.length === 0) {
      addToast({ message: 'Please select at least one user', type: 'error' });
      return;
    }
    try {
      setSending(true);
      if (sendMode === 'single') {
        await adminService.sendNotificationToUser(selectedUser!.id, formData.title, formData.body, formData.type, formData.priority, formData.channel);
        addToast({ message: `Notification sent to ${selectedUser!.first_name}`, type: 'success' });
      } else if (sendMode === 'bulk') {
        await adminService.sendNotificationToUsers(selectedUsers.map(u => u.id), formData.title, formData.body, formData.type, formData.priority, formData.channel);
        addToast({ message: `Notification sent to ${selectedUsers.length} users`, type: 'success' });
      } else {
        await adminService.sendBroadcastCampaign([], formData.title, formData.body, { type: formData.type, priority: formData.priority, channel: formData.channel });
        addToast({ message: 'Broadcast sent to all users', type: 'success' });
      }
      resetSendModal();
      fetchNotifications(pagination.currentPage);
      fetchStats();
    } catch (error: any) {
      addToast({ message: error?.response?.data?.message || error?.message || 'Failed to send notification', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const resetSendModal = () => {
    setShowSendModal(false);
    setFormData({ title: '', body: '', type: 'system', priority: 'normal', channel: 'both' });
    setSelectedUser(null);
    setSelectedUsers([]);
    setUserSearchInput('');
    setSearchableUsers([]);
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
      transaction: 'success',
      alert: 'danger',
      promotion: 'warning',
      system: 'info',
      update: 'info',
    };
    return <Badge variant={variants[type] || 'info'}>{type}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      high: 'danger',
      normal: 'info',
      low: 'warning',
    };
    return <Badge variant={variants[priority] || 'info'}>{priority}</Badge>;
  };

  const statCards = [
    { label: 'Total Sent', value: stats?.total || 0, icon: Bell, color: '#4a5ff7', bg: '#eef2ff' },
    { label: 'Unread', value: stats?.unread || 0, icon: Mail, color: '#d97706', bg: '#fef3c7' },
    { label: 'Read', value: stats?.read || 0, icon: MessageSquare, color: '#059669', bg: '#d1fae5' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">Notifications</h1>
          <p className="text-xs sm:text-sm text-[#6b7280] mt-1">Send and manage user notifications</p>
        </div>
        <Button onClick={() => setShowSendModal(true)} className="rounded-xl self-start sm:self-auto">
          <Send size={16} className="mr-2" />
          Send Notification
        </Button>
      </div>

      {/* Stats — horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-hide">
        {statCards.map((card) => (
          <Card key={card.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 flex-shrink-0 w-[160px] sm:w-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wider">{card.label}</p>
                <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">{card.value}</p>
              </div>
              <div className="rounded-xl p-2 sm:p-2.5" style={{ backgroundColor: card.bg }}>
                <card.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: card.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex-1 min-w-[200px] sm:min-w-0">
            <Input
              placeholder="Search notifications..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-32 sm:w-36 flex-shrink-0">
            <Select
              options={[
                { value: '', label: 'All Types' },
                { value: 'system', label: 'System' },
                { value: 'transaction', label: 'Transaction' },
                { value: 'promotion', label: 'Promotion' },
                { value: 'alert', label: 'Alert' },
                { value: 'update', label: 'Update' },
              ]}
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            />
          </div>
          <div className="w-28 sm:w-32 flex-shrink-0">
            <Select
              options={[
                { value: '', label: 'Priority' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
              ]}
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            />
          </div>
          {(filters.type || filters.priority || filters.search) && (
            <button
              onClick={() => { setSearchInput(''); setFilters({ type: '', priority: '', search: '' }); }}
              className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] flex-shrink-0"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {/* Notifications Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc]">
              <Bell className="h-6 w-6 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No notifications found</h3>
            <p className="mt-1 text-xs text-[#6b7280]">Send a notification to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Recipient</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Title</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Message</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Type</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Priority</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {notif.user ? `${notif.user.first_name?.[0]}${notif.user.last_name?.[0]}` : '—'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {notif.user ? `${notif.user.first_name} ${notif.user.last_name}` : '—'}
                            </p>
                            <p className="text-xs text-[#6b7280]">{notif.user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-[#111827] max-w-[200px] truncate">{notif.title}</td>
                      <td className="px-5 py-3 text-sm text-[#6b7280] max-w-[250px] truncate">{notif.body}</td>
                      <td className="px-5 py-3 text-center">{getTypeBadge(notif.type)}</td>
                      <td className="px-5 py-3 text-center">{getPriorityBadge(notif.priority)}</td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={notif.read_at ? 'success' : 'warning'}>
                          {notif.read_at ? 'Read' : 'Unread'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#6b7280]">{formatDate(notif.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {notifications.map((notif) => (
                <div key={notif.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {notif.user ? `${notif.user.first_name?.[0]}${notif.user.last_name?.[0]}` : '—'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">
                          {notif.user ? `${notif.user.first_name} ${notif.user.last_name}` : '—'}
                        </p>
                        <p className="text-[11px] text-[#6b7280] truncate">{notif.user?.email || '—'}</p>
                      </div>
                    </div>
                    <Badge variant={notif.read_at ? 'success' : 'warning'} className="flex-shrink-0 ml-2">
                      {notif.read_at ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827] truncate">{notif.title}</p>
                    <p className="text-xs text-[#6b7280] truncate mt-0.5">{notif.body}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(notif.type)}
                      {getPriorityBadge(notif.priority)}
                    </div>
                    <span className="text-[11px] text-[#9ca3af]">{formatDate(notif.created_at)}</span>
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
                    onClick={() => fetchNotifications(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="rounded-lg bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#111827]">
                    {pagination.currentPage}/{pagination.lastPage}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs px-2.5"
                    onClick={() => fetchNotifications(pagination.currentPage + 1)}
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

      {/* Send Notification Modal */}
      <Modal isOpen={showSendModal} onClose={resetSendModal} title="Send Notification">
        <div className="space-y-4">
          {/* Mode tabs — scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'single', label: 'Single', icon: Mail },
              { key: 'bulk', label: 'Multiple', icon: Users },
              { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => { setSendMode(mode.key as any); setSelectedUser(null); setSelectedUsers([]); }}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 sm:flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                  sendMode === mode.key
                    ? 'bg-[#111827] text-white'
                    : 'bg-[#f8fafc] text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f1f5f9]'
                }`}
              >
                <mode.icon size={14} />
                {mode.label}
              </button>
            ))}
          </div>

          {/* User selection — single */}
          {sendMode === 'single' && (
            <div ref={userSearchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 sm:px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{selectedUser.first_name} {selectedUser.last_name}</p>
                      <p className="text-xs text-[#6b7280] truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-white text-[#6b7280] flex-shrink-0 ml-2">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search users..."
                    value={userSearchInput}
                    onChange={(e) => { setUserSearchInput(e.target.value); setShowUserDropdown(true); }}
                    onFocus={() => setShowUserDropdown(true)}
                    icon={<Search size={16} />}
                  />
                  {showUserDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white shadow-lg max-h-60 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="flex items-center justify-center py-4"><Spinner size="sm" /></div>
                      ) : searchableUsers.length === 0 ? (
                        <div className="px-4 py-4 text-center text-sm text-[#6b7280]">
                          {userSearchInput.length < 2 ? 'Type to search' : 'No users found'}
                        </div>
                      ) : (
                        searchableUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => { setSelectedUser(user); setShowUserDropdown(false); setUserSearchInput(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f1f5f9] last:border-0"
                          >
                            <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{user.first_name?.[0]}{user.last_name?.[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User selection — bulk */}
          {sendMode === 'bulk' && (
            <div ref={userSearchRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Users</label>
              <div className="relative">
                <Input
                  placeholder="Search users..."
                  value={userSearchInput}
                  onChange={(e) => { setUserSearchInput(e.target.value); setShowUserDropdown(true); }}
                  onFocus={() => setShowUserDropdown(true)}
                  icon={<Search size={16} />}
                />
                {showUserDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white shadow-lg max-h-60 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="flex items-center justify-center py-4"><Spinner size="sm" /></div>
                    ) : searchableUsers.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-[#6b7280]">
                        {userSearchInput.length < 2 ? 'Type to search' : 'No users found'}
                      </div>
                    ) : (
                      searchableUsers.map((user) => {
                        const isSelected = selectedUsers.some(u => u.id === user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => {
                              if (isSelected) setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                              else setSelectedUsers([...selectedUsers, user]);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition-colors text-left border-b border-[#f1f5f9] last:border-0 ${isSelected ? 'bg-[#eef2ff]' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#4a5ff7] border-[#4a5ff7]' : 'border-[#d1d5db]'}`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{user.first_name?.[0]}{user.last_name?.[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate">{user.first_name} {user.last_name}</p>
                              <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} variant="info" className="flex items-center gap-1">
                      {u.first_name} {u.last_name}
                      <button onClick={() => setSelectedUsers(selectedUsers.filter(su => su.id !== u.id))} className="ml-1 hover:text-red-600">
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Broadcast notice */}
          {sendMode === 'broadcast' && (
            <div className="rounded-xl bg-[#fef3c7] border border-[#fde68a] p-3 sm:p-4">
              <p className="text-sm font-medium text-[#92400e]">Broadcast to All Users</p>
              <p className="text-xs text-[#a16207] mt-1">This notification will be sent to every registered user.</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              placeholder="Notification title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              placeholder="Notification message"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#4a5ff7] focus:border-transparent resize-none"
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'transaction', label: 'Transaction' },
                  { value: 'promotion', label: 'Promotion' },
                  { value: 'alert', label: 'Alert' },
                  { value: 'update', label: 'Update' },
                ]}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Select
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                ]}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>
          </div>

          {/* Channel — scrollable on mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { key: 'push', label: 'Push', icon: Smartphone },
                { key: 'email', label: 'Email', icon: Mail },
                { key: 'both', label: 'Both', icon: Send },
              ].map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, channel: ch.key })}
                  className={`flex items-center gap-1.5 rounded-xl px-3 sm:flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                    formData.channel === ch.key
                      ? 'bg-[#111827] text-white'
                      : 'bg-[#f8fafc] text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <ch.icon size={14} />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={resetSendModal} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending} className="flex-1 rounded-xl">
              {sending ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Send size={16} className="mr-2" />
                  {sendMode === 'broadcast' ? 'Broadcast' : 'Send'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

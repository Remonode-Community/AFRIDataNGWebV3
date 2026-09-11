'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  Shield,
  Users2,
  UserCheck,
  UserMinus,
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import { Modal } from '@/components/shared/Modal';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/utils/format.utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = 'active' | 'suspended' | 'inactive';

interface AdminUser {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  is_verified?: boolean;
  email_verified_at?: string | null;
  is_active?: string | number | boolean;
  balance_major?: number;
  status?: UserStatus;
  created_at?: string;
  transactions?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(
  status?: UserStatus | string
): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    active: 'success',
    suspended: 'danger',
    inactive: 'warning',
  };
  return map[status ?? ''] ?? 'info';
}

function Spinner() {
  return (
    <svg
      className="h-6 w-6 animate-spin text-[#4a5ff7]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(page, 10, {
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        verified: '',
      });

      console.log('[AdminUsers] Users response:', response);

      let userData: AdminUser[] = [];
      let pagination: { last_page?: number } | undefined;

      if (Array.isArray(response.data)) {
        userData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        userData = response.data.data;
        pagination = response.data;
      }

      if (!pagination && (response as any).pagination) {
        pagination = (response as any).pagination;
      }

      userData = userData.map((u) => ({
        ...u,
        status:
          u.status ||
          (u.is_active === '1' || u.is_active === 1 || u.is_active === true
            ? 'active'
            : 'inactive'),
        is_verified:
          typeof u.is_verified === 'boolean'
            ? u.is_verified
            : !!u.email_verified_at,
      }));

      setUsers(userData);
      setTotalPages(pagination?.last_page ?? 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await adminService.getRoles();
      console.log('[AdminUsers] Roles response:', { response });
      
      // API returns roles array directly or in response.data
      let rolesData = [];
      if (Array.isArray(response)) {
        rolesData = response;
      } else if (Array.isArray(response.data)) {
        rolesData = response.data;
      } else if (response?.data && Array.isArray(response.data)) {
        rolesData = response.data;
      }
      
      console.log('[AdminUsers] Processed roles:', { rolesData });
      setRoles(rolesData);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers(currentPage);
    if (roles.length === 0) fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleOpenRoleModal = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedRole('');
    
    // Fetch roles if not already loaded
    if (roles.length === 0) {
      await fetchRoles();
    }
    
    setShowRoleModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    try {
      await adminService.assignRoleToUser(
        Number(selectedUser.id),
        Number(selectedRole)
      );
      setShowRoleModal(false);
      setSelectedRole('');
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone_number ?? '').includes(searchTerm);
      const matchesStatus =
        statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    return { total: users.length, active, suspended, inactive };
  }, [users]);

  // ── Guard render ────────────────────────────────────────────────────────────

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Spinner />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">Loading users…</p>
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



      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <section className="flex gap-3 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 md:overflow-x-visible xl:grid-cols-4">
        {[
          {
            title: 'All Users',
            value: summary.total,
            note: 'Registered user accounts',
            Icon: Users2,
          },
          {
            title: 'Active Accounts',
            value: summary.active,
            note: 'Users currently active',
            Icon: UserCheck,
          },
          {
            title: 'Suspended Accounts',
            value: summary.suspended,
            note: 'Restricted user accounts',
            Icon: ShieldCheck,
          },
          {
            title: 'Inactive Accounts',
            value: summary.inactive,
            note: 'Dormant or unused accounts',
            Icon: UserMinus,
          },
        ].map(({ title, value, note, Icon }) => (
          <Card
            key={title}
            className="min-w-[250px] snap-start rounded-[24px] border border-[#e5e7eb] bg-white p-4 sm:p-5 md:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:min-w-0"
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[#6b7280]">{title}</p>
                <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                  {value}
                </p>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#6b7280]">{note}</p>
              </div>
              <div className="rounded-2xl bg-[#eef2ff] p-2 sm:p-3 flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#4a5ff7]" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-5 md:p-6">
        <div className="mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Filters
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">
            Search by name, email, or phone and narrow results by account
            status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1fr_220px_220px]">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
              size={18}
            />
            <Input
              label="Search"
              placeholder="Search by name, email, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="pl-11"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#374151]">
              Status Filter
            </label>
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                size={18}
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | UserStatus);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-xl border border-[#d1d5db] bg-white pl-11 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Count */}
          <div className="flex items-end">
            <div className="flex h-11 w-full items-center rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 text-sm font-medium text-[#6b7280]">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>
      </Card>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#f1f5f9] px-6 py-5">
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            User Records
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Review account information, status, and user activity.
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef2ff]">
              <Users2 className="h-8 w-8 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#111827]">
              No users found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6b7280]">
              No users match your current search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    {[
                      'User',
                      'Email',
                      'Phone',
                      'Status',
                      'Verified',
                      'Joined',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#6b7280] ${
                          h === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#f8fafc] transition-colors hover:bg-[#fafafa]"
                    >
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4a5ff7]">
                            {u.first_name.charAt(0)}
                            {u.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-xs text-[#9ca3af]">
                              ID: {u.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {u.phone_number ?? '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(u.status)} size="sm">
                          {u.status ?? 'active'}
                        </Badge>
                      </td>

                      {/* Verified */}
                      <td className="px-6 py-4">
                        <Badge
                          variant={u.is_verified ? 'success' : 'warning'}
                          size="sm"
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {formatDate(u.created_at ?? '')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                          >
                            <Eye size={15} />
                            View
                          </button>
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#6b7280] transition hover:bg-[#f1f5f9]"
                          >
                            <Shield size={15} />
                            Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 p-4 xl:hidden">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-[22px] border border-[#edf2f7] bg-[#fcfcfd] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4a5ff7]">
                        {u.first_name.charAt(0)}
                        {u.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#111827]">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-sm text-[#6b7280] truncate">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(u.status)} size="sm">
                      {u.status ?? 'active'}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-[#111827]">
                        {u.phone_number ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Verified
                      </p>
                      <p className="mt-1">
                        <Badge
                          variant={u.is_verified ? 'success' : 'warning'}
                          size="sm"
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Joined
                      </p>
                      <p className="mt-1 text-sm text-[#111827]">
                        {formatDate(u.created_at ?? '')}
                      </p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                      >
                        <Eye size={15} />
                        View
                      </button>
                      <button
                        onClick={() => handleOpenRoleModal(u)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#6b7280] transition hover:bg-[#f1f5f9]"
                      >
                        <Shield size={15} />
                        Role
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-[24px] border border-[#e5e7eb] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6b7280]">
          Showing{' '}
          <span className="font-semibold text-[#111827]">
            {filteredUsers.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-[#111827]">{users.length}</span>{' '}
          users
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-[#d1d5db] px-4"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <div className="rounded-xl bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#111827]">
            {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            className="h-11 rounded-xl border-[#d1d5db] px-4"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* ── User Details Modal ───────────────────────────────────────────── */}
      {showDetails && selectedUser && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="User Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Name',
                  value: `${selectedUser.first_name} ${selectedUser.last_name}`,
                },
                { label: 'Email', value: selectedUser.email },
                {
                  label: 'Phone',
                  value: selectedUser.phone_number ?? 'N/A',
                },
                {
                  label: 'Balance',
                  value: `₦${(selectedUser.balance_major ?? 0).toLocaleString()}`,
                },
                {
                  label: 'Joined',
                  value: formatDate(selectedUser.created_at ?? ''),
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {value}
                  </p>
                </div>
              ))}

              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="mt-1">
                  <Badge variant={getStatusVariant(selectedUser.status)}>
                    {selectedUser.status ?? 'active'}
                  </Badge>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">
                  Verification
                </p>
                <p className="mt-1">
                  <Badge
                    variant={selectedUser.is_verified ? 'success' : 'warning'}
                  >
                    {selectedUser.is_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Assign Role Modal ────────────────────────────────────────────── */}
      {showRoleModal && selectedUser && (
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Assign Role to User"
          size="md"
        >
          <div className="space-y-5">
            {/* User Info */}
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                User
              </p>
              <p className="mt-2 text-sm font-medium text-[#111827]">
                {selectedUser?.first_name} {selectedUser?.last_name}
              </p>
              <p className="text-xs text-[#6b7280]">
                {selectedUser?.email}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Select Role
              </label>
              {loadingRoles ? (
                <div className="flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-8">
                  <Spinner />
                  <span className="ml-2 text-sm text-[#6b7280]">Loading roles…</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="rounded-lg border border-[#fcd34d] bg-[#fef3c7] p-4 text-sm text-[#92400e]">
                  No roles available. Please contact an administrator.
                </div>
              ) : (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                >
                  <option value="">Select a role…</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleAssignRole}
                disabled={!selectedRole || loadingRoles}
                className="flex-1"
              >
                Assign Role
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRoleModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
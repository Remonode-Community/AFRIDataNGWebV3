'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useUIStore } from '@/store/ui.store';
import { adminService } from '@/services/admin.service';
import { Spinner } from '@/components/shared/Spinner';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { AirtimeConversion, AirtimeConversionFilters, AirtimeNetwork } from '@/types/api.types';

interface FilterState {
  status?: string;
  network?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

const NETWORKS: AirtimeNetwork[] = ['MTN', 'Airtel', '9mobile', 'Glo'];
const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'purple' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'failed', label: 'Failed', color: 'red' },
];

export default function AirtimeConversionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useUIStore();

  const [conversions, setConversions] = useState<AirtimeConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get('status') || undefined,
    network: searchParams.get('network') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'date',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
  });

  const fetchConversions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAirtimeConversions({
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      } as AirtimeConversionFilters);

      const paginatedData = response.data;
      if (paginatedData && Array.isArray(paginatedData.data)) {
        setConversions(paginatedData.data);
        setPagination((prev) => ({
          ...prev,
          total: paginatedData.total ?? 0,
          lastPage: paginatedData.last_page ?? 1,
        }));
      }
    } catch (error) {
      console.error('Error fetching conversions:', error);
      addToast({ type: 'error', message: 'Error fetching airtime conversions' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, filters, addToast]);

  useEffect(() => {
    fetchConversions();
  }, [fetchConversions]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'danger' | 'warning' | 'info' => {
    const statusObj = STATUSES.find((s) => s.value === status);
    const colorMap: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
      yellow: 'warning',
      blue: 'info',
      purple: 'info',
      green: 'success',
      red: 'danger',
      gray: 'default',
    };
    return colorMap[statusObj?.color || 'gray'] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': case 'failed': return <XCircle className="h-4 w-4" />;
      case 'processing': case 'confirmed': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const pendingCount = conversions.filter((c) => c.status === 'pending').length;
  const totalAmount = conversions.reduce((sum, c) => {
    const v = typeof c.discounted_amount === 'string' ? parseFloat(c.discounted_amount) : (c.discounted_amount || 0);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const safeFormatCurrency = (value: any): string => {
    if (!value && value !== 0) return formatCurrency(0);
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return formatCurrency(isNaN(n) ? 0 : n);
  };

  const statCards = [
    { label: 'Pending', value: pendingCount, icon: AlertCircle, color: '#d97706', bg: '#fef3c7' },
    { label: 'In Queue', value: safeFormatCurrency(totalAmount), icon: TrendingUp, color: '#4a5ff7', bg: '#eef2ff' },
    { label: 'Total', value: pagination.total, icon: TrendingUp, color: '#059669', bg: '#d1fae5' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Airtime Conversions</h1>
            <p className="text-sm text-gray-600 mt-1">Manage user airtime to cash conversion requests</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/admin/airtime-conversions/analytics')}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <TrendingUp className="h-5 w-5" />
            Analytics
          </Button>
        </div>

        {/* Quick Stats — horizontally scrollable on mobile */}
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible scrollbar-hide">
          {statCards.map((card) => (
            <Card key={card.label} className="p-4 sm:p-6 flex-shrink-0 w-[170px] sm:w-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className="rounded-xl p-2 sm:p-3" style={{ backgroundColor: card.bg }}>
                  <card.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: card.color }} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters & Search */}
        <Card className="p-3 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversions..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7] focus:border-transparent"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 flex-shrink-0">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>

            {showFilters && (
              <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible lg:grid-cols-5 pt-3 border-t border-gray-200 scrollbar-hide">
                <div className="min-w-[140px] sm:min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7]"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[140px] sm:min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                  <select
                    value={filters.network || ''}
                    onChange={(e) => handleFilterChange('network', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7]"
                  >
                    <option value="">All Networks</option>
                    {NETWORKS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[150px] sm:min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7]"
                  />
                </div>
                <div className="min-w-[150px] sm:min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7]"
                  />
                </div>
                <div className="min-w-[130px] sm:min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy || 'date'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4a5ff7]"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : conversions.length === 0 ? (
            <div className="px-4 sm:px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc]">
                <AlertCircle className="h-6 w-6 text-[#4a5ff7]" />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No conversions found</p>
              <p className="mt-1 text-xs text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">User</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Network</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Commission</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</th>
                      <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {conversions.map((conversion) => (
                      <tr key={conversion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {conversion.user?.first_name?.[0]}{conversion.user?.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {conversion.user?.first_name} {conversion.user?.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{conversion.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="default">{conversion.network}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-900">{safeFormatCurrency(conversion.amount)}</p>
                          <p className="text-[11px] text-gray-500">{safeFormatCurrency(conversion.discounted_amount)} received</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-red-600">
                          {safeFormatCurrency(conversion.commission)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(conversion.status)}
                            <Badge variant={getStatusBadgeVariant(conversion.status)}>
                              {STATUSES.find((s) => s.value === conversion.status)?.label || conversion.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {formatDate(conversion.created_at)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/airtime-conversions/${conversion.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {conversions.map((conversion) => (
                  <div key={conversion.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-[#4a5ff7] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {conversion.user?.first_name?.[0]}{conversion.user?.last_name?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {conversion.user?.first_name} {conversion.user?.last_name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{conversion.user?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/airtime-conversions/${conversion.id}`)}
                        className="flex-shrink-0 ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default">{conversion.network}</Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(conversion.status)}
                          <Badge variant={getStatusBadgeVariant(conversion.status)}>
                            {STATUSES.find((s) => s.value === conversion.status)?.label || conversion.status}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">{formatDate(conversion.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{safeFormatCurrency(conversion.amount)}</span>
                      <span className="text-red-600 font-medium">-{safeFormatCurrency(conversion.commission)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.lastPage > 1 && (
                <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">{pagination.page}</span>/{pagination.lastPage} · {pagination.total}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg text-xs px-2.5"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-900">
                      {pagination.page}/{pagination.lastPage}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-lg text-xs px-2.5"
                      disabled={pagination.page === pagination.lastPage}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

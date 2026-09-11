'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminStats } from '@/components/admin/AdminStats';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { formatDate, formatCurrency } from '@/utils/format.utils';
import { Modal } from '@/components/shared/Modal';

interface OfferCode {
  id: number;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  expires_at: string;
  usage_limit: number;
  per_user_limit: number;
  active: boolean;
  uses: number;
  conditions?: Record<string, any>;
  revenue_impact?: number;
}

export default function AdminOfferCodesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offerCodes, setOfferCodes] = useState<OfferCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    active: '',
    search: '',
  });
  const [selectedOffer, setSelectedOffer] = useState<OfferCode | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'flat',
    value: '',
    expires_at: '',
    usage_limit: '',
    per_user_limit: '',
    active: true,
  });

  const isAdmin = useMemo(() => {
    return Boolean(user?.roles?.some((role) => role === 'admin'));
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  const fetchOfferCodes = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminService.getOfferCodes(page, 20, filters);

      if (response?.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.data || [];
        setOfferCodes(data);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.last_page || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching offer codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferCodes(currentPage);
  }, [currentPage, filters]);

  const handleFilter = (newFilters: Partial<{ active: string; search: string }>) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({ active: '', search: '' });
    setCurrentPage(1);
  };

  const handleCreateOrUpdate = async () => {
    try {
      const payload = {
        ...formData,
        value: Number(formData.value),
        usage_limit: Number(formData.usage_limit),
        per_user_limit: Number(formData.per_user_limit),
      };

      if (selectedOffer?.id) {
        await adminService.updateOfferCode(selectedOffer.id, payload);
      } else {
        await adminService.createOfferCode(payload);
      }

      setShowForm(false);
      setFormData({
        code: '',
        type: 'flat',
        value: '',
        expires_at: '',
        usage_limit: '',
        per_user_limit: '',
        active: true,
      });
      setSelectedOffer(null);
      fetchOfferCodes(currentPage);
    } catch (error) {
      console.error('Error saving offer code:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedOffer) return;
    try {
      await adminService.deleteOfferCode(selectedOffer.id);
      setShowDetails(false);
      setSelectedOffer(null);
      fetchOfferCodes(currentPage);
    } catch (error) {
      console.error('Error deleting offer code:', error);
    }
  };

  const statsItems = [
    {
      title: 'Total Codes',
      value: offerCodes.length,
      change: { value: '+5.2%', direction: 'up' as const },
    },
    {
      title: 'Active Codes',
      value: offerCodes.filter((o) => o.active).length,
      change: { value: '+2.1%', direction: 'up' as const },
    },
    {
      title: 'Total Usage',
      value: offerCodes.reduce((sum, o) => sum + (o.uses || 0), 0),
      change: { value: '+15.3%', direction: 'up' as const },
    },
    {
      title: 'Avg Usage/Code',
      value: offerCodes.length > 0 ? Math.round(offerCodes.reduce((sum, o) => sum + (o.uses || 0), 0) / offerCodes.length) : 0,
      change: { value: '+8.5%', direction: 'up' as const },
    },
  ];

  const filterConfigs = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Offer code...',
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const tableColumns = [
    {
      key: 'code',
      label: 'Code',
      width: '150px',
    },
    {
      key: 'type',
      label: 'Type',
      width: '100px',
      render: (value: string) => (
        <Badge variant="info">
          {value === 'percentage' ? `${value}` : value}
        </Badge>
      ),
    },
    {
      key: 'value',
      label: 'Value',
      width: '100px',
      render: (value: number, row: OfferCode) =>
        row.type === 'percentage' ? `${value}%` : formatCurrency(value),
    },
    {
      key: 'uses',
      label: 'Uses',
      width: '80px',
    },
    {
      key: 'active',
      label: 'Status',
      width: '100px',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'warning'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'expires_at',
      label: 'Expires',
      width: '150px',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'id',
      label: 'Actions',
      width: '150px',
      align: 'center' as const,
      render: (value: number, row: OfferCode) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOffer(row);
              setShowDetails(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOffer(row);
              setFormData({
                code: row.code,
                type: row.type,
                value: String(row.value),
                expires_at: row.expires_at,
                usage_limit: String(row.usage_limit),
                per_user_limit: String(row.per_user_limit),
                active: row.active,
              });
              setShowForm(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <AdminHeader
        title="Offer Codes"
        description="Manage promotional codes and discounts"
        action={{
          label: '+ New Code',
          onClick: () => {
            setSelectedOffer(null);
            setFormData({
              code: '',
              type: 'flat',
              value: '',
              expires_at: '',
              usage_limit: '',
              per_user_limit: '',
              active: true,
            });
            setShowForm(true);
          },
        }}
      />

      <AdminStats stats={statsItems} />

      <AdminFilters
        filters={filterConfigs}
        values={filters}
        onFilter={handleFilter}
        onReset={handleReset}
        loading={loading}
      />

      <AdminTable
        columns={tableColumns}
        data={offerCodes}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        total={offerCodes.length}
        onPageChange={setCurrentPage}
        title="All Offer Codes"
        perPage={20}
      />

      {showDetails && selectedOffer && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Offer Code Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Code</p>
                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-gray-900">
                  {selectedOffer.code}
                  <button className="text-gray-400 hover:text-gray-600">
                    <Copy className="h-4 w-4" />
                  </button>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="mt-1">
                  <Badge variant="info">{selectedOffer.type}</Badge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Value</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedOffer.type === 'percentage'
                    ? `${selectedOffer.value}%`
                    : formatCurrency(selectedOffer.value)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="mt-1">
                  <Badge variant={selectedOffer.active ? 'success' : 'warning'}>
                    {selectedOffer.active ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expires</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatDate(selectedOffer.expires_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Uses</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedOffer.uses} / {selectedOffer.usage_limit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Per User Limit</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedOffer.per_user_limit}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowDetails(false);
                  setFormData({
                    code: selectedOffer.code,
                    type: selectedOffer.type,
                    value: String(selectedOffer.value),
                    expires_at: selectedOffer.expires_at,
                    usage_limit: String(selectedOffer.usage_limit),
                    per_user_limit: String(selectedOffer.per_user_limit),
                    active: selectedOffer.active,
                  });
                  setShowForm(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={selectedOffer ? 'Edit Offer Code' : 'Create Offer Code'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., WELCOME50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#a9b7ff] focus:ring-[#a9b7ff]"
                >
                  <option value="flat">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'percentage' ? '50' : '500'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Limit
                </label>
                <Input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Per User Limit
                </label>
                <Input
                  type="number"
                  value={formData.per_user_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires At
              </label>
              <Input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#a9b7ff]"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateOrUpdate}
              >
                {selectedOffer ? 'Update' : 'Create'} Code
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowForm(false)}
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

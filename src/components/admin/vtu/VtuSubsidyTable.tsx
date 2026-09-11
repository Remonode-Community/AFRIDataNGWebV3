'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Percent, Settings, Search } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { SubsidyConfigModal } from './SubsidyConfigModal';
import type { ServiceSubsidyConfig } from '@/types/vtu.types';

export function VtuSubsidyTable() {
  const [services, setServices] = useState<ServiceSubsidyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [configuringService, setConfiguringService] = useState<ServiceSubsidyConfig | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getVTUServices();
      if (response.success && response.data) {
        setServices(response.data as unknown as ServiceSubsidyConfig[]);
      }
    } catch (err) {
      console.error('Failed to fetch VTU services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleToggle = async (serviceId: string) => {
    try {
      setTogglingId(serviceId);
      const response = await adminService.toggleVTUSubsidy(serviceId);
      if (response.success && response.data) {
        const data = response.data as unknown as { service_id: string; subsidy_enabled: boolean };
        setServices((prev) =>
          prev.map((s) =>
            s.service_id === data.service_id
              ? { ...s, subsidy_enabled: data.subsidy_enabled }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle subsidy:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfigSave = (updated: ServiceSubsidyConfig) => {
    setServices((prev) =>
      prev.map((s) =>
        s.service_id === updated.service_id ? updated : s
      )
    );
    setConfiguringService(null);
  };

  const filteredServices = services.filter(
    (s) =>
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.service_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#a9b7ff]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchServices}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#a9b7ff] focus:outline-none focus:ring-1 focus:ring-[#a9b7ff]"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Discount Caps
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <tr key={service.service_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service.service_name}</p>
                    <p className="text-xs text-gray-500">{service.service_id}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    onClick={() => handleToggle(service.service_id)}
                    disabled={togglingId === service.service_id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      service.subsidy_enabled ? 'bg-green-500' : 'bg-gray-300'
                    } ${togglingId === service.service_id ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        service.subsidy_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      service.subsidy_type === 'percentage'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Percent className="mr-1 h-3 w-3" />
                    {service.subsidy_type === 'percentage' ? '%' : '\u20A6'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {service.subsidy_type === 'percentage'
                      ? `${service.subsidy_value}%`
                      : `\u20A6${service.subsidy_value.toLocaleString()}`}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {service.min_discount_cap !== null || service.max_discount_cap !== null ? (
                      <>
                        {service.min_discount_cap !== null ? `\u20A6${service.min_discount_cap}` : '\u20A60'}
                        {' - '}
                        {service.max_discount_cap !== null ? `\u20A6${service.max_discount_cap.toLocaleString()}` : 'No cap'}
                      </>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    onClick={() => setConfiguringService(service)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={14} />
                    Configure
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredServices.map((service) => (
          <div
            key={service.service_id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{service.service_name}</p>
                <p className="text-xs text-gray-500">{service.service_id}</p>
              </div>
              <button
                onClick={() => handleToggle(service.service_id)}
                disabled={togglingId === service.service_id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  service.subsidy_enabled ? 'bg-green-500' : 'bg-gray-300'
                } ${togglingId === service.service_id ? 'opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    service.subsidy_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    service.subsidy_type === 'percentage'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {service.subsidy_type === 'percentage' ? '%' : '\u20A6'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Value</p>
                <p className="text-sm font-medium text-gray-900">
                  {service.subsidy_type === 'percentage'
                    ? `${service.subsidy_value}%`
                    : `\u20A6${service.subsidy_value.toLocaleString()}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setConfiguringService(service)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings size={14} />
              Configure
            </button>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No services found matching your search.</p>
        </div>
      )}

      {/* Config Modal */}
      {configuringService && (
        <SubsidyConfigModal
          service={configuringService}
          onClose={() => setConfiguringService(null)}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
}

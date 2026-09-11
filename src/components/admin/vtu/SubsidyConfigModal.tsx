'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { calculateSubsidyPreview } from '@/utils/subsidy-calculator';
import type { ServiceSubsidyConfig, SubsidyType } from '@/types/vtu.types';

interface SubsidyConfigModalProps {
  service: ServiceSubsidyConfig;
  onClose: () => void;
  onSave: (updated: ServiceSubsidyConfig) => void;
}

export function SubsidyConfigModal({ service, onClose, onSave }: SubsidyConfigModalProps) {
  const [subsidyType, setSubsidyType] = useState<SubsidyType>(service.subsidy_type);
  const [subsidyValue, setSubsidyValue] = useState<string>(String(service.subsidy_value));
  const [minDiscountCap, setMinDiscountCap] = useState<string>(
    service.min_discount_cap !== null ? String(service.min_discount_cap) : ''
  );
  const [maxDiscountCap, setMaxDiscountCap] = useState<string>(
    service.max_discount_cap !== null ? String(service.max_discount_cap) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = calculateSubsidyPreview(
    1000,
    subsidyType,
    parseFloat(subsidyValue) || 0,
    minDiscountCap ? parseFloat(minDiscountCap) : null,
    maxDiscountCap ? parseFloat(maxDiscountCap) : null
  );

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);

      const value = parseFloat(subsidyValue);
      if (isNaN(value) || value < 0) {
        setError('Please enter a valid subsidy value');
        return;
      }

      if (subsidyType === 'percentage' && value > 100) {
        setError('Percentage cannot exceed 100%');
        return;
      }

      const minCap = minDiscountCap ? parseFloat(minDiscountCap) : null;
      const maxCap = maxDiscountCap ? parseFloat(maxDiscountCap) : null;

      if (minCap !== null && minCap < 0) {
        setError('Minimum cap cannot be negative');
        return;
      }

      if (maxCap !== null && maxCap < 0) {
        setError('Maximum cap cannot be negative');
        return;
      }

      if (minCap !== null && maxCap !== null && minCap > maxCap) {
        setError('Minimum cap cannot be greater than maximum cap');
        return;
      }

      const response = await adminService.updateVTUSubsidyConfig(service.service_id, {
        subsidy_type: subsidyType,
        subsidy_value: value,
        min_discount_cap: minCap,
        max_discount_cap: maxCap,
      });

      if (response.success && response.data) {
        onSave(response.data as unknown as ServiceSubsidyConfig);
      }
    } catch (err) {
      console.error('Failed to save subsidy config:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{service.service_name}</h2>
            <p className="text-sm text-gray-500">Configure subsidy settings</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subsidy Type Toggle */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Subsidy Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSubsidyType('percentage')}
              className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                subsidyType === 'percentage'
                  ? 'border-[#a9b7ff] bg-[#f7f8ff] text-[#a9b7ff]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => setSubsidyType('fixed')}
              className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                subsidyType === 'fixed'
                  ? 'border-[#a9b7ff] bg-[#f7f8ff] text-[#a9b7ff]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              Fixed Amount (&#8358;)
            </button>
          </div>
        </div>

        {/* Subsidy Value */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subsidy Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {subsidyType === 'percentage' ? '%' : '\u20A6'}
            </span>
            <input
              type="number"
              value={subsidyValue}
              onChange={(e) => setSubsidyValue(e.target.value)}
              min="0"
              max={subsidyType === 'percentage' ? '100' : undefined}
              step={subsidyType === 'percentage' ? '0.5' : '1'}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 text-sm text-gray-900 focus:border-[#a9b7ff] focus:outline-none focus:ring-1 focus:ring-[#a9b7ff]"
              placeholder={subsidyType === 'percentage' ? 'e.g., 2' : 'e.g., 50'}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {subsidyType === 'percentage'
              ? 'Percentage discount on the original price'
              : 'Fixed Naira amount deducted from the original price'}
          </p>
        </div>

        {/* Discount Caps */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Min Discount Cap
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                &#8358;
              </span>
              <input
                type="number"
                value={minDiscountCap}
                onChange={(e) => setMinDiscountCap(e.target.value)}
                min="0"
                step="1"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 text-sm text-gray-900 focus:border-[#a9b7ff] focus:outline-none focus:ring-1 focus:ring-[#a9b7ff]"
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Max Discount Cap
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                &#8358;
              </span>
              <input
                type="number"
                value={maxDiscountCap}
                onChange={(e) => setMaxDiscountCap(e.target.value)}
                min="0"
                step="1"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 text-sm text-gray-900 focus:border-[#a9b7ff] focus:outline-none focus:ring-1 focus:ring-[#a9b7ff]"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {parseFloat(subsidyValue) > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Preview (on &#8358;1,000 plan)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Original Price</span>
                <span className="text-sm text-gray-900 line-through">
                  &#8358;{preview.originalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="text-sm font-medium text-green-600">
                  -&#8358;{preview.discount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="text-sm font-medium text-gray-900">You Pay</span>
                <span className="text-lg font-bold text-green-600">
                  &#8358;{preview.subsidizedAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">User Savings</span>
                <span className="text-xs font-medium text-green-600">
                  Save &#8358;{preview.savings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#a9b7ff] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#9aa5ff] disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

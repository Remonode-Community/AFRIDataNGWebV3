'use client';

import { VtuSubsidyTable } from '@/components/admin/vtu/VtuSubsidyTable';

export default function VTUSubsidiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VTU Subsidies</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage subsidized rates for VTU services. Configure discounts that users see on data and TV subscription plans.
        </p>
      </div>

      <VtuSubsidyTable />
    </div>
  );
}

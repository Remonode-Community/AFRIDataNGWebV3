'use client';

import React from 'react';
import { Card, CardBody } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Search, RotateCcw } from 'lucide-react';

interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

interface AdminFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onFilter: (filters: Record<string, string>) => void;
  onReset: () => void;
  loading?: boolean;
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
  filters,
  values,
  onFilter,
  onReset,
  loading = false,
}) => {
  const [filterValues, setFilterValues] = React.useState(values);

  const handleChange = (key: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onFilter(filterValues);
  };

  const handleReset = () => {
    const resetValues = filters.reduce(
      (acc, filter) => ({
        ...acc,
        [filter.key]: '',
      }),
      {}
    );
    setFilterValues(resetValues);
    onReset();
  };

  return (
    <Card className="mb-6">
      <CardBody className="space-y-3">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4 scrollbar-hide">
          {filters.map((filter) => {
            if (filter.type === 'select') {
              return (
                <div key={filter.key} className="min-w-[140px] sm:min-w-0">
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  <Select
                    value={filterValues[filter.key] || ''}
                    onChange={(e) =>
                      handleChange(filter.key, e.target.value)
                    }
                    options={[
                      { value: '', label: `All ${filter.label}` },
                      ...(filter.options || []),
                    ]}
                  />
                </div>
              );
            }

            if (filter.type === 'date') {
              return (
                <div key={filter.key} className="min-w-[160px] sm:min-w-0">
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  <Input
                    type="date"
                    value={filterValues[filter.key] || ''}
                    onChange={(e) =>
                      handleChange(filter.key, e.target.value)
                    }
                  />
                </div>
              );
            }

            return (
              <div key={filter.key} className="min-w-[200px] sm:min-w-0 flex-1">
                <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={filter.placeholder || `Search ${filter.label}...`}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) =>
                      handleChange(filter.key, e.target.value)
                    }
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 sm:gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleReset}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

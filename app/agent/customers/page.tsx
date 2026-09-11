'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Spinner } from '@/components/shared/Spinner';
import { agentService, AgentCustomer } from '@/services/agent.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';

export default function AgentCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<AgentCustomer[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const perPage = 20;

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const fetchCustomers = async (page: number) => {
    try {
      setLoading(true);
      const response = await agentService.getCustomers(100);
      const allCustomers = response.data.data || [];
      setTotalCustomers(allCustomers.length);
      const start = (page - 1) * perPage;
      setCustomers(allCustomers.slice(start, start + perPage));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchInput.toLowerCase();
    return (
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone_number?.includes(searchInput)
    );
  });

  const totalPages = Math.ceil(totalCustomers / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">My Customers</h1>
        <p className="text-sm text-[#6b7280] mt-1">Customers assigned to you</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Customers</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">{totalCustomers}</p>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Transactions</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {customers.reduce((sum, c) => sum + (c.transaction_count || 0), 0)}
          </p>
        </Card>
        <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">
            {formatCurrency(customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0))}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-medium text-[#6b7280] hover:bg-[#f8fafc] transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#f1f5f9] px-5 py-4">
          <h2 className="text-base font-bold text-[#111827]">
            Customers ({filteredCustomers.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-6 w-6 text-[#475569]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#111827]">No customers found</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              {searchInput ? 'No customers match your search.' : 'No customers have been assigned to you yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Customer</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Contact</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Transactions</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Total Spent</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-[#f8fafc] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#eef2ff] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#4a5ff7]">
                              {customer.first_name?.[0]}{customer.last_name?.[0]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#111827]">
                            {customer.first_name} {customer.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-[#6b7280] flex items-center gap-1.5">
                            <Mail size={12} /> {customer.email}
                          </p>
                          <p className="text-xs text-[#6b7280] flex items-center gap-1.5">
                            <Phone size={12} /> {customer.phone_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-[#111827]">
                        {customer.transaction_count || 0}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-[#111827]">
                        {formatCurrency(customer.total_spent || 0)}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#6b7280]">
                        {customer.pivot?.assigned_at ? formatDate(customer.pivot.assigned_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#f1f5f9] px-5 py-3">
                <div className="text-xs text-[#6b7280]">
                  Page <span className="font-semibold text-[#111827]">{currentPage}</span> of{' '}
                  <span className="font-semibold text-[#111827]">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchCustomers(newPage);
                    }}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </Button>
                  <span className="rounded-lg bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#111827]">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchCustomers(newPage);
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

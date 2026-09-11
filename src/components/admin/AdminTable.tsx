'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  title?: string;
  emptyMessage?: string;
  perPage?: number;
  total?: number;
  className?: string;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}

export const AdminTable = React.forwardRef<
  HTMLDivElement,
  AdminTableProps<any>
>(
  (
    {
      columns,
      data,
      loading = false,
      currentPage,
      totalPages,
      onPageChange,
      title,
      emptyMessage = 'No data available',
      perPage = 20,
      total,
      className,
      renderMobileCard,
    },
    ref
  ) => {
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    const startIndex = (currentPage - 1) * perPage + 1;
    const endIndex = Math.min(currentPage * perPage, total || data.length);

    return (
      <div ref={ref} className={className}>
        <Card>
          {title && (
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
              <span className="text-xs sm:text-sm text-gray-500">
                Showing {startIndex} to {endIndex} of {total || data.length}
              </span>
            </CardHeader>
          )}

          <CardBody className="p-0">
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2ff]">
                    <Spinner />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Loading data...</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {columns.map((column) => (
                          <th
                            key={String(column.key)}
                            className={`px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${
                              alignClass[column.align || 'left']
                            }`}
                            style={column.width ? { width: column.width } : {}}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((row: any, rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                          {columns.map((column) => {
                            const value =
                              column.render?.(
                                row[String(column.key)],
                                row,
                                rowIndex
                              ) ?? row[String(column.key)];

                            return (
                              <td
                                key={String(column.key)}
                                className={`px-6 py-3 text-sm text-gray-900 ${
                                  alignClass[column.align || 'left']
                                }`}
                              >
                                {value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                {renderMobileCard && (
                  <div className="md:hidden divide-y divide-gray-100">
                    {data.map((row: any, rowIndex: number) => (
                      <div key={rowIndex} className="px-4 py-3">
                        {renderMobileCard(row, rowIndex)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback mobile scroll if no custom renderMobileCard */}
                {!renderMobileCard && (
                  <div className="md:hidden overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          {columns.map((column) => (
                            <th
                              key={String(column.key)}
                              className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${
                                alignClass[column.align || 'left']
                              }`}
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((column) => {
                              const value =
                                column.render?.(
                                  row[String(column.key)],
                                  row,
                                  rowIndex
                                ) ?? row[String(column.key)];

                              return (
                                <td
                                  key={String(column.key)}
                                  className={`px-4 py-2.5 text-xs text-gray-900 ${
                                    alignClass[column.align || 'left']
                                  }`}
                                >
                                  {value}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardBody>

          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3">
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{currentPage}</span>/{totalPages} · {total || data.length}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs px-2.5"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-900">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs px-2.5"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }
);

AdminTable.displayName = 'AdminTable';

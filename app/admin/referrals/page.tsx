'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, TrendingUp, Gift, DollarSign, Eye } from 'lucide-react';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminStats } from '@/components/admin/AdminStats';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { Modal } from '@/components/shared/Modal';
import { Spinner } from '@/components/shared/Spinner';

interface Referral {
  id: number;
  user: { id: number; name: string; email: string };
  program: string;
  code: string;
  link: string;
  referrals_count: number;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isAdmin = useMemo(() => {
    return Boolean(user?.roles?.some((role) => role === 'admin'));
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [referralResponse, programResponse] = await Promise.all([
          adminService.getReferrals(),
          adminService.getReferralPrograms(),
        ]);

        if (referralResponse?.data) {
          const refData = referralResponse.data.referrals || [];
          setReferrals(Array.isArray(refData) ? refData : []);
        }

        if (programResponse?.data) {
          setPrograms(Array.isArray(programResponse.data) ? programResponse.data : []);
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalReferrals = referrals.reduce((sum, ref) => sum + (ref.referrals_count || 0), 0);
  const totalEarnings = referrals.reduce((sum, ref) => {
    if (ref.program?.commission_rate && ref.referrals_count) {
      return sum + (ref.program.commission_rate * ref.referrals_count);
    }
    return sum;
  }, 0);

  const statsItems = [
    {
      title: 'Total Referral Programs',
      value: programs.length,
      icon: <Gift className="h-6 w-6" />,
      change: { value: '+2', direction: 'up' as const },
    },
    {
      title: 'Active Referrers',
      value: referrals.length,
      icon: <Users className="h-6 w-6" />,
      change: { value: '+15.3%', direction: 'up' as const },
    },
    {
      title: 'Total Referrals',
      value: totalReferrals,
      icon: <TrendingUp className="h-6 w-6" />,
      change: { value: '+32.1%', direction: 'up' as const },
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(totalEarnings),
      icon: <DollarSign className="h-6 w-6" />,
      change: { value: '+18.9%', direction: 'up' as const },
    },
  ];

  const tableColumns = [
    {
      key: 'user',
      label: 'Referrer',
      width: '200px',
      render: (value: any) => value?.email || 'N/A',
    },
    {
      key: 'program',
      label: 'Program',
      width: '150px',
    },
    {
      key: 'code',
      label: 'Code',
      width: '120px',
      render: (value: string) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-900">
          {value}
        </code>
      ),
    },
    {
      key: 'referrals_count',
      label: 'Referrals',
      width: '100px',
    },
    {
      key: 'link',
      label: 'Link',
      width: '150px',
      render: (value: string) => (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#a9b7ff] hover:underline truncate block"
        >
          View Link
        </a>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      width: '80px',
      align: 'center' as const,
      render: (value: number, row: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedReferral(row);
            setShowDetails(true);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <AdminHeader
        title="Referral Programs"
        description="Manage referral programs and track earnings"
      />

      <AdminStats stats={statsItems} />

      {/* Programs Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Active Programs
          </h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : programs.length === 0 ? (
            <p className="text-sm text-gray-500">No programs available</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <h4 className="font-semibold text-gray-900">{program.name}</h4>
                  <p className="mt-2 text-sm text-gray-600">
                    {program.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Commission:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {program.commission_rate ? (
                        program.commission_type === 'percentage'
                          ? `${program.commission_rate}%`
                          : formatCurrency(program.commission_rate)
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Badge variant={program.active ? 'success' : 'warning'}>
                      {program.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Referrals Table */}
      <AdminTable
        columns={tableColumns}
        data={referrals}
        loading={loading}
        currentPage={1}
        totalPages={1}
        total={referrals.length}
        onPageChange={() => {}}
        title="Active Referrals"
        perPage={20}
        emptyMessage="No active referrals found"
      />

      {showDetails && selectedReferral && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Referral Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Referrer</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedReferral.user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Program</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedReferral.program}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Code</p>
                <p className="mt-1 font-mono text-sm text-gray-900">
                  {selectedReferral.code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {selectedReferral.referrals_count}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Referral Link</p>
              <p className="rounded-lg bg-gray-50 p-3 text-xs break-all text-gray-900">
                {selectedReferral.link}
              </p>
            </div>

            {selectedReferral.referrals && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Recent Referrals</p>
                <div className="space-y-2">
                  {selectedReferral.referrals.slice(0, 5).map((ref: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 p-2">
                      <span className="text-sm text-gray-900">
                        {ref.user?.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(ref.referred_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}

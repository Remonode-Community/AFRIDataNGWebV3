'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, CreditCard, Wallet, Users2, CheckCircle2, XCircle, Clock, Link2 } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { formatDate, formatDateTime } from '@/utils/format.utils';
import { AdminUser } from '@/types/api.types';

interface UserDetailResponse {
  id: number;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone_number: string;
  is_verified: boolean;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  dob: string | null;
  gender: string | null;
  bvn: string | null;
  nin: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
  wallet: {
    balance: number;
    formatted_balance: string;
    can_withdraw: boolean;
    has_pin: boolean;
    pin_locked: boolean;
    paystack_dva: {
      account_name: string;
      account_number: string;
      bank_name: string;
      bank_slug: string;
      account_active: boolean;
    } | null;
    wallet_exists: boolean;
  } | null;
  bank_info: {
    account_name: string;
    account_number: string;
    bank_name: string;
    bank_code: string;
    bvn: string | null;
  } | null;
  counts: {
    user_transactions?: number;
    central_transactions?: number;
    wallet_transactions?: number;
    custom_wallet_transactions?: number;
    vtu_transactions?: number;
    referral_links?: number;
    bank_info?: number;
  };
  roles?: string[];
  permissions?: string[];
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [detail, setDetail] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params?.id as string;

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getUser(userId);

        console.log('[AdminUserDetail] response:', response);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load user details');
        }

        const responseData = response.data as any;
        const userData = responseData?.user ?? responseData ?? responseData?.data;
        console.log('[AdminUserDetail] userData:', userData);

        if (!userData) {
          throw new Error('No user details returned from server');
        }

        setDetail(userData);
      } catch (err: any) {
        console.error('[AdminUserDetail] Error fetching user detail:', err);
        setError(err.message || 'Unable to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDetail();
    } else {
      setError('Missing user id');
      setLoading(false);
    }
  }, [userId]);

  const walletStatus = useMemo(() => {
    if (!detail?.wallet) return 'No wallet';
    return detail.wallet.wallet_exists ? 'Wallet exists' : 'No wallet';
  }, [detail]);

  const counts = useMemo(() => ({
    user_transactions: detail?.counts?.user_transactions ?? 0,
    central_transactions: detail?.counts?.central_transactions ?? 0,
    wallet_transactions: detail?.counts?.wallet_transactions ?? 0,
    custom_wallet_transactions: detail?.counts?.custom_wallet_transactions ?? 0,
    vtu_transactions: detail?.counts?.vtu_transactions ?? 0,
    referral_links: detail?.counts?.referral_links ?? 0,
    bank_info: detail?.counts?.bank_info ?? 0,
  }), [detail]);

  if (!user || loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-lg font-semibold text-gray-700">No user details available.</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4a5ff7]">
            User detail
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#111827]">
            {detail.name || `${detail.first_name} ${detail.last_name}`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#6b7280]">
            Detailed admin view of the user profile, wallet, transactions, bank info, and roles.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Profile summary</p>
                <h2 className="mt-3 text-2xl font-bold text-[#111827]">User information</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={detail.is_verified ? 'success' : 'warning'}>
                  {detail.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant={detail.is_profile_complete ? 'success' : 'warning'}>
                  {detail.is_profile_complete ? 'Profile complete' : 'Incomplete profile'}
                </Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Full name</p>
                <p className="text-base font-semibold text-[#111827]">{detail.name || `${detail.first_name} ${detail.last_name}`}</p>
              </div>
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Email</p>
                <p className="text-base font-semibold text-[#111827]">{detail.email}</p>
              </div>
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Phone</p>
                <p className="text-base font-semibold text-[#111827]">{detail.phone_number}</p>
              </div>
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">DOB / Gender</p>
                <p className="text-base font-semibold text-[#111827]">
                  {detail.dob ? formatDate(detail.dob) : 'N/A'}
                  {detail.gender ? ` • ${detail.gender}` : ''}
                </p>
              </div>
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">BVN / NIN</p>
                <p className="text-base font-semibold text-[#111827]">
                  {detail.bvn ?? 'N/A'} / {detail.nin ?? 'N/A'}
                </p>
              </div>
              <div className="space-y-2 rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Created / Updated</p>
                <p className="text-base font-semibold text-[#111827]">{formatDateTime(detail.created_at)}</p>
                <p className="text-sm text-[#6b7280]">Last updated {formatDateTime(detail.updated_at)}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Wallet summary</p>
                <h2 className="mt-3 text-2xl font-bold text-[#111827]">Balance & account status</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-2 text-sm text-[#4a5ff7]">
                <Wallet className="h-4 w-4" />
                {walletStatus}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Current balance</p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">{detail.wallet?.formatted_balance ?? '₦0.00'}</p>
              </div>
              <div className="rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Withdrawable</p>
                <p className="mt-2 text-base font-semibold text-[#111827]">{detail.wallet?.can_withdraw ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">Has PIN</p>
                <p className="mt-2 text-base font-semibold text-[#111827]">{detail.wallet?.has_pin ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">PIN Locked</p>
                <p className="mt-2 text-base font-semibold text-[#111827]">{detail.wallet?.pin_locked ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#eef2ff] bg-[#fcfcfd] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                <CreditCard className="h-4 w-4 text-[#4a5ff7]" />
                Paystack DVA account
              </div>

              {detail.wallet?.paystack_dva ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#6b7280]">Account name</p>
                    <p className="mt-1 font-semibold text-[#111827]">{detail.wallet.paystack_dva.account_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280]">Account number</p>
                    <p className="mt-1 font-semibold text-[#111827]">{detail.wallet.paystack_dva.account_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280]">Bank</p>
                    <p className="mt-1 font-semibold text-[#111827]">{detail.wallet.paystack_dva.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280]">DVA active</p>
                    <p className="mt-1 font-semibold text-[#111827]">{detail.wallet.paystack_dva.account_active ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#6b7280]">No DVA account linked.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Transaction counts</p>
                <h2 className="mt-3 text-2xl font-bold text-[#111827]">Activity summary</h2>
              </div>
              <Users2 className="h-6 w-6 text-[#4a5ff7]" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'User transactions', value: counts.user_transactions },
                { label: 'Central transactions', value: counts.central_transactions },
                { label: 'Wallet transactions', value: counts.wallet_transactions },
                { label: 'Custom wallet transactions', value: counts.custom_wallet_transactions },
                { label: 'VTU transactions', value: counts.vtu_transactions },
                { label: 'Referral links', value: counts.referral_links },
                { label: 'Bank info records', value: counts.bank_info },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-[#eef2ff] bg-[#fafbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-[#111827]">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#4a5ff7]" />
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Roles & permissions</p>
                <p className="text-base font-semibold text-[#111827]">{detail.roles?.join(', ') || 'No roles assigned'}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {(detail.roles ?? []).map((role) => (
                  <Badge key={role} variant="info">
                    {role}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(detail.permissions ?? []).map((permission) => (
                  <Badge key={permission} variant="default">
                    {permission}
                  </Badge>
                ))}
              </div>
              {!detail.permissions?.length && (
                <p className="text-sm text-[#6b7280]">No permissions assigned.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-[#4a5ff7]" />
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Bank account</p>
                <p className="text-base font-semibold text-[#111827]">{detail.bank_info?.bank_name || 'N/A'}</p>
              </div>
            </div>

            {detail.bank_info ? (
              <div className="mt-6 grid gap-4">
                <div>
                  <p className="text-xs text-[#6b7280]">Account name</p>
                  <p className="mt-1 text-base font-semibold text-[#111827]">{detail.bank_info.account_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Account number</p>
                  <p className="mt-1 text-base font-semibold text-[#111827]">{detail.bank_info.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">Bank code</p>
                  <p className="mt-1 text-base font-semibold text-[#111827]">{detail.bank_info.bank_code}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b7280]">BVN</p>
                  <p className="mt-1 text-base font-semibold text-[#111827]">{detail.bank_info.bvn ?? 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6b7280]">No bank information available.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

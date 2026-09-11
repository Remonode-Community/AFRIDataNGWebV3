'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/components/shared/Toast';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { formatCurrency } from '@/utils/format.utils';

interface FormData {
  provider: string;
  providerName: string;
  phone: string;
  amount: string;
}

type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';
type PaymentMethod = 'wallet' | 'card' | 'bank_transfer';

export default function AirtimeReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [showPINModal, setShowPINModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>('idle');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    console.log('[AirtimeReview] Page mounted, checking for form data...');
    const savedData = typeof window !== 'undefined' ? sessionStorage.getItem('airtimeFormData') : null;
    console.log('[AirtimeReview] Saved data from sessionStorage:', savedData);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as FormData;
        console.log('[AirtimeReview] Parsed data:', parsedData);
        setFormData(parsedData);
      } catch (err) {
        console.error('[AirtimeReview] Error parsing saved data:', err);
        router.push('/dashboard/airtime');
      }
    } else {
      console.warn('[AirtimeReview] No form data found, redirecting to airtime page');
      router.push('/dashboard/airtime');
    }
  }, [router]);

  const amount = useMemo(() => Number(formData?.amount || 0), [formData]);
  // const convenienceFee = useMemo(() => Math.ceil(amount * 0.015), [amount]);
  const convenienceFee = 0;
  const totalAmount = amount;

  const handleBack = () => {
    router.push('/dashboard/airtime');
  };

  const handleConfirmPayment = () => {
    console.log('[AirtimeReview] Confirm payment clicked');
    if (!formData || isProcessing) {
      console.warn('[AirtimeReview] Cannot confirm: formData exists:', !!formData, 'isProcessing:', isProcessing);
      return;
    }
    console.log('[AirtimeReview] Opening PIN modal');
    setShowPINModal(true);
  };

  const handleVerifyPIN = async (pin: string) => {
    console.log('[AirtimeReview] PIN verification started');
    if (!formData || !user) {
      console.warn('[AirtimeReview] Missing formData or user');
      return;
    }
    if (!pin) {
      console.warn('[AirtimeReview] No PIN provided');
      return;
    }

    setIsProcessing(true);
    setTransactionStatus('processing');

    try {
      const airtimePayload = {
        serviceID: formData.provider,
        phone: formData.phone.replace(/\s/g, ''),
        amount: parseInt(formData.amount),
        user_id: user?.id,
        payment_method: paymentMethod as 'wallet' | 'card' | 'mobile_money',
        pin,
      };

      console.log('[AirtimeReview] Airtime purchase request prepared:', airtimePayload);
      
      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log('[AirtimeReview] Calling paymentService.purchaseAirtime()...');
      const response = await paymentService.purchaseAirtime(airtimePayload);
      console.log('[AirtimeReview] Purchase response received:', response);

      if (response.success) {
        const backendRequestId = (response as any).transaction?.reference;
        setTransactionId(backendRequestId || '');
        setTransactionStatus('success');
        setShowPINModal(false);

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('airtimeFormData');
        }

        addToast({
          message: 'Airtime purchased successfully!',
          type: 'success',
        });

        console.log('[AirtimeReview] Transaction successful, redirecting in 3 seconds...');
        setTimeout(() => {
          router.push('/dashboard/history');
        }, 2500);
      } else {
        console.warn('[AirtimeReview] Purchase failed:', response);
        setShowPINModal(false);
        setTransactionStatus('error');
        
        if ((response as any)?.code === 'INSUFFICIENT_USER_BALANCE') {
          addToast({
            message: 'Insufficient wallet balance. Please top up your wallet and try again.',
            type: 'error',
          });
        } else {
          addToast({
            message: response.message || 'Transaction failed. Please try again.',
            type: 'error',
          });
        }
      }
    } catch (error: any) {
      console.error('[AirtimeReview] Payment error:', error);
      
      if (error.isDuplicateError) {
        addToast({
          message: 'This airtime purchase has already been processed. Please check your history.',
          type: 'info',
        });
      } else if (error.isIdempotencyError) {
        addToast({
          message: 'Payment system error. Please try again.',
          type: 'error',
        });
      } else {
        const message =
          error.message ||
          (typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message === 'string'
            ? (error as { response?: { data?: { message?: string } } }).response!
                .data!.message!
            : 'Failed to process payment. Please try again.');

        addToast({
          message,
          type: 'error',
        });
      }

      setTransactionStatus('error');
    } finally {
      console.log('[AirtimeReview] PIN verification completed, processing state:', isProcessing);
      setIsProcessing(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Loader2 className="animate-spin text-[#4a5ff7]" size={26} />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">Loading review...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>


      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4a5ff7] bg-white text-sm font-bold text-[#4a5ff7]">
                  ✓
                </div>
                <span className="text-sm font-semibold text-[#111827]">
                  Select Provider & Amount
                </span>
              </div>
              <div className="h-[2px] flex-1 bg-[#4a5ff7]" />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a5ff7] text-sm font-bold text-white">
                  2
                </div>
                <span className="text-sm font-semibold text-[#111827]">
                  Confirm & Pay
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Service Details
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-4">
                <span className="text-sm text-[#6b7280]">Network Provider</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {formData.providerName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-4">
                <span className="text-sm text-[#6b7280]">Phone Number</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {formData.phone}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-4">
                <span className="text-sm text-[#6b7280]">Airtime Amount</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {formatCurrency(amount)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-4">
                <span className="text-sm text-[#6b7280]">Convenience Fee</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {formatCurrency(convenienceFee)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] border border-[#dbe4ff] bg-[#f7f8ff] px-5 py-5">
                <span className="text-base font-semibold text-[#111827]">
                  Total Amount
                </span>
                <span className="text-2xl font-extrabold tracking-tight text-[#4a5ff7]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Payment Method
            </h2>

            <div className="mt-6 space-y-4">
              {[
                {
                  value: 'wallet',
                  label: 'Wallet',
                  description: 'Fastest option for instant checkout.',
                  icon: Wallet,
                },
                {
                  value: 'Others',
                  label: 'Pay with Other Options',
                  description: 'Pay with other payment options.',
                  icon: CreditCard,
                },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.value;
                const isDisabled = method.value !== 'wallet';

                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setPaymentMethod(method.value as PaymentMethod)}
                    title={isDisabled ? 'Coming soon' : ''}
                    className={`flex w-full items-start justify-between rounded-[22px] border p-4 text-left transition ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed bg-[#f5f5f5]'
                        : active
                        ? 'border-[#4a5ff7] bg-[#f7f8ff]'
                        : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-2xl p-3 ${
                          active ? 'bg-[#4a5ff7]' : 'bg-[#eef2ff]'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            active ? 'text-white' : 'text-[#4a5ff7]'
                          }`}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#111827]">
                          {method.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                          {method.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-1 h-5 w-5 rounded-full border-2 ${
                        active
                          ? 'border-[#4a5ff7] bg-[#4a5ff7]'
                          : 'border-[#d1d5db] bg-white'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

  
          </Card>
        </div>

        <div>
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] xl:sticky xl:top-8">
            <h3 className="text-lg font-bold tracking-tight text-[#111827]">
              Order Summary
            </h3>

            <div className="mt-5 space-y-4 border-b border-[#eef2f7] pb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Provider</span>
                <span className="font-semibold text-[#111827]">
                  {formData.providerName.split(' ')[0]}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Phone</span>
                <span className="font-semibold text-[#111827]">{formData.phone}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Amount</span>
                <span className="font-semibold text-[#111827]">
                  {formatCurrency(amount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Fee</span>
                <span className="font-semibold text-[#111827]">
                  {formatCurrency(convenienceFee)}
                </span>
              </div>
            </div>

            <div className="mt-5 mb-6 flex items-center justify-between">
              <span className="text-base font-semibold text-[#111827]">Total</span>
              <span className="text-2xl font-extrabold tracking-tight text-[#4a5ff7]">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {transactionStatus === 'success' ? (
              <div className="mb-6 rounded-[22px] border border-green-200 bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-green-600" size={24} />
                <p className="text-sm font-semibold text-green-900">
                  Transaction Successful
                </p>
                <p className="mt-1 break-all text-xs text-green-700">
                  ID: {transactionId}
                </p>
              </div>
            ) : null}

            {transactionStatus === 'error' ? (
              <div className="mb-6 rounded-[22px] border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 text-red-600" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Transaction failed
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      Please review your balance or try again.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {transactionStatus !== 'success' ? (
              <Button
                fullWidth
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className={`mb-3 h-12 rounded-xl text-base font-semibold transition-all ${
                  isProcessing
                    ? 'bg-[#3b4fe0] text-white opacity-75 cursor-not-allowed'
                    : 'bg-[#4a5ff7] text-white hover:bg-[#3b4fe0]'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  'Confirm & Pay'
                )}
              </Button>
            ) : null}

            <Button
              variant="secondary"
              fullWidth
              onClick={handleBack}
              disabled={isProcessing}
              className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isProcessing ? 'Processing...' : 'Cancel'}
            </Button>

            <p className="mt-4 text-center text-xs text-[#6b7280]">
              <Lock className="mr-1 inline" size={12} />
              Secured by AFRIDataNG
            </p>
          </Card>
        </div>
      </div>

      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handleVerifyPIN}
        isLoading={isProcessing}
        title="Verify Transaction"
        description="Enter your 4-digit PIN to complete this purchase"
      />

      <Toast />
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
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
  Wifi,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Toast } from '@/components/shared/Toast';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { formatCurrency } from '@/utils/format.utils';

interface FormData {
  provider: string;
  providerName: string;
  variation?: string;
  variationCode?: string;
  variationName?: string;
  variationAmount?: string;
  subsidizedAmount?: number;
  savings?: number;
}

type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';
type PaymentMethod = 'wallet' | 'card' | 'bank_transfer';

export default function DataReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [showPINModal, setShowPINModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>('idle');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    console.log('[DataReview] Page mounted, checking for form data...');
    const savedData = typeof window !== 'undefined' ? sessionStorage.getItem('dataFormData') : null;
    console.log('[DataReview] Saved data from sessionStorage:', savedData);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as FormData;
        console.log('[DataReview] Parsed data:', parsedData);
        setFormData(parsedData);
      } catch (err) {
        console.error('[DataReview] Error parsing saved data:', err);
        router.push('/dashboard/data');
      }
    } else {
      console.warn('[DataReview] No form data found, redirecting to data page');
      router.push('/dashboard/data');
    }
  }, [router]);

  const amount = parseInt(formData?.variationAmount || '0');
  const displayAmount = formData?.subsidizedAmount || amount;
  const hasSubsidy = formData?.subsidizedAmount !== undefined && formData?.savings !== undefined && formData.savings > 0;

  const handleBack = () => {
    router.push('/dashboard/data');
  };

  const validatePhoneNumber = (): boolean => {
    const phone = phoneNumber.replace(/\s/g, '');
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!/^0[789]\d{9}$/.test(phone)) {
      setPhoneError('Please enter a valid Nigerian phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleConfirmPayment = () => {
    console.log('[DataReview] Confirm payment clicked');
    if (!formData || isProcessing) {
      console.warn('[DataReview] Cannot confirm: formData exists:', !!formData, 'isProcessing:', isProcessing);
      return;
    }
    
    if (!validatePhoneNumber()) {
      return;
    }
    
    console.log('[DataReview] Opening PIN modal');
    setShowPINModal(true);
  };

  const handleVerifyPIN = async (pin: string) => {
    console.log('[DataReview] PIN verification started');
    if (!formData || !user) {
      console.warn('[DataReview] Missing formData or user');
      return;
    }
    if (!pin) {
      console.warn('[DataReview] No PIN provided');
      return;
    }

    setIsProcessing(true);
    setTransactionStatus('processing');

    try {
      const now = new Date();
      const requestId = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${Date.now()}${uuidv4().slice(0, 8)}`;

      const dataPayload = {
        service_id: formData.provider,
        variation_code: formData.variationCode,
        amount: parseInt(formData.variationAmount || '0'),
        phone_number: phoneNumber.replace(/\s/g, ''),
        user_id: user?.id?.toString(),
        payment_method: paymentMethod as 'wallet' | 'card' | 'mobile_money',
        request_id: requestId,
      };

      console.log('[DataReview] Data purchase request prepared:', dataPayload);

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1200));

      console.log('[DataReview] Calling paymentService.purchaseData()...');
      const response = await paymentService.purchaseData(dataPayload);
      console.log('[DataReview] Purchase response received:', response);

      if (response.success && response.data) {
        // Now confirm with PIN if needed
        console.log('[DataReview] Confirming purchase with PIN...');
        const confirmResponse = await paymentService.confirmDataPurchase(
          requestId,
          { pin, request_id: requestId }
        );

        console.log('[DataReview] PIN confirmation response:', confirmResponse);

        if (confirmResponse.success) {
          setTransactionId(confirmResponse.data?.id || requestId);
          setTransactionStatus('success');
          setShowPINModal(false);

          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('dataFormData');
          }

          addToast({
            message: 'Data purchased successfully!',
            type: 'success',
          });

          console.log('[DataReview] Transaction successful, redirecting in 3 seconds...');
          setTimeout(() => {
            router.push('/dashboard/history');
          }, 2500);
        } else {
          console.warn('[DataReview] PIN confirmation failed:', confirmResponse);
          setTransactionStatus('error');
          addToast({
            message: confirmResponse.message || 'PIN verification failed. Please try again.',
            type: 'error',
          });
        }
      } else {
        console.warn('[DataReview] Purchase failed - unexpected response:', response);
        setShowPINModal(false);
        setTransactionStatus('error');
        
        if ((response as any)?.code === 'INSUFFICIENT_USER_BALANCE') {
          addToast({
            message: 'Insufficient wallet balance. Please top up your wallet and try again.',
            type: 'error',
          });
        } else {
          addToast({
            message: (response as any)?.message || (response as any)?.error || 'Transaction failed. Please try again.',
            type: 'error',
          });
        }
      }
    } catch (error: any) {
      console.error('[DataReview] Payment error:', error);

      const errorData = error?.response?.data || error;

      // Handle insufficient wallet balance
      if (errorData?.code === 'INSUFFICIENT_USER_BALANCE') {
        addToast({
          message: 'Insufficient wallet balance. Please top up your wallet and try again.',
          type: 'error',
        });
      } else if (error.isDuplicateError) {
        addToast({
          message: 'This data purchase has already been processed. Please check your history.',
          type: 'info',
        });
      } else if (error.isIdempotencyError) {
        addToast({
          message: 'Payment system error. Please try again.',
          type: 'error',
        });
      } else {
        const message =
          errorData?.error ||
          errorData?.message ||
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
      console.log('[DataReview] PIN verification completed, processing state:', isProcessing);
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
                  Select Provider & Plan
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
                <span className="text-sm text-[#6b7280]">Data Plan</span>
                <span className="text-sm font-semibold text-[#111827] text-right max-w-xs">
                  {formData.variationName}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-4">
                <span className="text-sm text-[#6b7280]">Plan Code</span>
                <span className="text-sm font-semibold text-[#111827]">
                  {formData.variationCode}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] border border-[#dbe4ff] bg-[#f7f8ff] px-5 py-5">
                <div>
                  <span className="text-base font-semibold text-[#111827]">
                    {hasSubsidy ? 'Discounted Amount' : 'Total Amount'}
                  </span>
                  {hasSubsidy && (
                    <p className="mt-0.5 text-xs text-green-600">You are saving {formatCurrency(formData!.savings!)}</p>
                  )}
                </div>
                <div className="text-right">
                  {hasSubsidy ? (
                    <>
                      <span className="text-2xl font-extrabold tracking-tight text-green-600">
                        {formatCurrency(displayAmount)}
                      </span>
                      <p className="text-sm text-gray-500 line-through">
                        {formatCurrency(amount)}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Save {formatCurrency(formData!.savings!)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-extrabold tracking-tight text-[#a9b7ff]">
                      {formatCurrency(amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
              Recipient Details
            </h2>

            <div className="mt-6 space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="08012345678"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                onBlur={validatePhoneNumber}
                error={phoneError}
                helperText="Format: 08xxxxxxxxx or +2348xxxxxxxxx"
                icon={<Wifi size={18} />}
              />
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
                  value: 'others',
                  label: 'Other Options',
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
                <span className="text-[#6b7280]">Plan</span>
                <span className="font-semibold text-[#111827] text-right max-w-xs">
                  {formData.variationName?.substring(0, 50)}...
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Amount</span>
                <span className="font-semibold text-[#111827]">
                  {formatCurrency(amount)}
                </span>
              </div>
              {hasSubsidy && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">You Saved</span>
                  <span className="font-semibold text-green-600">
                    -{formatCurrency(formData!.savings!)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 mb-6 flex items-center justify-between">
              <span className="text-base font-semibold text-[#111827]">Total</span>
              {hasSubsidy ? (
                <div className="text-right">
                  <span className="text-2xl font-extrabold tracking-tight text-green-600">
                    {formatCurrency(displayAmount)}
                  </span>
                  <p className="text-sm text-gray-500 line-through">
                    {formatCurrency(amount)}
                  </p>
                </div>
              ) : (
                <span className="text-2xl font-extrabold tracking-tight text-[#a9b7ff]">
                  {formatCurrency(amount)}
                </span>
              )}
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

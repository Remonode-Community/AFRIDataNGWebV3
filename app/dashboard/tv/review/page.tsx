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
  Wallet,
  Tv,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/components/shared/Toast';
import { SmartcardVerification } from '@/components/shared/SmartcardVerification';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { vtuService } from '@/services/vtu.service';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import { formatCurrency } from '@/utils/format.utils';

interface TVFormData {
  provider: string;
  providerName: string;
  variation?: string;
  variationCode?: string;
  variationName?: string;
  variationAmount?: string;
  smartcard?: string;
  subsidizedAmount?: number;
  savings?: number;
}

type TransactionStatus = 'idle' | 'verifying' | 'verified' | 'processing' | 'success' | 'error';
type PaymentMethod = 'wallet' | 'card' | 'bank_transfer';

export default function TVReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState<TVFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [showPINModal, setShowPINModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [verificationError, setVerificationError] = useState<string>('');
  const [verifiedCustomer, setVerifiedCustomer] = useState<{
    name?: string;
    number?: string;
  } | null>(null);

  useEffect(() => {
    console.log('[TVReview] Page mounted, checking for form data...');
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('tvFormData') : null;
    if (stored) {
      try {
        const data = JSON.parse(stored) as TVFormData;
        console.log('[TVReview] Form data loaded:', data);
        setFormData(data);
        // Auto-verify smartcard on load
        verifySmartcard(data.smartcard || '', data.provider);
      } catch (error) {
        console.error('[TVReview] Error parsing form data:', error);
        router.push('/dashboard/tv');
      }
    } else {
      console.log('[TVReview] No form data found, redirecting...');
      router.push('/dashboard/tv');
    }
  }, [router]);

  const verifySmartcard = async (smartcardNumber: string, provider: string) => {
    try {
      setTransactionStatus('verifying');
      setVerificationError('');

      console.log('[TVReview] Verifying smartcard...');
      const response = await vtuService.verifySmartcard(
        smartcardNumber,
        provider
      );

      console.log('[TVReview] Verification response:', response);

      // Check for errors in response
      if (response?.content?.WrongBillersCode || response?.WrongBillersCode) {
        setVerificationError(
          response?.content?.error ||
            'The smartcard number appears to be invalid. Please verify and try again.'
        );
        setTransactionStatus('error');
      } else {
        // Successfully verified
        setVerifiedCustomer({
          name:
            response?.content?.Customer_Name || response?.Customer_Name || 'Customer',
          number: smartcardNumber,
        });
        setTransactionStatus('verified');
      }
    } catch (error) {
      console.error('[TVReview] Verification error:', error);
      setTransactionStatus('error');
      setVerificationError(
        'Failed to verify smartcard. Please check and try again.'
      );
    }
  };

  const handlePaymentProcess = async () => {
    if (!user || !formData) {
      addToast({
        message: 'Session expired. Please start over.',
        type: 'error',
      });
      router.push('/dashboard/tv');
      return;
    }

    if (transactionStatus !== 'verified') {
      addToast({
        message: 'Please verify your smartcard before proceeding.',
        type: 'error',
      });
      return;
    }

    if (paymentMethod === 'wallet') {
      setShowPINModal(true);
    } else {
      // For card and bank transfer, process payment directly
      await handlePINConfirm('');
    }
  };

  const handlePINConfirm = async (pin: string) => {
    if (!user || !formData) return;

    try {
      setIsProcessing(true);
      setTransactionStatus('processing');

      const requestId = uuidv4();
      console.log('[TVReview] Processing payment with request ID:', requestId);

      const paymentData = {
        amount: formData.variationAmount || '0',
        billersCode: formData.smartcard || '',
        email: user.email || '',
        phone: user.phone_number || '',
        request_id: requestId,
        serviceID: formData.provider,
        variation_code: formData.variationCode,
        user_id: user.id || 0,
      };

      console.log('[TVReview] Payment data:', paymentData);

      const response = await vtuService.processPayment(paymentData);

      console.log('[TVReview] Payment response:', response);

      if (response?.status === 'success' || response?.message === 'successful') {
        setTransactionId(requestId);
        setTransactionStatus('success');

        // Clear stored data
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('tvFormData');
        }

        addToast({
          message: `TV subscription successful! Transaction ID: ${requestId}`,
          type: 'success',
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push(`/dashboard/tv-history?id=${requestId}`);
        }, 3000);
      } else {
        setTransactionStatus('error');

        if ((response as any)?.code === 'INSUFFICIENT_USER_BALANCE') {
          addToast({
            message: 'Insufficient wallet balance. Please top up your wallet and try again.',
            type: 'error',
          });
        } else {
          addToast({
            message:
              (response as any)?.message ||
              (response as any)?.error ||
              'Payment failed. Please try again or use a different payment method.',
            type: 'error',
          });
        }
      }
    } catch (error: any) {
      console.error('[TVReview] Payment error:', error);
      setTransactionStatus('error');

      const errorData = error?.response?.data || error;

      if (errorData?.code === 'INSUFFICIENT_USER_BALANCE') {
        addToast({
          message: 'Insufficient wallet balance. Please top up your wallet and try again.',
          type: 'error',
        });
      } else {
        addToast({
          message: errorData?.error || errorData?.message || 'An error occurred during payment. Please try again.',
          type: 'error',
        });
      }
    } finally {
      setIsProcessing(false);
      setShowPINModal(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/tv');
  };

  const originalAmount = parseFloat(formData?.variationAmount || '0');
  const displayAmount = formData?.subsidizedAmount || originalAmount;
  const hasSubsidy = formData?.subsidizedAmount !== undefined && formData?.savings !== undefined && formData.savings > 0;

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#a9b7ff]" size={40} />
      </div>
    );
  }

  if (transactionStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-green-600" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your TV subscription has been activated.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Transaction ID: {transactionId}
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-[#a9b7ff] hover:bg-[#9aa5ff] text-white"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isProcessing}
        >
          <ChevronLeft className="text-gray-600" size={24} />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Review Subscription</h1>
          <p className="text-gray-600 mt-1">Confirm your TV subscription details</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Subscription Details */}
          <Card className="p-6 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Subscription Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Provider</p>
                  <p className="font-semibold text-gray-900">
                    {formData.providerName}
                  </p>
                </div>
                <Tv className="text-[#a9b7ff]" size={20} />
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-semibold text-gray-900">
                    {formData.variationName}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Smartcard Number</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {formData.smartcard
                      ? `****${formData.smartcard.slice(-4)}`
                      : 'Not verified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-600">
                    {hasSubsidy ? 'Discounted Amount' : 'Amount'}
                  </p>
                  {hasSubsidy ? (
                    <>
                      <p className="text-2xl font-bold text-green-600">
                        &#8358;{displayAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 line-through">
                        &#8358;{originalAmount.toLocaleString()}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Save &#8358;{formData!.savings!.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-[#a9b7ff]">
                      &#8358;{originalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Smartcard Verification */}
          <Card className="p-6 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <SmartcardVerification
              state={{
                status: transactionStatus === 'verified' ? 'verified' : 
                       transactionStatus === 'verifying' ? 'verifying' :
                       transactionStatus === 'error' ? 'error' : 'idle',
                error: verificationError,
                customer: verifiedCustomer || undefined,
              }}
              smartcardNumber={formData.smartcard}
              providerName={formData.providerName}
              onRetry={() => {
                setTransactionStatus('idle');
                setVerificationError('');
                setVerifiedCustomer(null);
              }}
              showHints={true}
            />
          </Card>

          {/* Payment Method Selection */}
          {transactionStatus === 'verified' && (
            <Card className="p-6 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Select Payment Method
              </h2>

              <div className="space-y-3">
                {/* Wallet */}
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    paymentMethod === 'wallet'
                      ? 'border-[#a9b7ff] bg-[#f7f8ff]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet
                      size={20}
                      className={
                        paymentMethod === 'wallet'
                          ? 'text-[#a9b7ff]'
                          : 'text-gray-400'
                      }
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Wallet</p>
                      <p className="text-sm text-gray-500">
                        Pay with your wallet balance
                      </p>
                    </div>
                  </div>
                </button>

                {/* Card */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  disabled={true}
                  title="Coming soon"
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left opacity-50 cursor-not-allowed ${
                    paymentMethod === 'card'
                      ? 'border-[#a9b7ff] bg-[#f7f8ff]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard
                      size={20}
                      className={
                        paymentMethod === 'card'
                          ? 'text-[#a9b7ff]'
                          : 'text-gray-400'
                      }
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Debit Card</p>
                      <p className="text-sm text-gray-500">
                        Pay with your card
                      </p>
                    </div>
                  </div>
                </button>

                {/* Bank Transfer */}
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  disabled={true}
                  title="Coming soon"
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left opacity-50 cursor-not-allowed ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#a9b7ff] bg-[#f7f8ff]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock
                      size={20}
                      className={
                        paymentMethod === 'bank_transfer'
                          ? 'text-[#a9b7ff]'
                          : 'text-gray-400'
                      }
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-500">
                        Transfer via your bank
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="md:col-span-1">
          <Card className="p-6 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)] sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-6">Order Summary</h3>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Provider</span>
                <span className="text-sm font-medium text-gray-900">
                  {formData.providerName.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[150px]">
                  {formData.variationName?.substring(
                    0,
                    formData.variationName?.indexOf('N') || 20
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  &#8358;{originalAmount.toLocaleString()}
                </span>
              </div>
              {hasSubsidy && (
                <div className="flex justify-between items-center">
                  <span className="text-green-600">You Saved</span>
                  <span className="font-semibold text-green-600">
                    -&#8358;{formData!.savings!.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fee</span>
                <span className="font-semibold text-gray-900">&#8358;0.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-bold text-lg mb-6 pt-6 border-t border-gray-200">
              <span>Total</span>
              {hasSubsidy ? (
                <div className="text-right">
                  <span className="text-[#a9b7ff]">
                    &#8358;{displayAmount.toLocaleString()}
                  </span>
                  <p className="text-sm text-gray-500 line-through">
                    &#8358;{originalAmount.toLocaleString()}
                  </p>
                </div>
              ) : (
                <span className="text-[#a9b7ff]">
                  &#8358;{originalAmount.toLocaleString()}
                </span>
              )}
            </div>

            <Button
              onClick={handlePaymentProcess}
              disabled={
                isProcessing ||
                transactionStatus !== 'verified'
              }
              className="w-full bg-[#a9b7ff] hover:bg-[#9aa5ff] text-white disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </span>
              ) : (
                'Pay Now'
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              ✓ Secure payment powered by industry-standard encryption
            </p>
          </Card>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINConfirm}
        title="Confirm Payment"
        description="Enter your PIN to confirm this TV subscription payment"
      />
    </div>
  );
}

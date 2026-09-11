'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Spinner } from '@/components/shared/Spinner';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { useAlert } from '@/hooks/useAlert';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/payment.service';
import { formatCurrency } from '@/utils/format.utils';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ElectricityFormData {
  serviceID: string;
  billersCode: string;
  provider: string;
  providerID: string;
  meterNumber: string;
  customerName: string;
  paymentType: string;
  variationCode: string;
}

export default function ElectricityReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: alertError } = useAlert();
  const { execute } = useApi();

  const [formData, setFormData] = useState<ElectricityFormData | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showPINModal, setShowPINModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    requiredAmount: number;
    currentBalance: number;
    shortfall: number;
  } | null>(null);

  // Load form data from sessionStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('electricityFormData') : null;
    if (!stored) {
      router.push('/dashboard/bills');
      return;
    }

    try {
      const data = JSON.parse(stored) as ElectricityFormData;
      setFormData(data);
    } catch (err) {
      console.error('Error parsing form data:', err);
      router.push('/dashboard/bills');
    }
  }, [router]);

  // Validate amount input
  const isValidAmount = (): boolean => {
    const numAmount = parseInt(amount);
    return numAmount >= 100 && numAmount <= 10000000; // ₦100 to ₦10M
  };

  // Validate phone
  const isValidPhone = (): boolean => {
    return /^08\d{8}$/.test(phone);
  };

  // Validate email
  const isValidEmail = (): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle initial payment submission (open PIN modal)
  const handlePayment = () => {
    if (!amount.trim()) {
      alertError('Please enter an amount');
      return;
    }

    if (!isValidAmount()) {
      alertError('Amount must be between ₦100 and ₦10,000,000');
      return;
    }

    if (!isValidPhone()) {
      alertError('Phone number must be in format 08xxxxxxxxx');
      return;
    }

    if (!isValidEmail()) {
      alertError('Please enter a valid email address');
      return;
    }

    setShowPINModal(true);
  };

  // Handle PIN confirmation
  const handlePINConfirm = async (pin: string) => {
    if (!formData || !user) {
      alertError('Form data missing');
      setShowPINModal(false);
      return;
    }

    setIsProcessing(true);
    setInsufficientBalance(false);

    try {
      const billersCode = formData.billersCode;

      const paymentPayload = {
        serviceID: formData.serviceID,
        phone,
        amount: parseInt(amount),
        billersCode,
        variation_code: formData.variationCode,
        user_id: user.id,
        user_email: email,
        payment_method: paymentMethod,
        pin,
      };

      const paymentResult = await execute(
        paymentService.purchaseElectricity(paymentPayload)
      );

      if (paymentResult?.success) {
        success('Electricity bill payment successful!');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('electricityFormData');
        }
        router.push('/dashboard/history');
      } else {
        const errorCode = (paymentResult as any)?.code || paymentResult?.error_code;
        if (errorCode === 'INSUFFICIENT_USER_BALANCE') {
          const required = parseInt(amount);
          const current = (paymentResult as any)?.current_balance || 0;
          const shortfall = required - current;

          setInsufficientBalance(true);
          setBalanceInfo({
            requiredAmount: required,
            currentBalance: current,
            shortfall: Math.max(0, shortfall),
          });
        } else {
          alertError(paymentResult?.message || 'Payment failed');
        }
        setShowPINModal(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alertError(err?.message || 'Payment processing failed');
      setShowPINModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!formData) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  const canProceed = amount && isValidAmount() && isValidPhone() && isValidEmail();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Payment</h1>
          <p className="text-gray-600">Electricity Bill</p>
        </div>
      </div>

      {/* Insufficient Balance Alert */}
      {insufficientBalance && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Insufficient Balance</h3>
              <p className="text-sm text-red-700 mb-3">
                Your wallet balance is insufficient to complete this payment. Please top up your wallet and try again.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => router.push('/dashboard/wallet')}
              >
                Go to Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Service Details */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Service Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-600 uppercase">Provider</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{formData.provider}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-600 uppercase">Payment Type</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{formData.paymentType}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-600 uppercase">Meter Number</p>
              <p className="text-base font-semibold text-gray-900 mt-1">{formData.meterNumber}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-600 uppercase">Customer Name</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {formData.customerName}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Amount Input */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>

          <Input
            label="Amount to Pay (₦)"
            type="number"
            placeholder="Enter amount (₦100 - ₦10,000,000)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={
              amount && !isValidAmount()
                ? 'Amount must be between ₦100 and ₦10,000,000'
                : ''
            }
          />

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="08xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={
                phone && !isValidPhone()
                  ? 'Phone must be in format 08xxxxxxxxx'
                  : ''
              }
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={
                email && !isValidEmail()
                  ? 'Please enter a valid email'
                  : ''
              }
            />
          </div>
        </div>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>

          <div className="space-y-3">
            {['wallet', 'card', 'bank_transfer'].map((method) => {
              const isDisabled = method !== 'wallet';
              return (
              <label
                key={method}
                title={isDisabled ? 'Coming soon' : ''}
                className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  paymentMethod === method
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={method}
                  disabled={isDisabled}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="ml-3 font-medium text-gray-900 capitalize">
                  {method === 'bank_transfer' ? 'Bank Transfer' : method.charAt(0).toUpperCase() + method.slice(1)}
                </span>
              </label>
            );
            })}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-primary">
        <div className="space-y-2">
          <div className="flex justify-between items-center pb-3 border-b border-primary/20">
            <span className="text-gray-700">Amount to Pay:</span>
            <span className="text-2xl font-bold text-primary">
              {amount ? formatCurrency(parseInt(amount)) : '₦0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium text-gray-900 capitalize">
              {paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod}
            </span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={() => router.back()}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          fullWidth
          size="lg"
          onClick={handlePayment}
          disabled={!canProceed || isProcessing || insufficientBalance}
          isLoading={isProcessing}
        >
          Proceed to Payment
        </Button>
      </div>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINConfirm}
        isLoading={isProcessing}
      />
    </div>
  );
}

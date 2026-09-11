'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { useAlert } from '@/hooks/useAlert';
import { useApi } from '@/hooks/useApi';
import { vtuService } from '@/services/vtu.service';
import { Spinner } from '@/components/shared/Spinner';
import { ChevronRight, Check, Zap, AlertCircle, Loader } from 'lucide-react';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { paymentService } from '@/services/payment.service';
import { formatCurrency } from '@/utils/format.utils';
import { useAuth } from '@/hooks/useAuth';
import { VTUProvider } from '@/types/vtu.types';

type FormStep = 'provider' | 'payment-type' | 'meter' | 'payment';

export default function BillsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: alertError } = useAlert();
  const { execute } = useApi();

  const [step, setStep] = useState<FormStep>('provider');
  const [providers, setProviders] = useState<VTUProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [verifyingMeter, setVerifyingMeter] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [lastVerifyTime, setLastVerifyTime] = useState<number>(0);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState<VTUProvider | null>(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
  const [verifiedCustomer, setVerifiedCustomer] = useState<any>(null);
  const [meterError, setMeterError] = useState('');

  // Payment form state
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);

  // Load electricity providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const result = await vtuService.getElectricityProviders();
        if (result && result.length > 0) {
          setProviders(result);
          setSelectedProvider(result[0]);
        } else {
          alertError('Failed to load electricity providers');
        }
      } catch (err) {
        console.error('Error loading providers:', err);
        alertError('Error loading providers');
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, [alertError]);

  // Handle meter verification
  const handleVerifyMeter = async () => {
    // Prevent multiple simultaneous requests
    if (verifyingMeter) {
      return;
    }

    if (!meterNumber.trim()) {
      setMeterError('Please enter a meter number');
      return;
    }

    if (!selectedProvider) {
      setMeterError('Please select a provider first');
      return;
    }

    // Prevent duplicate requests within 3 seconds
    const now = Date.now();
    if (now - lastVerifyTime < 3000) {
      setMeterError('Please wait a moment before trying again');
      return;
    }

    setVerifyingMeter(true);
    setMeterError('');
    setLastVerifyTime(now);

    try {
        const billersCode = selectedProvider.biller_code || selectedProvider.biller_id || selectedProvider.serviceID;
      
      console.log('[MeterVerification] Starting verification:', {
        meterNumber,
        billersCode,
        serviceID: 'electricity-bill',
      });

      const response = await execute(
        vtuService.verifyMeterNumber(billersCode, meterNumber, 'electricity-bill')
      );

      console.log('[MeterVerification] Full response:', response);
      console.log('[MeterVerification] Response code:', response?.code);
      console.log('[MeterVerification] Response content:', response?.content);
      console.log('[MeterVerification] Customer name:', response?.content?.Customer_Name);

      if (response && response.code === '000' && response.content) {
        setVerifiedCustomer({
          meterNumber,
          customerName: response.content?.Customer_Name || 'Verified Customer',
          provider: selectedProvider.name,
        });
        success('Meter verified successfully!');
        setStep('payment');
      } else if ((response as any)?.code === '012') {
        setMeterError('Verification already in progress. Please wait a moment and try again.');
      } else if ((response as any)?.code === '015') {
        setMeterError('Invalid meter number for this provider');
      } else {
        setMeterError((response as any)?.response_description || (response as any)?.content?.errors || 'Meter verification failed');
      }
    } catch (err: any) {
      console.error('[MeterVerification] Error verifying meter:', err);
      console.error('[MeterVerification] Error message:', err?.message);
      console.error('[MeterVerification] Error response:', err?.response);
      console.error('[MeterVerification] Error response data:', err?.response?.data);
      console.error('[MeterVerification] Error response status:', err?.response?.status);
      setMeterError(err?.message || 'Failed to verify meter number');
    } finally {
      setVerifyingMeter(false);
    }
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!amount.trim()) {
      alertError('Please enter an amount');
      return;
    }

    if (!/^08\d{8}$/.test(phone)) {
      alertError('Phone number must be in format 08xxxxxxxxx');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alertError('Please enter a valid email address');
      return;
    }

    setShowPINModal(true);
  };

  // Handle PIN confirmation for payment
  const handlePINConfirm = async (pin: string) => {
    if (!selectedProvider || !user) {
      alertError('Provider or user information missing');
      setShowPINModal(false);
      return;
    }

    setProcessingPayment(true);
    setInsufficientBalance(false);

    try {
      const billersCode = selectedProvider.biller_code || selectedProvider.biller_id || selectedProvider.serviceID;

      const paymentPayload = {
        serviceID: 'electricity-bill',
        phone,
        amount: parseInt(amount),
        billersCode,
        variation_code: paymentType.toLowerCase(),
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
      setProcessingPayment(false);
    }
  };

  // Step indicators
  const steps = ['Select Provider', 'Meter Details', 'Verify Meter', 'Payment'];
  const stepIndex = step === 'provider' ? 0 : step === 'payment-type' ? 1 : step === 'meter' ? 2 : 3;

  if (loadingProviders) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Loader className="animate-spin text-[#4a5ff7]" size={26} />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">Loading electricity providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="space-y-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
        {/* Step 1: Select Provider */}
        {step === 'provider' && (
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4a5ff7] bg-white text-sm font-bold text-[#4a5ff7]">
                1
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Select Electricity Provider
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#111827] mb-6">
              Which distribution company provides your electricity?
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <button
                  key={provider.serviceID}
                  onClick={() => setSelectedProvider(provider)}
                  className={`relative group rounded-[20px] border-2 p-4 transition-all ${
                    selectedProvider?.serviceID === provider.serviceID
                      ? 'border-[#4a5ff7] bg-[#f7f8ff]'
                      : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                  }`}
                >
                  {/* Provider Image */}
                  <div className="mb-3 h-[60px] flex items-center justify-center">
                    {provider.image ? (
                      <Image
                        src={provider.image}
                        alt={provider.name}
                        width={60}
                        height={60}
                        className="max-h-[60px] max-w-[60px] object-contain"
                      />
                    ) : (
                      <Zap className="text-[#4a5ff7]" size={32} />
                    )}
                  </div>

                  {/* Provider Name */}
                  <p className="text-xs font-bold text-[#111827] line-clamp-2">{provider.name}</p>

                  {/* Selection Indicator */}
                  {selectedProvider?.serviceID === provider.serviceID && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#4a5ff7] text-white">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                fullWidth
                size="lg"
                onClick={() => setStep('payment-type')}
                disabled={!selectedProvider}
                className="rounded-[16px]"
              >
                Continue <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Meter Type & Meter Number */}
        {step === 'payment-type' && (
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a5ff7] text-sm font-bold text-white">
                2
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Meter Details
              </span>
            </div>

            {/* Selected Provider Display */}
            <div className="mb-8 p-4 rounded-[18px] bg-[#f0f3ff] border border-[#dfe4ff]">
              <p className="text-xs font-semibold text-[#6b7280] uppercase mb-2">Provider</p>
              <p className="text-lg font-bold text-[#111827]">{selectedProvider?.name}</p>
            </div>

            {/* Meter Type */}
            <h3 className="text-xl font-bold tracking-tight text-[#111827] mb-5">
              What is your meter type?
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <label
                className={`flex items-center rounded-[18px] border-2 p-5 transition-all cursor-pointer ${
                  paymentType === 'Prepaid'
                    ? 'border-[#4a5ff7] bg-[#f7f8ff]'
                    : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                }`}
              >
                <input
                  type="radio"
                  name="meterType"
                  value="Prepaid"
                  checked={paymentType === 'Prepaid'}
                  onChange={(e) => setPaymentType(e.target.value as 'Prepaid' | 'Postpaid')}
                  className="w-4 h-4 accent-[#4a5ff7]"
                />
                <span className="ml-3 font-semibold text-[#111827]">Prepaid</span>
              </label>

              <label
                className={`flex items-center rounded-[18px] border-2 p-5 transition-all cursor-pointer ${
                  paymentType === 'Postpaid'
                    ? 'border-[#4a5ff7] bg-[#f7f8ff]'
                    : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                }`}
              >
                <input
                  type="radio"
                  name="meterType"
                  value="Postpaid"
                  checked={paymentType === 'Postpaid'}
                  onChange={(e) => setPaymentType(e.target.value as 'Prepaid' | 'Postpaid')}
                  className="w-4 h-4 accent-[#4a5ff7]"
                />
                <span className="ml-3 font-semibold text-[#111827]">Postpaid</span>
              </label>
            </div>

            {/* Meter Number */}
            <h3 className="text-xl font-bold tracking-tight text-[#111827] mb-5">
              Enter meter number
            </h3>

            <Input
              label="Meter Number"
              type="text"
              placeholder="e.g., 12345678901"
              value={meterNumber}
              onChange={(e) => {
                setMeterNumber(e.target.value);
                setMeterError('');
              }}
              error={meterError}
              disabled={verifyingMeter}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setStep('provider')}
                className="rounded-[16px]"
              >
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                onClick={() => setStep('meter')}
                disabled={!meterNumber.trim()}
                className="rounded-[16px] flex items-center justify-center gap-2"
              >
                Verify Meter <ChevronRight size={18} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Verify Meter */}
        {step === 'meter' && (
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a5ff7] text-sm font-bold text-white">
                3
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Verify Meter
              </span>
            </div>

            {/* Meter Details Summary */}
            <div className="mb-8 space-y-4 p-5 rounded-[18px] bg-gradient-to-br from-[#f7f8ff] to-[#eef2ff] border border-[#dfe4ff]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Provider</p>
                  <p className="text-base font-bold text-[#111827]">{selectedProvider?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Meter Type</p>
                  <p className="text-base font-bold text-[#111827]">{paymentType}</p>
                </div>
              </div>
              <div className="border-t border-[#cfd8ff] pt-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Meter Number</p>
                <p className="text-lg font-bold text-[#4a5ff7]">{meterNumber}</p>
              </div>
            </div>

            {/* Verification Status */}
            {!verifiedCustomer ? (
              <>
                <p className="mb-6 text-sm text-[#6b7280]">
                  Click the button below to verify your meter with {selectedProvider?.name}. This helps us fetch your billing information.
                </p>

                {meterError && (
                  <div className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#fca5a5] bg-[#fef2f2] p-4">
                    <AlertCircle className="text-[#dc2626] flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-[#dc2626]">{meterError}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#86efac] bg-[#f0fdf4] p-4">
                <Check className="text-[#16a34a] flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-[#16a34a] mb-1">Meter Verified Successfully</p>
                  <p className="text-sm text-[#15803d]">
                    Customer: <span className="font-semibold">{verifiedCustomer.customerName}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setStep('payment-type')}
                disabled={verifyingMeter}
                className="rounded-[16px]"
              >
                Back
              </Button>
              {!verifiedCustomer ? (
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleVerifyMeter}
                  isLoading={verifyingMeter}
                  disabled={verifyingMeter}
                  className="rounded-[16px] flex items-center justify-center gap-2"
                >
                  {verifyingMeter ? 'Verifying...' : 'Verify Meter'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => setStep('payment')}
                  className="rounded-[16px] flex items-center justify-center gap-2"
                >
                  Continue to Payment <ChevronRight size={18} />
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Step 4: Payment */}
        {step === 'payment' && (
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a5ff7] text-sm font-bold text-white">
                4
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Confirm Payment
              </span>
            </div>

            {/* Verified Details */}
            <div className="mb-8 space-y-4 p-5 rounded-[18px] bg-gradient-to-br from-[#f0fdf4] to-[#dbeafe] border border-[#86efac]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Provider</p>
                  <p className="text-sm font-bold text-[#111827]">{selectedProvider?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Meter Type</p>
                  <p className="text-sm font-bold text-[#111827]">{paymentType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Meter Number</p>
                  <p className="text-sm font-bold text-[#111827]">{meterNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase mb-1">Customer</p>
                  <p className="text-sm font-bold text-[#111827]">{verifiedCustomer?.customerName}</p>
                </div>
              </div>
            </div>

            {/* Insufficient Balance Alert */}
            {insufficientBalance && (
              <div className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#fca5a5] bg-[#fef2f2] p-4">
                <AlertCircle className="text-[#dc2626] flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#dc2626] mb-2">Insufficient Balance</h3>
                  <p className="text-sm text-[#991b1b] mb-3">
                    Your wallet balance is insufficient to complete this payment. Please top up your wallet and try again.
                  </p>
                  <Button
                    size="sm"
                    className="w-full rounded-[12px]"
                    onClick={() => router.push('/dashboard/wallet')}
                  >
                    Fund Wallet
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Form */}
            <div className="space-y-6">
              {/* Amount */}
              <div>
                <h3 className="text-lg font-bold text-[#111827] mb-4">Payment Amount</h3>
                <Input
                  label="Amount (₦)"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={
                    amount && parseInt(amount) < 100
                      ? 'Minimum amount is ₦100'
                      : ''
                  }
                />
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-[#111827] mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="08xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-bold text-[#111827] mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {['wallet', 'card', 'bank_transfer'].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center rounded-[16px] border-2 p-4 transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'border-[#4a5ff7] bg-[#f7f8ff]'
                          : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 accent-[#4a5ff7]"
                      />
                      <span className="ml-3 font-semibold text-[#111827] capitalize">
                        {method === 'bank_transfer' ? 'Bank Transfer' : method.charAt(0).toUpperCase() + method.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 rounded-[18px] border border-[#dfe4ff] bg-gradient-to-br from-[#f7f8ff] to-[#eef2ff] p-5">
                <div className="flex justify-between items-center pb-4 border-b border-[#cfd8ff]">
                  <span className="text-[#6b7280] font-semibold">Total Amount:</span>
                  <span className="text-3xl font-extrabold text-[#4a5ff7]">
                    {amount ? formatCurrency(parseInt(amount)) : '₦0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-4">
                  <span className="text-[#6b7280]">Payment Method:</span>
                  <span className="font-semibold text-[#111827] capitalize">
                    {paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setStep('meter')}
                disabled={processingPayment}
                className="rounded-[16px]"
              >
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                onClick={handlePayment}
                disabled={!amount.trim() || processingPayment || insufficientBalance}
                isLoading={processingPayment}
                className="rounded-[16px]"
              >
                {processingPayment ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </Card>
        )}
        </div>

        {/* Sidebar Summary */}
        <div>
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] xl:sticky xl:top-8">
            <h3 className="text-lg font-bold tracking-tight text-[#111827]">
              Payment Details
            </h3>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Provider
                </p>
                {selectedProvider ? (
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {selectedProvider.name}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#9ca3af]">Not selected</p>
                )}
              </div>

              <div className="border-t border-[#e5e7eb] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Meter Type
                </p>
                {paymentType ? (
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {paymentType}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#9ca3af]">Not selected</p>
                )}
              </div>

              {meterNumber && (
                <div className="border-t border-[#e5e7eb] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Meter Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {meterNumber}
                  </p>
                </div>
              )}

              {amount && (
                <div className="border-t border-[#e5e7eb] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Amount
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#4a5ff7]">
                    ₦{parseInt(amount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <Button
              fullWidth
              disabled={!selectedProvider || step === 'payment' && (!amount.trim() || !phone.trim() || !email.trim())}
              className="mt-8 h-12 rounded-xl text-base font-semibold"
              onClick={() => {
                if (step === 'provider' && selectedProvider) setStep('payment-type');
                else if (step === 'payment-type' && meterNumber) setStep('meter');
                else if (step === 'meter' && verifiedCustomer) setStep('payment');
              }}
            >
              Continue
              <ChevronRight className="ml-2" size={18} />
            </Button>

            <p className="mt-4 text-center text-xs text-[#6b7280]">
              Step {step === 'provider' ? 1 : step === 'payment-type' ? 2 : step === 'meter' ? 3 : 4} of 4
            </p>
          </Card>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINConfirm}
        isLoading={processingPayment}
      />
    </div>
  );
}

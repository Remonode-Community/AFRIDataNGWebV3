'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader, Tv } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Toast } from '@/components/shared/Toast';
import { vtuService } from '@/services/vtu.service';
import { useUIStore } from '@/store/ui.store';
import { VTUProvider, VTUVariation } from '@/types/vtu.types';
import Image from 'next/image';

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

export default function TVPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [providers, setProviders] = useState<VTUProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [variations, setVariations] = useState<VTUVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [smartcard, setSmartcard] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [step, setStep] = useState<'select' | 'plan' | 'verify'>(
    'select'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('[TVPage] Fetching TV providers...');
        setLoading(true);
        const data = await vtuService.getTVProviders();

        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[TVPage] Providers loaded:', data.length);
          setProviders(data);
          // Auto-select first provider
          setSelectedProvider(data[0].serviceID);
        } else {
          console.warn('[TVPage] No providers returned');
          addToast({
            message: 'Failed to load TV providers',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('[TVPage] Error loading providers:', err);
        addToast({
          message: 'Failed to load TV providers. Please try again.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [addToast]);

  // Fetch variations when provider changes
  useEffect(() => {
    if (!selectedProvider) return;

    const fetchVariations = async () => {
      try {
        console.log('[TVPage] Fetching variations for provider:', selectedProvider);
        setLoadingVariations(true);
        setVariations([]);
        setSelectedVariation('');
        setSmartcard('');

        const response = await vtuService.getTVVariations(selectedProvider);

        if (response && response.variations && Array.isArray(response.variations)) {
          console.log('[TVPage] Variations loaded:', response.variations.length);
          setVariations(response.variations);
        } else {
          console.error('[TVPage] Invalid variations response:', response);
          addToast({
            message: 'Failed to load TV plans',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('[TVPage] Error loading variations:', err);
        addToast({
          message: 'Failed to load TV plans. Please try again.',
          type: 'error',
        });
      } finally {
        setLoadingVariations(false);
      }
    };

    fetchVariations();
  }, [selectedProvider, addToast]);

  const validateSmartcard = (value: string): boolean => {
    // Smartcard numbers are typically 10-20 digits
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 30;
  };

  const handleContinue = async () => {
    setErrors({});

    if (step === 'select') {
      if (!selectedProvider) {
        setErrors({ provider: 'Please select a TV provider' });
        return;
      }
      setStep('plan');
    } else if (step === 'plan') {
      if (!selectedVariation) {
        setErrors({ variation: 'Please select a subscription plan' });
        return;
      }
      setStep('verify');
    } else if (step === 'verify') {
      if (!smartcard.trim()) {
        setErrors({ smartcard: 'Smartcard number is required' });
        return;
      }
      if (!validateSmartcard(smartcard)) {
        setErrors({
          smartcard: 'Please enter a valid smartcard number (10-30 digits)',
        });
        return;
      }

      // Store form data and proceed to review
      try {
        const selectedPlan = variations.find(
          (v) => v.variation_code === selectedVariation
        );
        const selectedProviderData = providers.find(
          (p) => p.serviceID === selectedProvider
        );

        const dataToStore: TVFormData = {
          provider: selectedProvider,
          providerName: selectedProviderData?.name || '',
          variation: selectedVariation,
          variationCode: selectedVariation,
          variationName: selectedPlan?.name,
          variationAmount: selectedPlan?.variation_amount,
          smartcard,
          subsidizedAmount: selectedPlan?.subsidized?.enabled ? selectedPlan.subsidized.subsidized_amount : undefined,
          savings: selectedPlan?.subsidized?.enabled ? selectedPlan.subsidized.savings : undefined,
        };

        console.log('[TVPage] Storing form data to session:', dataToStore);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tvFormData', JSON.stringify(dataToStore));
        }

        router.push('/dashboard/tv/review');
      } catch (err) {
        console.error('[TVPage] Error during continue:', err);
        addToast({
          message: 'An error occurred. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const handleBack = () => {
    if (step === 'plan') {
      setStep('select');
      setSelectedVariation('');
      setSmartcard('');
      setErrors({});
    } else if (step === 'verify') {
      setStep('plan');
      setSmartcard('');
      setErrors({});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin text-[#a9b7ff] mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading TV providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">TV Subscription</h1>
        <p className="text-gray-600 mt-2">Subscribe to your favorite TV services</p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
          <Card className="p-6 sm:p-8 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
            <div className="space-y-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2">
            {/* Step 1 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  step === 'select' || step === 'plan' || step === 'verify'
                    ? 'bg-[#a9b7ff] text-white'
                    : 'border-2 border-gray-300 text-gray-500'
                }`}
              >
                1
              </div>
              <div
                className={`text-sm font-semibold hidden sm:block ${
                  step === 'select' || step === 'plan' || step === 'verify'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                Provider
              </div>
            </div>

            <div className="h-1.5 flex-1 bg-gray-300 rounded-full min-w-8"></div>

            {/* Step 2 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  step === 'plan' || step === 'verify'
                    ? 'bg-[#a9b7ff] text-white'
                    : 'border-2 border-gray-300 text-gray-500'
                }`}
              >
                2
              </div>
              <div
                className={`text-sm font-semibold hidden sm:block ${
                  step === 'plan' || step === 'verify'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                Plan
              </div>
            </div>

            <div className="h-1.5 flex-1 bg-gray-300 rounded-full min-w-8"></div>

            {/* Step 3 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  step === 'verify'
                    ? 'bg-[#a9b7ff] text-white'
                    : 'border-2 border-gray-300 text-gray-500'
                }`}
              >
                3
              </div>
              <div
                className={`text-sm font-semibold hidden sm:block ${
                  step === 'verify' ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                Verify
              </div>
            </div>

            <div className="h-1.5 flex-1 bg-gray-300 rounded-full min-w-8"></div>

            {/* Step 4 */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 text-gray-500 font-bold text-sm">
                4
              </div>
              <div className="text-sm font-semibold hidden sm:block text-gray-500">
                Pay
              </div>
            </div>
          </div>

          {/* Step 1: Provider Selection */}
          {step === 'select' && (
            <div className="space-y-6 pt-2">
              <label className="block text-sm font-semibold text-gray-900">
                Select TV Provider
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {providers.map((provider) => (
                  <button
                    key={provider.serviceID}
                    onClick={() => {
                      setSelectedProvider(provider.serviceID);
                      setErrors((prev) => ({
                        ...prev,
                        provider: '',
                      }));
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedProvider === provider.serviceID
                        ? 'border-[#a9b7ff] bg-[#f7f8ff] shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      {provider.image && (
                        <div className="h-16 w-full flex items-center justify-center">
                          <Image
                            src={provider.image}
                            alt={provider.name}
                            width={60}
                            height={60}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                        {provider.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.provider && (
                <p className="text-sm text-red-600">{errors.provider}</p>
              )}
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 'plan' && (
            <div className="space-y-6 pt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Selected Provider
                </label>
                <div className="p-4 bg-[#f7f8ff] border border-[#e5e7eb] rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {
                      providers.find((p) => p.serviceID === selectedProvider)
                        ?.name
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Select Subscription Plan
                </label>
                {loadingVariations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="animate-spin text-[#a9b7ff]" size={32} />
                  </div>
                ) : variations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No plans available for this provider
                  </p>
                ) : (
                  <div className="space-y-3">
                    {variations.map((plan) => {
                      const hasSubsidy = plan.subsidized?.enabled && plan.subsidized.savings > 0;
                      return (
                        <button
                          key={plan.variation_code}
                          onClick={() => {
                            setSelectedVariation(plan.variation_code);
                            setErrors((prev) => ({
                              ...prev,
                              variation: '',
                            }));
                          }}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedVariation === plan.variation_code
                              ? hasSubsidy
                                ? 'border-green-500 bg-green-50/30 shadow-md'
                                : 'border-[#a9b7ff] bg-[#f7f8ff] shadow-md'
                              : hasSubsidy
                              ? 'border-green-200 bg-white hover:border-green-300'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {plan.name}
                              </p>
                              {plan.fixedPrice === 'Yes' && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Fixed price
                                </p>
                              )}
                              {hasSubsidy && (
                                <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Save &#8358;{plan.subsidized!.savings.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              {hasSubsidy ? (
                                <>
                                  <p className="text-sm font-bold text-green-600">
                                    &#8358;{plan.subsidized!.subsidized_amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500 line-through">
                                    &#8358;{parseFloat(plan.variation_amount).toLocaleString()}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-bold text-[#a9b7ff]">
                                  &#8358;{parseFloat(plan.variation_amount).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.variation && (
                <p className="text-sm text-red-600">{errors.variation}</p>
              )}
            </div>
          )}

          {/* Step 3: Smartcard Verification */}
          {step === 'verify' && (
            <div className="space-y-6 pt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Selected Plan
                </label>
                <div className="p-4 bg-[#f7f8ff] border border-[#e5e7eb] rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    {variations.find((v) => v.variation_code === selectedVariation)
                      ?.name}
                  </p>
                  <p className="text-lg font-bold text-[#a9b7ff]">
                    ₦
                    {parseFloat(
                      variations.find((v) => v.variation_code === selectedVariation)
                        ?.variation_amount || '0'
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Tv className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Enter Your Smartcard Number</p>
                    <p className="text-xs opacity-90">
                      Find your smartcard/decoder number on your device or bill
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Smartcard/Decoder Number"
                type="text"
                placeholder="Enter your smartcard number"
                value={smartcard}
                onChange={(e) => {
                  setSmartcard(e.target.value.replace(/\D/g, ''));
                  if (errors.smartcard) {
                    setErrors((prev) => ({
                      ...prev,
                      smartcard: '',
                    }));
                  }
                }}
                error={errors.smartcard}
                maxLength={30}
              />

              <div className="text-xs text-gray-500 space-y-1">
                <p>• DSTV: Look for the 10-11 digit number after "Decoder No."</p>
                <p>• GoTV: Look for the smartcard number on your device</p>
                <p>• Startimes: Find the smartcard number on your decoder</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {step !== 'select' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleContinue}
              className="flex-1 sm:flex-none bg-[#a9b7ff] hover:bg-[#9aa5ff] text-white"
            >
              <div className="flex items-center gap-2">
                <span>
                  {step === 'verify' ? 'Continue to Payment' : 'Continue'}
                </span>
                <ChevronRight size={18} />
              </div>
            </Button>
          </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div>
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] xl:sticky xl:top-8">
            <h3 className="text-lg font-bold tracking-tight text-[#111827]">
              Summary
            </h3>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Provider
                </p>
                {selectedProvider ? (
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {providers.find((p) => p.serviceID === selectedProvider)?.name}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[#9ca3af]">Not selected</p>
                )}
              </div>

              <div className="border-t border-[#e5e7eb] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Subscription Plan
                </p>
                {selectedVariation ? (
                  <div className="mt-1 space-y-2">
                    <p className="text-sm font-semibold text-[#111827]">
                      {variations.find((v) => v.variation_code === selectedVariation)?.name}
                    </p>
                    {(() => {
                      const selectedVar = variations.find((v) => v.variation_code === selectedVariation);
                      const hasSubsidy = selectedVar?.subsidized?.enabled && selectedVar.subsidized.savings > 0;
                      if (hasSubsidy) {
                        return (
                          <>
                            <p className="text-lg font-bold text-green-600">
                              &#8358;{selectedVar!.subsidized!.subsidized_amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 line-through">
                              &#8358;{parseFloat(selectedVar!.variation_amount).toLocaleString()}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Save &#8358;{selectedVar!.subsidized!.savings.toLocaleString()}
                            </span>
                          </>
                        );
                      }
                      return (
                        <p className="text-lg font-bold text-[#a9b7ff]">
                          &#8358;{parseFloat(selectedVar?.variation_amount || '0').toLocaleString()}
                        </p>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[#9ca3af]">Not selected</p>
                )}
              </div>

              {smartcard && (
                <div className="border-t border-[#e5e7eb] pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Smartcard Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">
                    {smartcard}
                  </p>
                </div>
              )}
            </div>

            <Button
              fullWidth
              onClick={handleContinue}
              disabled={
                (step === 'select' && !selectedProvider) ||
                (step === 'plan' && !selectedVariation) ||
                (step === 'verify' && !smartcard.trim())
              }
              className="mt-8 h-12 rounded-xl text-base font-semibold"
            >
              Continue
              <ChevronRight className="ml-2" size={18} />
            </Button>

            <p className="mt-4 text-center text-xs text-[#6b7280]">
              Step {step === 'select' ? 1 : step === 'plan' ? 2 : 3} of 3
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

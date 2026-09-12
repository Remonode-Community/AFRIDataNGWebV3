'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader, Wifi } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/components/shared/Toast';
import { vtuService } from '@/services/vtu.service';
import { useUIStore } from '@/store/ui.store';
import { VTUProvider } from '@/types/vtu.types';
import Image from 'next/image';

interface DataFormData {
  provider: string;
  providerName: string;
  variation?: string;
  variationCode?: string;
  variationName?: string;
  variationAmount?: string;
  subsidizedAmount?: number;
  savings?: number;
}

export default function DataPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [providers, setProviders] = useState<VTUProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [variations, setVariations] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('[DataPage] Fetching data providers...');
        setLoading(true);
        const data = await vtuService.getDataProviders();

        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[DataPage] Providers loaded:', data.length);
          setProviders(data);
          // Auto-select first provider
          setSelectedProvider(data[0].serviceID);
        } else {
          console.warn('[DataPage] No providers returned');
          addToast({
            message: 'Failed to load data providers',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('[DataPage] Error loading providers:', err);
        addToast({
          message: 'Failed to load data providers. Please try again.',
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
        console.log('[DataPage] Fetching variations for provider:', selectedProvider);
        setLoadingVariations(true);
        setVariations([]);
        setSelectedVariation('');

        const response = await vtuService.getDataVariations(selectedProvider);

        if (response && response.variations && Array.isArray(response.variations)) {
          console.log('[DataPage] Variations loaded:', response.variations.length);
          setVariations(response.variations);
        } else {
          console.error('[DataPage] Invalid variations response:', response);
          addToast({
            message: 'Failed to load data plans',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('[DataPage] Error loading variations:', err);
        addToast({
          message: 'Failed to load data plans. Please try again.',
          type: 'error',
        });
      } finally {
        setLoadingVariations(false);
      }
    };

    fetchVariations();
  }, [selectedProvider, addToast]);

  const handleContinue = async () => {
    console.log('[DataPage] Continue clicked');
    const newErrors: Record<string, string> = {};

    if (!selectedProvider) {
      newErrors.provider = 'Please select a provider';
    }
    if (!selectedVariation) {
      newErrors.variation = 'Please select a data plan';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const provider = providers.find((p) => p.serviceID === selectedProvider);
      const variation = variations.find((v) => v.variation_code === selectedVariation);

      if (!provider || !variation) {
        console.error('[DataPage] Invalid selection:', provider, variation);
        return;
      }

      const dataToStore: DataFormData = {
        provider: selectedProvider,
        providerName: provider.name,
        variation: selectedVariation,
        variationCode: variation.variation_code,
        variationName: variation.name,
        variationAmount: variation.variation_amount,
        subsidizedAmount: variation.subsidized?.enabled ? variation.subsidized.subsidized_amount : undefined,
        savings: variation.subsidized?.enabled ? variation.subsidized.savings : undefined,
      };

      console.log('[DataPage] Storing form data:', dataToStore);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dataFormData', JSON.stringify(dataToStore));
      }

      router.push('/dashboard/data/review');
    } catch (err) {
      console.error('[DataPage] Error during continue:', err);
      addToast({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <Loader className="animate-spin text-[#4a5ff7]" size={26} />
          </div>
          <p className="text-sm font-medium text-[#6b7280]">Loading data providers...</p>
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
          {/* Step 1: Select Provider */}
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4a5ff7] bg-white text-sm font-bold text-[#4a5ff7]">
                1
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Select Network Provider
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#111827] mb-6">
              Which network would you like to buy data from?
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <button
                  key={provider.serviceID}
                  onClick={() => {
                    setSelectedProvider(provider.serviceID);
                    setErrors({});
                  }}
                  className={`relative group rounded-[20px] border-2 p-4 transition-all ${
                    selectedProvider === provider.serviceID
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
                      <Wifi className="text-[#4a5ff7]" size={32} />
                    )}
                  </div>

                  {/* Provider Name */}
                  <p className="text-sm font-bold text-[#111827]">{provider.name}</p>

                  {/* Selection Indicator */}
                  {selectedProvider === provider.serviceID && (
                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#4a5ff7] text-white">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {errors.provider && (
              <p className="mt-4 text-sm text-red-600">{errors.provider}</p>
            )}
          </Card>

          {/* Step 2: Select Data Plan */}
          <Card className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a5ff7] text-sm font-bold text-white">
                2
              </div>
              <span className="text-sm font-semibold text-[#111827]">
                Select Data Plan
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-[#111827] mb-6">
              Choose your preferred data plan
            </h2>

            {loadingVariations ? (
              <div className="flex justify-center py-8">
                <div className="text-center">
                  <Loader className="animate-spin mx-auto mb-2 text-[#4a5ff7]" size={24} />
                  <p className="text-sm text-[#6b7280]">Loading available plans...</p>
                </div>
              </div>
            ) : variations.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {variations.map((variation) => {
                  const hasSubsidy = variation.subsidized?.enabled && variation.subsidized.savings > 0;
                  return (
                    <button
                      key={variation.variation_code}
                      onClick={() => {
                        setSelectedVariation(variation.variation_code);
                        setErrors({});
                      }}
                      className={`w-full rounded-[18px] border-2 p-4 text-left transition-all ${
                        selectedVariation === variation.variation_code
                          ? hasSubsidy
                            ? 'border-green-500 bg-green-50/30'
                            : 'border-[#a9b7ff] bg-[#f7f8ff]'
                          : hasSubsidy
                          ? 'border-green-200 bg-white hover:border-green-300'
                          : 'border-[#e5e7eb] bg-white hover:border-[#cfd8ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#111827]">
                            {variation.name}
                          </p>
                          <p className="mt-1 text-xs text-[#6b7280]">
                            {variation.variation_code}
                          </p>
                          {hasSubsidy && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Save &#8358;{variation.subsidized!.savings.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {hasSubsidy ? (
                            <>
                              <p className="text-lg font-bold text-green-600">
                                &#8358;{variation.subsidized!.subsidized_amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 line-through">
                                &#8358;{parseFloat(variation.variation_amount).toLocaleString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-lg font-bold text-[#a9b7ff]">
                              &#8358;{parseFloat(variation.variation_amount).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[18px] border-2 border-dashed border-[#e5e7eb] p-8 text-center">
                <p className="text-sm text-[#6b7280]">No plans available for this provider</p>
              </div>
            )}

            {errors.variation && (
              <p className="mt-4 text-sm text-red-600">{errors.variation}</p>
            )}
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
                  Data Plan
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
            </div>

            <Button
              fullWidth
              onClick={handleContinue}
              disabled={!selectedProvider || !selectedVariation}
              className={`mt-8 h-12 rounded-xl text-base font-semibold ${
                !selectedProvider || !selectedVariation
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Continue to Review
              <ChevronRight className="ml-2" size={18} />
            </Button>

            <p className="mt-4 text-center text-xs text-[#6b7280]">
              Step 1 of 3
            </p>
          </Card>
        </div>
      </div>

      <Toast />
    </div>
  );
}

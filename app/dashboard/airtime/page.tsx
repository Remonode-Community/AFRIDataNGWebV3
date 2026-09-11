'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ChevronRight, Loader } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Toast } from '@/components/shared/Toast';
import { vtuService } from '@/services/vtu.service';
import { useUIStore } from '@/store/ui.store';
import { VTUProvider } from '@/types/vtu.types';
import Image from 'next/image';

const PROVIDER_LOGOS: Record<string, string> = {
  mtn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/MTN_logo.svg/512px-MTN_logo.svg.png',
  airtel: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Airtel_logo.svg/512px-Airtel_logo.svg.png',
  glo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Globacom_Limited.svg/512px-Globacom_Limited.svg.png',
  '9mobile': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/9mobile_logo.jpg/512px-9mobile_logo.jpg',
};

interface AirtimeFormData {
  provider: string;
  phone: string;
  amount: string;
}

export default function AirtimePage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [providers, setProviders] = useState<VTUProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<AirtimeFormData>({
    provider: '',
    phone: '',
    amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Log providers whenever they change
  useEffect(() => {
    console.log('[Airtime] ╔════════════════════════════════════════════════════════╗');
    console.log('[Airtime] ║ PROVIDERS STATE CHANGED                               ║');
    console.log('[Airtime] ╚════════════════════════════════════════════════════════╝');
    console.log('[Airtime] Current providers state:', {
      providers,
      count: providers.length,
      isArray: Array.isArray(providers),
      timestamp: new Date().toISOString(),
    });
    if (providers.length > 0) {
      console.log('[Airtime] First provider:', providers[0]);
    }
  }, [providers]);

  useEffect(() => {
    console.log('[Airtime] ===== PAGE MOUNT - STARTING PROVIDER FETCH =====');
    console.log('[Airtime] Component mounted, fetching providers...');
    
    const fetchProviders = async () => {
      try {
        console.log('[Airtime] ===== FETCH PROVIDERS START =====');
        console.log('[Airtime] Calling vtuService.getAirtimeProviders()...');
        console.log('[Airtime] Request details:', {
          method: 'GET',
          endpoint: '/vtu/service/airtime',
          fullUrl: 'https://api.afridata.remonode.com/api/v1/vtu/service/airtime',
          timestamp: new Date().toISOString(),
        });
        
        setLoading(true);
        console.log('[Airtime] Loading state set to true');
        
        const providers = await vtuService.getAirtimeProviders();
        
        console.log('[Airtime] ===== RESPONSE RECEIVED =====');
        console.log('[Airtime] Full response received from vtuService:', {
          providersArray: providers,
          type: typeof providers,
          isArray: Array.isArray(providers),
          length: Array.isArray(providers) ? providers.length : 'N/A',
          timestamp: new Date().toISOString(),
        });
        
        console.log('[Airtime] Response inspection:');
        console.log('[Airtime] providers === null?', providers === null);
        console.log('[Airtime] providers === undefined?', providers === undefined);
        console.log('[Airtime] providers?.length:', (providers as any)?.length);
        console.log('[Airtime] JSON.stringify(providers):', JSON.stringify(providers));
        
        if (providers && Array.isArray(providers) && providers.length > 0) {
          console.log('[Airtime] ✅ Providers array is VALID');
          console.log('[Airtime] About to call setProviders with', providers.length, 'items');
          console.log('[Airtime] Providers to set:', providers);
          
          setProviders(providers);
          console.log('[Airtime] setProviders() called');
          
          // Auto-select first provider
          const firstProviderId = providers[0].serviceID;
          console.log('[Airtime] Auto-selecting first provider:', firstProviderId);
          
          setFormData((prev) => {
            const updated = { ...prev, provider: firstProviderId };
            console.log('[Airtime] Form data updated:', updated);
            return updated;
          });
          
          console.log('[Airtime] ✅ Providers loaded successfully', {
            count: providers.length,
            firstProvider: providers[0],
            autoSelectedId: firstProviderId,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.warn('[Airtime] ❌ No providers returned or invalid response', {
            providers,
            isArray: Array.isArray(providers),
            length: Array.isArray(providers) ? providers.length : 'N/A',
            timestamp: new Date().toISOString(),
          });
          setProviders([]);
        }
      } catch (err) {
        console.error('[Airtime] ===== ERROR OCCURRED =====');
        console.error('[Airtime] Error loading providers:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : 'N/A',
          errorCode: (err as any)?.code,
          errorResponse: (err as any)?.response,
          timestamp: new Date().toISOString(),
        });
        console.error('[Airtime] Full error object:', err);
        
        addToast({
          message: 'Failed to load airtime providers. Check console for details.',
          type: 'error',
        });
      } finally {
        setLoading(false);
        console.log('[Airtime] ===== FETCH COMPLETE =====');
        console.log('[Airtime] Loading state set to false, provider fetch complete');
      }
    };

    fetchProviders();
  }, [addToast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.provider) {
      newErrors.provider = 'Please select a provider';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^0[789]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Nigerian phone number';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseInt(formData.amount) < 100) {
      newErrors.amount = 'Minimum amount is ₦100';
    } else if (parseInt(formData.amount) > 1000000) {
      newErrors.amount = 'Maximum amount is ₦1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    console.log('[Airtime] Continue clicked, validating form...');
    if (!validateForm()) {
      console.log('[Airtime] Form validation failed:', errors);
      return;
    }

    try {
      const dataToStore = {
        ...formData,
        providerName: providers.find((p) => p.serviceID === formData.provider)?.name,
      };
      console.log('[Airtime] Storing form data to session:', dataToStore);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('airtimeFormData', JSON.stringify(dataToStore));
      }

      console.log('[Airtime] Navigating to review page...');
      router.push('/dashboard/airtime/review');
    } catch (err) {
      console.error('[Airtime] Error during continue:', err);
      addToast({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    }
  };

  const getProviderLogo = (provider: VTUProvider): string => {
    // Use the image from API response if available
    if (provider.image) {
      return provider.image;
    }
    // Fallback to hardcoded logos
    const key = provider.serviceID.split('-')[0].toLowerCase();
    return PROVIDER_LOGOS[key] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin text-[#a9b7ff] mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading airtime providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Buy Airtime</h1>
        <p className="text-gray-600 mt-2">Quick and easy airtime recharge for all networks</p>
      </div>

      <Card className="p-6 sm:p-8 border-[#e5e7eb] shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <div className="space-y-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#a9b7ff] text-white font-bold text-sm">
              1
            </div>
            <div className="text-sm font-semibold text-gray-900">Select Provider & Amount</div>
            <div className="flex-1 h-1.5 bg-[#a9b7ff] rounded-full mx-4"></div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 text-gray-500 font-bold text-sm">
              2
            </div>
            <div className="text-sm font-semibold text-gray-500">Confirm & Pay</div>
          </div>

          {/* Provider Selection */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-gray-900 mb-5">
              Select Network Provider
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
              {providers.map((provider) => {
                const logoUrl = getProviderLogo(provider);
                console.log(`[Airtime] Provider card rendering - ${provider.serviceID}`, {
                  serviceID: provider.serviceID,
                  name: provider.name,
                  logoUrl,
                  isSelected: formData.provider === provider.serviceID,
                });
                
                return (
                  <button
                    key={provider.serviceID}
                    onClick={() => {
                      console.log('[Airtime] Provider clicked - full details:', {
                        selectedProvider: provider,
                        serviceID: provider.serviceID,
                        providerName: provider.name,
                        previousSelection: formData.provider,
                        timestamp: new Date().toISOString(),
                      });
                      setFormData((prev) => ({
                        ...prev,
                        provider: provider.serviceID,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        provider: '',
                      }));
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.provider === provider.serviceID
                        ? 'border-[#a9b7ff] bg-[#f7f8ff] shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      {logoUrl && (
                        <div className="h-12 w-full mb-2 flex items-center justify-center">
                          <Image
                            src={logoUrl}
                            alt={provider.name}
                            width={50}
                            height={50}
                            className="object-contain"
                            onLoad={() => {
                              console.log(`[Airtime] Logo loaded: ${provider.serviceID}`);
                            }}
                            onError={(error) => {
                              console.error(`[Airtime] Logo failed: ${provider.serviceID}`, {
                                url: logoUrl,
                                error,
                              });
                            }}
                          />
                        </div>
                      )}
                      <p className="text-sm font-bold text-gray-900">{provider.name.split(' ')[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.provider && (
              <p className="text-red-600 text-sm mt-2">{errors.provider}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Recipient Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="tel"
                placeholder="080 1234 5678"
                value={formData.phone}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  // Format as phone number
                  if (value.length > 0) {
                    if (value.length <= 3) {
                      value = value;
                    } else if (value.length <= 7) {
                      value = value.slice(0, 3) + ' ' + value.slice(3);
                    } else {
                      value = value.slice(0, 3) + ' ' + value.slice(3, 7) + ' ' + value.slice(7, 11);
                    }
                  }
                  setFormData((prev) => ({ ...prev, phone: value }));
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                className="pl-12"
              />
            </div>
            {errors.phone && <p className="text-red-600 text-sm mt-2">{errors.phone}</p>}
          </div>

          {/* Amount */}
          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Amount (₦)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, amount: e.target.value }));
                setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              min="100"
              max="1000000"
              className="text-base py-3"
            />
            <div className="flex gap-3 mt-4 flex-wrap">
              {[100, 500, 1000, 2500, 5000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    console.log('[Airtime] Quick amount selected:', amount);
                    setFormData((prev) => ({ ...prev, amount: amount.toString() }));
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    formData.amount === amount.toString()
                      ? 'bg-[#a9b7ff] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>
            {errors.amount && <p className="text-red-600 text-sm mt-2">{errors.amount}</p>}
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button fullWidth onClick={handleContinue} className="py-4 text-base font-semibold h-12 rounded-xl">
              <span>Continue to Payment</span>
              <ChevronRight className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Toast Notification is handled by UIStore */}
      <Toast />
    </div>
  );
}

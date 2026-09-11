import { apiClient } from './api-client';
import type {
  VTUService as VTUServiceType,
  VTUProvider,
  VTUVariationResponse,
  VTUPaymentRequest,
  VTUPaymentResponse,
} from '@/types/vtu.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

class VTUService {
  /**
   * Get all available VTU services (Airtime, Data, Bills, etc.)
   */
  async getServices(): Promise<VTUServiceType[] | null> {
    try {
      const response = await apiClient.get<any>('/vtu/services');
      
      // Check for content property first, then fall back to data
      let services = response?.content || response?.data || null;
      
      // Check if data is nested
      if (services && typeof services === 'object' && !Array.isArray(services) && 'data' in services) {
        services = services.data;
      }
      
      return services;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all providers for a specific service
   * @param serviceId - The service identifier (e.g., 'airtime', 'data', 'electricity-bill')
   */
  async getServiceProviders(serviceId: string): Promise<VTUProvider[] | null> {
    try {
      console.log('[VTUService] Fetching providers for:', serviceId);
      const endpoint = `/vtu/service/${serviceId}`;
      const response = await apiClient.get<any>(endpoint);
      
      console.log('[VTUService] ===== RAW RESPONSE DEBUG =====');
      console.log('[VTUService] Full response object:', response);
      console.log('[VTUService] Response type:', typeof response);
      console.log('[VTUService] Response keys:', Object.keys(response || {}));
      console.log('[VTUService] response.content:', response?.content);
      console.log('[VTUService] response.data:', response?.data);
      console.log('[VTUService] response.success:', response?.success);
      console.log('[VTUService] response.message:', response?.message);
      console.log('[VTUService] response.response_description:', response?.response_description);
      console.log('[VTUService] JSON stringify:', JSON.stringify(response));
      
      // API returns: { response_description: "000", content: [...] }
      // The apiClient.get() returns res.data which is the API response body
      let providers: any = response?.content || response?.data;
      
      console.log('[VTUService] After first check - providers:', {
        isArray: Array.isArray(providers),
        value: providers,
      });
      
      // Check if data is nested (some endpoints might wrap it further)
      if (providers && typeof providers === 'object' && !Array.isArray(providers) && 'data' in providers) {
        console.log('[VTUService] Detected nested response structure, extracting nested data');
        providers = providers.data;
      }
      
      console.log('[VTUService] Final providers check:', {
        isArray: Array.isArray(providers),
        count: Array.isArray(providers) ? providers.length : 0,
        providers: Array.isArray(providers) ? providers.slice(0, 1) : 'NOT_ARRAY',
      });
      
      return Array.isArray(providers) ? providers : null;
    } catch (error) {
      console.error('[VTUService] Error fetching providers:', error);
      throw error;
    }
  }

  /**
   * Get variations for a specific provider
   * @param serviceId - The service ID (e.g., 'airtel-data', 'mtn-airtime')
   */
  async getVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    try {
      console.log('[VTUService] Fetching variations for:', serviceId);
      const response = await apiClient.get<any>(
        `/vtu/variations/${serviceId}`
      );
      console.log('[VTUService] Variations response:', response);
      
      // Check for content property first, then fall back to data
      let variations = response?.content || response?.data || null;
      
      // Check if data is nested
      if (variations && typeof variations === 'object' && !Array.isArray(variations) && 'data' in variations) {
        console.log('[VTUService] Detected nested response structure for variations, extracting nested data');
        variations = variations.data;
      }
      
      console.log('[VTUService] Variations extracted:', variations);
      return variations;
    } catch (error) {
      console.error('[VTUService] getVariations error:', error);
      throw error;
    }
  }

  /**
   * Process VTU payment
   * @param paymentData - Payment request payload
   */
  async processPayment(paymentData: VTUPaymentRequest): Promise<VTUPaymentResponse | null> {
    try {
      console.log('[VTUService] Processing payment with data:', paymentData);
      const response = await apiClient.post<any>(
        '/vtu/pay',
        paymentData
      );
      console.log('[VTUService] Payment response:', response);
      
      // Check for content property first, then fall back to data
      let result = response?.content || response?.data || null;
      
      // Check if data is nested
      if (result && typeof result === 'object' && !Array.isArray(result) && 'data' in result) {
        console.log('[VTUService] Detected nested response structure for payment, extracting nested data');
        result = result.data;
      }

      // If no content/data wrapper, check if the response itself has error/success fields
      if (!result && response && typeof response === 'object' && !Array.isArray(response)) {
        const resp = response as any;
        if (resp.code || resp.error || resp.success === false) {
          result = resp;
        }
      }
      
      console.log('[VTUService] Payment result extracted:', result);
      return result;
    } catch (error) {
      console.error('[VTUService] processPayment error:', error);
      throw error;
    }
  }

  /**
   * Get airtime services (filtered to 'airtime' service)
   * Convenience method for airtime flow
   */
  async getAirtimeProviders(): Promise<VTUProvider[] | null> {
    console.log('[VTUService] ╔════════════════════════════════════════════════════════╗');
    console.log('[VTUService] ║ getAirtimeProviders() ENTRY POINT                     ║');
    console.log('[VTUService] ╚════════════════════════════════════════════════════════╝');
    try {
      console.log('[VTUService] Calling getServiceProviders("airtime")...');
      const result = await this.getServiceProviders('airtime');
      
      console.log('[VTUService] ╔════════════════════════════════════════════════════════╗');
      console.log('[VTUService] ║ getAirtimeProviders() FINAL CHECK                     ║');
      console.log('[VTUService] ╚════════════════════════════════════════════════════════╝');
      console.log('[VTUService] Result value:', result);
      console.log('[VTUService] Result type:', typeof result);
      console.log('[VTUService] Is array?:', Array.isArray(result));
      console.log('[VTUService] Result length:', Array.isArray(result) ? result.length : 'NOT AN ARRAY');
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('[VTUService] ✅ SUCCESS: Returning array with', result.length, 'providers');
        console.log('[VTUService] First provider:', result[0]);
      } else if (result === null) {
        console.warn('[VTUService] ⚠️  WARNING: Result is null');
      } else if (!Array.isArray(result)) {
        console.error('[VTUService] ❌ ERROR: Result is NOT an array!', {
          result,
          resultType: typeof result,
        });
      }
      
      return result;
    } catch (error) {
      console.error('[VTUService] ❌ getAirtimeProviders() EXCEPTION:', error);
      throw error;
    }
  }

  /**
   * Get variations for airtime provider
   * @param providerCode - Provider code (e.g., 'mtn', 'airtel', 'glo', '9mobile')
   */
  async getAirtimeVariations(providerCode: string): Promise<VTUVariationResponse | null> {
    return this.getVariations(`${providerCode}-airtime`);
  }

  /**
   * Get all data providers
   * Convenience method for data purchase flow
   */
  async getDataProviders(): Promise<VTUProvider[] | null> {
    console.log('[VTUService] ╔════════════════════════════════════════════════════════╗');
    console.log('[VTUService] ║ getDataProviders() ENTRY POINT                        ║');
    console.log('[VTUService] ╚════════════════════════════════════════════════════════╝');
    try {
      console.log('[VTUService] Calling getServiceProviders("data")...');
      const result = await this.getServiceProviders('data');
      
      console.log('[VTUService] ╔════════════════════════════════════════════════════════╗');
      console.log('[VTUService] ║ getDataProviders() FINAL CHECK                        ║');
      console.log('[VTUService] ╚════════════════════════════════════════════════════════╝');
      console.log('[VTUService] Result:', {
        isArray: Array.isArray(result),
        count: Array.isArray(result) ? result.length : 0,
        sample: Array.isArray(result) ? result[0] : null,
      });
      
      return result;
    } catch (error) {
      console.error('[VTUService] ❌ getDataProviders() EXCEPTION:', error);
      throw error;
    }
  }

  /**
   * Get variations (plans) for a data provider
   * @param serviceId - Service ID (e.g., 'airtel-data', 'mtn-data')
   */
  async getDataVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    console.log('[VTUService] Fetching data variations for:', serviceId);
    return this.getVariations(serviceId);
  }

  /**
   * Get all electricity providers
   * Convenience method for electricity bill payment flow
   */
  async getElectricityProviders(): Promise<VTUProvider[] | null> {
    console.log('[VTUService] Fetching electricity providers...');
    try {
      const result = await this.getServiceProviders('electricity-bill');
      console.log('[VTUService] Electricity providers loaded:', {
        isArray: Array.isArray(result),
        count: Array.isArray(result) ? result.length : 0,
      });
      return result;
    } catch (error) {
      console.error('[VTUService] Error fetching electricity providers:', error);
      throw error;
    }
  }

  /**
   * Get variations (prepaid/postpaid) for an electricity provider
   * @param serviceId - Service ID (e.g., 'ikeja-electric')
   */
  async getElectricityVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    console.log('[VTUService] Fetching electricity variations for:', serviceId);
    return this.getVariations(serviceId);
  }

  /**
   * Verify meter number for electricity bill payment
   * @param billersCode - Electricity provider biller code
   * @param meterNumber - Customer's meter number
   * @param serviceID - Electricity provider service ID
   */
  async verifyMeterNumber(
    billersCode: string,
    meterNumber: string,
    serviceID: string
  ): Promise<any> {
    try {
      console.log('[VTUService] Verifying meter number:', {
        billersCode,
        meterNumber,
        serviceID,
      });

      const response = await apiClient.post('/vtu/merchant-verify', {
        billersCode,
        serviceID: serviceID,
        Meter_Number: meterNumber,
      });

      console.log('[VTUService] Meter verification response:', response);
      return response;
    } catch (error) {
      console.error('[VTUService] Meter verification failed:', error);
      throw error;
    }
  }

  /**
   * Get all TV subscription providers
   * Convenience method for TV subscription flow
   */
  async getTVProviders(): Promise<VTUProvider[] | null> {
    console.log('[VTUService] Fetching TV providers...');
    try {
      const result = await this.getServiceProviders('tv-subscription');
      console.log('[VTUService] TV providers loaded:', {
        isArray: Array.isArray(result),
        count: Array.isArray(result) ? result.length : 0,
      });
      return result;
    } catch (error) {
      console.error('[VTUService] Error fetching TV providers:', error);
      throw error;
    }
  }

  /**
   * Get variations (subscription plans) for a TV provider
   * @param serviceId - Service ID (e.g., 'dstv', 'gotv', 'startimes')
   */
  async getTVVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    console.log('[VTUService] Fetching TV variations for:', serviceId);
    return this.getVariations(serviceId);
  }

  /**
   * Verify smartcard/decoder number for TV subscription
   * @param smartcardNumber - Customer's smartcard/decoder number
   * @param serviceID - TV provider service ID (e.g., 'dstv', 'gotv')
   */
  async verifySmartcard(
    smartcardNumber: string,
    serviceID: string
  ): Promise<any> {
    try {
      console.log('[VTUService] Verifying smartcard:', {
        smartcardNumber: smartcardNumber.slice(0, 4) + '****',
        serviceID,
      });

      const response = await apiClient.post('/vtu/merchant-verify', {
        billersCode: smartcardNumber,
        serviceID: serviceID,
      });

      console.log('[VTUService] Smartcard verification response:', response);
      return response;
    } catch (error) {
      console.error('[VTUService] Smartcard verification failed:', error);
      throw error;
    }
  }
}

export const vtuService = new VTUService();

import { apiClient } from './api-client';
import { ApiResponse } from '@/types/api.types';

/**
 * Payment Service
 * Handles all payment-related operations with automatic idempotency key management
 */

interface InitializePaymentRequest {
  amount: number;
  currency?: 'NGN' | 'USD';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer' | 'wallet';
  description?: string;
  email?: string;
  metadata?: Record<string, any>;
}

interface InitializePaymentResponse {
  success: boolean;
  data: {
    payment: {
      id: string;
      amount: number;
      currency: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      reference: string;
      created_at: string;
    };
    authorization_url?: string;
    access_code?: string;
    public_key?: string;
  };
}

interface AirtimePurchaseRequest {
  serviceID?: string;
  phone?: string;
  provider?: string;
  phone_number?: string;
  amount: number;
  user_id?: string | number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  recipient_name?: string;
  pin?: string;
}

interface DataPurchaseRequest {
  serviceID?: string;
  phone?: string;
  provider?: string;
  phone_number?: string;
  plan_id?: string;
  amount: number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  pin?: string;
  variation_code?: string;
  user_id?: string | number;
}

interface BillPaymentRequest {
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
  provider: string;
  account_number: string;
  amount: number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  is_estimate?: boolean;
  pin?: string;
}

class PaymentService {
  /**
   * Initialize payment with idempotency key
   * Idempotency key is automatically added by interceptor
   */
  async initializePayment(
    payload: InitializePaymentRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<InitializePaymentResponse>> {
    try {
      console.log('[PaymentService] Initializing payment:', {
        amount: payload.amount,
        method: payload.payment_method,
        retryCount,
      });

      const response = await apiClient.post<InitializePaymentResponse>(
        '/payments/initialize',
        payload
      );

      console.log('[PaymentService] Payment initialization successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Payment initialization failed:', error);

      // Retry logic for network errors (not for MISSING_IDEMPOTENCY_KEY)
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        console.log(`[PaymentService] Retrying payment initialization (attempt ${retryCount + 1}/3)`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.initializePayment(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Verify payment status
   * Also requires idempotency key for safety
   */
  async verifyPayment(reference: string): Promise<ApiResponse<any>> {
    try {
      console.log('[PaymentService] Verifying payment:', reference);

      const response = await apiClient.post('/payments/verify', {
        reference,
      });

      console.log('[PaymentService] Payment verification successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Purchase airtime with idempotency
   * Automatically includes idempotency key
   */
  async purchaseAirtime(
    payload: AirtimePurchaseRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      console.log('[PaymentService] Purchasing airtime:', {
        provider: payload.provider,
        phone: payload.phone_number,
        amount: payload.amount,
        retryCount,
      });

      // Map fields to API expected format
      const apiPayload = {
        serviceID: payload.serviceID || payload.provider,
        phone: payload.phone || payload.phone_number,
        amount: payload.amount,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      console.log('[PaymentService] Airtime purchase successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Airtime purchase failed:', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        console.log(`[PaymentService] Retrying airtime purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseAirtime(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Purchase data bundle with idempotency
   */
  async purchaseData(
    payload: any,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      console.log('[PaymentService] Purchasing data:', {
        service_id: payload.service_id,
        phone: payload.phone_number,
        variation_code: payload.variation_code,
        retryCount,
      });

      // Map fields to API expected format for /vtu/pay endpoint
      const apiPayload = {
        serviceID: payload.serviceID || payload.service_id,
        phone: payload.phone || payload.phone_number,
        amount: payload.amount,
        variation_code: payload.variation_code,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      console.log('[PaymentService] Data purchase successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Data purchase failed:', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        console.log(`[PaymentService] Retrying data purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseData(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Pay bills with idempotency
   */
  async payBill(payload: BillPaymentRequest, retryCount: number = 0): Promise<ApiResponse<any>> {
    try {
      console.log('[PaymentService] Paying bill:', {
        billType: payload.bill_type,
        provider: payload.provider,
        amount: payload.amount,
        retryCount,
      });

      const response = await apiClient.post('/transactions/bills/pay', payload);

      console.log('[PaymentService] Bill payment successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Bill payment failed:', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        console.log(`[PaymentService] Retrying bill payment (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.payBill(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Purchase electricity bill with idempotency
   * Maps electricity form data to /vtu/pay endpoint
   */
  async purchaseElectricity(payload: any, retryCount: number = 0): Promise<ApiResponse<any>> {
    try {
      console.log('[PaymentService] Purchasing electricity:', {
        serviceID: payload.serviceID,
        billersCode: payload.billersCode,
        amount: payload.amount,
        retryCount,
      });

      // Map fields to API expected format for /vtu/pay endpoint
      const apiPayload = {
        serviceID: payload.serviceID,
        phone: payload.phone,
        amount: payload.amount,
        billersCode: payload.billersCode,
        variation_code: payload.variation_code,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.user_email && { user_email: payload.user_email }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      console.log('[PaymentService] Electricity purchase successful:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentService] Electricity purchase failed:', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        console.log(`[PaymentService] Retrying electricity purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseElectricity(payload, retryCount + 1);
      }

      throw error;
    }
  }
}

export const paymentService = new PaymentService();

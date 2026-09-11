import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api.types';
import {
  generateIdempotencyKey,
  getStoredIdempotencyKey,
  storeIdempotencyKey,
  clearIdempotencyKey,
} from '@/utils/idempotency.utils';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/utils/safe-storage.utils';
import { hasValidToken, clearAuthTokens, isTokenLikelyExpired } from '@/utils/token.utils';
import { trackApiError } from '@/utils/error-tracking.utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.afridata.remonode.com/api/v1';

// Define payment operation paths that require idempotency keys
const PAYMENT_OPERATIONS = [
  '/vtu/service',
  '/payments/initialize',
  '/payments/verify',
  '/vtu/pay',
  '/transactions/data/purchase',
  '/transactions/bills/pay',
];

console.log('[ApiClient] Initializing API Client with:', {
  API_BASE_URL,
  env: process.env.NEXT_PUBLIC_API_URL,
  isProduction: process.env.NODE_ENV === 'production',
  timestamp: new Date().toISOString(),
});

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

interface ApiClientConfig extends AxiosRequestConfig {
  retry?: number;
}

/**
 * Check if endpoint requires idempotency key (POST/PUT/DELETE payment operations)
 */
const isPaymentOperation = (url: string): boolean => {
  return PAYMENT_OPERATIONS.some((op) => url.includes(op));
};

/**
 * Generate operation ID from URL and request body for idempotency tracking
 */
const generateOperationId = (url: string, data?: any): string => {
  const timestamp = Math.floor(Date.now() / 60000); // Group by minute for consistency
  const dataHash = data ? JSON.stringify(data).substring(0, 50) : '';
  return `${url}-${dataHash}-${timestamp}`;
};

class ApiClient {
  private axiosInstance: AxiosInstance;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const token = this.getToken();
        
        console.log('[ApiClient] ===== REQUEST INTERCEPTOR =====');
        console.log('[ApiClient] Making request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullUrl: `${config.baseURL}${config.url}`,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO_TOKEN',
          timestamp: new Date().toISOString(),
        });
        
        if (token && token.length > 0) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('[ApiClient] ✓ Authorization token added to request');
        } else {
          console.warn('[ApiClient] ⚠️ No valid token found - request will be unauthenticated');
          console.warn('[ApiClient] Token value:', token);
          // Log all localStorage keys for debugging
          if (typeof window !== 'undefined') {
            console.warn('[ApiClient] Available localStorage keys:', Object.keys(localStorage));
          }
        }

        // Add idempotency key for payment operations
        const method = config.method?.toUpperCase() || '';
        const url = config.url || '';

        if (['POST', 'PUT', 'DELETE'].includes(method) && isPaymentOperation(url)) {
          const operationId = generateOperationId(url, config.data);

          // Try to retrieve existing key for this operation (for retries)
          let idempotencyKey = getStoredIdempotencyKey(operationId);

          // Generate new key if not found
          if (!idempotencyKey) {
            idempotencyKey = generateIdempotencyKey();
            storeIdempotencyKey(idempotencyKey, operationId);
          }

          // Add idempotency key header
          config.headers['Idempotency-Key'] = idempotencyKey;
          console.log(`[ApiClient] Added Idempotency-Key: ${idempotencyKey} for ${url}`);
        }
        
        config.retry = config.retry || 0;
        console.log('[ApiClient] Request interceptor completed');
        return config;
      },
      (error) => {
        console.error('[ApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('[ApiClient] ===== RESPONSE RECEIVED =====');
        console.log('[ApiClient] Response success:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data,
          headers: response.headers,
          timestamp: new Date().toISOString(),
        });

        // Clear idempotency key on success for payment operations
        const url = response.config.url || '';
        if ((response.status === 200 || response.status === 201) && isPaymentOperation(url)) {
          const operationId = generateOperationId(url, response.config.data);
          // Keep key for 5 minutes in case of additional retries
          setTimeout(() => {
            clearIdempotencyKey(operationId);
          }, 5 * 60 * 1000);
        }

        return response;
      },
      async (error: AxiosError) => {
        console.error('[ApiClient] ===== RESPONSE ERROR =====');
        const endpoint = error.config?.url || 'unknown';
        console.error('[ApiClient] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          fullUrl: `${error.config?.baseURL}${error.config?.url}`,
          responseData: error.response?.data,
          responseHeaders: error.response?.headers,
          timestamp: new Date().toISOString(),
        });

        // Track the API error
        trackApiError(endpoint, error, {
          method: error.config?.method?.toUpperCase(),
          headers: error.config?.headers,
          data: error.config?.data,
        });

        // Handle idempotency-specific errors
        const responseData = error.response?.data as any;
        if (responseData?.code === 'MISSING_IDEMPOTENCY_KEY') {
          console.error('[Idempotency] Missing idempotency key for payment operation');
          return Promise.reject({
            ...error,
            message: 'Payment operation requires idempotency key. Please try again.',
            isIdempotencyError: true,
          });
        }

        if (responseData?.code === 'DUPLICATE_IDEMPOTENCY_KEY' || error.response?.status === 409) {
          console.warn('[Idempotency] Duplicate request detected (idempotency key already used)');
          const url = error.config?.url || '';
          if (isPaymentOperation(url)) {
            const operationId = generateOperationId(url, error.config?.data);
            clearIdempotencyKey(operationId);
          }
          return Promise.reject({
            ...error,
            message: 'This payment has already been processed. Please check your transaction history.',
            isDuplicateError: true,
          });
        }
        
        const config = error.config as ExtendedAxiosRequestConfig;

        // Handle 401 - Session expired or invalid token
        if (error.response?.status === 401) {
          console.error('[ApiClient] 401 Unauthorized - Session expired or invalid token');
          console.error('[ApiClient] Token status:', {
            hasToken: hasValidToken(),
            isExpired: isTokenLikelyExpired(),
          });

          // Clear tokens immediately to prevent further attempts
          clearAuthTokens();

          // Try to trigger proper logout via Zustand store if available
          try {
            // Dynamically import to avoid circular dependencies
            const { useAuthStore } = require('@/store/auth.store');
            const handleSessionExpired = useAuthStore.getState?.()?.handleSessionExpired;
            if (handleSessionExpired && typeof handleSessionExpired === 'function') {
              console.log('[ApiClient] Triggering store session expiration handler');
              handleSessionExpired();
            }
          } catch (storeError) {
            console.warn('[ApiClient] Could not access Zustand store for logout:', storeError);
          }

          // Redirect to login page with proper history
          if (typeof window !== 'undefined') {
            // Use replace to prevent going back to protected page
            window.location.replace('/auth/login?session_expired=true');
          }

          return Promise.reject({
            ...error,
            message: 'Session expired. Please login again.',
            isSessionExpired: true,
          });
        }

        // Retry logic for network errors (but not 401)
        if (config && config.retry! < this.maxRetries) {
          config.retry = (config.retry || 0) + 1;
          console.log(`[ApiClient] Retrying request (attempt ${config.retry}/${this.maxRetries})`);
          await this.delay(this.retryDelay * config.retry);
          return this.axiosInstance(config);
        }

        console.error('[ApiClient] Request failed - no retry', error);
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): ApiResponse {
    const response = error.response?.data as any;
    return {
      success: false,
      message: response?.message || error.message || 'An error occurred',
      error_code: response?.error_code || 'UNKNOWN_ERROR',
      errors: response?.errors,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return safeGetItem('token');
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      safeRemoveItem('token');
    }
  }

  private setAccessToken(accessToken: string): void {
    if (typeof window !== 'undefined') {
      safeSetItem('token', accessToken);
    }
  }

  private setRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined') {
      safeSetItem('refreshToken', refreshToken);
    }
  }

  // Public API methods
  public get<T = any>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.get<ApiResponse<T>>(url, config).then((res) => res.data);
  }

  public post<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.post<ApiResponse<T>>(url, data, config).then((res) => res.data);
  }

  public put<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.put<ApiResponse<T>>(url, data, config).then((res) => res.data);
  }

  public patch<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.patch<ApiResponse<T>>(url, data, config).then((res) => res.data);
  }

  public delete<T = any>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    return this.axiosInstance.delete<ApiResponse<T>>(url, config).then((res) => res.data);
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  public logout(): void {
    this.clearToken();
  }
}

export const apiClient = new ApiClient();

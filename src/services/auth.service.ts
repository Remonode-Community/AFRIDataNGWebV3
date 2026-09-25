import { apiClient } from './api-client';
import { toLocalPhoneNumber } from '@/utils/format.utils';
import {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  VerifyPhoneRequest,
  RequestPhoneVerificationRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  UserPreferences,
  ApiResponse,
} from '@/types/api.types';

class AuthService {
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User }>> {
    // Map the form payload to the API contract:
    // the backend expects `phone_number` (local 11-digit format) and `ref`.
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email.trim().toLowerCase(),
      phone_number: toLocalPhoneNumber(data.phone),
      password: data.password,
      password_confirmation: data.password_confirmation,
      ...(data.referral_code ? { ref: data.referral_code.trim().toUpperCase() } : {}),
    };
    return apiClient.post('/auth/register', payload);
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', data);
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout', {});
    apiClient.logout();
    return response;
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{ user: User }>> {
    // Backend endpoint is /auth/verify-email-with-otp and expects `otp` (not `code`)
    return apiClient.post('/auth/verify-email-with-otp', {
      email: data.email,
      otp: data.code,
    });
  }

  async resendEmailVerification(email: string): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/resend-email-verification-otp', { email });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<{ email: string }>> {
    return apiClient.post('/auth/forgot-password', data);
  }

  async verifyPasswordResetOtp(data: { email: string; otp: string }): Promise<ApiResponse<{ email: string; reset_token: string }>> {
    return apiClient.post('/auth/verify-password-reset-otp', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/reset-password', data);
  }

  async requestPhoneVerification(
    data: RequestPhoneVerificationRequest
  ): Promise<ApiResponse<void>> {
    return apiClient.post('/users/request-phone-verification', data);
  }

  async verifyPhone(data: VerifyPhoneRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/users/verify-phone', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.put('/users/change-password', data);
  }
}

class UserService {
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<{ user: User }>> {
    const formData = new FormData();

    // Convert UpdateProfileRequest to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return apiClient.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getPreferences(): Promise<ApiResponse<{ preferences: UserPreferences }>> {
    return apiClient.get('/users/preferences');
  }

  async updatePreferences(
    data: UpdatePreferencesRequest
  ): Promise<ApiResponse<{ preferences: UserPreferences }>> {
    return apiClient.put('/users/preferences', data);
  }

  async deleteAccount(
    password: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete('/users/account', {
      data: { password, reason },
    });
  }

  async enable2FA(): Promise<
    ApiResponse<{
      qr_code: string;
      secret: string;
      backup_codes: string[];
    }>
  > {
    return apiClient.post('/users/enable-2fa', {});
  }
}

export const authService = new AuthService();
export const userService = new UserService();

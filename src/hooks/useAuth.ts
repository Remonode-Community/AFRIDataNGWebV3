'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { authService } from '@/services/auth.service';
import { LoginSchema, RegisterSchema, VerifyEmailSchema } from '@/utils/validation.utils';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, setUser, setAuthToken, setIsLoading, setError, getPrimaryRole, logout: logoutStore } = useAuthStore();
  const { addToast } = useUIStore();

  const login = useCallback(
    async (data: LoginSchema) => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('[useAuth] Login attempt for:', data.email);
        const response = await authService.login(data);
        
        // Log the complete response for debugging
        console.log('[useAuth] Full response object:', JSON.stringify(response, null, 2));
        console.log('[useAuth] Response.data keys:', Object.keys(response.data || {}));
        console.log('[useAuth] Response.data.token:', response.data?.token);
        console.log('[useAuth] Response.data.token type:', typeof response.data?.token);
        console.log('[useAuth] Response.data.accessToken:', response.data?.accessToken);
        
        console.log('[useAuth] Login response:', {
          success: response.success,
          hasToken: !!response.data?.token,
          tokenLength: response.data?.token?.length || 0,
          hasAccessToken: !!response.data?.accessToken,
          accessTokenLength: response.data?.accessToken?.length || 0,
          hasUser: !!response.data?.user,
          message: response.message,
        });

        if (response.success && response.data) {
          // Determine which token field to use
          let tokenToUse: string | undefined;
          
          // Check token field first
          if (response.data.token && response.data.token.length > 0) {
            tokenToUse = response.data.token;
            console.log('[useAuth] Using "token" field from response');
          }
          
          // Fall back to accessToken if token is not available or too short
          if (!tokenToUse && response.data.accessToken) {
            tokenToUse = response.data.accessToken;
            console.log('[useAuth] Using "accessToken" field from response');
          }
          
          // Check for other possible token field names
          if (!tokenToUse) {
            const data = response.data as any;
            const possibleFields = ['jwt', 'jwtToken', 'auth_token', 'authorization'];
            for (const field of possibleFields) {
              if (data[field]) {
                tokenToUse = data[field];
                console.log(`[useAuth] Using "${field}" field from response`);
                break;
              }
            }
          }
          
          if (!tokenToUse) {
            console.error('[useAuth] No authentication token found in response');
            console.error('[useAuth] Available fields in response.data:', Object.keys(response.data));
            setError('No authentication token received from server');
            addToast({ type: 'error', message: 'Authentication failed: No token received' });
            return;
          }
          
          console.log('[useAuth] Login successful, setting user and token', { tokenLength: tokenToUse.length });
          setUser(response.data.user);
          setAuthToken(tokenToUse);
          console.log('[useAuth] Token set in auth store', { tokenLength: tokenToUse.length });
          addToast({ type: 'success', message: 'Login successful!' });

          // Redirect based on primary role (admin > agent > user)
          const roles = response.data.user.roles || [];
          const primaryRole = getPrimaryRole(roles);
          console.log('[useAuth] Primary role determined:', primaryRole);
          
          if (primaryRole === 'admin') {
            router.push('/admin');
          } else if (primaryRole === 'agent') {
            router.push('/agent');
          } else {
            router.push('/dashboard');
          }
        } else {
          console.warn('[useAuth] Login failed:', response.message);
          setError(response.message || 'Login failed');
          addToast({ type: 'error', message: response.message || 'Login failed' });
        }
      } catch (err: any) {
        console.error('[useAuth] Login error:', err);
        const message = err.message || 'An error occurred during login';
        setError(message);
        addToast({ type: 'error', message });
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, setAuthToken, setIsLoading, setError, getPrimaryRole, addToast, router]
  );

  const register = useCallback(
    async (data: RegisterSchema) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register(data);

        if (response.success) {
          addToast({
            type: 'success',
            message: 'Registration successful! Please verify your email.',
          });
          router.push('/auth/verify-email?email=' + encodeURIComponent(data.email));
        } else {
          setError(response.message || 'Registration failed');
          addToast({ type: 'error', message: response.message || 'Registration failed' });
        }
      } catch (err: any) {
        // Prefer field-level validation messages from the API (422 responses)
        const validationErrors = err?.errors?.errors;
        const message =
          (Array.isArray(validationErrors) && validationErrors[0]) ||
          err?.errors?.message ||
          err.message ||
          'An error occurred during registration';
        setError(message);
        addToast({ type: 'error', message });
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setError, addToast, router]
  );

  const verifyEmail = useCallback(
    async (data: VerifyEmailSchema) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.verifyEmail(data);

        if (response.success) {
          addToast({ type: 'success', message: 'Email verified successfully!' });
          router.push('/auth/login');
        } else {
          setError(response.message || 'Verification failed');
          addToast({ type: 'error', message: response.message || 'Verification failed' });
        }
      } catch (err: any) {
        const message = err.message || 'An error occurred during verification';
        setError(message);
        addToast({ type: 'error', message });
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setError, addToast, router]
  );

  const resendVerification = useCallback(
    async (email: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.resendEmailVerification(email);

        if (response.success) {
          addToast({ type: 'success', message: 'Verification code resent!' });
        } else {
          setError(response.message || 'Could not resend code');
          addToast({ type: 'error', message: response.message || 'Could not resend code' });
        }
        return response;
      } catch (err: any) {
        const message = err.message || 'Could not resend verification code';
        setError(message);
        addToast({ type: 'error', message });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, setError, addToast]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[useAuth] Logging out...');
      
      // Try to call logout API (optional - may fail if session is already invalid)
      try {
        await authService.logout();
      } catch (apiError: any) {
        console.warn('[useAuth] API logout failed (may be expected if session expired):', apiError.message);
        // Continue with local logout even if API call fails
      }

      // Clear auth store - this clears all tokens and auth state
      logoutStore();
      
      addToast({ type: 'success', message: 'Logged out successfully' });
      router.push('/auth/login');
    } catch (err: any) {
      console.error('[useAuth] Logout error:', err);
      addToast({ type: 'error', message: 'Logout failed - please try again' });
      // Still clear local state even if error
      logoutStore();
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, logoutStore, addToast, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
  };
};

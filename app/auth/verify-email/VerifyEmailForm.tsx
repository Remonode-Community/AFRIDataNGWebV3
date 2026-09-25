'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BadgeCheck, MailCheck, RefreshCcw } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import {
  verifyEmailSchema,
  type VerifyEmailSchema,
} from '@/utils/validation.utils';

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get('email') || '';

  const { verifyEmail, resendVerification, isLoading } = useAuth();

  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const email = watch('email');

  const onSubmit = async (data: VerifyEmailSchema) => {
    await verifyEmail(data);
  };

  const handleResendCode = async () => {
    if (resendIn > 0 || !email) return;

    const response = await resendVerification(email.trim().toLowerCase());
    if (response?.success) {
      setResendIn(60);
      timerRef.current = setInterval(() => {
        setResendIn((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <>
      <section className="hidden lg:flex bg-[#fafafa] border-r border-gray-100">
        <div className="flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4a5ff7] rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#0a0a0a]">AFRIDataNG</span>
            </Link>
          </div>

          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 bg-[#eef0fe] text-[#4a5ff7] text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full border border-[#c7ccfb] mb-5">
              <BadgeCheck size={14} />
              Verification step
            </span>

            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-[#0a0a0a] mb-5">
              One more step
              <br />
              to secure your account.
            </h1>

            <p className="text-base leading-8 text-[#666]">
              Enter the verification code sent to your email address to activate
              your account and complete setup.
            </p>

            <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#eef0fe] flex items-center justify-center">
                  <MailCheck className="text-[#4a5ff7]" size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0a0a0a]">Email confirmation</div>
                  <div className="text-sm text-[#888]">Use the 6-digit code you received</div>
                </div>
              </div>

              <div className="text-sm text-[#555] leading-7">
                Make sure to check your inbox and spam folder. The code is usually
                delivered within a few moments.
              </div>
            </div>
          </div>

          <div className="text-sm text-[#888]">
            Safe, simple, and designed for quick onboarding.
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4a5ff7] rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#0a0a0a]">AFRIDataNG</span>
            </Link>
          </div>

          <Card className="w-full border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-2xl bg-white p-6 sm:p-8">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#eef0fe] border border-[#c7ccfb] flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-[#4a5ff7]" size={28} />
              </div>

              <h2 className="text-3xl font-extrabold tracking-tight text-[#0a0a0a] mb-2">
                Verify Your Email
              </h2>

              <p className="text-sm sm:text-base text-[#666] leading-7">
                We sent a verification code to{' '}
                <span className="font-semibold text-[#0a0a0a]">
                  {email || 'your email address'}
                </span>
                .
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Verification Code"
                type="text"
                placeholder="000000"
                helperText="Enter the 6-digit code from your email"
                error={errors.code?.message}
                maxLength={6}
                {...register('code')}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                className="mt-2 h-12 rounded-lg bg-[#4a5ff7] hover:bg-[#3a4fe0] text-white font-semibold"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  Verify Email
                  <ArrowRight size={16} />
                </span>
              </Button>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-[#666] mb-3">Didn&apos;t receive the code?</p>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendIn > 0 || isLoading || !email}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5ff7] hover:underline disabled:text-[#999] disabled:no-underline disabled:cursor-not-allowed"
              >
                <RefreshCcw size={14} className={isLoading && resendIn === 0 ? 'animate-spin' : ''} />
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>

              <div className="mt-4">
                <Link
                  href="/auth/login"
                  className="text-sm text-[#666] hover:text-[#0a0a0a] transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

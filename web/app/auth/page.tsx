'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestCode, verifyCode } = useAuth();
  const router = useRouter();

  const handleSendCode = async () => {
    setIsLoading(true);
    try {
      await requestCode(email);
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      const message =
        error?.body?.message ||
        error?.response?.data?.message ||
        error?.message ||
        (error?.body ? JSON.stringify(error.body) : undefined) ||
        'Failed to send code';
      // eslint-disable-next-line no-console
      console.error('Send code failed:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await verifyCode(email, code);
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      const message =
        error?.body?.message ||
        error?.response?.data?.message ||
        error?.message ||
        (error?.body ? JSON.stringify(error.body) : undefined) ||
        'Invalid code';
      // eslint-disable-next-line no-console
      console.error('Verify code failed:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      await handleSendCode();
    } else {
      await handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-indigo-600">
              ← Back
            </Link>
            <div className="text-xs text-gray-500">Magic-link sign in</div>
          </div>

          <div className="card p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
              <p className="mt-1 text-sm text-gray-600">
                Enter your email to receive a one-time code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label mb-1">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code after you receive it"
              className="input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2.5"
          >
            {isLoading
              ? 'Loading...'
              : code.trim()
              ? 'Verify & Sign In'
              : 'Send Code'}
          </button>
        </form>

            <div className="mt-4 text-center text-sm text-gray-600">
              Need a new code?{' '}
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


















'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code after you receive it"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading
              ? 'Loading...'
              : code.trim()
              ? 'Verify & Sign In'
              : 'Send Code'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Need a new code?{' '}
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isLoading}
            className="text-indigo-600 hover:underline disabled:opacity-50"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}


















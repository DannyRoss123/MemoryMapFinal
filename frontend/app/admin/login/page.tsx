'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : undefined;
        throw new Error(message || 'Invalid email or password');
      }

      const data = await response.json();

      // Verify the user is an admin
      if (data.role !== 'ADMIN') {
        throw new Error('Access denied. Admin credentials required.');
      }

      // Login successful
      login({
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        location: data.location
      });

      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 px-4 py-16 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl opacity-70" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl opacity-60" />
        <div className="absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-300">Memory Map Administration</p>
        </div>

        {/* Login Form */}
        <form
          className="w-full rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-8 space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="admin@example.com"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-white/90">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error Message */}
          {error ? (
            <div className="rounded-xl bg-red-500/20 border border-red-300/30 px-4 py-3">
              <p className="text-sm text-white">{error}</p>
            </div>
          ) : null}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Register Link */}
          <p className="text-sm text-white/70 text-center">
            Need an admin account?{' '}
            <Link href="/admin/register" className="text-white font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </form>

        {/* Back to main login */}
        <div className="mt-6">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition">
            ← Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../context/UserContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, isLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show success message if redirected from registration
    if (searchParams?.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

      const userData = await response.json();
      login(userData);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f6abf] via-[#7ec6ff] to-[#f5fbff] px-4 py-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/40 blur-3xl opacity-70" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-white/30 blur-3xl opacity-60" />
        <div className="absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-white/20 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight">Memory Map</h1>
          <h2 className="text-2xl md:text-3xl text-white/90 font-medium mt-2">A clear path to supportive care</h2>
          <p className="text-base md:text-lg text-white/75 mt-4 max-w-xl mx-auto">
            Stay organized, share updates, and keep everyone aligned.
          </p>
        </div>

        <form
          className="mt-10 w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-6 md:px-8 md:py-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Sign In</h3>
            <p className="text-sm text-white/70 mt-1">Welcome back! Please enter your details</p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="rounded-2xl bg-green-500/20 border border-green-300/30 px-4 py-3">
              <p className="text-sm text-white">{success}</p>
            </div>
          ) : null}

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="john@example.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-white/90">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error ? (
            <div className="rounded-2xl bg-red-500/20 border border-red-300/30 px-4 py-3">
              <p className="text-sm text-white">{error}</p>
            </div>
          ) : null}

          {/* Submit Button */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] py-3.5 text-base font-semibold text-white shadow-md hover:shadow-lg hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-sm text-white/80 text-center">
              Don't have an account?{' '}
              <Link href="/register" className="text-white font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

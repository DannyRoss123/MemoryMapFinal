'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

export default function AdminRegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!location.trim()) {
      setError('Please enter your location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          location: location.trim(),
          role: 'ADMIN'
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : undefined;
        throw new Error(message || 'Unable to register');
      }

      // Registration successful, redirect to login
      router.push('/admin/login?registered=true');
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

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Admin Account</h1>
          <p className="text-slate-300">Register as an administrator</p>
        </div>

        {/* Registration Form */}
        <form
          className="w-full rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-8 space-y-5"
          onSubmit={handleSubmit}
        >
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-white/90">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-white/90">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Doe"
                required
              />
            </div>
          </div>

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
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="admin@example.com"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label htmlFor="location" className="block text-sm font-medium text-white/90">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="New York, NY"
              required
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
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-white/70 mt-1">At least 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? 'Creating Account...' : 'Create Admin Account'}
          </button>

          {/* Login Link */}
          <p className="text-sm text-white/70 text-center">
            Already have an account?{' '}
            <Link href="/admin/login" className="text-white font-semibold hover:underline">
              Sign in
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

'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '../context/UserContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

const ROLE_LABELS: Record<Role, string> = {
  PATIENT: 'Patient',
  CAREGIVER: 'Caregiver'
};

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [userType, setUserType] = useState<Role>('PATIENT');
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

    // Basic email validation
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
          role: userType
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : undefined;
        throw new Error(message || 'Unable to register');
      }

      // Registration successful, redirect to login
      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f6abf] via-[#7ec6ff] to-[#f5fbff] px-4 py-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/40 blur-3xl opacity-70" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-white/30 blur-3xl opacity-60" />
        <div className="absolute left-1/3 bottom-0 h-80 w-80 rounded-full bg-white/20 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight">Create Account</h1>
          <p className="text-base md:text-lg text-white/75 mt-4 max-w-xl mx-auto">
            Join Memory Map to get started with supportive care
          </p>
        </div>

        <form
          className="mt-10 w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-6 md:px-8 md:py-8 space-y-5"
          onSubmit={handleSubmit}
        >
          {/* User Type Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/90">I am a</p>
            <div className="inline-flex w-full rounded-2xl bg-white/10 p-1 border border-white/20">
              {(Object.keys(ROLE_LABELS) as Role[]).map((option) => {
                const isSelected = userType === option;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setUserType(option)}
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm md:text-base transition ${
                      isSelected ? 'bg-white text-[#0f5ca8] shadow-sm' : 'bg-transparent text-white/80'
                    }`}
                  >
                    {ROLE_LABELS[option]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
                className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="john@example.com"
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
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
              className="w-full rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              placeholder="••••••••"
              required
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
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-sm text-white/80 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-white font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

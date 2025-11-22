'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useUser } from '../context/UserContext';

const ROLE_LABELS: Record<Role, string> = {
  PATIENT: 'Patient',
  CAREGIVER: 'Caregiver'
};

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useUser();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<Role>('PATIENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const destination = user.role === 'PATIENT' ? '/patient/dashboard' : '/caregiver/dashboard';
      router.replace(destination);
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim(), location: location.trim(), role })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : undefined;
        throw new Error(message || 'Unable to log in');
      }

      const userData = (await response.json()) as {
        userId: string;
        name: string;
        role: Role;
        location: string;
        caregiverId?: string;
        caregiverName?: string;
      };

      login(userData);
      const destination = userData.role === 'PATIENT' ? '/patient/dashboard' : '/caregiver/dashboard';
      router.replace(destination);
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
            Stay organized, share updates, and keep everyone aligned. Log in to get started as a patient or caregiver.
          </p>
        </div>

        <form
          className="mt-10 w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-6 md:px-8 md:py-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-white/90">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-base text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white/70"
                placeholder="Enter your name"
              />
            </div>

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
                className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-base text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70 focus:border-white/70"
                placeholder="City, State"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white/90">Role</p>
            <div className="inline-flex w-full rounded-2xl bg-white/10 p-1 border border-white/20">
              {(Object.keys(ROLE_LABELS) as Role[]).map((option) => {
                const isSelected = role === option;
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setRole(option)}
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

          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] py-3.5 text-base font-semibold text-white shadow-md hover:shadow-lg hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Continuing...' : 'Continue'}
            </button>
            <p className="text-xs text-white/60 text-center">By continuing, you agree to our terms.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

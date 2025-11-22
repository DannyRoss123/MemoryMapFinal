'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';

export default function HomePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f6abf] via-[#7ec6ff] to-[#f5fbff]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f6abf] via-[#7ec6ff] to-[#f5fbff] animate-fade-in">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Memory Map</h1>
              <p className="text-sm text-white/70">Welcome, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome to Memory Map!
          </h2>

          <div className="space-y-4 text-white/90">
            <p className="text-lg">
              You're logged in as a <span className="font-semibold">{user.role}</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* User Info Card */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Your Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-white/70">Name</dt>
                    <dd className="text-white font-medium">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/70">Email</dt>
                    <dd className="text-white font-medium">{user.email || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/70">Role</dt>
                    <dd className="text-white font-medium">{user.role}</dd>
                  </div>
                  {user.location && (
                    <div>
                      <dt className="text-sm text-white/70">Location</dt>
                      <dd className="text-white font-medium">{user.location}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {user.role === 'PATIENT' ? (
                    <>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">View My Tasks</div>
                        <div className="text-sm text-white/70">See your daily tasks</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">View Memories</div>
                        <div className="text-sm text-white/70">Browse your photos and videos</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">Journal Entry</div>
                        <div className="text-sm text-white/70">Write in your journal</div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">Manage Patients</div>
                        <div className="text-sm text-white/70">View and manage your patients</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">Assign Tasks</div>
                        <div className="text-sm text-white/70">Create tasks for patients</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition">
                        <div className="font-medium text-white">Upload Memories</div>
                        <div className="text-sm text-white/70">Add photos and videos</div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

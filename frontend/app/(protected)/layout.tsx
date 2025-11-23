'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '../context/UserContext';

const patientLinks = [
  { label: 'Dashboard', href: '/patient/dashboard' },
  { label: 'Journal', href: '/patient/journal' },
  { label: 'Tasks', href: '/patient/tasks' }
];

const caregiverLinks = [
  { label: 'Dashboard', href: '/caregiver/dashboard' },
  { label: 'Patients', href: '/caregiver/patients' },
  { label: 'Tasks', href: '/caregiver/tasks' }
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700">Loading...</div>
    );
  }

  if (!user) {
    return null;
  }

  const links = user.role === 'PATIENT' ? patientLinks : caregiverLinks;
  const roleLabel = user.role === 'PATIENT' ? 'Patient' : 'Caregiver';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (user.role === 'PATIENT') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="text-xl font-semibold text-slate-900">MemoryMap</div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <div className="flex flex-col leading-tight text-right">
            <span>
              Hi, {user.name} ({roleLabel})
            </span>
            {user.role === 'PATIENT' && user.caregiverName ? (
              <span className="text-xs text-slate-500">Paired with {user.caregiverName}</span>
            ) : null}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6">
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

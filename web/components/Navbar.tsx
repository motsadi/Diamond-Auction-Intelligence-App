'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const streamlitUrl = process.env.NEXT_PUBLIC_STREAMLIT_URL;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/datasets', label: 'Datasets' },
    { href: '/forecast', label: 'Forecast' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/history', label: 'History' },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                DAI
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">Diamond Auction Intelligence</div>
                <div className="text-xs text-gray-500">Auction forecasting</div>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {streamlitUrl ? (
                <a
                  href={streamlitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Streamlit Demo
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-700">{user?.email}</div>
            <button onClick={() => signOut()} className="btn-secondary">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}






















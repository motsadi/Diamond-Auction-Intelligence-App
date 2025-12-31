'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

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
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
              Diamond Auction Intelligence
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === item.href
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-700 hover:text-indigo-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}






















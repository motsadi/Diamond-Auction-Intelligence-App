'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, type NavItem } from './Sidebar';
import { useAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

type AppShellProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const SIDEBAR_STORAGE_KEY = 'dai.sidebar.collapsed';

function getDefaultTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Overview';
  if (pathname === '/forecast') return 'Econometric Forecasting';
  if (pathname === '/analysis') return 'Auction Data Diagnostics';
  if (pathname === '/reports') return 'Executive Auction Reports';
  if (pathname === '/datasets') return 'Datasets';
  if (pathname === '/history') return 'History';
  if (pathname === '/admin') return 'Admin';
  if (pathname === '/sentiment') return 'Market Sentiment & Price-Risk';
  if (pathname === '/simulation') return 'Auction Simulation & Strategy';
  if (pathname === '/grading') return 'Grading & Valuation';
  if (pathname === '/segmentation') return 'Segmentation & Recommendations';
  return 'Diamond Auction Intelligence';
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved != null) setCollapsed(saved === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    // close mobile drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Best-effort usage tracking (helps distinguish subdomain vs Vercel host).
    // We only track core pages to avoid log noise.
    const tracked = new Set(['/dashboard', '/forecast', '/analysis', '/reports', '/datasets', '/history', '/admin']);
    if (!user?.id) return;
    if (!tracked.has(pathname)) return;
    void logActivity({
      actorId: user.id,
      action: 'page.view',
      entityType: 'page',
      entityId: pathname,
      meta: {
        host: typeof window !== 'undefined' ? window.location.host : undefined,
        path: pathname,
        isAdmin: Boolean(isAdmin),
      },
    });
  }, [pathname, user?.id, isAdmin]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { href: '/dashboard', label: 'Overview', group: 'Core' },
      { href: '/forecast', label: 'Econometric forecasting', group: 'Core', badge: 'Live' },
      { href: '/analysis', label: 'Auction diagnostics', group: 'Core', badge: 'Live' },
      { href: '/reports', label: 'Executive reports', group: 'Core', badge: 'New' },
      { href: '/datasets', label: 'Datasets', group: 'Operations' },
      { href: '/history', label: 'History', group: 'Operations' },
      { href: '/sentiment', label: 'Market sentiment & risk', group: 'ML Modules', badge: 'Soon' },
      { href: '/simulation', label: 'Auction simulation', group: 'ML Modules', badge: 'Soon' },
      { href: '/grading', label: 'Grading & valuation', group: 'ML Modules', badge: 'Soon' },
      { href: '/segmentation', label: 'Segmentation & recommendations', group: 'ML Modules', badge: 'Soon' },
    ];
    if (isAdmin) items.push({ href: '/admin', label: 'Admin', group: 'Operations' });
    return items;
  }, [isAdmin]);

  const pageTitle = title || getDefaultTitle(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        items={navItems}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        activePath={pathname}
      />

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'} print:pl-0`}>
        <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="btn-secondary lg:hidden"
                aria-label="Open menu"
              >
                Menu
              </button>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{pageTitle}</div>
                {subtitle ? (
                  <div className="truncate text-xs text-gray-500">{subtitle}</div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions ? <div className="hidden sm:block">{actions}</div> : null}
              <div className="hidden sm:block text-sm text-gray-700">{user?.email}</div>
              <button onClick={() => signOut()} className="btn-secondary">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 print-reset">
          {children}
        </main>
      </div>
    </div>
  );
}



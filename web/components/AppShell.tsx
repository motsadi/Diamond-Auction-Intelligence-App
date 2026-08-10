'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, type NavItem } from './Sidebar';
import { useAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { Bell, Menu, UserRound } from 'lucide-react';

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
  if (pathname === '/copilot') return 'Auction Copilot';
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
    const tracked = new Set([
      '/dashboard',
      '/forecast',
      '/copilot',
      '/analysis',
      '/reports',
      '/datasets',
      '/history',
      '/sentiment',
      '/simulation',
      '/grading',
      '/segmentation',
      '/admin',
    ]);
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
      { href: '/dashboard', label: 'Command centre', group: 'Workspace', icon: 'overview' },
      { href: '/forecast', label: 'Prediction & demand', group: 'Workspace', icon: 'forecast', badge: 'Live' },
      { href: '/copilot', label: 'Auction Copilot', group: 'Workspace', icon: 'copilot', badge: 'Beta' },
      { href: '/reports', label: 'Reports', group: 'Workspace', icon: 'reports', badge: 'Live' },
      { href: '/analysis', label: 'Data diagnostics', group: 'Intelligence', icon: 'analysis' },
      { href: '/sentiment', label: 'Market sentiment & risk', group: 'Intelligence', icon: 'sentiment', badge: 'Planned' },
      { href: '/simulation', label: 'Auction simulation', group: 'Intelligence', icon: 'simulation', badge: 'Planned' },
      { href: '/grading', label: 'Grading & valuation', group: 'Intelligence', icon: 'grading', badge: 'Planned' },
      { href: '/segmentation', label: 'Buyer intelligence', group: 'Intelligence', icon: 'segmentation', badge: 'Planned' },
      { href: '/datasets', label: 'Data library', group: 'Data & governance', icon: 'datasets' },
      { href: '/history', label: 'Decision history', group: 'Data & governance', icon: 'history' },
    ];
    if (isAdmin) items.push({ href: '/admin', label: 'Administration', group: 'Data & governance', icon: 'admin' });
    return items;
  }, [isAdmin]);

  const pageTitle = title || getDefaultTitle(pathname);

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Sidebar
        items={navItems}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        activePath={pathname}
      />

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'} print:pl-0`}>
        <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="icon-btn lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-950">{pageTitle}</div>
                {subtitle ? (
                  <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions ? <div className="hidden sm:block">{actions}</div> : null}
              <button type="button" className="icon-btn relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
              </button>
              <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="max-w-40">
                  <div className="truncate text-xs font-semibold text-slate-800">{user?.email}</div>
                  <button onClick={() => signOut()} className="mt-0.5 block text-[11px] text-slate-500 hover:text-slate-900">
                    Sign out
                  </button>
                </div>
              </div>
              <button onClick={() => signOut()} className="btn-secondary sm:hidden">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 print-reset">
          {children}
        </main>
      </div>
    </div>
  );
}



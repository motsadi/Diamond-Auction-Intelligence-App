'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Database,
  FileBarChart,
  Gauge,
  Gem,
  History,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  group: 'Workspace' | 'Intelligence' | 'Data & governance';
  icon: keyof typeof icons;
  badge?: 'Live' | 'Planned' | 'Beta';
};

type SidebarProps = {
  items: NavItem[];
  activePath: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function Badge({ badge }: { badge: NavItem['badge'] }) {
  if (!badge) return null;
  const styles =
    badge === 'Live'
      ? 'bg-emerald-100 text-emerald-800'
      : badge === 'Beta'
        ? 'bg-violet-100 text-violet-800'
        : 'bg-slate-100 text-slate-500';
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles}`}>{badge}</span>;
}

const icons = {
  overview: LayoutDashboard,
  forecast: ChartNoAxesCombined,
  analysis: BarChart3,
  reports: FileBarChart,
  datasets: Database,
  history: History,
  sentiment: Gauge,
  simulation: SlidersHorizontal,
  grading: Gem,
  segmentation: Users,
  copilot: Bot,
  admin: Settings,
};

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = icons[item.icon];
  return (
    <Link
      href={item.href}
      className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      }`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-700'}`} strokeWidth={1.8} />
      {collapsed ? null : (
        <>
          <span className="truncate">{item.label}</span>
          <Badge badge={item.badge} />
        </>
      )}
    </Link>
  );
}

function SidebarInner({
  items,
  activePath,
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
}: Omit<SidebarProps, 'mobileOpen'>) {
  const groups: Array<NavItem['group']> = ['Workspace', 'Intelligence', 'Data & governance'];

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex h-[72px] items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-emerald-300 shadow-sm">
            <Gem className="h-5 w-5" />
          </div>
          {collapsed ? null : (
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-slate-950">ODC Intelligence</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Auction decision platform</div>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleCollapsed} className="icon-btn hidden lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onCloseMobile} className="icon-btn lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => {
          const groupItems = items.filter((i) => i.group === g);
          if (groupItems.length === 0) return null;
          return (
            <div key={g} className="mt-4">
              {collapsed ? null : (
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {g}
                </div>
              )}
              <div className="space-y-1">
                {groupItems.map((item) => (
                  <NavLink key={item.href} item={item} active={activePath === item.href} collapsed={collapsed} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {collapsed ? null : (
        <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <BrainCircuit className="h-4 w-4 text-emerald-700" />
            Model governance
          </div>
          <div className="mt-2 leading-5">Simulated data · Human approval required</div>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const widthClass = props.collapsed ? 'lg:w-20' : 'lg:w-72';

  return (
    <>
      {/* Desktop */}
      <div className={`no-print fixed inset-y-0 left-0 z-30 hidden ${widthClass} lg:block`}>
        <SidebarInner
          items={props.items}
          activePath={props.activePath}
          collapsed={props.collapsed}
          onToggleCollapsed={props.onToggleCollapsed}
          onCloseMobile={props.onCloseMobile}
        />
      </div>

      {/* Mobile overlay + drawer */}
      {props.mobileOpen ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu overlay"
            onClick={props.onCloseMobile}
          />
          <div className="absolute inset-y-0 left-0 w-80">
            <SidebarInner
              items={props.items}
              activePath={props.activePath}
              collapsed={false}
              onToggleCollapsed={props.onToggleCollapsed}
              onCloseMobile={props.onCloseMobile}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}



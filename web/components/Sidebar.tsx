'use client';

import Link from 'next/link';

export type NavItem = {
  href: string;
  label: string;
  group: 'Core' | 'ML Modules' | 'Operations';
  badge?: 'Live' | 'Soon' | 'New';
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
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
      : badge === 'New'
      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200'
      : 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200';
  return <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles}`}>{badge}</span>;
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200' : 'text-gray-700 hover:bg-gray-100'
      }`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active ? 'bg-indigo-600' : item.badge === 'Live' ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
      />
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
  const groups: Array<NavItem['group']> = ['Core', 'ML Modules', 'Operations'];

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            DAI
          </div>
          {collapsed ? null : (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">DAI</div>
              <div className="text-xs text-gray-500">Okavango Diamond Co.</div>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleCollapsed} className="btn-secondary hidden lg:inline-flex">
            {collapsed ? '→' : '←'}
          </button>
          <button type="button" onClick={onCloseMobile} className="btn-secondary lg:hidden">
            Close
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
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
        <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
          <div className="font-semibold text-gray-700">Reports-ready</div>
          <div className="mt-1">Forecast → Analysis → Report export</div>
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
      <div className={`fixed inset-y-0 left-0 z-30 hidden ${widthClass} lg:block`}>
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
        <div className="fixed inset-0 z-40 lg:hidden">
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



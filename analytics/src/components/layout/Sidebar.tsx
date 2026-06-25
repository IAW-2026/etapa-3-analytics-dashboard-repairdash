'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { LayoutDashboard, Wrench, Car, CreditCard, MessageSquare, Tag } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { ROUTE_PATH, ROUTE_META, type Route } from '@/lib/routes';

const NAV: { id: Route; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'riderapp', icon: Wrench },
  { id: 'driver', icon: Car },
  { id: 'payments', icon: CreditCard },
  { id: 'feedback', icon: MessageSquare },
  { id: 'promociones', icon: Tag },
];

export function Sidebar({ isMobile }: { isMobile: boolean }) {
  const { sidebarOpen, closeSidebar } = useApp();
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside
      className={`w-[256px] shrink-0 flex flex-col bg-surface border-r border-border h-full${isMobile ? ' fixed left-0 top-0 bottom-0 z-50 shadow-card' : ''}`}
      style={{
        ...(isMobile ? {
          transform: `translateX(${sidebarOpen ? '0' : '-105%'})`,
          transition: 'transform .28s ease',
        } : {}),
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-[11px] px-[18px] pt-5 pb-4">
        <div className="size-[30px] rounded-[9px] bg-gradient-to-br from-violet to-pink rotate-45 shrink-0 ml-[3px]" />
        <div className="flex flex-col">
          <span className="font-grotesk font-bold text-base tracking-[-.01em]">Analytics</span>
          <span className="text-[11px] text-text3 tracking-[.05em]">VISIÓN CONSOLIDADA</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-3">
        {NAV.map(({ id, icon: Icon }) => {
          const active = pathname === ROUTE_PATH[id];
          return (
            <Link
              key={id}
              href={ROUTE_PATH[id]}
              onClick={closeSidebar}
              className={`flex items-center gap-[11px] px-3 py-[9px] rounded-[10px] cursor-pointer mx-[10px] my-[1px] text-sm no-underline transition-[background] duration-[120ms] ${active ? 'font-semibold' : 'font-normal'}`}
              style={{
                color: active ? 'var(--text)' : 'var(--text2)',
                background: active ? 'var(--violet-soft)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? 'var(--violet-soft)' : 'transparent'; }}
            >
              <Icon size={17} strokeWidth={1.9} className="shrink-0" style={{ color: active ? ROUTE_META[id].dot : 'var(--text3)' }} />
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{ROUTE_META[id].title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-[18px] py-3 border-t border-border flex items-center gap-2.5">
        <UserButton />
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{user?.fullName || user?.firstName || 'Súper admin'}</span>
          <span className="text-[11.5px] text-text3 whitespace-nowrap overflow-hidden text-ellipsis">{user?.primaryEmailAddress?.emailAddress || ''}</span>
        </div>
      </div>
    </aside>
  );
}

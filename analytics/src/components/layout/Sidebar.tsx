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

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
    margin: '1px 10px', fontSize: 14, textDecoration: 'none',
    color: active ? 'var(--text)' : 'var(--text2)',
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--violet-soft)' : 'transparent',
    transition: 'background .12s',
  });

  const sidebarStyle: React.CSSProperties = {
    width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column',
    background: 'var(--surface)', borderRight: '1px solid var(--border)', height: '100%',
    ...(isMobile ? {
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50,
      transform: `translateX(${sidebarOpen ? '0' : '-105%'})`,
      transition: 'transform .28s ease',
      boxShadow: 'var(--shadow)',
    } : {}),
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 18px 16px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'linear-gradient(135deg, var(--violet), var(--pink))',
          transform: 'rotate(45deg)', flexShrink: 0, marginLeft: 3,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>Analytics</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '.05em' }}>VISIÓN CONSOLIDADA</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0 12px' }}>
        {NAV.map(({ id, icon: Icon }) => {
          const active = pathname === ROUTE_PATH[id];
          return (
            <Link
              key={id}
              href={ROUTE_PATH[id]}
              onClick={closeSidebar}
              style={linkStyle(active)}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? 'var(--violet-soft)' : 'transparent'; }}
            >
              <Icon size={17} strokeWidth={1.9} style={{ flexShrink: 0, color: active ? ROUTE_META[id].dot : 'var(--text3)' }} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ROUTE_META[id].title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <UserButton />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName || user?.firstName || 'Súper admin'}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.primaryEmailAddress?.emailAddress || ''}</span>
        </div>
      </div>
    </aside>
  );
}

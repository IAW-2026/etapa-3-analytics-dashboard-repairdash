'use client';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  icon?: ReactNode;
  loading?: boolean;
}

// Indicador numérico grande. Es el bloque base de la fila de KPIs del overview
// y de las páginas de servicio.
export function KpiCard({ label, value, hint, color = 'var(--text)', icon, loading }: KpiCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text3)' }}>
        {icon}
        <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.02em' }}>{label}</span>
      </div>
      {loading ? (
        <Skeleton w={110} h={30} style={{ margin: '4px 0 2px' }} />
      ) : (
        <span style={{ fontFamily: 'var(--font-grotesk)', fontSize: 30, fontWeight: 700, color, letterSpacing: '-.02em', lineHeight: 1.1 }}>
          {value}
        </span>
      )}
      {hint && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{hint}</span>}
    </div>
  );
}

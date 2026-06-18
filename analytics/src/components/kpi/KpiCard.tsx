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
    <div className="card flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2" style={{ color: 'var(--text3)' }}>
        {icon}
        <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.02em' }}>{label}</span>
      </div>
      {loading ? (
        <Skeleton w={110} h={30} style={{ margin: '4px 0 2px' }} />
      ) : (
        <span className="font-bold leading-[1.1]" style={{ fontFamily: 'var(--font-grotesk)', fontSize: 30, color, letterSpacing: '-.02em' }}>
          {value}
        </span>
      )}
      {hint && <span className="text-xs" style={{ color: 'var(--text3)' }}>{hint}</span>}
    </div>
  );
}

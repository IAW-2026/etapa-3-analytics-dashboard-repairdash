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
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2 text-text3">
        {icon}
        <span className="text-[12.5px] font-semibold tracking-[.02em]">{label}</span>
      </div>
      {loading ? (
        <Skeleton w={110} h={30} style={{ margin: '4px 0 2px' }} />
      ) : (
        <span className="font-grotesk text-[30px] font-bold leading-[1.1] tracking-[-.02em]" style={{ color }}>
          {value}
        </span>
      )}
      {hint && <span className="text-xs text-text3">{hint}</span>}
    </div>
  );
}

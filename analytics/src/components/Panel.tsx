'use client';
import type { ReactNode } from 'react';
import { TableSkeleton } from '@/components/ui/Skeleton';

interface PanelProps {
  title: string;
  loading?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
}

// Card de contenido sin altura fija (a diferencia de ChartCard). Para tablas y
// listados, con estados de carga/vacío unificados.
export function Panel({ title, loading, empty, emptyLabel = 'Sin datos para el período', children }: PanelProps) {
  return (
    <div className="card flex flex-col gap-3.5">
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 600, fontSize: 15 }}>{title}</span>
      </div>
      {loading ? <TableSkeleton /> : empty ? (
        <div className="py-7 grid place-items-center text-[13px]" style={{ color: 'var(--text3)' }}>{emptyLabel}</div>
      ) : children}
    </div>
  );
}

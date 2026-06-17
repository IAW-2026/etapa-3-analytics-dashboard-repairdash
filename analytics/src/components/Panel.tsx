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
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 600, fontSize: 15 }}>{title}</span>
      </div>
      {loading ? <TableSkeleton /> : empty ? (
        <div style={{ padding: '28px 0', display: 'grid', placeItems: 'center', color: 'var(--text3)', fontSize: 13 }}>{emptyLabel}</div>
      ) : children}
    </div>
  );
}

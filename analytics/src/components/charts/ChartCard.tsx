'use client';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ChartCardProps {
  title: string;
  loading?: boolean;
  empty?: boolean;        // no hay datos para el período
  emptyLabel?: string;
  children: ReactNode;
  height?: number;
}

// Card contenedora para cualquier visualización: encabezado + estados de carga
// y vacío unificados, para que los charts solo se ocupen de dibujar.
export function ChartCard({ title, loading, empty, emptyLabel = 'Sin datos para el período', children, height = 260 }: ChartCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 600, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ height, position: 'relative' }}>
        {loading ? (
          <Skeleton w="100%" h={height} radius={12} />
        ) : empty ? (
          <div style={{ height, display: 'grid', placeItems: 'center', color: 'var(--text3)', fontSize: 13 }}>{emptyLabel}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

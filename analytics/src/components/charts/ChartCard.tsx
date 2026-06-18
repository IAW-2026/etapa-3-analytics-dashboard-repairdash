'use client';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ChartCardProps {
  title: string;
  meta?: string;
  loading?: boolean;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
  height?: number;
  titleSize?: number;
}

export function ChartCard({ title, meta, loading, empty, emptyLabel = 'Sin datos para el periodo', children, height = 260, titleSize = 15 }: ChartCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 700, fontSize: titleSize }}>{title}</span>
        {meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text3)' }}>{meta}</span>}
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

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
    <div className="card flex flex-col gap-3.5">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 700, fontSize: titleSize }}>{title}</span>
        {meta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text3)' }}>{meta}</span>}
      </div>
      <div className="relative" style={{ height }}>
        {loading ? (
          <Skeleton w="100%" h={height} radius={12} />
        ) : empty ? (
          <div className="grid place-items-center text-[13px]" style={{ height, color: 'var(--text3)' }}>{emptyLabel}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

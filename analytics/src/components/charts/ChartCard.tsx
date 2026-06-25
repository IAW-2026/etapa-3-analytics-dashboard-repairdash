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
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3.5">
      <div className="flex items-baseline gap-3.5 flex-wrap">
        <span className="font-grotesk font-bold" style={{ fontSize: titleSize }}>{title}</span>
        {meta && <span className="font-mono text-[13px] font-bold text-text3">{meta}</span>}
      </div>
      <div className="relative" style={{ height }}>
        {loading ? (
          <Skeleton w="100%" h={height} radius={12} />
        ) : empty ? (
          <div className="grid place-items-center text-[13px] text-text3" style={{ height }}>{emptyLabel}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

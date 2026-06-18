'use client';

interface BadgeProps {
  label: string;
  variant?: 'ok' | 'warn' | 'danger' | 'violet' | 'pink' | 'mag';
  className?: string;
}

const VARIANTS: Record<string, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  violet: 'bg-violet-soft text-violet',
  pink: 'bg-pink-soft text-pink',
  mag: 'bg-mag-soft text-mag',
};

export function Badge({ label, variant = 'violet', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-[11.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${VARIANTS[variant]} ${className}`}>
      {label}
    </span>
  );
}

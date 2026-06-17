'use client';

interface BadgeProps {
  label: string;
  bg: string;
  fg: string;
  className?: string;
}

export function Badge({ label, bg, fg, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${className}`} style={{ background: bg, color: fg }}>
      {label}
    </span>
  );
}

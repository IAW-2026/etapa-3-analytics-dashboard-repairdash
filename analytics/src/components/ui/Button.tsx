'use client';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'ghost', loading, children, className = '', ...rest }: ButtonProps) {
  const base = 'font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer';

  const variants: Record<string, string> = {
    primary:
      'border-none rounded-[10px] px-[18px] py-[9px] text-[13.5px] text-white bg-gradient-to-r from-violet to-pink hover:brightness-110 disabled:opacity-45 disabled:pointer-events-none',
    ghost:
      'border border-border bg-transparent text-text2 rounded-[10px] px-4 py-[9px] text-[13.5px] hover:border-violet hover:text-violet',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && <span className="spinner inline-block w-4 h-4 mr-2 align-middle" />}
      {children}
    </button>
  );
}

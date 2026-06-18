'use client';
import type { CSSProperties } from 'react';

// Shimmer placeholders used while data is loading. The shimmer itself lives in
// the `.skeleton` class (globals.css) so it follows the active theme tokens.

interface SkeletonProps {
  w?: number | string;
  h?: number | string;
  radius?: number | string;
  style?: CSSProperties;
}

export function Skeleton({ w = '100%', h = 14, radius = 8, style }: SkeletonProps) {
  return <span className="skeleton" style={{ display: 'block', width: w, height: h, borderRadius: radius, ...style }} />;
}

// Imita una tabla poblada para encajar en el contenedor mientras carga.
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  const widths = ['70%', '52%', '40%', '60%', '34%', '48%', '44%'];
  return (
    <table className="w-full" style={{ borderCollapse: 'collapse' }} aria-hidden>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="tr-base">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="td" style={c === cols - 1 ? { textAlign: 'right' } : undefined}>
                <Skeleton
                  w={widths[c % widths.length]}
                  h={12}
                  style={c === cols - 1 ? { marginLeft: 'auto', width: 64 } : undefined}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

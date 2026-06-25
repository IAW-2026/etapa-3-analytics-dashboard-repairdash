import type { CSSProperties } from 'react';

// Estilos compartidos por los charts de Recharts, atados a los tokens del tema.
// El tooltip es un div HTML, así que puede usar var(--...) directamente.
export const AXIS_TICK = { fill: 'var(--text3)', fontSize: 12 } as const;
export const GRID_STROKE = 'var(--border)';

export const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border2)',
  borderRadius: 12,
  boxShadow: 'var(--shadow)',
  fontSize: 13,
  color: 'var(--text)',
};
export const TOOLTIP_LABEL_STYLE: CSSProperties = { color: 'var(--text2)', fontWeight: 600 };
export const TOOLTIP_ITEM_STYLE: CSSProperties = { color: 'var(--text)' };

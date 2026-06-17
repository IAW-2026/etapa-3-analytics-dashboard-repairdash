import { type ReactNode } from 'react';

export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

// Tabla genérica con el mismo markup responsive que el Control Plane: en mobile
// (≤1024px, ver table.css) cada fila se vuelve una card usando data-label.
export function Table<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="table-wrap" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`th${col.align === 'right' ? ' th-right' : ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="tr-base">
              {columns.map((col, ci) => (
                <td key={ci} className="td" data-label={col.label || undefined} style={{ textAlign: col.align || 'left' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {col.render(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

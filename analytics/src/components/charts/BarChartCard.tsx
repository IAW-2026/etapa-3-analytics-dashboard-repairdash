'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartCard } from './ChartCard';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartTheme';
import { CHART_COLORS } from '@/lib/utils';

export interface BarDatum {
  name: string;
  value: number;
}

interface Props {
  title: string;
  meta?: string;
  loading?: boolean;
  data: BarDatum[];
  height?: number;
  color?: string;
  multicolor?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

function HorizontalBars({ data, color, multicolor }: { data: BarDatum[]; color: string; multicolor?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 12, padding: '2px 0' }}>
      {data.map((item, index) => {
        const width = `${Math.max(0, Math.min(100, (item.value / max) * 100))}%`;
        const fill = multicolor ? CHART_COLORS[index % CHART_COLORS.length] : color;
        return (
          <div key={`${item.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 190px) minmax(90px, 1fr) minmax(42px, max-content)', alignItems: 'center', gap: 20, minHeight: 22 }}>
            <span style={{ color: 'var(--text2)', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--surface2)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width,
                  borderRadius: 999,
                  background: multicolor ? fill : `linear-gradient(90deg, ${fill}, var(--pink))`,
                  boxShadow: item.value > 0 ? '0 0 12px rgba(242,107,184,.22)' : 'none',
                }}
              />
            </div>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-grotesk)', fontSize: 17, fontWeight: 700, textAlign: 'right' }}>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BarChartCard({ title, meta, loading, data, height = 260, color = CHART_COLORS[0], multicolor, orientation = 'vertical' }: Props) {
  const empty = !loading && (!data || data.length === 0 || data.every((d) => d.value === 0));
  const horizontalHeight = orientation === 'horizontal'
    ? Math.max(height, data.length * 34 + Math.max(0, data.length - 1) * 12 + 4)
    : height;

  if (orientation === 'horizontal') {
    return (
      <ChartCard title={title} meta={meta} loading={loading} empty={empty} height={horizontalHeight} titleSize={18}>
        <HorizontalBars data={data} color={color} multicolor={multicolor} />
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} meta={meta} loading={loading} empty={empty} height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} interval={0} textAnchor="middle" height={28} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
          <Tooltip cursor={{ fill: 'var(--violet-soft)' }} contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color} maxBarSize={48}>
            {multicolor && data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

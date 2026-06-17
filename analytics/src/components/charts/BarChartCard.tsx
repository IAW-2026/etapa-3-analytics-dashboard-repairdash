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
  loading?: boolean;
  data: BarDatum[];
  height?: number;
  color?: string;
  multicolor?: boolean; // un color por barra (categorías) vs un color uniforme
}

export function BarChartCard({ title, loading, data, height = 260, color = CHART_COLORS[0], multicolor }: Props) {
  const empty = !loading && (!data || data.length === 0 || data.every((d) => d.value === 0));
  return (
    <ChartCard title={title} loading={loading} empty={empty} height={height}>
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

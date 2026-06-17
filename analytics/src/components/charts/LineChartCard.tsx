'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartTheme';
import { CHART_COLORS } from '@/lib/utils';
import { formatMoney } from '@/lib/money';

export interface LineDatum {
  date: string; // YYYY-MM-DD
  value: number;
}

interface Props {
  title: string;
  loading?: boolean;
  data: LineDatum[];
  height?: number;
  color?: string;
  // Formato de los valores (eje Y + tooltip). Es un descriptor serializable en
  // vez de una función, para poder renderizar este client component desde un
  // Server Component sin pasar funciones a través del límite RSC.
  format?: 'money';
}

// DD/MM a partir de YYYY-MM-DD.
function shortDate(d: string): string {
  const [, m, day] = d.split('-');
  return day && m ? `${day}/${m}` : d;
}

export function LineChartCard({ title, loading, data, height = 260, color = CHART_COLORS[0], format }: Props) {
  const valueFormatter = format === 'money' ? (v: number) => formatMoney(v) : undefined;
  const empty = !loading && (!data || data.length === 0);
  return (
    <ChartCard title={title} loading={loading} empty={empty} height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 12, left: -6, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={valueFormatter} />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v: number) => [valueFormatter ? valueFormatter(v) : v, 'Total']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

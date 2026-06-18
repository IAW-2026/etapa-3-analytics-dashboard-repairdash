'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';
import { AXIS_TICK, GRID_STROKE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartTheme';
import { CHART_COLORS } from '@/lib/utils';
import { formatCompactMoney, formatMoney } from '@/lib/money';

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
  emptyLabel?: string;
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

function nicePositiveTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0, 1];
  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const normalized = maxValue / magnitude;
  const stepMultiplier = normalized <= 2 ? 0.5 : normalized <= 5 ? 1 : 2;
  const step = stepMultiplier * magnitude;
  const top = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= top; tick += step) ticks.push(tick);
  return ticks.length >= 2 ? ticks : [0, top || 1];
}

export function LineChartCard({ title, loading, data, height = 260, color = CHART_COLORS[0], emptyLabel, format }: Props) {
  const axisValueFormatter = format === 'money' ? (v: number) => formatCompactMoney(v) : undefined;
  const tooltipValueFormatter = format === 'money' ? (v: number) => formatMoney(v) : undefined;
  const empty = !loading && (!data || data.length === 0);
  const hasNegativeValues = data.some((d) => d.value < 0);
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const nonNegativeTicks = nicePositiveTicks(maxValue * 1.08);
  const nonNegativeDomain: [number, number] = [0, nonNegativeTicks[nonNegativeTicks.length - 1]];
  return (
    <ChartCard title={title} loading={loading} empty={empty} emptyLabel={emptyLabel} height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 12, left: -6, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} minTickGap={24} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={format === 'money' ? 64 : 56}
            tickFormatter={axisValueFormatter}
            domain={hasNegativeValues ? ['auto', 'auto'] : nonNegativeDomain}
            ticks={hasNegativeValues ? undefined : nonNegativeTicks}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v: number) => [tooltipValueFormatter ? tooltipValueFormatter(v) : v, 'Total']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

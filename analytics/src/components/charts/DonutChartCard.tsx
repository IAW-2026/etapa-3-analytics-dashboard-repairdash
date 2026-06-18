'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from './ChartCard';
import { TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE } from './chartTheme';
import { CHART_COLORS } from '@/lib/utils';

export interface DonutDatum {
  name: string;
  value: number;
}

interface Props {
  title: string;
  loading?: boolean;
  data: DonutDatum[];
  height?: number;
  colors?: string[];
}

export function DonutChartCard({ title, loading, data, height = 260, colors = CHART_COLORS }: Props) {
  const empty = !loading && (!data || data.length === 0 || data.every((d) => d.value === 0));
  return (
    <ChartCard title={title} loading={loading} empty={empty} height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="var(--surface)">
            {data.map((d, i) => <Cell key={i} fill={colors[i % colors.length]} aria-label={d.name} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12.5, color: 'var(--text2)' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

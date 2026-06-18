import { Tag, Clock, CalendarX, Repeat, Percent } from 'lucide-react';
import { periodFromSearchParams } from '@/lib/period';
import { getPromociones } from '@/lib/server/services';
import { fnum } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import type { PromocionesData } from '@/lib/types';
import { KpiCard } from '@/components/kpi/KpiCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { Panel } from '@/components/Panel';
import { PageTitle } from '@/components/PageTitle';
import { Table, type Column } from '@/components/table/Table';

type TopPromo = PromocionesData['topPromos'][number];

const columns: Column<TopPromo>[] = [
  { label: 'Promoción', render: (p) => <span style={{ fontWeight: 600 }}>{p.nombre}</span> },
  { label: 'Usos', align: 'right', render: (p) => <span style={{ fontWeight: 700 }}>{fnum(p.usos)}</span> },
];

export default async function PromocionesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
  const data = await getPromociones(period.from, period.to);

  const financialBars = [
    { name: 'Valor original', value: data.valorOriginal ?? 0 },
    { name: 'Valor pagado', value: data.valorPagado ?? 0 },
    { name: 'Ahorro total', value: data.ahorroTotal ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="Promociones" subtitle={`Estado de promociones y uso en el período ${period.label}.`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Vigentes" value={fnum(data.vigentes)} color="var(--ok)" icon={<Tag size={15} />} />
        <KpiCard label="Programadas" value={fnum(data.programadas)} color="var(--violet)" icon={<Clock size={15} />} />
        <KpiCard label="Vencidas" value={fnum(data.vencidas)} color="var(--text3)" icon={<CalendarX size={15} />} />
        <KpiCard label="Usos en el período" value={fnum(data.usos)} icon={<Repeat size={15} />} hint={data.usosTruncated ? 'Parcial (dataset grande)' : undefined} />
        <KpiCard label="Ahorro total" value={formatMoney(data.ahorroTotal ?? null)} color="var(--pink)" icon={<Percent size={15} />} />
      </div>

      <BarChartCard title="Impacto economico" data={financialBars} color="var(--violet)" orientation="horizontal" format="money" />

      <Panel title="Top promociones por uso" empty={data.topPromos.length === 0}>
        <Table columns={columns} rows={data.topPromos} />
      </Panel>
    </div>
  );
}

import { Tag, Clock, CalendarX, Repeat, Percent } from 'lucide-react';
import { periodFromSearchParams } from '@/lib/period';
import { getPromociones } from '@/lib/server/services';
import { fnum, fpct } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/kpi/KpiCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PageTitle } from '@/components/PageTitle';

export default async function PromocionesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
  const data = await getPromociones(period.from, period.to);

  const promoUsageBars = data.topPromos.map((p) => ({ name: p.nombre, value: p.usos }));
  const financialBars = [
    { name: 'Valor original', value: data.valorOriginal ?? 0 },
    { name: 'Valor pagado', value: data.valorPagado ?? 0 },
    { name: 'Ahorro total', value: data.ahorroTotal ?? 0 },
  ];
  const ahorroRate = data.valorOriginal && data.ahorroTotal != null
    ? data.ahorroTotal / data.valorOriginal
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="Promociones" subtitle={`Estado de promociones y uso en el periodo ${period.label}.`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Vigentes" value={fnum(data.vigentes)} color="var(--ok)" icon={<Tag size={15} />} />
        <KpiCard label="Programadas" value={fnum(data.programadas)} color="var(--violet)" icon={<Clock size={15} />} />
        <KpiCard label="Vencidas" value={fnum(data.vencidas)} color="var(--text3)" icon={<CalendarX size={15} />} />
        <KpiCard label="Usos en el periodo" value={fnum(data.usos)} icon={<Repeat size={15} />} hint={data.usosTruncated ? 'Parcial (dataset grande)' : undefined} />
        <KpiCard label="Ahorro total" value={formatMoney(data.ahorroTotal ?? null)} color="var(--pink)" icon={<Percent size={15} />} />
      </div>

      <BarChartCard title="Usos por promocion" data={promoUsageBars} multicolor orientation="horizontal" />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-grotesk)', fontSize: 18, fontWeight: 700 }}>Impacto economico</span>
          <span style={{ fontSize: 12.5, color: 'var(--text3)', fontWeight: 700 }}>historial /count</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          {financialBars.map((item) => (
            <div key={item.name} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)', minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{item.name}</div>
              <div style={{ marginTop: 8, fontFamily: 'var(--font-grotesk)', fontSize: 22, fontWeight: 800, color: item.name === 'Ahorro total' ? 'var(--pink)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatMoney(item.value)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 2, color: 'var(--text2)', fontSize: 13 }}>
          <span>Tasa de ahorro sobre valor original</span>
          <strong style={{ color: 'var(--ok)' }}>{fpct(ahorroRate, true)}</strong>
        </div>
      </div>
    </div>
  );
}

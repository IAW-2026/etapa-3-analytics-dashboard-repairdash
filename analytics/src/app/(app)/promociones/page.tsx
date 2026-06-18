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
    <div className="flex flex-col gap-[22px] max-w-[1280px] mx-auto">
      <PageTitle title="Promociones" subtitle={`Estado de promociones y uso en el periodo ${period.label}.`} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
        <KpiCard label="Vigentes" value={fnum(data.vigentes)} color="var(--ok)" icon={<Tag size={15} />} />
        <KpiCard label="Programadas" value={fnum(data.programadas)} color="var(--violet)" icon={<Clock size={15} />} />
        <KpiCard label="Vencidas" value={fnum(data.vencidas)} color="var(--text3)" icon={<CalendarX size={15} />} />
        <KpiCard label="Usos en el periodo" value={fnum(data.usos)} icon={<Repeat size={15} />} hint={data.usosTruncated ? 'Parcial (dataset grande)' : undefined} />
        <KpiCard label="Ahorro total" value={formatMoney(data.ahorroTotal ?? null)} color="var(--pink)" icon={<Percent size={15} />} />
      </div>

      <BarChartCard title="Usos por promocion" data={promoUsageBars} multicolor orientation="horizontal" />

      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <span className="font-grotesk text-lg font-bold">Impacto economico</span>
          <span className="text-[12.5px] text-text3 font-bold">historial /count</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {financialBars.map((item) => (
            <div key={item.name} className="border border-border rounded-xl p-3.5 bg-surface2 min-w-0">
              <div className="text-xs text-text3 font-bold uppercase tracking-[.04em]">{item.name}</div>
              <div className="mt-2 font-grotesk text-[22px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: item.name === 'Ahorro total' ? 'var(--pink)' : 'var(--text)' }}>
                {formatMoney(item.value)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-3 flex-wrap pt-0.5 text-text2 text-[13px]">
          <span>Tasa de ahorro sobre valor original</span>
          <strong className="text-ok">{fpct(ahorroRate, true)}</strong>
        </div>
      </div>
    </div>
  );
}

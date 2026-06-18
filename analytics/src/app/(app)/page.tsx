import { DollarSign, ArrowLeftRight, Users, PackageCheck, Star, Tag } from 'lucide-react';
import { resolvePeriod } from '@/lib/period';
import { getOverview } from '@/lib/server/services';
import { ROUTE_PATH } from '@/lib/routes';
import { fnum } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/kpi/KpiCard';
import { LineChartCard, BarChartCard, DonutChartCard } from '@/components/charts/ChartsBundle';
import { ServiceCard } from './_components/ServiceCard';

const TX_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', RESERVED: 'Reservada', LIQUIDATED: 'Liquidada',
  TRANSFERRED: 'Transferida', DISPUTED: 'En disputa', REFUNDED: 'Reembolsada', FAILED: 'Fallida',
};

export default async function OverviewPage() {
  const period = resolvePeriod('this-month');
  const data = await getOverview(period.from, period.to, period.month);
  const k = data.kpis;

  const revenueSeries = data.revenueSeries.map((r) => ({ date: r.date, value: r.total }));
  const txBars = Object.entries(data.transactionsByStatus || {}).map(([key, v]) => ({ name: TX_LABELS[key] || key, value: v }));
  const ratingDonut = data.ratingsDistribution.map((d) => ({ name: `${d.estrellas}★`, value: d.cantidad }));

  const services = data.services;
  const cards = [
    { key: 'riderapp', name: 'RiderApp', route: 'riderapp' as const, dot: 'var(--pink)', ok: services.riderapp.ok,
      stats: [{ v: fnum(services.riderapp.clientes), l: 'Clientes' }, { v: fnum(services.riderapp.viajes), l: 'Viajes' }] },
    { key: 'driver', name: 'DriverApp', route: 'driver' as const, dot: 'var(--violet)', ok: services.driver.ok,
      stats: [{ v: fnum(services.driver.workersOnline), l: 'Online' }, { v: fnum(services.driver.jobsActivos), l: 'Trabajos activos' }] },
    { key: 'payments', name: 'Payments', route: 'payments' as const, dot: 'var(--mag)', ok: services.payments.ok,
      stats: [{ v: fnum(services.payments.transacciones), l: 'Transacciones' }, { v: formatMoney(services.payments.ingresos ?? null), l: 'Ingresos' }] },
    { key: 'feedback', name: 'Feedback', route: 'feedback' as const, dot: 'var(--pink)', ok: services.feedback.ok,
      stats: [{ v: fnum(services.feedback.reviews), l: 'Reviews' }, { v: fnum(services.feedback.reportes), l: 'Reportes' }] },
    { key: 'promociones', name: 'Promociones', route: 'promociones' as const, dot: 'var(--ok)', ok: services.promociones.ok,
      stats: [{ v: fnum(services.promociones.activas), l: 'Activas' }, { v: fnum(services.promociones.usos), l: 'Usos' }] },
  ];

  return (
    <div className="flex flex-col gap-[22px] max-w-[1280px] mx-auto">
      <div>
        <h1 className="font-grotesk text-[clamp(22px,3vw,27px)] font-bold m-0 mb-[6px] tracking-[-.015em]">Visión consolidada</h1>
        <p className="m-0 text-sm text-text2 max-w-[64ch]">
          Indicadores clave del negocio agregados de las cinco webapps, combinando snapshots operativos y métricas recientes.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <KpiCard label="Ingresos" value={formatMoney(k.ingresos ?? null)} hint="Pagos liquidados" color="var(--ok)" icon={<DollarSign size={15} />} />
        <KpiCard label="Transacciones" value={fnum(k.transacciones)} hint="Volumen total" icon={<ArrowLeftRight size={15} />} />
        <KpiCard label="Usuarios activos" value={fnum(k.usuariosActivos)} hint="Clientes + drivers" icon={<Users size={15} />} />
        <KpiCard label="Pedidos completados" value={fnum(k.pedidosCompletados)} hint="Trabajos + viajes" icon={<PackageCheck size={15} />} />
        <KpiCard label="Calificación prom." value={k.calificacionPromedio != null ? `${k.calificacionPromedio.toFixed(2)} ★` : '—'} hint="Reviews del mes" color="var(--warn)" icon={<Star size={15} />} />
        <KpiCard label="Promociones activas" value={fnum(k.promocionesActivas)} hint="Vigentes" color="var(--violet)" icon={<Tag size={15} />} />
      </div>

      {/* Charts */}
      <LineChartCard title="Ingresos por día" data={revenueSeries} format="money" color="var(--ok)" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-4">
        <BarChartCard title="Transacciones por estado" meta="payments /summary" data={txBars} color="var(--violet)" orientation="horizontal" />
        <DonutChartCard title="Distribución de calificaciones" data={ratingDonut} />
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
        {cards.map((c) => (
          <ServiceCard key={c.key} href={ROUTE_PATH[c.route]} name={c.name} dot={c.dot} ok={c.ok} stats={c.stats} />
        ))}
      </div>
    </div>
  );
}

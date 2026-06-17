import Link from 'next/link';
import { DollarSign, ArrowLeftRight, Users, PackageCheck, Star, Tag } from 'lucide-react';
import { periodFromSearchParams } from '@/lib/period';
import { getOverview } from '@/lib/server/services';
import { ROUTE_PATH } from '@/lib/routes';
import { fnum } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/kpi/KpiCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';

const TX_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', RESERVED: 'Reservada', LIQUIDATED: 'Liquidada',
  TRANSFERRED: 'Transferida', DISPUTED: 'En disputa', REFUNDED: 'Reembolsada', FAILED: 'Fallida',
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-grotesk)', fontSize: 'clamp(22px, 3vw, 27px)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-.015em' }}>Visión consolidada</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)', maxWidth: '64ch' }}>
          Indicadores clave del negocio agregados de las cinco webapps — período: <strong>{period.label}</strong>.
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <KpiCard label="Ingresos" value={formatMoney(k.ingresos ?? null)} hint="Pagos liquidados" color="var(--ok)" icon={<DollarSign size={15} />} />
        <KpiCard label="Transacciones" value={fnum(k.transacciones)} hint="Volumen total" icon={<ArrowLeftRight size={15} />} />
        <KpiCard label="Usuarios activos" value={fnum(k.usuariosActivos)} hint="Clientes + drivers" icon={<Users size={15} />} />
        <KpiCard label="Pedidos completados" value={fnum(k.pedidosCompletados)} hint="Trabajos + viajes" icon={<PackageCheck size={15} />} />
        <KpiCard label="Calificación prom." value={k.calificacionPromedio != null ? `${k.calificacionPromedio.toFixed(2)} ★` : '—'} hint="Reviews del mes" color="var(--warn)" icon={<Star size={15} />} />
        <KpiCard label="Promociones activas" value={fnum(k.promocionesActivas)} hint="Vigentes" color="var(--violet)" icon={<Tag size={15} />} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <LineChartCard title="Ingresos por día" data={revenueSeries} format="money" color="var(--ok)" />
        </div>
        <BarChartCard title="Transacciones por estado" data={txBars} color="var(--mag)" />
        <DonutChartCard title="Distribución de calificaciones" data={ratingDonut} />
      </div>

      {/* Service cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        {cards.map((c) => (
          <Link key={c.key} href={ROUTE_PATH[c.route]} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.dot }} />
              <span style={{ fontFamily: 'var(--font-grotesk)', fontWeight: 600, fontSize: 15.5 }}>{c.name}</span>
              <span className="badge" style={{ marginLeft: 'auto', background: c.ok ? 'var(--ok-soft)' : 'var(--danger-soft)', color: c.ok ? 'var(--ok)' : 'var(--danger)' }}>
                {c.ok ? 'Operativa' : 'Sin datos'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {c.stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-grotesk)', fontSize: 20, fontWeight: 700 }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: c.dot }}>Ver detalle →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

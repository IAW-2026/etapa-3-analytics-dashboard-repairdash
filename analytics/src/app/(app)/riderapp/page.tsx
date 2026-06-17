import { Users, MapPin, CheckCircle2, DollarSign, Star } from 'lucide-react';
import { getRiderApp } from '@/lib/server/services';
import { fnum } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/kpi/KpiCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PageTitle } from '@/components/PageTitle';

export default async function RiderAppPage() {
  const data = await getRiderApp();

  const noConcluidos = data.viajes != null && data.viajesConcluidos != null
    ? Math.max(0, data.viajes - data.viajesConcluidos) : null;

  const viajesBars = [
    { name: 'Concluidos', value: data.viajesConcluidos ?? 0 },
    { name: 'Otros', value: noConcluidos ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="RiderApp" subtitle="Clientes, viajes e ingresos (totales actuales, sin filtro temporal)." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Clientes" value={fnum(data.clientes)} icon={<Users size={15} />} />
        <KpiCard label="Viajes" value={fnum(data.viajes)} icon={<MapPin size={15} />} />
        <KpiCard label="Viajes concluidos" value={fnum(data.viajesConcluidos)} color="var(--ok)" icon={<CheckCircle2 size={15} />} />
        <KpiCard label="Ingresos (pagos)" value={formatMoney(data.ingresos ?? null)} color="var(--ok)" icon={<DollarSign size={15} />} />
        <KpiCard label="Calificación prom." value={data.calificacionPromedio != null ? `${data.calificacionPromedio.toFixed(2)} ★` : '—'} color="var(--warn)" icon={<Star size={15} />} />
      </div>

      <BarChartCard title="Viajes por estado" data={viajesBars} multicolor />
    </div>
  );
}

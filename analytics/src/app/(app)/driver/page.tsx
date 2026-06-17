import { Users, Wifi, Hammer, Layers } from 'lucide-react';
import { getDriver } from '@/lib/server/services';
import { fnum } from '@/lib/utils';
import { KpiCard } from '@/components/kpi/KpiCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PageTitle } from '@/components/PageTitle';

export default async function DriverPage() {
  const data = await getDriver();

  const w = data.workers;
  const offline = w && w.total != null && w.online != null && w.enTrabajo != null
    ? Math.max(0, w.total - w.online - w.enTrabajo) : null;

  const workersBars = [
    { name: 'Online', value: w?.online ?? 0 },
    { name: 'En trabajo', value: w?.enTrabajo ?? 0 },
    { name: 'Offline', value: offline ?? 0 },
  ];
  const jobsBars = [
    { name: 'Activos', value: data.jobs?.activos ?? 0 },
    { name: 'Pendientes', value: data.jobs?.pendientes ?? 0 },
    { name: 'Finalizados', value: data.jobsFinalizados ?? 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="DriverApp" subtitle="Estado operativo actual de trabajadores y trabajos (snapshot, sin filtro temporal)." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Trabajadores" value={fnum(w?.total)} icon={<Users size={15} />} />
        <KpiCard label="Online" value={fnum(w?.online)} color="var(--ok)" icon={<Wifi size={15} />} />
        <KpiCard label="En trabajo" value={fnum(w?.enTrabajo)} color="var(--violet)" icon={<Hammer size={15} />} />
        <KpiCard label="Trabajos finalizados" value={fnum(data.jobsFinalizados)} icon={<Layers size={15} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <BarChartCard title="Trabajadores por estado" data={workersBars} multicolor />
        <BarChartCard title="Trabajos por estado" data={jobsBars} color="var(--violet)" />
      </div>
    </div>
  );
}

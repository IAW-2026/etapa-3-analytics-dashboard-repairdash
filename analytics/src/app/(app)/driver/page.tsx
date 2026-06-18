import { AlertTriangle, CheckCircle2, PlusCircle, Wifi, XCircle } from 'lucide-react';
import { DRIVER_ANALYTICS_EMPTY_MESSAGE, driverAnalyticsRangeFromPeriod } from '@/lib/driver-analytics-period';
import { periodFromSearchParams } from '@/lib/period';
import { getDriver } from '@/lib/server/services';
import { fnum } from '@/lib/utils';
import { KpiCard } from '@/components/kpi/KpiCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { PageTitle } from '@/components/PageTitle';
import { Panel } from '@/components/Panel';

export default async function DriverPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
  const range = driverAnalyticsRangeFromPeriod(period);
  const data = await getDriver(range);

  const jobs = data.jobs;
  const workers = data.workers;
  const created = jobs?.creados ?? 0;
  const finished = jobs?.finalizados ?? data.jobsFinalizados ?? 0;
  const cancelled = jobs?.cancelados ?? 0;
  const online = workers?.online ?? 0;
  const timeseries = data.jobsTimeseries
    .filter((point) => point.created > 0 || point.finished > 0 || point.cancelled > 0)
    .map((point) => ({ date: point.date, value: point.created + point.finished + point.cancelled }));
  const serviceTypes = data.serviceTypes?.items ?? [];
  const hasServiceTypes = serviceTypes.some((item) => item.created > 0 || item.finished > 0 || item.cancelled > 0 || (item.active ?? 0) > 0);
  const hasAnyData = created > 0 || finished > 0 || cancelled > 0 || online > 0 || timeseries.length > 0 || hasServiceTypes;
  const notice = data.unavailable
    ? 'Integracion no disponible. Revisa URL, API key o estado de Driver App.'
    : data.invalidRange || !hasAnyData
      ? DRIVER_ANALYTICS_EMPTY_MESSAGE
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="DriverApp" subtitle={`Metricas operativas desde Driver App (${range.label}).`} />

      {notice ? (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderColor: data.unavailable ? 'var(--danger)' : 'var(--border)',
            color: data.unavailable ? 'var(--danger)' : 'var(--text2)',
            background: data.unavailable ? 'var(--danger-soft)' : 'var(--surface)',
          }}
        >
          <AlertTriangle size={17} />
          <span style={{ fontSize: 13.5, fontWeight: 650 }}>{notice}</span>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Trabajos creados" value={fnum(created)} icon={<PlusCircle size={15} />} />
        <KpiCard label="Finalizados" value={fnum(finished)} color="var(--ok)" icon={<CheckCircle2 size={15} />} />
        <KpiCard label="Cancelados" value={fnum(cancelled)} color="var(--danger)" icon={<XCircle size={15} />} />
        <KpiCard label="Drivers online" value={fnum(online)} color="var(--violet)" icon={<Wifi size={15} />} />
      </div>

      <LineChartCard
        title="Actividad diaria de trabajos"
        data={timeseries}
        height={260}
        color="var(--violet)"
        emptyLabel={DRIVER_ANALYTICS_EMPTY_MESSAGE}
      />

      <Panel title="Performance por tipo de servicio" empty={!hasServiceTypes} emptyLabel={DRIVER_ANALYTICS_EMPTY_MESSAGE}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
          {serviceTypes.map((item) => (
            <div key={item.name} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-grotesk)', fontSize: 16, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</strong>
                {item.averageMinutes != null ? (
                  <span className="badge" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>{fnum(Math.round(item.averageMinutes))} min</span>
                ) : null}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
                <Metric label="Creados" value={item.created} />
                <Metric label="Finalizados" value={item.finished} />
                <Metric label="Cancelados" value={item.cancelled} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: 'var(--text3)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ marginTop: 4, color: 'var(--text)', fontFamily: 'var(--font-grotesk)', fontSize: 19, fontWeight: 800 }}>{fnum(value)}</div>
    </div>
  );
}

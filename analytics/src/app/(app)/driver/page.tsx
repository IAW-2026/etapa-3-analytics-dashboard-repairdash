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
    .filter((point) => point.accepted > 0)
    .map((point) => ({ date: point.date, value: point.accepted }));
  const serviceTypes = data.serviceTypes?.items ?? [];
  const hasServiceTypes = serviceTypes.some((item) => item.created > 0 || item.finished > 0 || item.cancelled > 0 || (item.active ?? 0) > 0);
  const hasAnyData = created > 0 || finished > 0 || cancelled > 0 || online > 0 || timeseries.length > 0 || hasServiceTypes;
  const notice = data.unavailable
    ? 'Integracion no disponible. Revisa URL, API key o estado de Driver App.'
    : data.invalidRange || !hasAnyData
      ? DRIVER_ANALYTICS_EMPTY_MESSAGE
      : null;

  return (
    <div className="flex flex-col gap-[22px] max-w-[1280px] mx-auto">
      <PageTitle title="DriverApp" subtitle={`Metricas operativas desde Driver App (${range.label}).`} />

      {notice ? (
        <div
          className="border rounded-2xl p-5 flex items-center gap-2.5"
          style={{
            borderColor: data.unavailable ? 'var(--danger)' : 'var(--border)',
            color: data.unavailable ? 'var(--danger)' : 'var(--text2)',
            background: data.unavailable ? 'var(--danger-soft)' : 'var(--surface)',
          }}
        >
          <AlertTriangle size={17} />
          <span className="text-[13.5px] font-[650]">{notice}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3.5">
        <KpiCard label="Trabajos creados" value={fnum(created)} icon={<PlusCircle size={15} />} />
        <KpiCard label="Finalizados" value={fnum(finished)} color="var(--ok)" icon={<CheckCircle2 size={15} />} />
        <KpiCard label="Cancelados" value={fnum(cancelled)} color="var(--danger)" icon={<XCircle size={15} />} />
        <KpiCard label="Drivers online" value={fnum(online)} color="var(--violet)" icon={<Wifi size={15} />} />
      </div>

      <LineChartCard
        title="Trabajos aceptados por dia"
        data={timeseries}
        height={260}
        color="var(--violet)"
        emptyLabel={DRIVER_ANALYTICS_EMPTY_MESSAGE}
      />

      <Panel title="Performance por tipo de servicio" empty={!hasServiceTypes} emptyLabel={DRIVER_ANALYTICS_EMPTY_MESSAGE}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
          {serviceTypes.map((item) => (
            <div key={item.name} className="border border-border rounded-xl p-3.5 bg-surface2 flex flex-col gap-3 min-w-0">
              <div className="flex justify-between gap-2.5 items-start">
                <strong className="text-text font-grotesk text-base min-w-0 overflow-hidden text-ellipsis">{item.name}</strong>
                {item.averageMinutes != null ? (
                  <span className="inline-flex items-center text-[11.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap bg-violet-soft text-violet">{fnum(Math.round(item.averageMinutes))} min</span>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-[9px]">
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
    <div className="min-w-0">
      <div className="text-text3 text-[11px] font-bold uppercase tracking-[.02em] whitespace-nowrap">{label}</div>
      <div className="mt-1 text-text font-grotesk text-[19px] font-extrabold">{fnum(value)}</div>
    </div>
  );
}

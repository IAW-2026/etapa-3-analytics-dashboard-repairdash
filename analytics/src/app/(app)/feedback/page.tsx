import { MessageSquare, Flag, UserX, Star } from 'lucide-react';
import { periodFromSearchParams } from '@/lib/period';
import { getFeedback } from '@/lib/server/services';
import { fnum, fpct } from '@/lib/utils';
import { KpiCard } from '@/components/kpi/KpiCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PageTitle } from '@/components/PageTitle';

const ESTADO_LABELS: Record<string, string> = { CREADO: 'Creado', PRUEBAS_AGREGADAS: 'En revisión', RESUELTO: 'Resuelto' };
const DECISION_LABELS: Record<string, string> = { AFavor: 'A favor', EnContra: 'En contra', SinDecision: 'Sin decisión' };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
  const data = await getFeedback(period.month);

  const ratingDonut = data.ratingsDistribution.map((d) => ({ name: `${d.estrellas}★`, value: d.cantidad }));
  const estadoBars = Object.entries(data.reportsPorEstado || {}).map(([k, v]) => ({ name: ESTADO_LABELS[k] || k, value: v }));
  const decisionDonut = Object.entries(data.reportsPorDecision || {}).map(([k, v]) => ({ name: DECISION_LABELS[k] || k, value: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="Feedback" subtitle={`Reviews y reportes del mes (${period.month}).`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Reviews del mes" value={fnum(data.reviewsDelMes)} icon={<MessageSquare size={15} />} />
        <KpiCard label="Reportes del mes" value={fnum(data.reportesDelMes)} color="var(--warn)" icon={<Flag size={15} />} />
        <KpiCard label="Fallo c/ cliente" value={fnum(data.reportesContraCliente)} color="var(--danger)" icon={<UserX size={15} />} />
        <KpiCard label="Fallo c/ trabajador" value={fnum(data.reportesContraTrabajador)} color="var(--danger)" icon={<UserX size={15} />} />
        <KpiCard label="Calificación prom." value={data.calificacionPromedio != null ? `${data.calificacionPromedio.toFixed(2)} ★` : '—'} color="var(--warn)" icon={<Star size={15} />} />
        <KpiCard label="Tasa de reportes" value={fpct(data.tasaReportes, true)} hint="reportes / trabajos" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <DonutChartCard title="Distribución de calificaciones" data={ratingDonut} />
        <BarChartCard title="Reportes por estado" data={estadoBars} multicolor />
        <DonutChartCard title="Reportes por decisión" data={decisionDonut} />
      </div>
    </div>
  );
}

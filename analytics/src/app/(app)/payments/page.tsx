import { DollarSign, ArrowLeftRight, Ticket, Percent, HandCoins, Banknote } from 'lucide-react';
import { periodFromSearchParams, periodDays } from '@/lib/period';
import { getPayments } from '@/lib/server/services';
import { fnum } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { KpiCard } from '@/components/kpi/KpiCard';
import { LineChartCard } from '@/components/charts/LineChartCard';
import { BarChartCard } from '@/components/charts/BarChartCard';
import { PageTitle } from '@/components/PageTitle';

const TX_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', RESERVED: 'Reservada', LIQUIDATED: 'Liquidada',
  TRANSFERRED: 'Transferida', DISPUTED: 'En disputa', REFUNDED: 'Reembolsada', FAILED: 'Fallida',
};
const WD_LABELS: Record<string, string> = { REQUESTED: 'Solicitado', APPROVED: 'Aprobado', REJECTED: 'Rechazado' };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const period = periodFromSearchParams(await searchParams);
  const data = await getPayments(period.month, periodDays(period), { from: period.from, to: period.to });
  const s = data.settlements;

  const revenueSeries = data.revenueSeries.map((r) => ({ date: r.date, value: r.total }));
  const txBars = Object.entries(data.transactionsByStatus || {}).map(([k, v]) => ({ name: TX_LABELS[k] || k, value: v }));
  const wdBars = Object.entries(data.withdrawalsByStatus || {}).map(([k, v]) => ({ name: WD_LABELS[k] || k, value: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1280, margin: '0 auto' }}>
      <PageTitle title="Payments" subtitle={`KPIs financieros del mes (${period.month}).`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="GMV" value={formatMoney(data.gmv ?? null)} hint="Monto bruto cobrado" color="var(--ok)" icon={<DollarSign size={15} />} />
        <KpiCard label="Pagos cobrados" value={fnum(data.paidTransactions)} icon={<ArrowLeftRight size={15} />} />
        <KpiCard label="Ticket promedio" value={formatMoney(data.averageTicket ?? null)} icon={<Ticket size={15} />} />
        <KpiCard label="Comisión plataforma" value={formatMoney(data.platformCommission ?? null)} color="var(--violet)" icon={<Percent size={15} />} />
        <KpiCard label="Neto a trabajadores" value={formatMoney(data.netToWorkers ?? null)} icon={<HandCoins size={15} />} />
      </div>

      <LineChartCard title="GMV por día" data={revenueSeries} format="money" color="var(--ok)" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: 16 }}>
        <BarChartCard title="Transacciones por estado" meta="payments /summary" data={txBars} color="var(--violet)" orientation="horizontal" />
        <BarChartCard title="Retiros por estado" data={wdBars} color="var(--violet)" />
      </div>

      {/* Liquidaciones y retiros */}
      <PageTitle title="Liquidaciones y retiros" subtitle="Resumen del mes." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <KpiCard label="Retiros aprobados" value={fnum(s?.withdrawalsApproved)} icon={<Banknote size={15} />} />
        <KpiCard label="Monto aprobado" value={formatMoney(s?.withdrawalsAmountApproved ?? null)} color="var(--ok)" icon={<Banknote size={15} />} />
      </div>
    </div>
  );
}

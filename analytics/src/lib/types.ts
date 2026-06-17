// Contratos de datos que devuelven las API routes /api/an/* y que consumen las
// páginas. Todo lo que viene de upstream puede faltar (servicio caído / sin
// configurar) → casi todo es nullable y cada servicio expone `ok`.

export interface PeriodInfo {
  from: string;
  to: string;
  month: string;
}

/* ── Payments ── */
// Alimentado por las APIs de analytics de Payments (/api/analytics/*): solo
// agregados (KPIs, breakdowns y serie corta), sin filas ni conteos de usuarios.
export interface PaymentsData {
  ok: boolean;
  // summary (KPIs del mes)
  gmv: number | null;                 // Gross Merchandise Value (RESERVED+LIQUIDATED+TRANSFERRED)
  paidTransactions: number | null;
  averageTicket: number | null;
  platformCommission: number | null;
  netToWorkers: number | null;
  failedTransactions: number | null;
  refundedTransactions: number | null;
  // status-breakdown
  transactionsByStatus: Record<string, number> | null; // count por estado
  amountByStatus: Record<string, number> | null;        // monto por estado
  // settlements-summary
  settlements: {
    liquidatedTransactions: number | null;
    liquidatedGross: number | null;
    commissionCollected: number | null;
    netLiquidatedToWorkers: number | null;
    withdrawalsRequested: number | null;
    withdrawalsApproved: number | null;
    withdrawalsRejected: number | null;
    withdrawalsAmountApproved: number | null;
  } | null;
  withdrawalsByStatus: Record<string, number> | null;   // derivado de settlements
  // daily
  revenueSeries: { date: string; total: number }[];     // gmv por día (últimos N días)
}

/* ── DriverApp ── */
export interface DriverData {
  ok: boolean;
  workers: { total: number | null; online: number | null; enTrabajo: number | null } | null;
  jobs: { activos: number | null; pendientes: number | null } | null;
  jobsFinalizados: number | null; // pagination.total de jobs?estado=FINALIZADO
  serviceTypes: { total: number | null } | null;
}

/* ── RiderApp ── */
export interface RiderAppData {
  ok: boolean;
  clientes: number | null;
  viajes: number | null;
  viajesConcluidos: number | null;
  ingresos: number | null;            // suma de pagos aceptados
  calificacionPromedio: number | null; // promedio de calificacion de clientes
}

/* ── Feedback ── */
export interface FeedbackData {
  ok: boolean;
  reviewsDelMes: number | null;
  reportesDelMes: number | null;
  reportesContraCliente: number | null;
  reportesContraTrabajador: number | null;
  tasaReportes: number | null; // fracción (0.031)
  ratingsDistribution: { estrellas: number; cantidad: number }[];
  calificacionPromedio: number | null;
  reportsPorEstado: Record<string, number> | null;
  reportsPorDecision: Record<string, number> | null;
}

/* ── Promociones ── */
// Alimentado por las APIs de analytics de Promotions (/api/admin/promociones/count
// y /api/historial[/count]): counts por estado y agregados de uso del rango.
export interface PromocionesData {
  ok: boolean;
  vigentes: number | null;
  programadas: number | null;
  vencidas: number | null;
  eliminadas: number | null;
  usos: number | null;            // historial/count.totalUsos (en el rango)
  ahorroTotal: number | null;     // historial/count.ahorroTotal
  valorOriginal: number | null;   // historial/count.sumaValorOriginal
  valorPagado: number | null;     // historial/count.sumaValorPagado
  usosTruncated: boolean;
  porEstado: { estado: string; cantidad: number }[];
  topPromos: { nombre: string; usos: number }[];
}

/* ── Overview consolidado ── */
export interface OverviewData {
  period: PeriodInfo;
  kpis: {
    ingresos: number | null;
    transacciones: number | null;
    usuariosActivos: number | null;
    pedidosCompletados: number | null;
    calificacionPromedio: number | null;
    promocionesActivas: number | null;
  };
  revenueSeries: { date: string; total: number }[];
  transactionsByStatus: Record<string, number> | null;
  ratingsDistribution: { estrellas: number; cantidad: number }[];
  services: {
    riderapp: { ok: boolean; clientes: number | null; viajes: number | null };
    driver: { ok: boolean; workersOnline: number | null; jobsActivos: number | null };
    payments: { ok: boolean; transacciones: number | null; ingresos: number | null };
    feedback: { ok: boolean; reviews: number | null; reportes: number | null };
    promociones: { ok: boolean; activas: number | null; usos: number | null };
  };
}

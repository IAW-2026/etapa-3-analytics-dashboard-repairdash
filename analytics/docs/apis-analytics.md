# APIs Analytics - Payments App

Estos endpoints son internos y server-to-server. Los consume Analytics desde su backend, no desde el browser del usuario.

Analytics no recibe tablas de transacciones, retiros, drivers ni riders. Payments solo expone KPIs, breakdowns y series cortas agregadas.

## Autenticacion

Para v1 se reutiliza la misma autenticacion server-to-server del Control Plane:

```http
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

Payments debe tener configurada:

```env
CONTROL_PLANE_API_KEY="valor-secreto"
```

Variables sugeridas en Analytics:

```env
PAYMENTS_BASE_URL="http://localhost:3000"
PAYMENTS_CONTROL_PLANE_API_KEY="mismo-valor-que-CONTROL_PLANE_API_KEY-en-Payments"
```

## Como Pedir Datos

GMV significa `Gross Merchandise Value`: es el monto bruto total cobrado por Payments en el periodo, antes de restar comision de plataforma o neto del trabajador.

En esta app, GMV suma el campo `amount` de transacciones que cuentan como cobradas:

- `RESERVED`
- `LIQUIDATED`
- `TRANSFERRED`

Hay dos formatos de consulta:

- Las APIs mensuales usan `month=YYYY-MM`.
- La API de grafico reciente usa `days=N`.

Si no se manda `month`, Payments usa el mes actual en `America/Argentina/Buenos_Aires`.

Si no se manda `days`, Payments usa `7`. El minimo es `1` y el maximo es `31`.

Resumen:

| API | Parametro | Ejemplo | Uso |
| --- | --- | --- | --- |
| `/api/analytics/summary` | `month=YYYY-MM` | `/api/analytics/summary?month=2026-06` | KPIs financieros del mes |
| `/api/analytics/status-breakdown` | `month=YYYY-MM` | `/api/analytics/status-breakdown?month=2026-06` | Conteo y monto por estado |
| `/api/analytics/settlements-summary` | `month=YYYY-MM` | `/api/analytics/settlements-summary?month=2026-06` | Liquidaciones y retiros del mes |
| `/api/analytics/daily` | `days=N` | `/api/analytics/daily?days=7` | Grafico de pagos de los ultimos N dias |

## APIs Nuevas

### GET /api/analytics/summary

KPIs financieros simples del mes: GMV, pagos cobrados, ticket promedio, comision, neto a trabajadores, fallidas y reembolsadas.

```http
GET /api/analytics/summary?month=YYYY-MM
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

```json
{
  "success": true,
  "source": "payments",
  "period": {
    "month": "2026-06",
    "start": "2026-06-01",
    "endExclusive": "2026-07-01",
    "timeZone": "America/Argentina/Buenos_Aires"
  },
  "generatedAt": "2026-06-17T15:00:00.000Z",
  "kpis": {
    "gmv": "152000.00",
    "paidTransactions": 42,
    "averageTicket": "3619.05",
    "platformCommission": "15200.00",
    "netToWorkers": "136800.00",
    "failedTransactions": 5,
    "refundedTransactions": 1
  }
}
```

### GET /api/analytics/status-breakdown

Conteo y monto total por estado de transaccion.

```http
GET /api/analytics/status-breakdown?month=YYYY-MM
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

```json
{
  "success": true,
  "source": "payments",
  "statuses": [
    { "status": "PENDING", "count": 3, "amount": "9000.00" },
    { "status": "RESERVED", "count": 12, "amount": "42000.00" },
    { "status": "LIQUIDATED", "count": 30, "amount": "110000.00" },
    { "status": "TRANSFERRED", "count": 4, "amount": "15000.00" },
    { "status": "DISPUTED", "count": 0, "amount": "0.00" },
    { "status": "REFUNDED", "count": 1, "amount": "3500.00" },
    { "status": "FAILED", "count": 5, "amount": "18000.00" }
  ]
}
```

### GET /api/analytics/daily

Buckets diarios para graficos cortos. No devuelve transacciones.

```http
GET /api/analytics/daily?days=7
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

```json
{
  "success": true,
  "source": "payments",
  "days": 7,
  "period": {
    "start": "2026-06-11",
    "endExclusive": "2026-06-18",
    "timeZone": "America/Argentina/Buenos_Aires"
  },
  "generatedAt": "2026-06-17T15:00:00.000Z",
  "buckets": [
    { "date": "2026-06-11", "gmv": "12000.00", "transactions": 4 },
    { "date": "2026-06-12", "gmv": "18500.00", "transactions": 6 },
    { "date": "2026-06-13", "gmv": "0.00", "transactions": 0 }
  ]
}
```

### GET /api/analytics/settlements-summary

Resumen de liquidaciones y retiros. No permite aprobar retiros ni liquidar pagos.

```http
GET /api/analytics/settlements-summary?month=YYYY-MM
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

```json
{
  "success": true,
  "source": "payments",
  "settlements": {
    "liquidatedTransactions": 30,
    "liquidatedGross": "110000.00",
    "commissionCollected": "11000.00",
    "netLiquidatedToWorkers": "99000.00",
    "withdrawalsRequested": 8,
    "withdrawalsApproved": 6,
    "withdrawalsRejected": 1,
    "withdrawalsAmountApproved": "45000.00"
  },
  "withdrawalStatuses": ["REQUESTED", "APPROVED", "REJECTED"]
}
```

## Reglas

- `month` usa formato `YYYY-MM`; si falta o es invalido, se usa el mes actual en `America/Argentina/Buenos_Aires`.
- `days` acepta de `1` a `31`; si falta o es invalido, se usa `7`.
- Todos los montos viajan como string decimal.
- No se devuelven tablas ni filas individuales.

## Reutilizado de Control Plane

Se reutiliza `x-control-plane-api-key`, `CONTROL_PLANE_API_KEY`, `validateControlPlaneApiKey` y el formato de errores de autenticacion.

No se reutilizan los endpoints `/api/control-plane/transactions`, `/withdrawals`, `/drivers` ni `/riders` porque devuelven listados operativos, no KPIs agregados.

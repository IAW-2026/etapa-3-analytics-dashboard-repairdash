# Analytics Dashboard

Dashboard de analitica para RepairDash. Consolida metricas de RiderApp, DriverApp, Payments, Feedback y Promociones para visualizar el estado general del sistema desde un panel unico. No tiene base de datos propia: consulta las APIs de cada webapp, normaliza sus respuestas y muestra KPIs y graficos.

## Deploy

https://etapa-3-analytics-dashboard-repaird.vercel.app

## Acceso

- **Super-admin:** ingresar con `controlplane+clerk_test@iaw.com` / `Iawuser#`.
- **Usuario final:** no aplica. Esta app es solo para administradores globales; los usuarios sin rol `super-admin` son redirigidos a `/unauthorized`.

## Vistas

- `/`: vision consolidada con ingresos, transacciones, usuarios activos, pedidos completados, calificacion promedio y promociones activas.
- `/riderapp`: clientes, viajes, viajes concluidos, ingresos y calificacion promedio.
- `/driver`: trabajos creados, finalizados, cancelados, drivers en linea y performance por tipo de servicio.
- `/payments`: GMV, pagos cobrados, ticket promedio, comision y retiros. GMV es el volumen bruto de dinero procesado antes de descontar comisiones o liquidaciones.
- `/feedback`: reviews, reportes, calificaciones y decisiones.
- `/promociones`: promociones vigentes, programadas, vencidas, usos y ahorro total.

## Stack

Next.js 16, React 19, Tailwind CSS 4, Recharts, Clerk y lucide-react.

## Integracion

La integracion vive del lado servidor en `src/lib/server`. Las paginas llaman servicios de dominio, los servicios usan clientes externos, y los mappers traducen cada respuesta al modelo interno del dashboard. La capa HTTP centralizada aplica timeout, reintentos, circuit breaker, validacion de JSON y logging para que la caida de una webapp degrade solo su seccion.

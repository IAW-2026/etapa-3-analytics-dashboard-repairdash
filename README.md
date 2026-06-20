# analytics-dashboard

Aplicación **Analytics Dashboard** del [Proyecto IAW 2026](https://etapa-3-analytics-dashboard-repaird.vercel.app) — comisión `RepairDash`.

## ¿Qué es?

El sistema RepairDash está formado por **cinco webapps independientes** (RiderApp, DriverApp, Payments, Feedback y Promociones), cada una con su propia base de datos y su propia API. Por separado, ninguna da una foto completa del negocio: una sabe de viajes, otra de cobros, otra de reseñas, etc.

Este **Analytics Dashboard** (Etapa 3 del proyecto) es la herramienta que resuelve eso: un panel de control de solo lectura que **consulta en tiempo real las APIs de las cinco webapps, normaliza sus respuestas y las presenta de forma unificada** en KPIs y gráficos. No tiene base de datos propia ni guarda información: cada vez que se abre una página, pide los datos a los servicios, los combina y los muestra.

Está pensado como herramienta interna de dirección, por lo que el acceso está restringido a un único rol administrativo.

### Stack

| Tecnología                  | Rol                                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16** (App Router) | Framework. Las páginas son **React Server Components**: se renderizan en el servidor, que es quien llama a las APIs externas (las claves nunca llegan al navegador). |
| **React 19**                | UI.                                                                                                                                                                  |
| **Tailwind CSS 4**          | Estilos. Incluye tema claro/oscuro.                                                                                                                                  |
| **Recharts**                | Gráficos (líneas, barras y donas).                                                                                                                                   |
| **Clerk**                   | Autenticación y control de roles.                                                                                                                                    |
| **lucide-react**            | Iconografía.                                                                                                                                                         |

---

## Funcionalidades

El dashboard tiene seis vistas: una consolidada y una por cada webapp. Todas comparten un **selector de período global** en la cabecera.

### Visión consolidada (`/`)

Es la página principal. Toma una métrica de cada una de las cinco webapps y arma los **KPIs globales del negocio**:

- **Ingresos** — pagos liquidados (viene de Payments).
- **Transacciones** — volumen total de transacciones (Payments).
- **Usuarios activos** — clientes de RiderApp + trabajadores de DriverApp.
- **Pedidos completados** — viajes concluidos (RiderApp) + trabajos finalizados (DriverApp).
- **Calificación promedio** — promedio de reseñas (Feedback, con RiderApp como respaldo).
- **Promociones activas** — promociones vigentes (Promociones).

Además muestra el **gráfico de ingresos por día**, el **desglose de transacciones por estado**, la **distribución de calificaciones**, y una **tarjeta por cada servicio** con un indicador de estado (en línea / caído) y dos cifras clave, que enlaza a la vista de detalle correspondiente. Las cinco APIs se consultan **en paralelo**, así que si una falla, las demás igual se muestran.

### RiderApp (`/riderapp`)

Totales actuales de la app de pasajeros: **clientes**, **viajes**, **viajes concluidos**, **ingresos** (suma de pagos aceptados) y **calificación promedio** de los clientes, más un desglose de viajes concluidos vs. el resto. Es una foto del estado actual, sin filtro temporal.

### DriverApp (`/driver`)

Métricas operativas de la app de conductores **para el período seleccionado**: trabajos **creados**, **finalizados** y **cancelados**, **drivers en línea**, un gráfico de **actividad diaria** de trabajos y un panel de **performance por tipo de servicio** (con cantidades y tiempo promedio en minutos). Si la integración no responde o el rango elegido no tiene datos, la página muestra un aviso claro en lugar de números vacíos.

### Payments (`/payments`)

KPIs financieros del mes:

- **GMV** (Gross Merchandise Value) — monto bruto cobrado.
- **Pagos cobrados**, **ticket promedio**, **comisión de la plataforma** y **neto a trabajadores**.

Incluye el **GMV por día**, los desgloses de **transacciones por estado** y **retiros por estado**, y un resumen de **liquidaciones y retiros aprobados** (cantidad y monto).

### Feedback (`/feedback`)

Reseñas y reportes del mes: cantidad de **reviews**, **reportes**, reportes con fallo **contra el cliente** y **contra el trabajador**, **calificación promedio** y **tasa de reportes** (reportes sobre trabajos). Lo acompaña con la **distribución de calificaciones**, los **reportes por estado** (creado / en revisión / resuelto) y los **reportes por decisión** (a favor / en contra / sin decisión).

### Promociones (`/promociones`)

Estado y uso de las promociones en el período: **vigentes**, **programadas**, **vencidas**, **usos** y **ahorro total**. Suma un **ranking de usos por promoción** y un bloque de **impacto económico** que compara el valor original contra el valor efectivamente pagado, el ahorro generado y la tasa de ahorro. Como el historial puede ser grande, los usos se recorren paginando la API y, si el volumen es muy alto, la cifra se marca como parcial.

### Funciones transversales

- **Selector de período global** — mes actual, últimos 30 días o **rango personalizado**. La selección se guarda en la URL; como las páginas son Server Components, al cambiar el período se vuelven a consultar las APIs con el nuevo rango (y se puede compartir o recargar el link conservando el filtro).
- **Autenticación y autorización** — vía Clerk. Solo los usuarios con rol `super-admin` entran al dashboard; el resto va a una pantalla de "no autorizado". El registro de nuevos usuarios está deshabilitado.
- **Tema claro/oscuro** — alternable y persistido en el navegador.

---

## Cómo se integraron las webapps

La integración es el corazón del proyecto. Toda la lógica vive del **lado del servidor** (`src/lib/server`) y está organizada en capas, de modo que cada responsabilidad esté aislada. El flujo de una página es siempre el mismo:

```
Página (Server Component)
  └─ Servicio de dominio        → decide qué pedir y arma la métrica final
       └─ Cliente externo       → sabe los endpoints y la paginación del servicio
            └─ Capa HTTP         → hace el fetch con timeout, reintentos y circuit breaker
       └─ Mapper                → traduce la respuesta cruda al modelo del dashboard
```

### 1. Clientes externos — qué se le pide a cada webapp

Cada servicio tiene un cliente (`external/<servicio>/client.ts`) que conoce sus endpoints reales y los llama **en paralelo**. En concreto:

| Webapp          | Endpoints que consume el dashboard                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **RiderApp**    | `/api/super-admin/clientes/count`, `/api/super-admin/viajes/count`, y los listados de clientes y viajes.                                               |
| **DriverApp**   | `/api/analytics/summary`, `/api/analytics/jobs-timeseries` (bucket diario) y `/api/analytics/service-types`, filtrando por rango de fechas.            |
| **Payments**    | `/api/analytics/summary`, `/api/analytics/status-breakdown`, `/api/analytics/settlements-summary` (por mes) y `/api/analytics/daily` (últimos N días). |
| **Feedback**    | `/api/analytics/feedback/summary`, `.../ratings/distribution` y `.../reports/breakdown`, por mes.                                                      |
| **Promociones** | `/api/admin/promociones/count` (uno por estado), `/api/historial/count` y `/api/historial` **paginado** para sumar los usos del rango.                 |

### 2. Mappers — normalizar respuestas distintas

Cada webapp devuelve su JSON con su propia forma. Los mappers (`external/<servicio>/mapper.ts`) **traducen esa respuesta cruda al modelo interno** del dashboard (definido en `src/lib/types.ts`). Son tolerantes a fallos: si un campo falta o el servicio está caído, la métrica queda en `null` (y la UI muestra `—`) en lugar de romper la página. Cada servicio expone además un flag `ok` para saber si respondió.

### 3. Servicios de dominio — calcular las métricas

Los servicios de dominio (`domain/<servicio>.service.ts`) orquestan cliente + mapper y producen el dato final que consume la página. El caso más interesante es `overview.service.ts`, que consulta los **cinco servicios a la vez** (`Promise.all`) y **agrega** los KPIs globales (por ejemplo, suma clientes de RiderApp con trabajadores de DriverApp para "usuarios activos"), tolerando que alguno no haya respondido.

### 4. Capa HTTP observable — resiliencia

Ninguna llamada externa usa `fetch` directo: todas pasan por un `fetchJson` común (`http/`) que aporta robustez ante servicios lentos o caídos:

- **Timeout** por request (5 s) para no quedar colgado.
- **Reintentos con backoff** ante errores transitorios (timeouts, 429, 5xx).
- **Circuit breaker** por endpoint: tras 3 fallos seguidos "abre" el circuito y deja de golpear ese servicio durante 30 s, dándole tiempo a recuperarse (luego prueba en modo "half-open").
- **Métricas y logging** de cada llamada (latencia, éxitos, fallos y su motivo).
- Validación de que la respuesta sea **JSON válido** antes de procesarla.

El resultado: la caída de un servicio degrada solo su parte del dashboard; el resto sigue funcionando.

### 5. Configuración y caché

- **Credenciales** — la URL base y la API key de cada servicio se leen de **variables de entorno solo del servidor** (sin prefijo `NEXT_PUBLIC_`), así nunca se incluyen en el bundle del cliente. Cada webapp usa su propio header de autenticación (`x-api-key`, `x-control-plane-api-key`, `x-analytics-api-key`, etc.).
- **Caché** — como los datos de análisis toleran un pequeño retraso, las respuestas se cachean unos segundos usando el caché de Next.js con **TTL y tags de revalidación**, reduciendo la carga sobre las webapps de origen.

---

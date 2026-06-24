# FeedbackApp — APIs Etapa 3

Documentación de los endpoints nuevos a implementar para que el **Control Plane** y el **Analytics Dashboard** puedan consultar la app de Feedback.

Estos endpoints son **independientes** de las APIs internas (`x-api-key`) y públicas (Clerk) que ya existen.

---

## Contexto

| | Descripción |
|---|---|
| **Control Plane** | Panel operativo global. Consulta estado actual, gestiona reportes y obtiene contexto de usuarios. Protegido con `x-control-plane-api-key`. |
| **Analytics Dashboard** | Panel de métricas. Solo lectura. Consulta agregaciones históricas del mes. Protegido con `x-analytics-api-key`. |

Feedback es **fuente de verdad** de reviews y reportes. Ninguna de las dos apps globales tiene base de datos propia.

---

## 1. Endpoints para Control Plane

**Header requerido en todos:**
```
x-control-plane-api-key: <CONTROL_PLANE_API_KEY>
```

Las mutaciones (PATCH) deben recibir además en el body:
```json
{
  "actorClerkId": "string",
  "actorEmail": "string",
  "reason": "string"
}
```

---

### GET /api/control-plane/summary

Contadores operativos actuales. **No incluye métricas históricas ni agregaciones analíticas.**

**Respuesta 200:**
```json
{
  "reportesAbiertos": 4,
  "reportesEnRevision": 2,
  "reportesResueltos": 18,
  "reviewsPendientes": 7
}
```

- `reportesAbiertos`: reportes con `resolucion = SinResolver` y `estado = CREADO`
- `reportesEnRevision`: reportes con `estado = PRUEBAS_AGREGADAS`
- `reportesResueltos`: reportes con `resolucion = Resuelto`
- `reviewsPendientes`: reviews con `estaCompleta = false`

---

### GET /api/control-plane/reports

Lista paginada de reportes con su estado operativo.

**Query params:**
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | 1 | Página |
| `limit` | number | 20 | Resultados por página |
| `estado` | string | — | Filtro: `CREADO`, `PRUEBAS_AGREGADAS`, `RESUELTO` |
| `resolucion` | string | — | Filtro: `SinResolver`, `Resuelto` |

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "idTrabajo": "string",
      "idReportante": "string",
      "idReportado": "string",
      "descripcion": "string",
      "estado": "CREADO | PRUEBAS_AGREGADAS | RESUELTO",
      "resolucion": "SinResolver | Resuelto",
      "decision": "AFavor | EnContra | null",
      "creadoEn": "ISO 8601"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/control-plane/reports/[id]

Detalle completo de un reporte: trabajo asociado, usuarios involucrados y pruebas.

**Respuesta 200:**
```json
{
  "id": "uuid",
  "idTrabajo": "string",
  "idReportante": "string",
  "idReportado": "string",
  "descripcion": "string",
  "estado": "CREADO | PRUEBAS_AGREGADAS | RESUELTO",
  "resolucion": "SinResolver | Resuelto",
  "decision": "AFavor | EnContra | null",
  "creadoEn": "ISO 8601",
  "trabajo": {
    "id": "string",
    "idRider": "string",
    "idDriver": "string",
    "tipoDeTrabajo": "string",
    "fechaInicio": "ISO 8601",
    "fechaFin": "ISO 8601 | null"
  },
  "reportante": {
    "id": "string",
    "nombre": "string",
    "apellido": "string",
    "rol": "rider | driver"
  },
  "reportado": {
    "id": "string",
    "nombre": "string",
    "apellido": "string",
    "rol": "rider | driver"
  },
  "pruebas": [
    {
      "id": "uuid",
      "tipo": "imagen | video",
      "url": "string"
    }
  ]
}
```

**Errores:**
- `404` si el reporte no existe

---

### PATCH /api/control-plane/reports/[id]/resolve

Resuelve un reporte. Equivale a la acción de `feedbackAdmin` pero invocada desde el Control Plane.

**Body:**
```json
{
  "decision": "AFavor | EnContra",
  "actorClerkId": "string",
  "actorEmail": "string",
  "reason": "string"
}
```

**Validaciones:**
- El reporte debe existir
- El reporte debe estar en estado `PRUEBAS_AGREGADAS`
- `decision` debe ser `AFavor` o `EnContra`

**Respuesta 200:**
```json
{
  "id": "uuid",
  "estado": "RESUELTO",
  "resolucion": "Resuelto",
  "decision": "AFavor | EnContra"
}
```

**Notas:**
- Resolver un reporte desde el Control Plane **no modifica Payments**. No frena, destraba ni reembolsa pagos.

---

### GET /api/control-plane/users/[userId]/context

Contexto de reportes de un usuario para la pantalla de Usuarios del Control Plane.

**Respuesta 200:**
```json
{
  "idUsuario": "string",
  "reportesComoReportado": {
    "abiertos": 1,
    "enRevision": 0,
    "conFalloEnContra": 2
  },
  "reportesComoReportante": {
    "total": 3
  },
  "reviewsRecibidas": {
    "total": 12,
    "valoracionPromedio": 4.2
  }
}
```

**Errores:**
- `404` si el usuario no existe en la base de datos de Feedback

---

## 2. Endpoints para Analytics Dashboard

**Header requerido en todos:**
```
x-analytics-api-key: <ANALYTICS_API_KEY>
```

**Reglas comunes:**
- Query params:
  - `month=YYYY-MM` (opcional). Mes granular. Si se omite, se usa el mes actual en `America/Argentina/Buenos_Aires`.
  - `from=YYYY-MM-DD` y `to=YYYY-MM-DD` (opcionales). Rango de fechas exacto. Cuando están presentes, anulan el filtro por `month` y filtran por fecha de creación dentro del rango.
- Todos los endpoints son **solo lectura**. No aceptan mutaciones.
- La respuesta siempre incluye `source`, `period` (string | { from, to }) y `generatedAt`.
- Montos como string decimal (no aplica a Feedback, pero se mantiene la convención de fechas en ISO 8601).

---

### GET /api/analytics/feedback/summary

KPIs del mes: reviews y reportes.

**Query params:**
- `month=YYYY-MM` (opcional)
- `from=YYYY-MM-DD` y `to=YYYY-MM-DD` (opcionales, anulan `month`)

**Respuesta 200:**
```json
{
  "source": "feedback",
  "period": "2025-06",
  "generatedAt": "ISO 8601",
  "reviewsDelMes": 38,
  "reportesDelMes": 5,
  "reportesConFalloContraCliente": 2,
  "reportesConFalloContraTrabajador": 1,
  "tasaReportessobreTrabajos": "0.031"
}
```

- `reviewsDelMes`: reviews con `estaCompleta = true` creadas en el período
- `reportesDelMes`: reportes creados en el período
- `reportesConFalloContraCliente`: reportes resueltos `EnContra` donde el reportado es un `rider`
- `reportesConFalloContraTrabajador`: reportes resueltos `EnContra` donde el reportado es un `driver`
- `tasaReportessobreTrabajos`: reportes del mes / trabajos del mes (calculado en Analytics cruzando con Driver; Feedback devuelve el numerador)

> **Nota de implementación:** `tasaReportessobreTrabajos` lo calcula Analytics cruzando este dato con el summary de Driver. Feedback solo devuelve `reportesDelMes` como insumo.

---

### GET /api/analytics/feedback/ratings/distribution

Distribución de valoraciones del mes por cantidad de estrellas.

**Query params:**
- `month=YYYY-MM` (opcional)
- `from=YYYY-MM-DD` y `to=YYYY-MM-DD` (opcionales, anulan `month`)

**Respuesta 200:**
```json
{
  "source": "feedback",
  "period": "2025-06",
  "generatedAt": "ISO 8601",
  "distribucion": [
    { "estrellas": 1, "cantidad": 2 },
    { "estrellas": 2, "cantidad": 3 },
    { "estrellas": 3, "cantidad": 7 },
    { "estrellas": 4, "cantidad": 14 },
    { "estrellas": 5, "cantidad": 12 }
  ]
}
```

Solo incluye reviews con `estaCompleta = true` y `valoracion != null` creadas en el período.

> **No se devuelve rating promedio global.** Ese cálculo queda excluido por decisión de diseño.

---

### GET /api/analytics/feedback/reports/breakdown

Distribución de reportes del mes por estado y decisión.

**Query params:**
- `month=YYYY-MM` (opcional)
- `from=YYYY-MM-DD` y `to=YYYY-MM-DD` (opcionales, anulan `month`)

**Respuesta 200:**
```json
{
  "source": "feedback",
  "period": "2025-06",
  "generatedAt": "ISO 8601",
  "porEstado": {
    "CREADO": 1,
    "PRUEBAS_AGREGADAS": 1,
    "RESUELTO": 3
  },
  "porDecision": {
    "AFavor": 2,
    "EnContra": 1,
    "SinDecision": 2
  },
  "total": 5
}
```

- `SinDecision`: reportes aún sin resolver (`decision = null`)

---

## 3. Variables de entorno nuevas

Agregar al `.env.local` y a Vercel:

```env
# Control Plane
CONTROL_PLANE_API_KEY=

# Analytics Dashboard
ANALYTICS_API_KEY=
```

Agregar al `.env.example`:
```env
CONTROL_PLANE_API_KEY=
ANALYTICS_API_KEY=
```

---

## 4. Resumen de endpoints a implementar

| Método | Ruta | Consumidor | Auth |
|---|---|---|---|
| GET | `/api/control-plane/summary` | Control Plane | `x-control-plane-api-key` |
| GET | `/api/control-plane/reports` | Control Plane | `x-control-plane-api-key` |
| GET | `/api/control-plane/reports/[id]` | Control Plane | `x-control-plane-api-key` |
| PATCH | `/api/control-plane/reports/[id]/resolve` | Control Plane | `x-control-plane-api-key` |
| GET | `/api/control-plane/users/[userId]/context` | Control Plane | `x-control-plane-api-key` |
| GET | `/api/analytics/feedback/summary` | Analytics | `x-analytics-api-key` |
| GET | `/api/analytics/feedback/ratings/distribution` | Analytics | `x-analytics-api-key` |
| GET | `/api/analytics/feedback/reports/breakdown` | Analytics | `x-analytics-api-key` |

---

## 5. Lo que ya existe y NO hay que reimplementar

Estos endpoints del README actual **ya cubren** funcionalidad que el Control Plane o Analytics podrían necesitar de forma indirecta. Se listan para evitar duplicación:

| Ruta existente | Quién la usa | Nota |
|---|---|---|
| `GET /api/reports/public/[id]` | Driver/Rider (x-api-key) | Estadísticas de usuario por reporte |
| `GET /api/reviews/user/[id]` | Driver/Rider (x-api-key) | Valoración pública de usuario |
| `PATCH /api/reports/[id]/resolve` | feedbackAdmin (Clerk) | El CP tiene su propio endpoint de resolve |

El endpoint `PATCH /api/control-plane/reports/[id]/resolve` es un endpoint **nuevo y separado** del `PATCH /api/reports/[id]/resolve` existente, aunque hagan lo mismo internamente. La separación es necesaria para mantener el mecanismo de autenticación diferenciado (`x-control-plane-api-key` vs. Clerk).

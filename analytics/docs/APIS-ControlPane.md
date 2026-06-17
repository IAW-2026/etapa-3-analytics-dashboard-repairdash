# APIs DriverApp para Control Plane

Este documento describe las APIs internas que DriverApp expone para la futura app Control Plane.

Control Plane no accede a la base de DriverApp. Toda operacion debe pasar por estos endpoints.

## Seguridad

Todas las rutas usan el header:

```txt
x-control-plane-api-key: CONTROL_PLANE_API_KEY
```

La variable debe existir en DriverApp:

```env
CONTROL_PLANE_API_KEY=""
```

Si falta o no coincide, DriverApp responde:

```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

## Admin Actual De DriverApp

La pantalla admin local de DriverApp ya esta protegida.

- La pagina `/admin/servicios` ejecuta `requireAdmin()`.
- Las server actions de crear, editar y eliminar tipos de servicio tambien ejecutan `requireAdmin()`.
- `requireAdmin()` valida el rol de Clerk `publicMetadata.role === "driver-admin"`.

Estas APIs de Control Plane son una superficie separada para el super admin global. No dependen de la sesion Clerk del admin local, sino de `x-control-plane-api-key`.

## Paginacion

Los endpoints que devuelven tablas aceptan:

| Query param | Default | Max | Descripcion |
|---|---:|---:|---|
| `page` | `1` | - | Pagina actual, base 1. |
| `limit` | `20` | `100` | Cantidad de elementos por pagina. |

Respuesta paginada:

```json
{
  "status": "success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Mutaciones

Toda mutacion debe enviar:

```json
{
  "actorClerkId": "user_control_admin",
  "actorEmail": "admin@repairdash.com",
  "reason": "Motivo operativo de la accion"
}
```

DriverApp valida estos campos para trazabilidad de contrato. En esta version no se agrega tabla de auditoria porque no se modifica el schema.

## GET `/api/control-plane/summary`

Devuelve estado operativo actual de DriverApp.

No devuelve metricas historicas ni analiticas.

```bat
curl.exe -i "http://localhost:3000/api/control-plane/summary" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

Respuesta:

```json
{
  "status": "success",
  "data": {
    "app": "driver",
    "checkedAt": "2026-06-09T12:00:00.000Z",
    "workers": {
      "total": 10,
      "online": 4,
      "enTrabajo": 2,
      "onboardingPendiente": 1
    },
    "jobs": {
      "activos": 6,
      "pendientes": 3
    },
    "serviceTypes": {
      "total": 5
    }
  }
}
```

## GET `/api/control-plane/workers`

Lista trabajadores de DriverApp.

Query params:

| Param | Descripcion |
|---|---|
| `page` | Pagina. |
| `limit` | Cantidad por pagina. |
| `q` | Busca por nombre, email o Clerk ID. |
| `status` | `OFFLINE`, `ONLINE` o `EN_TRABAJO`. |

```bat
curl.exe -i "http://localhost:3000/api/control-plane/workers?page=1&limit=20&q=manuel" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

Item:

```json
{
  "id": "driver_db_id",
  "clerkUserId": "user_123",
  "nombre": "Manuel",
  "email": "driver+clerktest@iaw.com",
  "telefono": "+5491111111111",
  "imagenURL": "https://...",
  "bio": "Tecnico matriculado",
  "role": "DRIVER",
  "status": "ONLINE",
  "onboardingCompleto": true,
  "tiposServicio": [
    {
      "id": "tipo_1",
      "nombre": "Electricidad"
    }
  ],
  "creadoEn": "2026-06-09T12:00:00.000Z",
  "actualizadoEn": "2026-06-09T12:00:00.000Z"
}
```

## GET `/api/control-plane/workers/:id`

Obtiene un trabajador por ID interno de DriverApp o por Clerk ID.

```bat
curl.exe -i "http://localhost:3000/api/control-plane/workers/user_123" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

## PATCH `/api/control-plane/workers/:id/status`

Actualiza el estado operativo de un trabajador.

Acepta `:id` como ID interno o Clerk ID.

Body:

```json
{
  "status": "OFFLINE",
  "actorClerkId": "user_control_admin",
  "actorEmail": "admin@repairdash.com",
  "reason": "Desactivacion operativa temporal"
}
```

Valores validos de `status`:

- `OFFLINE`
- `ONLINE`
- `EN_TRABAJO`

Nota: DriverApp todavia no tiene un estado persistente de suspension en el schema. Este endpoint administra el `DriverStatus` existente.

```bat
curl.exe -i -X PATCH "http://localhost:3000/api/control-plane/workers/user_123/status" ^
  -H "Content-Type: application/json" ^
  -H "x-control-plane-api-key: control-plane-secret" ^
  -d "{ \"status\": \"OFFLINE\", \"actorClerkId\": \"user_control_admin\", \"actorEmail\": \"admin@repairdash.com\", \"reason\": \"Desactivacion operativa temporal\" }"
```

## GET `/api/control-plane/jobs`

Lista trabajos de DriverApp.

Query params:

| Param | Descripcion |
|---|---|
| `page` | Pagina. |
| `limit` | Cantidad por pagina. |
| `q` | Busca por ID de trabajo, Clerk ID del rider, direccion o nombre del rider. |
| `estado` | `PENDIENTE`, `ACEPTADO`, `RECHAZADO`, `EN_CAMINO`, `EN_SERVICIO`, `FINALIZADO`, `CANCELADO`. |

```bat
curl.exe -i "http://localhost:3000/api/control-plane/jobs?page=1&limit=20&estado=PENDIENTE" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

Item:

```json
{
  "id": "trabajo_123",
  "estado": "PENDIENTE",
  "rider": {
    "clerkUserId": "user_rider",
    "nombre": "Juan",
    "apellido": "Perez",
    "valoracion": 4.8
  },
  "driver": null,
  "tipoServicio": {
    "id": "tipo_1",
    "nombre": "Electricidad"
  },
  "descripcion": "Cambio de toma",
  "direccion": "San Martin 850",
  "fotos": [],
  "montoEstimado": 30000,
  "creadoEn": "2026-06-09T12:00:00.000Z",
  "actualizadoEn": "2026-06-09T12:00:00.000Z"
}
```

## GET `/api/control-plane/jobs/:id`

Obtiene detalle de un trabajo por ID.

```bat
curl.exe -i "http://localhost:3000/api/control-plane/jobs/trabajo_123" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

## GET `/api/control-plane/service-types`

Lista tipos de servicio con paginacion.

Query params:

| Param | Descripcion |
|---|---|
| `page` | Pagina. |
| `limit` | Cantidad por pagina. |
| `q` | Busca por nombre o descripcion. |

```bat
curl.exe -i "http://localhost:3000/api/control-plane/service-types?page=1&limit=20" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

Item:

```json
{
  "id": "tipo_1",
  "nombre": "Electricidad",
  "descripcion": "Instalaciones y reparaciones electricas",
  "precioBase": 15000,
  "driversAsignados": 4,
  "trabajosActivos": 2,
  "creadoEn": "2026-06-09T12:00:00.000Z",
  "actualizadoEn": "2026-06-09T12:00:00.000Z"
}
```

## GET `/api/control-plane/service-types/:id`

Obtiene detalle de un tipo de servicio.

```bat
curl.exe -i "http://localhost:3000/api/control-plane/service-types/tipo_1" ^
  -H "x-control-plane-api-key: control-plane-secret"
```

## POST `/api/control-plane/service-types`

Crea un tipo de servicio.

Body:

```json
{
  "nombre": "Cerrajeria",
  "descripcion": "Apertura y cambio de cerraduras",
  "precioBase": 18000,
  "actorClerkId": "user_control_admin",
  "actorEmail": "admin@repairdash.com",
  "reason": "Alta comercial desde Control Plane"
}
```

```bat
curl.exe -i -X POST "http://localhost:3000/api/control-plane/service-types" ^
  -H "Content-Type: application/json" ^
  -H "x-control-plane-api-key: control-plane-secret" ^
  -d "{ \"nombre\": \"Cerrajeria\", \"descripcion\": \"Apertura y cambio de cerraduras\", \"precioBase\": 18000, \"actorClerkId\": \"user_control_admin\", \"actorEmail\": \"admin@repairdash.com\", \"reason\": \"Alta comercial desde Control Plane\" }"
```

## PATCH `/api/control-plane/service-types/:id`

Edita un tipo de servicio.

Body: enviar al menos uno de `nombre`, `descripcion`, `precioBase`, mas los campos de actor.

```json
{
  "precioBase": 20000,
  "actorClerkId": "user_control_admin",
  "actorEmail": "admin@repairdash.com",
  "reason": "Actualizacion de precio base"
}
```

```bat
curl.exe -i -X PATCH "http://localhost:3000/api/control-plane/service-types/tipo_1" ^
  -H "Content-Type: application/json" ^
  -H "x-control-plane-api-key: control-plane-secret" ^
  -d "{ \"precioBase\": 20000, \"actorClerkId\": \"user_control_admin\", \"actorEmail\": \"admin@repairdash.com\", \"reason\": \"Actualizacion de precio base\" }"
```

## DELETE `/api/control-plane/service-types/:id`

Elimina un tipo de servicio.

Importante: si el tipo de servicio tiene relaciones que impiden el borrado, Prisma devolvera error. Esta API no fuerza borrados destructivos.

Body:

```json
{
  "actorClerkId": "user_control_admin",
  "actorEmail": "admin@repairdash.com",
  "reason": "Baja comercial desde Control Plane"
}
```

```bat
curl.exe -i -X DELETE "http://localhost:3000/api/control-plane/service-types/tipo_1" ^
  -H "Content-Type: application/json" ^
  -H "x-control-plane-api-key: control-plane-secret" ^
  -d "{ \"actorClerkId\": \"user_control_admin\", \"actorEmail\": \"admin@repairdash.com\", \"reason\": \"Baja comercial desde Control Plane\" }"
```

## Errores Comunes

| Status | Causa |
|---:|---|
| `400` | Body invalido, campos faltantes o valores fuera de contrato. |
| `401` | `x-control-plane-api-key` ausente o incorrecta. |
| `404` | Entidad inexistente. |
| `409` | Conflicto de unicidad, por ejemplo tipo de servicio duplicado. |
| `500` | Falta `CONTROL_PLANE_API_KEY` o error interno. |


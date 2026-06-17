# App de Promociones — Documentación de API REST

---

Este documento describe todos los endpoints REST de la app de Promociones. Incluye información sobre autenticación, parámetros de entrada y todas las posibles respuestas para cada endpoint.

---

## Autenticación

La API utiliza tres mecanismos de autenticación según el tipo de consumidor.

|Mecanismo|Descripción|
|-|-|
|`Clerk Session`|Sesión de usuario autenticado con Clerk.|
|`x-api-key: `|API key para comunicación interna del Sistema. Se envía en el header `x-api-key`.|

>**Importante:** `RIDER_API_KEY` e `INTERNAL_SERVICES_API_KEY` deben ser valores distintos configurados en las variables de entorno de cada servicio.

Variables de entorno requeridas en la app de Promociones:

```env
RIDER_API_KEY="valor-secreto-rider"
INTERNAL_SERVICES_API_KEY="valor-secreto-servicios"
```

Variables sugeridas en los consumidores externos:

```env
PROMOCIONES_BASE_URL="http://localhost:3001"
PROMOCIONES_API_KEY="mismo-valor-que-INTERNAL_SERVICES_API_KEY-en-Promociones"
```

---

## Resumen
#### (Admin: administrador de PromotionsApp; SuperAdmin: administrador general de RepairDash)

|Método|Ruta|Auth|Descripción|
|-|-|-|-|
|`GET`|`/api/admin/promociones`|Admin / SuperAdmin|Listar todas las promociones (paginado)|
|`POST`|`/api/admin/promociones`|Admin / SuperAdmin|Crear una nueva promoción|
|`GET`|`/api/admin/promociones/[id]`|SuperAdmin|Ver detalle completo de una promoción|
|`PATCH`|`/api/admin/promociones/[id]`|Admin / SuperAdmin|Editar una promoción existente|
|`DELETE`|`/api/admin/promociones/[id]`|Admin / SuperAdmin|Eliminar (soft delete) una promoción|
|`GET`|`/api/promociones`|Rider|Listar promociones aplicables a un usuario|
|`GET`|`/api/historial`|SuperAdmin|Consultar historial de uso (paginado)|
|`POST`|`/api/historial`|Rider|Registrar un uso de promoción|
|`GET`|`/api/admin/tipo-servicio`|Admin|Listar tipos de servicio disponibles (se obtienen de DriverApp)|
|`GET`|`/api/admin/usuarios`|Admin|Listar usuarios activos|

---

## Endpoints

### GET /api/admin/promociones

Devuelve la lista paginada de todas las promociones con todos sus campos, incluyendo `filtroUsuarios` y `eliminada`. Por defecto solo devuelve las no eliminadas.

#### Request

```http
GET /api/admin/promociones?page=1&limit=20
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`x-api-key`|Sí*|`INTERNAL_SERVICES_API_KEY`|

#### Query Params

|Param|Requerido|Default|Descripción|
|-|-|-|-|
|`eliminada`|No|`false`|`true` devuelve solo eliminadas, `false` devuelve activas y vencidas|
|`page`|No|`1`|Número de página|
|`limit`|No|`20`|Resultados por página. Máximo: `100`|

#### Ejemplo desde Control Plane

```ts
export async function getPromociones(params: {
  eliminada?: boolean;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.eliminada !== undefined) searchParams.set("eliminada", String(params.eliminada));
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 20));

  const response = await fetch(
    `${process.env.PROMOCIONES_BASE_URL}/api/admin/promociones?${searchParams}`,
    {
      headers: {
        "x-api-key": process.env.PROMOCIONES_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error("No se pudieron consultar las promociones.");
  return response.json();
}
```

#### Respuestas

**`200 OK`** — Lista obtenida correctamente.

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "nombre": "20% en comida",
      "tipoDescuento": "porcentaje",
      "valor": 20.0,
      "descripcion": "Descuento en pedidos de comida",
      "destacada": true,
      "usoUnico": false,
      "precioMinimo": 5000.0,
      "categorias": ["comida"],
      "eliminada": false,
      "fechaInicio": "2026-01-01T00:00:00.000Z",
      "fechaFin": "2026-12-31T23:59:59.000Z",
      "filtroUsuarios": null
    }
  ],
  "pagination": {
    "total": 48,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida.

```json
{ "error": "No autorizado." }
```

**`500 Internal Server Error`** — Error inesperado al consultar la base de datos.

```json
{ "error": "Error interno del servidor" }
```

---

### POST /api/admin/promociones

Crea una nueva promoción en el sistema.

#### Request

```http
POST /api/admin/promociones
Content-Type: application/json
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`Content-Type`|Sí|`application/json`|
|`x-api-key`|Sí\*|`INTERNAL_SERVICES_API_KEY` cuando lo llama un servicio externo|

*También acepta sesión de admin Clerk con rol `admin-promotions`.

#### Body

|Campo|Tipo|Requerido|Descripción|
|-|-|-|-|
|`nombre`|`string`|Sí|Nombre visible de la promoción|
|`tipoDescuento`|`string`|Sí|`"porcentaje"` o `"monto_fijo"`|
|`valor`|`number`|Sí|Valor del descuento|
|`descripcion`|`string`|No|Descripción opcional visible al usuario|
|`destacada`|`boolean`|No|Si aparece destacada. Default: `false`|
|`usoUnico`|`boolean`|No|Si cada usuario solo puede usarla una vez. Default: `false`|
|`categorias`|`string[]`|No|Categorías de servicios donde aplica|
|`precioMinimo`|`number`|No|Precio mínimo del servicio para que aplique|
|`fechaInicio`|`string`|Sí|Fecha de inicio en formato ISO 8601|
|`fechaFin`|`string`|No|Fecha de vencimiento ISO 8601. `null` = sin vencimiento|
|`filtroUsuarios`|`object`|No|Condiciones que debe cumplir el usuario para calificar|

#### Respuestas

**`201 Created`** — Promoción creada correctamente. Devuelve el objeto completo con el `id` asignado.

```json
{
  "id": 5,
  "nombre": "20% en comida",
  "tipoDescuento": "porcentaje",
  "valor": 20.0,
  "descripcion": "Descuento en pedidos de comida",
  "destacada": true,
  "usoUnico": false,
  "precioMinimo": 5000.0,
  "categorias": ["comida"],
  "eliminada": false,
  "fechaInicio": "2026-01-01T00:00:00.000Z",
  "fechaFin": "2026-12-31T23:59:59.000Z",
  "filtroUsuarios": null
}
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida, y no hay sesión de Clerk activa.

```json
{ "error": "No autorizado. Iniciá sesión." }
```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json
{ "error": "Acceso restringido a administradores de promociones." }
```

**`500 Internal Server Error`** — Error inesperado al crear la promoción.

```json
{ "error": "Error interno del servidor" }
```

---

### GET /api/admin/promociones/[id]

Devuelve el detalle completo de una promoción por su ID, incluyendo todos los campos internos (`filtroUsuarios`, `eliminada`).

#### Request

```http
GET /api/admin/promociones/5
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`x-api-key`|Sí*|`INTERNAL_SERVICES_API_KEY` cuando lo llama un servicio externo|

*También acepta sesión de admin Clerk con rol `admin-promotions`.

#### Path Params

|Param|Requerido|Descripción|
|-|-|-|
|`id`|Sí|ID numérico de la promoción|

#### Respuestas

**`200 OK`** — Promoción encontrada.

```json
{
  "status": "success",
  "data": {
    "id": 5,
    "nombre": "20% en comida",
    "tipoDescuento": "porcentaje",
    "valor": 20.0,
    "descripcion": "Descuento en pedidos de comida",
    "destacada": true,
    "usoUnico": false,
    "precioMinimo": 5000.0,
    "categorias": ["comida"],
    "eliminada": false,
    "fechaInicio": "2026-01-01T00:00:00.000Z",
    "fechaFin": "2026-12-31T23:59:59.000Z",
    "filtroUsuarios": null
  }
}
```

**`400 Bad Request`** — El ID en la URL no es un número válido.

```json
{ "error": "ID inválido" }
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida, y no hay sesión de Clerk activa.

```json
{ "error": "No autorizado. Iniciá sesión." }
```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json
{ "error": "Acceso restringido a administradores de promociones." }
```

**`404 Not Found`** — No existe una promoción con ese ID.

```json
{ "error": "Promoción no encontrada" }
```

---

### PATCH /api/admin/promociones/[id]

Actualiza parcialmente una promoción existente. Solo se modifican los campos incluidos en el body; los omitidos no se tocan.

#### Request

```http
PATCH /api/admin/promociones/5
Content-Type: application/json
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`Content-Type`|Sí|`application/json`|
|`x-api-key`|Sí*|`INTERNAL_SERVICES_API_KEY` cuando lo llama un servicio externo|

*También acepta sesión de admin Clerk con rol `admin-promotions`.

#### Path Params

|Param|Requerido|Descripción|
|-|-|-|
|`id`|Sí|ID numérico de la promoción a editar|

#### Body

|Campo|Tipo|Requerido|Descripción|
|-|-|-|-|
|`nombre`|`string`|No|Nuevo nombre de la promoción|
|`tipoDescuento`|`string`|No|`"porcentaje"` o `"monto_fijo"`|
|`valor`|`number`|No|Nuevo valor del descuento|
|`descripcion`|`string`|No|Nueva descripción|
|`destacada`|`boolean`|No|Cambiar estado de destacada|
|`usoUnico`|`boolean`|No|Cambiar restricción de uso único|
|`categorias`|`string[] \| string`|No|Array de categorías o string separado por comas|
|`precioMinimo`|`number \| null`|No|Nuevo precio mínimo. Enviar `null` para quitar la restricción|
|`fechaInicio`|`string`|No|Nueva fecha de inicio ISO 8601|
|`fechaFin`|`string \| null`|No|Nueva fecha de fin. Enviar `null` para quitar vencimiento|
|`filtroUsuarios`|`object \| null`|No|Nuevo filtro. Enviar `null` para quitar el filtro|

#### Respuestas

**`200 OK`** — Promoción actualizada correctamente.

```json
{
  "status": "success",
  "data": {
    "id": 5,
    "nombre": "25% en comida",
    "tipoDescuento": "porcentaje",
    "valor": 25.0,
    "descripcion": "Descuento en pedidos de comida",
    "destacada": true,
    "usoUnico": false,
    "precioMinimo": 5000.0,
    "categorias": ["comida"],
    "eliminada": false,
    "fechaInicio": "2026-01-01T00:00:00.000Z",
    "fechaFin": "2026-12-31T23:59:59.000Z",
    "filtroUsuarios": null
  }
}
```

**`400 Bad Request`** — El ID en la URL no es un número válido.

```json
{ "error": "ID inválido" }
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida, y no hay sesión de Clerk activa.

```json
{ "error": "No autorizado. Iniciá sesión." }
```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json
{ "error": "Acceso restringido a administradores de promociones." }
```

**`500 Internal Server Error`** — Error inesperado al actualizar.

```json
{ "error": "Error al actualizar" }
```

---

### DELETE /api/admin/promociones/[id]

Realiza un soft delete de la promoción: setea `eliminada = true`. La promoción no se borra de la base de datos y puede consultarse con `?eliminada=true`. Los usuarios dejan de verla de inmediato.

#### Request

```http
DELETE /api/admin/promociones/5
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`x-api-key`|Sí*|`INTERNAL_SERVICES_API_KEY` cuando lo llama un servicio externo|

*También acepta sesión de admin Clerk con rol `admin-promotions`.

#### Path Params

|Param|Requerido|Descripción|
|-|-|-|
|`id`|Sí|ID numérico de la promoción a eliminar|

#### Respuestas

**`200 OK`** — Soft delete realizado correctamente.

```json
{ "status": "success" }
```

**`400 Bad Request`** — El ID en la URL no es un número válido.

```json
{ "error": "ID inválido" }
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida, y no hay sesión de Clerk activa.

```json
{ "error": "No autorizado. Iniciá sesión." }
```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json
{ "error": "Acceso restringido a administradores de promociones." }
```

**`500 Internal Server Error`** — Error inesperado al eliminar.

```json
{ "error": "Error interno" }
```

---

### GET /api/promociones

Devuelve las promociones vigentes que aplican a un usuario específico. Aplica toda la lógica de filtro: fechas, categorías, uso único y condiciones del `filtroUsuarios`. No devuelve promociones eliminadas ni vencidas.

#### Request

```http
GET /api/promociones?usuarioId=user_123
x-api-key: <RIDER_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`x-api-key`|Sí|`RIDER_API_KEY`|

#### Query Params

|Param|Requerido|Descripción|
|-|-|-|
|`usuarioId`|Sí|ID del usuario para el que se calculan las promociones aplicables|

#### Respuestas

**`200 OK`** — Lista de promociones aplicables. Puede ser un array vacío si ninguna aplica.

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "nombre": "20% en comida",
      "tipoDescuento": "porcentaje",
      "valor": 20.0,
      "precioMinimo": 5000.0,
      "categorias": ["comida"]
    }
  ]
}
```

> **Nota:** No devuelve `filtroUsuarios` ni otros campos internos. Solo la información necesaria para aplicar el descuento.

**`400 Bad Request`** — No se envió el parámetro `usuarioId`.

```json
{ "error": "Falta usuarioId" }
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida.

```json
{ "error": "No autorizado" }
```

**`500 Internal Server Error`** — Error inesperado al calcular las promociones.

```json
{ "error": "Error interno del servidor" }
```

---

### POST /api/historial

Registra que un usuario usó una promoción en un trabajo determinado. Llamado por Rider al completar un pago con promoción aplicada. Valida que la promoción exista antes de crear el registro.

#### Request

```http
POST /api/historial
Content-Type: application/json
x-api-key: <RIDER_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`Content-Type`|Sí|`application/json`|
|`x-api-key`|Sí|`RIDER_API_KEY`|

#### Body

|Campo|Tipo|Requerido|Descripción|
|-|-|-|-|
|`usuarioId`|`string`|Sí|ID del usuario que usó la promoción|
|`promocionId`|`number`|Sí|ID de la promoción utilizada|
|`trabajoId`|`number`|Sí|ID del trabajo/viaje al que se aplicó|
|`valorOriginal`|`number`|Sí|Precio del servicio sin descuento|
|`valorPagado`|`number`|Sí|Precio efectivamente pagado después del descuento|

#### Respuestas

**`201 Created`** — Registro creado correctamente.

```json
{
  "status": "success",
  "data": {
    "id": 42,
    "fechaUso": "2026-06-12T15:30:00.000Z",
    "nombre": "20% en comida",
    "promocionId": 1,
    "usuarioId": "user_123",
    "trabajoId": 789,
    "valorOriginal": 10000.0,
    "valorPagado": 8000.0
  }
}
```

**`400 Bad Request`** — Uno o más campos requeridos están ausentes en el body.

```json
{ "error": "Faltan campos requeridos" }
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida.

```json
{ "error": "No autorizado" }
```

**`404 Not Found`** — No existe una promoción con el `promocionId` indicado.

```json
{ "error": "Promoción no encontrada" }
```

**`500 Internal Server Error`** — Error inesperado al registrar el uso.

```json
{ "error": "Error interno del servidor" }
```

---

### GET /api/historial

Consulta el historial de uso de promociones con filtros opcionales y paginación. Cada registro incluye los datos básicos de la promoción asociada.

#### Request

```http
GET /api/historial?page=1&limit=20
x-api-key: <INTERNAL_SERVICES_API_KEY>
```

#### Headers

|Header|Requerido|Valor|
|-|-|-|
|`x-api-key`|Si*|`INTERNAL_SERVICES_API_KEY`|

#### Query Params

|Param|Requerido|Default|Descripción|
|-|-|-|-|
|`promocionId`|No|—|Filtra registros de una promoción específica|
|`usuarioId`|No|—|Filtra registros de un usuario específico|
|`page`|No|`1`|Número de página|
|`limit`|No|`20`|Resultados por página. Máximo: `100`|

#### Ejemplo desde Control Plane / Analytics

```ts
export async function getHistorial(params: {
  promocionId?: number;
  usuarioId?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.promocionId) searchParams.set("promocionId", String(params.promocionId));
  if (params.usuarioId) searchParams.set("usuarioId", params.usuarioId);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 20));

  const response = await fetch(
    `${process.env.PROMOCIONES_BASE_URL}/api/historial?${searchParams}`,
    {
      headers: {
        "x-api-key": process.env.PROMOCIONES_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error("No se pudo consultar el historial de promociones.");
  return response.json();
}
```

#### Respuestas

**`200 OK`** — Historial obtenido correctamente.

```json
{
  "status": "success",
  "data": [
    {
      "id": 42,
      "fechaUso": "2026-06-12T15:30:00.000Z",
      "nombre": "20% en comida",
      "promocionId": 1,
      "usuarioId": "user_123",
      "trabajoId": 789,
      "valorOriginal": 10000.0,
      "valorPagado": 8000.0,
      "promocion": {
        "id": 1,
        "nombre": "20% en comida",
        "tipoDescuento": "porcentaje",
        "valor": 20.0
      }
    }
  ],
  "pagination": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "totalPages": 18
  }
}
```

**`401 Unauthorized`** — Falta el header `x-api-key` o la key es inválida.

```json
{ "error": "No autorizado" }
```

**`500 Internal Server Error`** — Error inesperado al consultar el historial.

```json
{ "error": "Error interno del servidor" }
```

### GET /api/admin/tipo-servicio

Devuelve la lista de tipos de servicio disponibles en el sistema. Usado principalmente para poblar los selectores de categorías al crear o editar una promoción.

#### Request

```http

GET /api/admin/tipo-servicio

```

*Requiere sesión de admin Clerk con rol `admin-promotions`.

#### Respuestas

**`200 OK`** — Lista obtenida correctamente.

```json

{
 "status": "success",
 "data": \\\["comida", "transporte", "limpieza"]

}

```

**`401 Unauthorized`** — No hay sesión de Clerk activa`.

```json

{ "error": "No autorizado. Iniciá sesión." }

```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json

{ "error": "Acceso restringido a administradores de promociones." }

```

---

 

### GET /api/admin/usuarios

Devuelve la lista de usuarios activos registrados en la app de Promociones. Usado para consultar qué usuarios existen en el sistema al gestionar filtros o historial.

#### Request

```http

GET /api/admin/usuarios

```

*Requiere sesión de admin Clerk con rol `admin-promotions`.

#### Respuestas

**`200 OK`** — Lista obtenida correctamente. Solo devuelve usuarios con `activo = true`, ordenados por fecha de registro descendente.

```json

{
 "status": "success",
 "data": \\\[
   {
     "id": "user\\\_123",
     "nombre": "Juan Pérez",
     "fechaRegistro": "2026-01-15T10:00:00.000Z"
   }
 ]

}

```

**`401 Unauthorized`** — No hay sesión de Clerk activa`.

```json

{ "error": "No autorizado. Iniciá sesión." }

```

**`403 Forbidden`** — Hay sesión de Clerk activa pero el usuario no tiene el rol `admin-promotions`.

```json

{ "error": "Acceso restringido a administradores de promociones." }

```

**`500 Internal Server Error`** — Error inesperado al consultar la base de datos.

```json

{ "error": "Error interno del servidor" }

```


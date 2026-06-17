# APIs — Promociones para Analytics
 
> Todos los endpoints requieren autenticación con x-api-key.
 
---
 
## `GET /api/admin/promociones`
 
Lista promociones con paginación.
 
**Por defecto** (sin parámetros) devuelve todas las promociones **no eliminadas**.
 
### Query params
 
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `estado` | `string` | Filtra por estado. Valores válidos: `vigentes`, `programadas`, `vencidas`, `eliminadas`. Opcional. |
| `page` | `number` | Número de página. Default: `1`. |
| `limit` | `number` | Resultados por página. Default: `20`. Máximo: `100`. |
 
### Definición de estados
 
| Estado | Condición |
|--------|-----------|
| `vigentes` | `eliminada = false` AND `fechaInicio <= ahora` AND (`fechaFin` es `null` OR `fechaFin >= ahora`) |
| `programadas` | `eliminada = false` AND `fechaInicio > ahora` |
| `vencidas` | `eliminada = false` AND `fechaFin < ahora` |
| `eliminadas` | `eliminada = true` |
 
> Una promoción eliminada **nunca** se contabiliza como vigente, programada ni vencida.
 
### Respuesta exitosa `200`
 
```json
{
  "status": "success",
  "data": [
    {
      "id": "abc123",
      "nombre": "Promo verano",
      "tipoDescuento": "porcentaje",
      "valor": 15,
      "fechaInicio": "2025-12-01T00:00:00.000Z",
      "fechaFin": "2025-12-31T23:59:59.000Z",
      "eliminada": false
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```
 
### Respuesta de error `400`
 
```json
{
  "error": "Parámetro \"estado\" inválido. Use: eliminadas, vigentes, programadas o vencidas"
}
```
 
### Ejemplos
 
```
GET /api/admin/promociones
GET /api/admin/promociones?estado=vigentes
GET /api/admin/promociones?estado=vencidas&page=2&limit=10
GET /api/admin/promociones?estado=eliminadas
```
 
---

## `GET /api/admin/promociones/count`
 
Devuelve la **cantidad** de promociones según estado.
 
**Por defecto** (sin parámetros) devuelve la cantidad de promociones **no eliminadas**.
 
### Query params
 
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `estado` | `string` | Filtra por estado. Valores válidos: `vigentes`, `programadas`, `vencidas`, `eliminadas`. Opcional. |
 
> Los estados siguen la misma definición que en `GET /api/admin/promociones`.
 
### Respuesta exitosa `200`
 
```json
{
  "status": "success",
  "data": {
    "cantidad": 17
  }
}
```
 
### Respuesta de error `400`
 
```json
{
  "error": "Parámetro 'estado' inválido. Use: eliminadas, vigentes, programadas o vencidas"
}
```
 
### Ejemplos
 
```
GET /api/admin/promociones/count
GET /api/admin/promociones/count?estado=vigentes
GET /api/admin/promociones/count?estado=programadas
GET /api/admin/promociones/count?estado=vencidas
GET /api/admin/promociones/count?estado=eliminadas
```
---

## `GET /api/historial`
 
Devuelve el listado paginado de registros del historial de uso de promociones. Todos los filtros son opcionales y combinables entre sí.
 
### Query params
 
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `promocionId` | `number` | Filtra los registros de una promoción específica. Debe ser un entero positivo. |
| `usuarioId` | `string` | Filtra los registros de un usuario específico. No puede estar vacío. |
| `desde` | `string` (ISO 8601 / `YYYY-MM-DD`) | Incluye registros con `fechaUso >= desde`. No puede ser posterior a `hasta`. |
| `hasta` | `string` (ISO 8601 / `YYYY-MM-DD`) | Incluye registros con `fechaUso <= hasta`. No puede ser anterior a `desde`. |
| `page` | `number` | Número de página. Default: `1`. Debe ser un entero mayor a `0`. |
| `limit` | `number` | Resultados por página. Default: `20`. Máximo: `100`. Debe ser un entero mayor a `0`. |
 
### Respuesta exitosa `200`
 
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "usuarioId": "abc123",
      "fechaUso": "2026-05-10T14:32:00.000Z",
      "promocion": {
        "id": 5,
        "nombre": "Promo verano",
        "tipoDescuento": "porcentaje",
        "valor": 15
      }
    }
  ],
  "pagination": {
    "total": 84,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```
 
### Respuestas de error `400`
 
| Caso | Mensaje |
|------|---------|
| `promocionId` no es un entero positivo | `Parámetro "promocionId" inválido. Debe ser un número entero positivo.` |
| `usuarioId` vacío o solo espacios | `Parámetro "usuarioId" inválido. No puede estar vacío.` |
| `desde` con formato inválido | `Parámetro "desde" inválido. Use formato YYYY-MM-DD o ISO 8601.` |
| `hasta` con formato inválido | `Parámetro "hasta" inválido. Use formato YYYY-MM-DD o ISO 8601.` |
| `desde` es posterior a `hasta` | `El parámetro "desde" no puede ser posterior a "hasta".` |
| `page` no es un entero mayor a `0` | `Parámetro "page" inválido. Debe ser un número entero mayor a 0.` |
| `limit` no es un entero mayor a `0` | `Parámetro "limit" inválido. Debe ser un número entero mayor a 0.` |
 
```json
{ "error": "Parámetro \"promocionId\" inválido. Debe ser un número entero positivo." }
```
 
### Ejemplos
 
```
GET /api/historial
GET /api/historial?promocionId=5
GET /api/historial?usuarioId=abc123
GET /api/historial?desde=2026-01-01&hasta=2026-06-01
GET /api/historial?usuarioId=abc123&desde=2026-01-01&page=2&limit=10
```
 
---
 
## `GET /api/historial/count`
 
Devuelve estadísticas agregadas del historial de uso: cantidad de usos, suma de valores originales y pagados, y ahorro total. Todos los filtros son opcionales y combinables entre sí.
 
### Query params
 
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `promocionId` | `number` | Filtra los registros de una promoción específica. Debe ser un entero positivo. |
| `usuarioId` | `string` | Filtra los registros de un usuario específico. No puede estar vacío. |
| `desde` | `string` (ISO 8601 / `YYYY-MM-DD`) | Incluye registros con `fechaUso >= desde`. No puede ser posterior a `hasta`. |
| `hasta` | `string` (ISO 8601 / `YYYY-MM-DD`) | Incluye registros con `fechaUso <= hasta`. No puede ser anterior a `desde`. |
 
### Respuesta exitosa `200`
 
```json
{
  "status": "success",
  "data": {
    "totalUsos": 84,
    "sumaValorOriginal": 12500.00,
    "sumaValorPagado": 10200.00,
    "ahorroTotal": 2300.00
  },
  "filtros": {
    "promocionId": 5,
    "usuarioId": null,
    "desde": "2026-01-01T00:00:00.000Z",
    "hasta": null
  }
}
```
 
#### Campos de `data`
 
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalUsos` | `number` | Cantidad de registros que coinciden con los filtros. |
| `sumaValorOriginal` | `number` | Suma de `valorOriginal` de los registros filtrados. |
| `sumaValorPagado` | `number` | Suma de `valorPagado` de los registros filtrados. |
| `ahorroTotal` | `number` | Diferencia entre `sumaValorOriginal` y `sumaValorPagado`. |
 
> Si no hay registros que coincidan con los filtros, todos los campos numéricos devuelven `0`.
 
### Respuestas de error `400`
 
| Caso | Mensaje |
|------|---------|
| `promocionId` no es un entero positivo | `Parámetro "promocionId" inválido. Debe ser un número entero positivo.` |
| `usuarioId` vacío o solo espacios | `Parámetro "usuarioId" inválido. No puede estar vacío.` |
| `desde` con formato inválido | `Parámetro "desde" inválido. Use formato YYYY-MM-DD o ISO 8601.` |
| `hasta` con formato inválido | `Parámetro "hasta" inválido. Use formato YYYY-MM-DD o ISO 8601.` |
| `desde` es posterior a `hasta` | `El parámetro "desde" no puede ser posterior a "hasta".` |
 
```json
{ "error": "El parámetro \"desde\" no puede ser posterior a \"hasta\"." }
```
 
### Ejemplos
 
```
GET /api/historial/count
GET /api/historial/count?promocionId=5
GET /api/historial/count?usuarioId=abc123
GET /api/historial/count?desde=2026-01-01&hasta=2026-06-01
GET /api/historial/count?usuarioId=abc123&desde=2026-01-01
```
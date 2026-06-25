# Super Admin APIs

Endpoints administrativos para gestionar clientes y viajes de RepairDash.

Todas las rutas viven bajo `/api/super-admin/` y comparten:

- **Autenticación**: header `x-api-key` con el valor de `REPAIRDASH_API_KEY` (variable de entorno).
- **Respuestas exitosas**: `{ "data": ... }`.
- **Errores**: `{ "message": "..." }` con su status HTTP correspondiente.
- **Content-Type**: `application/json` tanto en request (cuando hay body) como en response.

## Autenticación

Cada request debe incluir:

```
x-api-key: <REPAIRDASH_API_KEY>
```

| Status | Significado |
| --- | --- |
| `401 Unauthorized` | Falta el header o el valor no coincide |
| `500 Internal Server Error` | La variable `REPAIRDASH_API_KEY` no está definida en el servidor |

---

## Clientes

### GET `/api/super-admin/clientes`

Lista todos los clientes registrados en la base de datos.

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": [
    {
      "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
      "nombre": "Luca",
      "apellido": "Fueyo",
      "mail": "luca@example.com",
      "calificacion": 4.5
    }
  ]
}
```

> `calificacion` viene serializado como `number` (no como `Decimal` de Prisma) o `null`.

---

### GET `/api/super-admin/clientes/count`

Devuelve la cantidad total de clientes en la base de datos.

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": { "total": 128 }
}
```

---

### GET `/api/super-admin/clientes/[idClerk]`

Obtiene un cliente puntual usando su `id_clerk` de Clerk.

**Path params**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `idClerk` | string | ID del usuario en Clerk (ej. `user_3Dgx9...`) |

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": {
    "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
    "nombre": "Luca",
    "apellido": "Fueyo",
    "mail": "luca@example.com",
    "calificacion": 4.5
  }
}
```

**Errores**

- `404 Not Found` — el cliente no existe.

---

### PUT `/api/super-admin/clientes/[idClerk]`

Actualiza el `nombre` y/o `apellido` de un cliente.

**Path params**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `idClerk` | string | ID del usuario en Clerk |

**Request body** (al menos uno de los dos campos)

```json
{
  "nombre": "Luca",
  "apellido": "Fueyo"
}
```

| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `nombre` | string | uno de los dos | Nuevo nombre del cliente |
| `apellido` | string | uno de los dos | Nuevo apellido del cliente |

**Response body** (200)

```json
{
  "data": {
    "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
    "nombre": "Luca",
    "apellido": "Fueyo",
    "mail": "luca@example.com",
    "calificacion": 4.5
  }
}
```

**Errores**

- `400 Bad Request` — body inválido o sin `nombre` ni `apellido`.
- `404 Not Found` — el cliente no existe.

---

### DELETE `/api/super-admin/clientes/[idClerk]`

Elimina al cliente de la base de datos.

**Path params**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `idClerk` | string | ID del usuario en Clerk |

**Request body**: ninguno.

**Response body** (200)

```json
{ "message": "Cliente eliminado" }
```

**Errores**

- `404 Not Found` — el cliente no existe.

> Nota: solo borra el registro en la tabla `cliente`. No elimina al usuario en Clerk.

---

## Viajes

### GET `/api/super-admin/viajes`

Lista todos los viajes del sistema, incluyendo el cliente asociado y sus pagos.

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": [
    {
      "id_viaje": 42,
      "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
      "tipo_de_trabajo": "plomeria",
      "estado": "concluido",
      "driver": "driver_abc",
      "fecha": "2026-05-12T15:34:00.000Z",
      "cliente": {
        "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
        "nombre": "Luca",
        "apellido": "Fueyo",
        "mail": "luca@example.com"
      },
      "pagos": [
        { "id_pago": 7, "monto": "5000", "estado": "aceptado" }
      ]
    }
  ]
}
```

---

### GET `/api/super-admin/viajes/count`

Devuelve la cantidad total de viajes en la base de datos.

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": { "total": 1543 }
}
```

---

### GET `/api/super-admin/viajes/cliente/[idClerk]`

Lista todos los viajes asociados a un cliente puntual.

**Path params**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `idClerk` | string | ID del usuario en Clerk |

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": [
    {
      "id_viaje": 42,
      "id_clerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
      "tipo_de_trabajo": "plomeria",
      "estado": "concluido",
      "driver": "driver_abc",
      "fecha": "2026-05-12T15:34:00.000Z",
      "pagos": [
        { "id_pago": 7, "monto": "5000", "estado": "aceptado" }
      ]
    }
  ]
}
```

**Errores**

- `404 Not Found` — el cliente no existe.

---

### GET `/api/super-admin/viajes/cliente/[idClerk]/count`

Devuelve la cantidad de viajes asociados a un cliente puntual.

**Path params**

| Param | Tipo | Descripción |
| --- | --- | --- |
| `idClerk` | string | ID del usuario en Clerk |

**Request body**: ninguno.

**Response body** (200)

```json
{
  "data": {
    "idClerk": "user_3Dgx9WenZGL8EKgV3YY3gjw6oc8",
    "total": 12
  }
}
```

**Errores**

- `404 Not Found` — el cliente no existe.

---

## Ejemplos con `curl`

Listar clientes:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/clientes
```

Cantidad de clientes:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/clientes/count
```

Obtener un cliente:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/clientes/user_3Dgx9WenZGL8EKgV3YY3gjw6oc8
```

Actualizar nombre/apellido:

```bash
curl -X PUT \
  -H "x-api-key: $REPAIRDASH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Luca","apellido":"Fueyo"}' \
  http://localhost:3000/api/super-admin/clientes/user_3Dgx9WenZGL8EKgV3YY3gjw6oc8
```

Eliminar cliente:

```bash
curl -X DELETE \
  -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/clientes/user_3Dgx9WenZGL8EKgV3YY3gjw6oc8
```

Listar todos los viajes:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/viajes
```

Cantidad total de viajes:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/viajes/count
```

Listar viajes de un cliente:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/viajes/cliente/user_3Dgx9WenZGL8EKgV3YY3gjw6oc8
```

Cantidad de viajes de un cliente:

```bash
curl -H "x-api-key: $REPAIRDASH_API_KEY" \
  http://localhost:3000/api/super-admin/viajes/cliente/user_3Dgx9WenZGL8EKgV3YY3gjw6oc8/count
```

---

## Notas de implementación

- Helper de auth compartido: `lib/api/superAdminAuth.ts` (`requireSuperAdmin`, `serializeCliente`).
- El middleware (`proxy.ts`) trata `/api(.*)` como ruta pública, por lo que estos endpoints **no** requieren sesión de Clerk — solo la `x-api-key`.
- Las queries reutilizan los helpers existentes en `lib/queries/clientes.ts` y `lib/queries/viajes.ts`.

# Instrucciones para el Backend - Paginación Server-Side

## Endpoints que necesitan paginación

Cada endpoint debe aceptar los siguientes query parameters y devolver un objeto con `data` y `meta`.

### Parámetros comunes (query string)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | int | Número de página (1-based) |
| `limit` | int | Items por página (default: 6) |
| `search` | string | Búsqueda por texto (número de DTE o nombre del cliente) |
| `estado` | string | Filtrar por estado (PROCESADO, RECIBIDO, CONTINGENCIA, etc.) |
| `fechaInicio` | string (YYYY-MM-DD) | Fecha inicial para filtrar por fecha de emisión |
| `fechaFin` | string (YYYY-MM-DD) | Fecha final para filtrar por fecha de emisión |
| `ordenFecha` | string | "reciente" o "antigua" |

### Formato de respuesta esperado

```json
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 6,
    "pages": 25
  }
}
```

Si por algún motivo el backend no soporta paginación, el frontend puede recibir un array plano y lo manejará con fallback (paginación client-side, mostrando todos los datos en 1 página).

### Lista de endpoints

| DTE | Endpoint actual | Endpoint con paginación |
|-----|----------------|------------------------|
| Factura | `GET /facturas/getAllDteFacturas?page=1&limit=6&search=...` | ✅ Ya implementado |
| Crédito | `GET /creditos/getAllDteCreditos?page=1&limit=6&search=...` | ✅ Ya implementado |
| Nota de Remisión | `GET /notasremision/?page=1&limit=6&search=...` | Pendiente |
| Sujeto Excluido | `GET /sujeto-excluido?page=1&limit=6&search=...` | Pendiente |
| Exportación | `GET /exportacion?page=1&limit=6&search=...` | Pendiente |
| Liquidación | `GET /liquidacion?page=1&limit=6&search=...` | Pendiente |
| Retención (DTE-07) | `GET /retencion?page=1&limit=6&search=...` | Pendiente |
| Notas de Débito | `GET /notasdebito/?page=1&limit=6&search=...` | Pendiente |
| Notas de Crédito | `GET /notascredito/?page=1&limit=6&search=...` | Pendiente |

### Endpoints para páginas "Anular"

Estas páginas cargan documentos para anulación. No necesitan paginación compleja, pero idealmente deberían aceptar `page` y `limit`. Actualmente cargan TODOS los documentos y el frontend los separa en dos listas (anulables e inválidos). Si el backend puede filtrar por `estado`, sería mejor.

| Página | Endpoint |
|--------|----------|
| Anular Facturas | `GET /facturas/getAllDteFacturas` |
| Anular Créditos | `GET /creditos/getAllDteCreditos` |
| Anular Sujeto Excluido | `GET /sujeto-excluido` |
| Anular Exportación | `GET /exportacion` |
| Anular Liquidación | `GET /liquidacion` |
| Anular Nota de Remisión | `GET /notasremision/` |

## Notas importantes
- El frontend usa `{ data: [...], meta: { total, page, limit, pages } }` cuando detecta que es un objeto, y array plano como fallback.
- El frontend envía page=1 al cambiar el search (debounced a 500ms).
- El frontend usa `ITEMS_PER_PAGE = 6`.
- `ordenFecha` con valor "reciente" = más recientes primero, "antigua" = más antiguas primero.

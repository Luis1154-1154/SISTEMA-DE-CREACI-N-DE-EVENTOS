# Contrato del backend

Este frontend trabaja sin `localStorage` y espera sesión por cookie HttpOnly vía `fetch` con `credentials: 'include'`.

## Endpoints esperados

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/appointments`
- `GET /api/appointments/me`
- `GET /api/admin/appointments`
- `DELETE /api/admin/appointments/:id`

## Reglas de UI ya cubiertas

- Registro con `telefono`, `nombre` y `contraseña`.
- Login con `telefono` y `contraseña`.
- Validación de campos vacíos.
- Normalización del teléfono para el admin con `trim` y sin espacios.
- Citas con `fecha`, `hora` y descripción opcional.
- Panel admin con agrupación por día y confirmación antes de borrar.

## Admin fijo

- Teléfono: `3123170997`
- Contraseña: `admin`

## Despliegue

- Sube `frontend/` a un hosting estático.
- Apunta `APP_CONFIG.apiBaseUrl` al backend público.
- El backend debe habilitar CORS con credenciales si está en otro dominio.
- El backend debe devolver cookies seguras en producción.

Despliegue único en Render
==========================

Esta configuración sirve el frontend estático y la API Express desde el mismo servicio.

Qué hace este repo ya listo
---------------------------
- `api/app.js` sirve la carpeta `frontend/` desde la raíz del sitio.
- La API queda disponible en `/api/...`.
- `render.yaml` define un servicio web apuntando a `api/`.

Pasos en Render
---------------
1. Crea una cuenta gratuita en https://render.com.
2. Conecta tu repositorio `Sistema-de-citas-de-consultorio`.
3. Render detectará `render.yaml` automáticamente o puedes crear un nuevo Web Service.
4. Usa estas variables de entorno:
   - `NODE_ENV=production`
   - `DB_CLIENT=mysql` o `DB_CLIENT=postgres`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_SSL=true` si tu base lo requiere
   - `CORS_ORIGIN=https://tu-servicio.onrender.com` si vas a consumir la API desde otro dominio
5. Render ejecutará:
   - Build: `npm install`
   - Start: `npm start`

Si quieres usar PostgreSQL
--------------------------
- `DB_CLIENT=postgres`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` con los datos del proveedor.
- Si usas Supabase o un pooler, agrega `DB_SSL=true`.

Si quieres usar MySQL
---------------------
- `DB_CLIENT=mysql`
- Configura los datos del host de MySQL.

Prueba final
------------
- Abre la URL pública de Render.
- Debe cargar el frontend.
- El login y las citas deben llamar a `/api/...` en el mismo dominio.

Notas
-----
- Cloudflare Pages sigue siendo útil solo para frontend estático.
- Si despliegas todo junto en Render, no necesitas mover `frontend/` a `docs/`.

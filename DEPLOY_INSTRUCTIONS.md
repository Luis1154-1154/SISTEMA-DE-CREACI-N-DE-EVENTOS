Pasos rápidos para desplegar en Render / conectar a Supabase (Postgres) y ejecutar migraciones

1) Variables de entorno necesarias
- `DB_CLIENT` = `postgres` (si usas Supabase) o `mysql` si usas MySQL
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SSL` = `true` (si usas SSL)
- `JWT_SECRET` = valor seguro para tokens JWT
- `NODE_ENV` = `production`
- `FRONTEND_ORIGIN` o `CORS_ORIGIN` = origenes permitidos para CORS

2) Migraciones / creación de tablas
- Si usas MySQL y el script `api/database.sql` en local puedes ejecutarlo con tu cliente
- Si usas Postgres/Supabase, la app incluye checks automáticos que añaden columnas al iniciar. Para asegurarte, levanta la app una vez con las vars DB configuradas y revisa logs.

3) Recomendado: ejecutar localmente y comprobar
- Instala dependencias en carpeta `api`:

```powershell
cd api
npm install
node scripts/create_db.js      # crea DB cuando es MySQL local
node app.js                    # o npm start según package.json
```

- Revisa la salida en consola para confirmar migraciones.

4) Comprobaciones básicas (curl)
- Obtener rutas disponibles:

```bash
curl http://localhost:3000/api
```

- Obtener settings de scheduling:

```bash
curl http://localhost:3000/api/schedule/settings
```

- Buscar citas por fecha:

```bash
curl "http://localhost:3000/api/appointments/by-date?date=2026-06-10"
```

5) Notas sobre Render y Supabase
- En Render, configura un servicio web apuntando a la carpeta `api` y establece el comando de start (por ejemplo `node app.js` o `npm start`).
- Configura las mismas variables de entorno que arriba en el panel de Render.
- Para Supabase, usa la información de conexión (host, puerto 5432, usuario, contraseña, db) y añade `DB_CLIENT=postgres`.
- Si usas SSL en Supabase, añade `DB_SSL=true` y `DB_SSL_REJECT_UNAUTHORIZED=false` si es necesario.

6) Pruebas y verificación post-despliegue
- Crea un usuari@ de prueba con `/api/auth/register` (email/phone/contraseña según formulario).
- En el panel admin, configura `appointment_interval_minutes` y reglas de `working_hours` y `working_exceptions`.
- Intenta agendar una cita desde frontend en una hora prohibida y confirma que API devuelve mensaje adecuado.

Si quieres, puedo:
- Ejecutar una secuencia de pruebas locales (si me autorizas a ejecutar comandos) o
- Preparar un script de verificación con `curl`/`httpie` que puedas ejecutar en tu entorno.

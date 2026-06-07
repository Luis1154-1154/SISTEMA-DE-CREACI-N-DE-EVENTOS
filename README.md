Clinic citas - despliegue rápido (PlanetScale + Render + Vercel)

Resumen rápido
- Base de datos: PlanetScale (MySQL compatible, free tier)
- Backend: Render (Node.js service) — gestiona env vars y da subdominio
- Frontend: Vercel (static site) — subdominio gratuito `*.vercel.app`

Archivos importantes
- API: `api/` (servidor Express)
- Frontend: `frontend/` (estáticos Bootstrap + JS)
- Esquema SQL: `api/database.sql`
- Ejemplo de variables: `.env.example`

Pasos locales (rápido)
1. Instala dependencias en el directorio `api/`:

```powershell
cd api
npm install
```

2. Crea la base de datos `clinic_db` local (si pruebas local):

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS clinic_db;"
```

3. Carga el esquema (local o remoto):

```powershell
mysql -u <user> -p -h <host> -P <port> < api/database.sql
```

4. Ejecuta el servidor localmente (usa variables de entorno o `.env` loader en tu entorno):

```powershell
$env:DB_HOST='127.0.0.1'
$env:DB_USER='root'
$env:DB_PASSWORD='tu_pass'
$env:DB_NAME='clinic_db'
$env:JWT_SECRET='valor_largo'
npm start
```

Despliegue recomendado (PlanetScale + Render + Vercel)

1) Crear DB en PlanetScale
- Regístrate en https://planetscale.com
- Crea una nueva base de datos (elige región)
- En la DB, crea una rama `main` si es necesario y en "Connect" elige "General" o "Node.js"
- Genera y copia las credenciales (host, username, password)
- Nota: PlanetScale usa TLS; ver más abajo sobre SSL/CA

2) Ejecutar el esquema
- Opción A: usar `pscale` (PlanetScale CLI) para desplegar/migrations y luego ejecutar `api/database.sql` en la rama principal
- Opción B: descargar `api/database.sql` y ejecutar con las credenciales remotas (o usar su consola web si lo permiten)

3) Desplegar backend en Render
- Crea cuenta en https://render.com
- Nuevo servicio -> Web Service -> conecta el repo de GitHub y selecciona la carpeta `api/` o el repo raíz con `api/package.json`
- Comando de start: `npm start` (ya definido en `api/package.json`)
- En settings del servicio, añade las variables de entorno:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `DB_SSL=true` si usas PlanetScale
  - Si PlanetScale te da un CA, añade `DB_SSL_CA` con el contenido en base64 o ruta si el host soporta archivos
- Despliega y espera que Render muestre el URL (ej. `https://mi-api.onrender.com`)

4) Desplegar frontend en Vercel
- Regístrate en https://vercel.com
- Importa el repo y configura la carpeta `frontend/` como el proyecto (Framework: Other / Static)
- Publicará en `https://<nombre>.vercel.app`
- Desde tu frontend, apunta las peticiones fetch a la URL del backend (o usa variables en build): `https://mi-api.onrender.com/api`.

Alternativa "todo en uno" (Railway)
- Railway crea la DB y el servicio en el mismo panel y te da las env vars automáticamente. Es más simple si no quieres PlanetScale por ahora.

Notas importantes
- Nunca subas `.env` al repo. Usa `.env.example` y las env vars en el host.
- En producción: `JWT_SECRET` debe ser un valor largo y secreto.
- Las contraseñas de usuarios ahora se guardan con `bcryptjs`.
- Para PlanetScale: si ves errores TLS, ajusta `DB_SSL` y `DB_SSL_REJECT_UNAUTHORIZED` según la documentación de PlanetScale.
- Considera usar `createPool()` (ya implementado) para producción.

¿Quieres que haga alguna de estas cosas ahora?
- Puedo generar la rama `dev` y crear un deploy preview en Render/Vercel (necesito que conectes tu GitHub o me indiques si quieres que te guíe paso-a-paso).
- Puedo prepararte un ejemplo de `pscale`/PlanetScale CLI script para ejecutar el SQL.


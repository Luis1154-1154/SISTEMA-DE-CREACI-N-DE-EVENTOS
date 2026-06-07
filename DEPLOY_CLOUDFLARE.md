Guía de despliegue en Cloudflare Pages (sitio estático)
===============================================

Resumen
-------
Este proyecto contiene la carpeta `frontend/` con los archivos estáticos (HTML/CSS/JS). Cloudflare Pages puede servir esa carpeta directamente sin marca de agua.

Pasos rápidos
-------------
1. Entra en https://dash.cloudflare.com/ y crea (o usa) una cuenta gratuita.
2. En el panel, selecciona **Pages** → **Create a project** → conecta tu cuenta de GitHub y autoriza el repositorio `Sistema-de-citas-de-consultorio`.
3. Configura la build:
   - Framework preset: `None` (sitio estático)
   - Build command: (déjalo vacío)
   - Output directory: `frontend`
4. Crea el proyecto. Cloudflare Pages desplegará el contenido y te dará una URL `*.pages.dev` con HTTPS automático.

Ajustes importantes para que la app funcione
-------------------------------------------
- Las rutas a tus `js` y `css` dentro de `frontend/` ya son relativas (p. ej. `./js/api-client.js`) — no necesitas modificar nada.
- Si tu API se aloja en otro dominio (por ejemplo Render o Railway), asegúrate de actualizar `frontend/js/app-config.js` para usar la URL del API (o deja la configuración por defecto y el navegador usará el origen actual + `/api`).
- El `api` debe aceptar CORS desde el dominio Pages y permitir credenciales. Recomendación en `api/app.js`:

```js
// ejemplo simplificado
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'https://tu-sitio.pages.dev';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

Cookies y sesiones
-------------------
- Para cookies cross-site (si frontend y backend están en dominios distintos):
  - `res.cookie('sid', token, { httpOnly: true, sameSite: 'none', secure: true })`
  - Asegúrate de que el frontend haga `fetch(..., { credentials: 'include' })` (ya está configurado en `api-client.js`).

Publicar con GitHub Pages (alternativa)
--------------------------------------
Si prefieres no usar Cloudflare Pages, puedes usar GitHub Pages copiando `frontend/` a `docs/` y configurando Pages para servir `docs/` desde `main`.

Comandos útiles (PowerShell)
---------------------------
Copiar frontend a docs para GitHub Pages:

```powershell
Remove-Item -Recurse -Force docs -ErrorAction SilentlyContinue
New-Item -ItemType Directory docs
Copy-Item -Recurse -Force frontend\* docs\
git add docs
git commit -m "Deploy frontend to docs for GitHub Pages"
git push origin main
```

Verificación
------------
- Accede a la URL `*.pages.dev` que Cloudflare te da. Prueba el login/register y la creación de citas.
- Si hay problemas con las cookies, revisa los encabezados CORS en el backend y la configuración de `sameSite`/`secure`.

Si quieres, puedo:
- Conectar el repo automáticamente a Cloudflare Pages (necesitaré que autorices mi acción en la UI), o
- Hacer el `docs/` + push para GitHub Pages ahora.

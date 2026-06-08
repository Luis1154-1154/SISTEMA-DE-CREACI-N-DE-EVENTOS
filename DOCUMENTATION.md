# Sistema de Gestión de Citas Clínicas - Documentación

## 📋 Descripción General

Sistema web completo para gestión de citas en consultorios médicos. Permite que pacientes agenden citas, administradores gestionen citas y expedientes clínicos, con autenticación JWT y múltiples funcionalidades clínicas.

**URL de Producción**: https://sistema-de-citas-de-consultorio.onrender.com

---

## ✨ Características Principales

### Para Pacientes/Usuarios
- ✅ Crear citas sin necesidad de registro
- ✅ Ver historial de citas propias (con login)
- ✅ Cancelar citas con motivo
- ✅ Registrarse e iniciar sesión
- ✅ Recuperar contraseña por email

### Para Administradores
- ✅ Gestionar todas las citas (crear, editar, marcar como atendidas, cancelar)
- ✅ Expediente clínico de pacientes
- ✅ Registrar particularidades (alergias, observaciones clínicas)
- ✅ Protección de auto-eliminación de cuenta admin
- ✅ Listar y eliminar usuarios
- ✅ Ver historial completo de citas con motivos de cancelación

---

## 🏗️ Estructura del Proyecto

```
├── api/                          # Backend Node.js/Express
│   ├── app.js                    # Configuración principal, rutas
│   ├── package.json              # Dependencias del backend
│   ├── database.sql              # Schema MySQL
│   ├── database_postgres.sql     # Schema PostgreSQL
│   ├── config/
│   │   ├── db.js                 # Conexión a BD
│   │   └── migrations.js         # Migraciones de schema
│   ├── controllers/              # Lógica de negocios
│   │   ├── appointmentsController.js
│   │   ├── authController.js
│   │   └── usuariosController.js
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication
│   ├── models/
│   │   ├── Appointments.js       # Modelo de citas
│   │   └── Usuarios.js           # Modelo de usuarios
│   ├── routes/
│   │   ├── appointmentsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── debugRoutes.js
│   │   └── usuariosRoutes.js
│   └── scripts/
│       ├── create_db.js          # Crear BD
│       └── hash_plain_passwords.js
│
├── frontend/                     # Frontend Bootstrap 5
│   ├── index.html                # Página de inicio
│   ├── login.html                # Login
│   ├── register.html             # Registro
│   ├── reset-password.html       # Recuperar contraseña
│   ├── create-appointment.html   # Crear cita (público)
│   ├── appointments.html         # Mis citas (usuario)
│   ├── history.html              # Historial (usuario)
│   ├── admin-appointments.html   # Admin: gestión de citas
│   ├── admin-history.html        # Admin: historial completo
│   ├── admin-records.html        # Admin: expedientes clínicos
│   ├── css/
│   │   └── app.css
│   └── js/
│       ├── api-client.js         # Cliente HTTP
│       ├── app-config.js         # Configuración
│       ├── auth-guard.js         # Guards de autenticación
│       ├── ui-utils.js           # Utilidades UI
│       ├── appointments.js       # Lógica de citas (usuario)
│       ├── create-appointment.js # Crear cita (público)
│       ├── admin.js              # Lógica admin
│       ├── login.js              # Login
│       ├── register.js           # Registro
│       ├── reset-password.js     # Reset contraseña
│       └── history.js            # Historial
│
├── README.md                     # Instrucciones básicas
├── DEPLOY_RENDER.md              # Instrucciones Render
├── DEPLOY_CLOUDFLARE.md          # Instrucciones Cloudflare
└── DOCUMENTATION.md              # Este archivo
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 16+
- MySQL 5.7+ o PostgreSQL 12+
- npm o yarn

### Setup Local

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/Luis1154-1154/Sistema-de-citas-de-consultorio.git
cd Sistema-de-citas-de-consultorio
```

#### 2. Instalar Dependencias Backend
```bash
cd api
npm install
```

#### 3. Configurar Base de Datos

**Para MySQL:**
```bash
mysql -u root -p < database.sql
```

**Para PostgreSQL:**
```bash
psql -U usuario -d tu_base_datos < database_postgres.sql
```

#### 4. Configurar Variables de Entorno
Crear archivo `.env` en la carpeta `api/`:

```env
# Base de Datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=clinic_db

# O para PostgreSQL (comentar MySQL)
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_NAME=clinic_db
# DB_PORT=5432

# Puerto del servidor
PORT=5000

# JWT
JWT_SECRET=tu_secret_muy_seguro_aqui

# Email (para recuperar contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
```

#### 5. Iniciar el Servidor
```bash
cd api
npm start
# El servidor estará en http://localhost:5000
```

#### 6. Acceder al Frontend
Abrir en navegador: `http://localhost:5000`

---

## 🔐 Autenticación

### Credenciales Admin por Defecto
- **Teléfono**: `3123170997`
- **Contraseña**: `admin`

### Flujo de Autenticación

1. **Registro de Usuario**: POST `/auth/register`
   - Crea usuario con rol `user`
   - Contraseña se hashea con bcrypt

2. **Login**: POST `/auth/login`
   - Valida credenciales
   - Retorna JWT token (válido 24 horas)
   - Token se guarda en localStorage o cookie

3. **Autenticación**: En cada request protegido
   - Se envía token en header `Authorization: Bearer <token>`
   - O como cookie si está disponible
   - Middleware valida y extrae datos del usuario

4. **Recuperar Contraseña**: POST `/auth/request-password-reset`
   - Envía email con link de reset
   - Link contiene token temporal

---

## 📚 API Endpoints

### Autenticación
```
POST   /auth/register                    Registrar usuario
POST   /auth/login                       Iniciar sesión
POST   /auth/logout                      Cerrar sesión
POST   /auth/request-password-reset      Solicitar reset contraseña
POST   /auth/reset-password              Reset contraseña con token
GET    /auth/me                          Obtener usuario actual (protegido)
```

### Citas
```
GET    /appointments                     Listar citas del día (admin)
GET    /appointments/self                Mis citas (usuario autenticado)
GET    /appointments/by-day              Citas por día (admin)
POST   /appointments                     Crear cita abierta (sin auth)
POST   /appointments/admin               Crear cita como admin (protegido)
PUT    /appointments/:id                 Actualizar cita (protegido)
PUT    /appointments/:id/cancel          Cancelar cita (protegido)
```

### Usuarios
```
GET    /usuarios                         Listar usuarios (admin)
GET    /usuarios/:id                     Obtener usuario (admin)
POST   /usuarios                         Crear usuario (admin)
PUT    /usuarios/:id                     Actualizar usuario (admin)
PUT    /usuarios/:id/observations        Actualizar observaciones clínicas (admin)
DELETE /usuarios/:id                     Eliminar usuario (admin)
```

---

## 🗄️ Base de Datos

### Tabla: users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) DEFAULT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  clinical_observations TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **id**: Identificador único
- **phone**: Teléfono único del usuario
- **name**: Nombre único del usuario
- **password**: Contraseña hasheada con bcrypt
- **role**: `user` (paciente) o `admin` (administrador)
- **clinical_observations**: Particularidades clínicas (alergias, etc.)

### Tabla: appointments
```sql
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  name VARCHAR(150) DEFAULT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cancel_reason TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

- **id**: Identificador de cita
- **user_id**: Referencia al usuario (nullable para citas anónimas)
- **phone/name**: Datos de contacto del paciente (snapshot)
- **date/time**: Fecha y hora de la cita
- **description**: Motivo de la cita
- **status**: `pending`, `attended`, `canceled`
- **cancel_reason**: Motivo si fue cancelada

---

## 🎯 Flujos de Uso

### 1. Paciente: Agendar Cita
1. Ir a "Agendar cita"
2. Llenar formulario (nombre, teléfono, fecha, hora, motivo)
3. Enviar
4. Cita creada sin necesidad de registrarse

### 2. Paciente: Ver Mis Citas
1. Iniciar sesión
2. Ir a "Mis citas"
3. Ver lista de citas propias
4. Opción para cancelar con motivo

### 3. Admin: Gestionar Citas
1. Iniciar sesión como admin
2. Dashboard muestra:
   - **Panel de citas**: Todas las citas pendientes
     - Marcar como atendida
     - Cancelar cita
     - Ver detalles
   - **Historial**: Citas atendidas y canceladas
     - Ver motivos de cancelación
   - **Expediente Clínico**:
     - Seleccionar paciente
     - Ver particularidades (alergias)
     - Agregar observaciones clínicas
     - Ver historial de citas del paciente
     - Crear citas para el paciente
     - Eliminar pacientes

---

## 🛡️ Seguridad

### Protecciones Implementadas

1. **Hash de Contraseñas**: bcrypt con salt rounds 10
2. **JWT Tokens**: Tokens con expiración de 24 horas
3. **CORS**: Configurado para permitir credenciales
4. **Validación de Entrada**: Validación en backend y frontend
5. **Protección Admin**: 
   - No puede auto-eliminarse
   - Requiere autenticación y rol admin para operaciones sensibles
6. **SQL Injection Prevention**: Uso de prepared statements
7. **XSS Prevention**: Sanitización de datos con `escapeHtml()`

### Rutas Protegidas
- Todas las rutas de `/usuarios` requieren autenticación + rol admin
- `/appointments/admin` requiere autenticación + rol admin
- `/appointments/self` requiere autenticación
- `/appointments` (crear) es pública

---

## 📱 Frontend

### Framework y Librerías
- **Bootstrap 5.3.3**: UI Framework
- **Fetch API**: HTTP requests (no jQuery)
- **ES6 Modules**: Organización de código modular
- **localStorage**: Persistencia de JWT

### Páginas Disponibles

#### Públicas
- `index.html` - Inicio
- `create-appointment.html` - Crear cita (sin login)
- `login.html` - Iniciar sesión
- `register.html` - Registrarse
- `reset-password.html` - Recuperar contraseña

#### Usuario Autenticado
- `appointments.html` - Mis citas
- `history.html` - Mi historial

#### Admin (Requiere rol admin)
- `admin-appointments.html` - Gestión de citas
- `admin-history.html` - Historial completo
- `admin-records.html` - Expedientes clínicos

### Cliente API (`js/api-client.js`)

Interfaz centralizada para todas las llamadas HTTP:

```javascript
// Autenticación
api.register(phone, name, password)
api.login(phone, password)
api.logout()
api.me()
api.requestPasswordReset(phone)
api.resetPassword(token, newPassword)

// Citas
api.createAppointment({ name, phone, date, time, description })
api.listAppointmentsByDay()
api.listAppointmentsSelf()
api.adminCreateAppointment({ userId, date, time, description })
api.updateAppointment(id, updates)
api.cancelAppointment(id, { reason })

// Usuarios
api.listUsers()
api.deleteUser(id)
api.updateUserClinicalObservations(id, { clinical_observations })
```

---

## 🔧 Mantenimiento y Troubleshooting

### Problemas Comunes

#### "No autorizado" (403)
- Verificar token JWT en localStorage
- Verificar que el usuario tiene el rol correcto
- Hacer logout e intentar login nuevamente

#### "Teléfono/Nombre duplicado"
- La BD solo permite un usuario por teléfono y nombre
- Verificar si el usuario ya existe

#### Citas no aparecen
- Verificar zona horaria de servidor y cliente
- Verificar que las fechas están en formato correcto (YYYY-MM-DD)

#### Email de reset no llega
- Verificar credenciales SMTP en `.env`
- Verificar que el usuario existe
- Revisar carpeta de spam

### Migraciones de Esquema
Las migraciones se ejecutan automáticamente en startup (`api/config/migrations.js`):
- Crea tablas si no existen
- Modifica columnas según sea necesario
- Inserta admin por defecto

### Limpiar Base de Datos
```bash
# MySQL
mysql -u root -p < api/database.sql

# PostgreSQL
psql -U usuario -d clinic_db < api/database_postgres.sql
```

---

## 📊 Estadísticas del Proyecto

- **Líneas de código**: ~3000+
- **Endpoints API**: 12+
- **Páginas Frontend**: 8
- **Modelos BD**: 2 (users, appointments)
- **Tecnologías**: Node.js, Express, MySQL/PostgreSQL, Bootstrap, Vanilla JS
- **Deployed on**: Render (production)

---

## 🚀 Deployment

### Render.com
Ver `DEPLOY_RENDER.md` para instrucciones completas.

**Comandos Principales:**
```bash
# Commit cambios
git add -A
git commit -m "descripción"

# Push a rama clinic (deployment automático)
git push clinic main

# O push a rama main (repositorio)
git push origin main
```

### Cloudflare
Ver `DEPLOY_CLOUDFLARE.md` para configuración de DNS y caching.

---

## 📝 Variables de Ambiente Ejemplo

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password123
DB_NAME=clinic_db
DB_PORT=3306

# Or PostgreSQL
# DB_HOST=db.example.com
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_NAME=clinic_db
# DB_PORT=5432
# DB_TYPE=postgres

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your_very_secret_key_here_min_32_chars

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# API
CORS_ORIGIN=https://sistema-de-citas-de-consultorio.onrender.com
```

---

## 📞 Contacto y Soporte

- **GitHub**: https://github.com/Luis1154-1154/Sistema-de-citas-de-consultorio
- **Email**: contact@example.com
- **Issues**: Reportar en GitHub

---

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

## 🎓 Changelog Reciente

### v1.0 - Producción
- ✅ Sistema de citas completo
- ✅ Expediente clínico
- ✅ Autenticación JWT
- ✅ Admin protegido de auto-eliminación
- ✅ Particularidades clínicas (alergias)
- ✅ Motivos de cancelación
- ✅ Soporte MySQL y PostgreSQL
- ✅ Deployment en Render

---

**Última actualización**: Junio 2026
**Versión**: 1.0
**Estado**: Producción ✅

# NexussXSystem — Sistema Empresarial Premium

> Plataforma empresarial completa con CRM, soporte técnico con IA, pipeline de ventas, base de conocimiento y herramientas de automatización.

---

## Descripción del proyecto

**NexussXSystem** es un sistema de gestión empresarial desarrollado como proyecto final de grado en la carrera de **Desarrollo y Administración de Aplicaciones Informáticas**. La plataforma centraliza todas las operaciones de una empresa de tecnología en una sola herramienta web: gestión de clientes (CRM), soporte técnico con SLA, pipeline de ventas Kanban, generación de contenido con Inteligencia Artificial y mucho más.

El sistema está diseñado para ser vendido a agencias y pequeñas empresas que necesitan una solución profesional sin pagar miles de dólares por herramientas como Salesforce o HubSpot.

---

## Tecnologías utilizadas

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 24.x |
| Framework web | Express.js | 4.x |
| Base de datos | SQLite (node:sqlite nativo) | Node built-in |
| Autenticación | JSON Web Tokens (JWT) | 9.x |
| Cifrado de contraseñas | bcryptjs | 2.x |
| Inteligencia Artificial | Anthropic Claude API | SDK 0.96 |
| Seguridad HTTP | Helmet.js | 7.x |
| Rate limiting | express-rate-limit | 7.x |
| Compresión | compression | 1.x |
| Subida de archivos | Multer | 1.x |
| Autenticación 2 factores | otplib (TOTP) | 12.x |
| Código QR | qrcode | 1.x |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) | — |

---

## Características principales

### Autenticación y seguridad
- Registro e inicio de sesión con JWT
- Autenticación de dos factores (2FA) con Google Authenticator
- 5 niveles de roles: Owner, Admin, Manager, Agent, Viewer
- API Keys propias para integraciones externas
- Límite de peticiones (rate limiting) anti-brute force
- Cifrado bcrypt para contraseñas
- Recuperación de contraseña con token de 24h
- Registro de auditoría completo de todas las acciones

### CRM — Gestión de Clientes
- Base de datos de contactos con etapas de relación
- Notas por contacto con historial
- Pipeline Kanban drag & drop de oportunidades de venta
- Deals con probabilidad, valor y fecha de cierre
- Importación masiva desde CSV
- Exportación a CSV
- IA para análisis de insights de cada contacto

### Sistema de Tickets de Soporte
- Tickets con SLA (Service Level Agreement) automático
- 4 prioridades: Urgente, Alta, Normal, Baja
- Categorías: General, Facturación, Técnico, Bug, Feature
- Respuestas con notas internas (no visibles al cliente)
- Sugerencias de respuesta generadas por IA
- Resumen automático de conversaciones con IA
- Sistema CSAT para valoración del cliente (1-5 estrellas)
- Notificaciones en tiempo real

### Generador de Contenido con IA
- 7 tipos de contenido: Blog, Email, Social Media, Landing Page, Descripción de producto, FAQ, Publicidad
- Control de tono: profesional, amigable, persuasivo, técnico, inspirador, informal
- 3 longitudes de contenido
- Guardado directo al blog del sistema
- Historial de generaciones

### Base de Conocimiento
- Artículos en formato Markdown con renderizado visual
- Categorías personalizables con íconos
- Sistema de búsqueda en tiempo real
- Contador de vistas y feedback "¿Fue útil?"
- Editor con barra de herramientas Markdown
- Generación de contenido con IA directamente en el editor
- Panel de administración separado

### Analytics y Reportes
- 9 KPIs en tiempo real
- 4 gráficas de evolución mensual (últimos 6 meses)
- Embudo de ventas (funnel) por etapas
- Métricas de tickets por categoría y prioridad
- CSAT promedio
- Resumen ejecutivo generado por IA
- Exportación de reportes a CSV

### Notificaciones
- Sistema de notificaciones en tiempo real via Server-Sent Events (SSE)
- Tipos: info, éxito, advertencia, error
- Centro de notificaciones con filtros
- Marcar como leída / leer todas

### Automatizaciones
- Reglas condicionales: si evento → si condición → ejecutar acción
- Eventos: ticket creado, ticket inactivo
- Acciones: notificar admin, notificar usuario, cambiar campo, cambiar estado
- Contador de ejecuciones por regla

### White-label
- Nombre de empresa personalizable
- Logo y colores configurables
- Configuración SMTP para emails propios
- Multi-tenancy preparado

---

## Estructura del proyecto

```
NexussXSystem/
│
├── server/                  # Backend (Node.js + Express)
│   ├── index.js             # Servidor principal — todos los endpoints
│   ├── db.js                # Base de datos SQLite — esquema y helpers
│   ├── package.json         # Dependencias del servidor
│   ├── .env                 # Variables de entorno (no subir a Git)
│   ├── data/
│   │   └── nexus.db         # Base de datos SQLite
│   └── uploads/             # Archivos subidos por usuarios
│
├── docs/                    # Documentación del proyecto
│   ├── DOCUMENTACION_TECNICA.md
│   ├── MANUAL_USUARIO.md
│   ├── PRESENTACION.html    # Presentación interactiva (abrir en navegador)
│   └── DIAGRAMA_SISTEMA.html
│
├── _v1_backup/              # Backup de la versión original (v1)
│
├── *.html                   # Páginas del frontend (19 páginas)
├── nexus.css                # Estilos globales del sistema
├── nexus.js                 # Lógica JavaScript del frontend
├── logo.jpeg / favicon.ico  # Identidad visual
├── INICIAR_SERVIDOR.bat     # Script de arranque (Windows)
└── README.md                # Este archivo
```

---

## Instalación y ejecución

### Requisitos previos
- Node.js v22 o superior (el proyecto usa v24)
- Sistema operativo: Windows, macOS o Linux

### Pasos

1. Clonar o descargar el proyecto en tu computadora

2. Instalar dependencias del servidor:
```bash
cd server
npm install
```

3. Configurar variables de entorno en `server/.env`:
```env
ANTHROPIC_API_KEY=tu_clave_aqui
PORT=3002
JWT_SECRET=un_secreto_seguro_largo
ADMIN_EMAIL=tu@email.com
```

4. Iniciar el servidor:

**Windows:** Doble clic en `INICIAR_SERVIDOR.bat`

**Terminal:**
```bash
cd server
node --experimental-sqlite index.js
```

5. Abrir el navegador en: `http://localhost:3002`

6. Crear cuenta con el email configurado en `ADMIN_EMAIL` para obtener rol Owner.

---

## Páginas del sistema

| Página | Descripción | Acceso |
|--------|-------------|--------|
| `index.html` | Pantalla de entrada | Público |
| `home.html` | Landing page principal | Público |
| `login.html` | Inicio de sesión | Público |
| `registro.html` | Crear cuenta | Público |
| `dashboard.html` | Panel de control con KPIs | Admin+ |
| `crm.html` | Gestión de contactos | Agent+ |
| `pipeline.html` | Pipeline Kanban de ventas | Agent+ |
| `tickets.html` | Sistema de soporte | Todos |
| `ai-tools.html` | Generador de contenido IA | Todos |
| `knowledge.html` | Base de conocimiento | Público |
| `kb-admin.html` | Administrar KB | Agent+ |
| `reports.html` | Reportes y analytics | Agent+ |
| `audit.html` | Log de auditoría | Admin+ |
| `notifications.html` | Centro de notificaciones | Todos |
| `settings.html` | Configuración de cuenta | Todos |
| `plans.html` | Planes y precios | Público |
| `admin.html` | Panel de administración | Agent+ |
| `timeline.html` | Proyectos de clientes | Todos |
| `referidos.html` | Programa de referidos | Todos |

---

## API Reference (principales endpoints)

### Autenticación
```
POST /api/register        — Crear cuenta
POST /api/login           — Iniciar sesión
GET  /api/me              — Obtener perfil
PATCH /api/me             — Actualizar perfil
POST /api/me/change-password
POST /api/me/2fa/setup    — Configurar 2FA
POST /api/me/2fa/enable   — Activar 2FA
```

### CRM
```
GET    /api/crm/contacts           — Listar contactos
POST   /api/crm/contacts           — Crear contacto
GET    /api/crm/contacts/:id       — Detalle de contacto
PATCH  /api/crm/contacts/:id       — Actualizar
DELETE /api/crm/contacts/:id       — Eliminar
POST   /api/crm/contacts/import    — Importar CSV
GET    /api/crm/contacts.csv       — Exportar CSV
GET    /api/crm/deals              — Pipeline de deals
POST   /api/crm/deals              — Crear deal
PATCH  /api/crm/deals/:id          — Actualizar deal (mover etapa)
```

### Tickets
```
GET    /api/tickets        — Listar tickets
POST   /api/tickets        — Crear ticket
GET    /api/tickets/:id    — Detalle + comentarios
PATCH  /api/tickets/:id    — Actualizar / responder
POST   /api/tickets/:id/csat — Valorar ticket
```

### Inteligencia Artificial
```
POST /api/jarvis                  — Chatbot Jarvis
POST /api/ai/ticket-suggest       — Sugerir respuesta a ticket
POST /api/ai/ticket-summarize     — Resumir conversación
POST /api/ai/generate-content     — Generar contenido (blog, email, etc.)
POST /api/ai/contact-insights     — Insights de contacto CRM
POST /api/ai/business-summary     — Resumen ejecutivo del negocio
```

### Base de Conocimiento
```
GET  /api/kb/categories    — Categorías
GET  /api/kb/articles      — Listar artículos
GET  /api/kb/articles/:id  — Leer artículo
POST /api/kb/articles      — Crear artículo
PATCH /api/kb/articles/:id — Editar
POST /api/kb/articles/:id/helpful — Feedback
```

---

## Seguridad implementada

- **JWT** con expiración de 7 días
- **bcrypt** con 12 rondas de sal para contraseñas
- **Helmet.js** para headers HTTP de seguridad
- **Rate limiting**: 20 req/15min en auth, 15 req/min en IA, 120 req/min general
- **CORS** configurado
- **2FA TOTP** compatible con Google Authenticator, Authy, etc.
- **Audit log** de todas las acciones sensibles con IP
- **Roles granulares** con middleware de autorización por endpoint

---

## Autor

Proyecto Final de Grado — 5to B  
**Desarrollo y Administración de Aplicaciones Informáticas**  
**Email:** nexussxsistem@gmail.com

---

*"Nuestro trabajo supera los límites... va más allá de este planeta." — Nexuss X Systems*

# Documentación Técnica — NexussXSystem v2.0

**Proyecto Final de Grado · 5to B — Desarrollo y Administración de Aplicaciones Informáticas**

---

## 1. Resumen ejecutivo

NexussXSystem es una plataforma web de gestión empresarial (SaaS) desarrollada completamente desde cero. Integra un CRM, sistema de tickets con SLA, pipeline de ventas Kanban, base de conocimiento, generador de contenido con Inteligencia Artificial y un panel de analíticas avanzado.

El sistema está orientado a agencias de tecnología y pequeñas empresas que necesitan una herramienta profesional centralizada. Se diferencia de soluciones existentes en su integración nativa con IA generativa (Claude de Anthropic) para automatizar tareas repetitivas.

---

## 2. Arquitectura del sistema

### 2.1 Modelo de arquitectura

El sistema sigue una arquitectura **cliente-servidor monolítica** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                       │
│                                                              │
│  HTML/CSS/JS (Vanilla)  ──►  nexus.js (API client)         │
│  19 páginas HTML                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / SSE (puerto 3002)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    SERVIDOR (Node.js)                         │
│                                                              │
│  Express.js ──► Middleware (Helmet, CORS, RateLimit, JWT)   │
│       │                                                      │
│       ├──► Rutas Auth         POST /api/register, /login    │
│       ├──► Rutas CRM          GET/POST /api/crm/*           │
│       ├──► Rutas Tickets      GET/POST /api/tickets/*       │
│       ├──► Rutas KB           GET/POST /api/kb/*            │
│       ├──► Rutas IA           POST /api/ai/*                │
│       ├──► Rutas Notif.       GET /api/notifications        │
│       ├──► Rutas Admin        GET /api/admin/*              │
│       └──► Static files       GET /*.html, *.css, *.js      │
│                                                              │
│  SQLite (node:sqlite)   ──►  server/data/nexus.db           │
│  Anthropic SDK          ──►  Claude Haiku + Sonnet           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Patrón de diseño

- **Backend:** Patrón MVC simplificado. Las rutas actúan como controladores, el módulo `db.js` como modelo.
- **Frontend:** Patrón de módulo con el objeto global `NXS` que encapsula todas las llamadas a la API.
- **Base de datos:** Modelo relacional con SQLite. Sin ORM — SQL nativo para máximo rendimiento y control.

### 2.3 Flujo de una petición típica

```
1. Usuario hace clic en "Nuevo ticket" en tickets.html
2. nexus.js::NXS.apiPost('/api/tickets', data) ejecuta un fetch()
3. Express recibe la petición en POST /api/tickets
4. Middleware auth() verifica el JWT en el header Authorization
5. Si válido, el handler crea el ticket en SQLite
6. Se ejecutan las automatizaciones del evento 'ticket.created'
7. Se crean notificaciones para los agentes via createNotification()
8. Se retorna { ok: true, id, number } al cliente
9. El cliente muestra un toast de confirmación
```

---

## 3. Base de datos

### 3.1 Motor de base de datos

Se utiliza **SQLite** a través del módulo nativo `node:sqlite` de Node.js 22.5+. Esta elección permite:
- Cero dependencias externas (compiladas)
- Archivo único `nexus.db` fácil de respaldar
- Rendimiento excelente para cargas de trabajo de pequeñas y medianas empresas
- SQL estándar compatible con migración futura a PostgreSQL o MySQL

### 3.2 Configuración

```javascript
// WAL mode: escrituras no bloquean lecturas
db.exec('PRAGMA journal_mode = WAL');
// Integridad referencial activada
db.exec('PRAGMA foreign_keys = ON');
```

### 3.3 Esquema de tablas

#### Núcleo del sistema
| Tabla | Registros típicos | Descripción |
|-------|------------------|-------------|
| `tenants` | 1 (por instalación) | Configuración de la empresa/instancia |
| `users` | 5–100 | Usuarios del sistema con roles |
| `audit_logs` | Miles | Registro de todas las acciones |
| `api_keys` | 1–20 | Claves API para integraciones |
| `notifications` | Cientos | Alertas del sistema |

#### CRM
| Tabla | Descripción |
|-------|-------------|
| `contacts` | Clientes, leads y prospectos |
| `deals` | Oportunidades de venta (pipeline) |
| `crm_activities` | Historial de actividades por contacto |
| `crm_notes` | Notas libres sobre contactos |

#### Soporte
| Tabla | Descripción |
|-------|-------------|
| `tickets` | Solicitudes de soporte con SLA |
| `ticket_comments` | Conversación del ticket |
| `ticket_templates` | Plantillas de respuesta |

#### Conocimiento y contenido
| Tabla | Descripción |
|-------|-------------|
| `kb_categories` | Categorías de la base de conocimiento |
| `kb_articles` | Artículos en formato Markdown |
| `blog_posts` | Artículos del blog público |

#### Operaciones
| Tabla | Descripción |
|-------|-------------|
| `orders` | Órdenes de compra |
| `referrals` | Programa de referidos |
| `projects` | Proyectos de clientes con timeline |
| `messages` | Mensajes del formulario de contacto |

#### Configuración
| Tabla | Descripción |
|-------|-------------|
| `plans` | Planes de suscripción disponibles |
| `subscriptions` | Suscripción activa del tenant |
| `automation_rules` | Reglas de automatización |
| `ai_conversations` | Historial de chats con Jarvis |

### 3.4 Diagrama simplificado de relaciones clave

```
tenants
  │
  ├──< users
  │     └──< api_keys
  │     └──< audit_logs
  │     └──< notifications
  │
  ├──< contacts
  │     └──< deals
  │     └──< crm_notes
  │     └──< crm_activities
  │
  ├──< tickets
  │     └──< ticket_comments
  │
  ├──< kb_categories
  │     └──< kb_articles
  │
  ├──< orders
  ├──< projects
  └──< automation_rules
```

---

## 4. Sistema de autenticación

### 4.1 JWT (JSON Web Tokens)

El sistema usa tokens JWT firmados con HS256. El token contiene:
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "role": "admin",
  "tenant_id": 1,
  "iat": 1716000000,
  "exp": 1716604800
}
```

- **Expiración:** 7 días
- **Algoritmo:** HS256 (HMAC-SHA256)
- **Almacenamiento:** localStorage en el cliente (clave `nxs_auth`)
- **Transmisión:** Header `Authorization: Bearer <token>`

### 4.2 Roles y permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `owner` | Propietario del sistema | Todo — asignado por email en .env |
| `admin` | Administrador | Todo excepto cambiar rol a owner |
| `manager` | Gerente | CRM, tickets, proyectos, KB, automatizaciones |
| `agent` | Agente | CRM lectura, responder tickets, crear KB |
| `viewer` | Usuario final | Ver sus tickets y proyectos |

### 4.3 Autenticación de dos factores (2FA)

Implementado con el estándar TOTP (Time-based One-Time Password) — RFC 6238:
1. Se genera un secreto único por usuario con `otplib.authenticator.generateSecret()`
2. Se genera un código QR en formato `otpauth://` para escanear con cualquier app TOTP
3. El usuario verifica con un código de 6 dígitos
4. En el login, si 2FA está activo, el servidor retorna `{ requires_2fa: true }` y espera el código
5. Compatible con: Google Authenticator, Authy, Microsoft Authenticator, Bitwarden

### 4.4 API Keys

Para integraciones sin usuario/contraseña:
- La clave se genera aleatoriamente como `nxs_[32 chars hex]`
- Solo el prefijo (8 chars) y el hash SHA-256 se almacenan en BD
- La clave completa se muestra **una sola vez** al crearla
- Se transmite en el header `X-API-Key`

---

## 5. Integración con IA (Anthropic Claude)

### 5.1 Modelos utilizados

| Funcionalidad | Modelo | Max tokens |
|---------------|--------|-----------|
| Chatbot Jarvis | claude-haiku-4-5 | 300 |
| Sugerir respuesta ticket | claude-haiku-4-5 | 400 |
| Resumir ticket | claude-haiku-4-5 | 200 |
| Insights de contacto | claude-haiku-4-5 | 300 |
| Resumen ejecutivo | claude-haiku-4-5 | 400 |
| Generar contenido (blog, email) | claude-sonnet-4-5 | 1500 |

Haiku para respuestas rápidas y operacionales; Sonnet para contenido largo y creativo.

### 5.2 System prompts

Cada endpoint de IA tiene un system prompt especializado:
- **Jarvis:** Asistente de ventas de Nexuss X Sistems, máximo 3 oraciones, siempre en español
- **Ticket suggest:** Agente de soporte empático, respuestas con pasos claros
- **Content generator:** Copywriter experto, optimizado para SEO

### 5.3 Manejo de errores de IA

Si la API de Anthropic no está disponible (sin clave, sin conexión), todos los endpoints de IA retornan `{ error: 'IA no configurada' }` con código 503, y el frontend muestra un mensaje informativo sin romper la funcionalidad principal.

---

## 6. Sistema de notificaciones en tiempo real

### 6.1 Server-Sent Events (SSE)

El endpoint `GET /api/notifications/stream` mantiene una conexión HTTP persistente usando SSE:

```javascript
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.write(`data: ${JSON.stringify({ type:'connected' })}\n\n`);
// Ping cada 25s para mantener la conexión viva
const ping = setInterval(() => res.write(':ping\n\n'), 25000);
```

Los clientes conectados se almacenan en un Map en memoria. Cuando se crea una notificación en BD, el sistema puede emitir eventos a los clientes conectados.

### 6.2 Cuándo se crean notificaciones

- Nuevo usuario registrado → admins
- Nuevo ticket creado → agents/admins (urgente: tipo error)
- Ticket actualizado → usuario propietario
- Nueva orden recibida → admins
- Proyecto asignado → cliente
- Automatización disparada → destinatario configurado

---

## 7. Sistema de SLA (Service Level Agreement)

Cuando se crea un ticket, se calcula automáticamente la fecha límite de respuesta:

| Prioridad | SLA | Cálculo |
|-----------|-----|---------|
| Urgente | 4 horas | `now + 4*3600000 ms` |
| Alta | 8 horas | `now + 8*3600000 ms` |
| Normal | 24 horas | `now + 24*3600000 ms` |
| Baja | 72 horas | `now + 72*3600000 ms` |

En el frontend, una barra visual muestra el % de tiempo consumido. Si `sla_due_at < now` y el ticket no está cerrado, `sla_breached = true` y se muestra en rojo con alerta en el dashboard.

---

## 8. Automatizaciones

El motor de automatizaciones es un sistema basado en reglas que se ejecuta sincrónicamente en el servidor:

```
CUANDO [evento] OCURRE
  SI [condición1] Y [condición2]
  ENTONCES [acción1], [acción2]
```

### 8.1 Eventos disponibles
- `ticket.created` — Cuando se crea un nuevo ticket
- `ticket.stale` — Cuando un ticket lleva X días sin respuesta

### 8.2 Operadores de condición
- `eq` (igual), `neq` (diferente), `gt` (mayor que), `lt` (menor que), `contains` (contiene)

### 8.3 Tipos de acciones
- `notify_admin` — Notificar a todos los admins
- `notify_user` — Notificar al usuario del ticket
- `set_field` — Cambiar un campo del ticket
- `set_status` — Cambiar el estado del ticket

---

## 9. Seguridad

### 9.1 Medidas implementadas

| Medida | Implementación |
|--------|----------------|
| Headers de seguridad | Helmet.js (X-Frame-Options, CSP, HSTS, etc.) |
| Rate limiting | 20 req/15min en auth, 120 req/min general, 15 req/min en IA |
| Cifrado de contraseñas | bcrypt con 12 rondas (factor de coste alto) |
| Tokens JWT | Firmados con secreto configurable, expiran en 7 días |
| API Keys | Almacenadas como hash SHA-256, nunca en texto plano |
| 2FA | TOTP RFC 6238 con ventana de tiempo de ±1 código |
| Validación de roles | Middleware por endpoint, no solo en el frontend |
| Audit log | IP registrada en cada acción sensible |
| CORS | Configurable, actualmente abierto para desarrollo |
| SQL Injection | Imposible: uso exclusivo de prepared statements |
| XSS | Sanitización en el servidor, no interpolación de HTML |

### 9.2 Lo que NO se implementó (fuera del alcance del proyecto)

- HTTPS/TLS (requiere certificado SSL y dominio)
- OAuth2 / SSO (requiere proveedor externo)
- Backups automáticos (solo manual: copiar nexus.db)
- CAPTCHA en formularios públicos

---

## 10. Rendimiento

- **SQLite con WAL:** Lecturas concurrentes sin bloquear escrituras
- **Índices en tablas clave:** `tenant_id`, `email`, `status`, `created_at`
- **Compresión HTTP:** gzip via `compression` middleware
- **Static files:** Servidos directamente por Express desde el sistema de archivos
- **Paginación:** Todos los endpoints de listado tienen `LIMIT` y `OFFSET`

---

## 11. Despliegue en producción

Para publicar el sistema en internet (fuera del alcance del proyecto final pero documentado):

1. Contratar un VPS (DigitalOcean, Render, Railway)
2. Instalar Node.js 22+
3. Copiar el proyecto al servidor
4. Configurar variables de entorno
5. Usar PM2 para mantener el proceso corriendo: `pm2 start server/index.js`
6. Configurar Nginx como reverse proxy con SSL de Let's Encrypt
7. Configurar dominio en DNS

---

## 12. Pruebas realizadas

| Prueba | Resultado |
|--------|-----------|
| Registro de usuario y asignación de rol owner | ✅ |
| Login con email/contraseña correctos | ✅ |
| Login con credenciales incorrectas | ✅ Retorna 401 |
| Acceso a endpoint admin sin token | ✅ Retorna 401 |
| Acceso a endpoint admin con rol viewer | ✅ Retorna 403 |
| Creación de ticket y notificación a agentes | ✅ |
| SLA calculado correctamente al crear ticket | ✅ |
| Generación de contenido con IA | ✅ |
| Drag & drop en pipeline Kanban | ✅ |
| Importación de contactos CSV | ✅ |
| Exportación de contactos CSV | ✅ |
| 2FA: setup, activación y login con código | ✅ |
| API Key: creación, uso en header, eliminación | ✅ |
| Audit log registra todas las acciones | ✅ |
| Notificaciones en tiempo real (SSE) | ✅ |

---

*Documento preparado para evaluación del proyecto final — 5to B*
*Desarrollo y Administración de Aplicaciones Informáticas*

// ─── DATABASE — NexusXSystem v2 ───────────────────────────────────────────────
// Uses Node.js built-in node:sqlite (Node 22.5+ / Node 24+) — no compilation needed
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dir, 'data', 'nexus.db');

// ensure data/ and uploads/ exist
if (!fs.existsSync(join(__dir, 'data'))) fs.mkdirSync(join(__dir, 'data'), { recursive: true });
if (!fs.existsSync(join(__dir, 'uploads'))) fs.mkdirSync(join(__dir, 'uploads'), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
db.exec(`
-- TENANTS (multi-tenancy)
CREATE TABLE IF NOT EXISTS tenants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'starter',
  logo_url    TEXT,
  primary_color TEXT DEFAULT '#00d4ff',
  custom_domain TEXT,
  smtp_json   TEXT,
  branding_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL DEFAULT 1,
  email           TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer',
  avatar_url      TEXT,
  phone           TEXT,
  verified        INTEGER NOT NULL DEFAULT 0,
  verification_code TEXT,
  totp_secret     TEXT,
  totp_enabled    INTEGER NOT NULL DEFAULT 0,
  reset_token     TEXT,
  reset_expires   INTEGER,
  last_login_at   TEXT,
  login_count     INTEGER NOT NULL DEFAULT 0,
  metadata_json   TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  user_id     INTEGER,
  user_email  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  changes_json TEXT,
  ip          TEXT,
  ua          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);

-- API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  user_id     INTEGER NOT NULL,
  name        TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,
  key_hash    TEXT NOT NULL,
  permissions_json TEXT DEFAULT '["read"]',
  last_used_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- ─── CRM ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  position    TEXT,
  status      TEXT NOT NULL DEFAULT 'lead',
  stage       TEXT NOT NULL DEFAULT 'new',
  source      TEXT DEFAULT 'manual',
  value       REAL DEFAULT 0,
  assigned_to INTEGER,
  tags_json   TEXT DEFAULT '[]',
  notes       TEXT,
  avatar_url  TEXT,
  linkedin    TEXT,
  website     TEXT,
  address     TEXT,
  metadata_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email  ON contacts(email);

CREATE TABLE IF NOT EXISTS deals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  contact_id  INTEGER,
  title       TEXT NOT NULL,
  value       REAL NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'DOP',
  stage       TEXT NOT NULL DEFAULT 'prospecting',
  probability INTEGER NOT NULL DEFAULT 20,
  close_date  TEXT,
  assigned_to INTEGER,
  notes       TEXT,
  lost_reason TEXT,
  won_at      TEXT,
  lost_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(contact_id) REFERENCES contacts(id)
);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id, stage);

CREATE TABLE IF NOT EXISTS crm_activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  contact_id  INTEGER,
  deal_id     INTEGER,
  type        TEXT NOT NULL,
  note        TEXT,
  created_by  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(contact_id) REFERENCES contacts(id),
  FOREIGN KEY(deal_id)    REFERENCES deals(id)
);

CREATE TABLE IF NOT EXISTS crm_notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  contact_id  INTEGER,
  client_email TEXT,
  text        TEXT NOT NULL,
  created_by  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── TICKETS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  number      TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT NOT NULL DEFAULT 'normal',
  status      TEXT NOT NULL DEFAULT 'open',
  category    TEXT DEFAULT 'general',
  sla_hours   INTEGER DEFAULT 24,
  sla_due_at  TEXT,
  assigned_to INTEGER,
  user_id     INTEGER,
  user_email  TEXT NOT NULL,
  user_name   TEXT,
  tags_json   TEXT DEFAULT '[]',
  csat_score  INTEGER,
  ai_summary  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at   TEXT,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant  ON tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_email   ON tickets(user_email);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id   INTEGER NOT NULL,
  text        TEXT NOT NULL,
  from_email  TEXT NOT NULL,
  from_name   TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0,
  is_ai       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '📄',
  description TEXT,
  order_num   INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kb_articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  category_id INTEGER,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  views       INTEGER NOT NULL DEFAULT 0,
  helpful_yes INTEGER NOT NULL DEFAULT 0,
  helpful_no  INTEGER NOT NULL DEFAULT 0,
  created_by  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(category_id) REFERENCES kb_categories(id)
);
CREATE INDEX IF NOT EXISTS idx_kb_tenant ON kb_articles(tenant_id, is_published);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  user_id     INTEGER,
  user_email  TEXT,
  type        TEXT NOT NULL DEFAULT 'info',
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- ─── MESSAGES (contact form) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  replied_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id     INTEGER NOT NULL DEFAULT 1,
  customer_json TEXT NOT NULL,
  items_json    TEXT NOT NULL,
  total         REAL NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'DOP',
  discount      REAL NOT NULL DEFAULT 0,
  referral_code TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── REFERRALS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  user_id     INTEGER,
  email       TEXT NOT NULL,
  name        TEXT,
  code        TEXT UNIQUE NOT NULL,
  discount    REAL NOT NULL DEFAULT 10,
  uses        INTEGER NOT NULL DEFAULT 0,
  earnings    REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id     INTEGER NOT NULL DEFAULT 1,
  client_email  TEXT NOT NULL,
  name          TEXT NOT NULL,
  stages_json   TEXT NOT NULL DEFAULT '[]',
  progress      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  notes         TEXT,
  start_date    TEXT,
  due_date      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── BLOG ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  excerpt     TEXT,
  content     TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  is_published INTEGER NOT NULL DEFAULT 0,
  featured_image TEXT,
  author_id   INTEGER,
  views       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── AUTOMATION RULES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automation_rules (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL DEFAULT 1,
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,
  conditions_json TEXT DEFAULT '[]',
  actions_json    TEXT NOT NULL DEFAULT '[]',
  is_active       INTEGER NOT NULL DEFAULT 1,
  runs_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── PLANS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT UNIQUE NOT NULL,
  price_monthly   REAL NOT NULL DEFAULT 0,
  price_yearly    REAL NOT NULL DEFAULT 0,
  features_json   TEXT NOT NULL DEFAULT '[]',
  limits_json     TEXT NOT NULL DEFAULT '{}',
  is_active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id       INTEGER NOT NULL,
  plan_name       TEXT NOT NULL DEFAULT 'starter',
  status          TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at   TEXT,
  period_ends_at  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- ─── AI CONVERSATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  session_id  TEXT NOT NULL,
  user_id     INTEGER,
  messages_json TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── TASK CATEGORIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#00d4ff',
  icon        TEXT DEFAULT '📋',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── TASKS (Gestión de Tareas) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id     INTEGER NOT NULL DEFAULT 1,
  category_id   INTEGER,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pendiente',
  priority      TEXT NOT NULL DEFAULT 'normal',
  assigned_to   INTEGER,
  assigned_email TEXT,
  created_by    INTEGER,
  due_date      TEXT,
  completed_at  TEXT,
  progress      INTEGER NOT NULL DEFAULT 0,
  tags_json     TEXT DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(tenant_id)   REFERENCES tenants(id),
  FOREIGN KEY(category_id) REFERENCES task_categories(id),
  FOREIGN KEY(assigned_to) REFERENCES users(id),
  FOREIGN KEY(created_by)  REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant  ON tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

-- ─── TASK COMMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL,
  user_id     INTEGER,
  user_email  TEXT NOT NULL,
  user_name   TEXT,
  text        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
`);

// ─── SEED DEFAULT TENANT ──────────────────────────────────────────────────────
const tenantCount = db.prepare('SELECT COUNT(*) as c FROM tenants').get().c;
if (tenantCount === 0) {
  db.prepare(`INSERT INTO tenants (name, slug, plan) VALUES (?, ?, ?)`).run('Nexuss X Sistems', 'nexuss', 'agency');
}

// ─── SEED DEFAULT PLANS ───────────────────────────────────────────────────────
const planCount = db.prepare('SELECT COUNT(*) as c FROM plans').get().c;
if (planCount === 0) {
  const insertPlan = db.prepare(`INSERT INTO plans (name, price_monthly, price_yearly, features_json, limits_json) VALUES (?,?,?,?,?)`);
  insertPlan.run('starter',  49,   470,  JSON.stringify(['CRM básico','Tickets','5 usuarios','KB pública']), JSON.stringify({users:5, contacts:200, tickets_mo:50}));
  insertPlan.run('business', 199,  1990, JSON.stringify(['CRM completo','IA básica','25 usuarios','Pipeline','Reportes','Email integrado']), JSON.stringify({users:25, contacts:2000, tickets_mo:500}));
  insertPlan.run('agency',   499,  4990, JSON.stringify(['Todo Business','White-label','Usuarios ilimitados','API acceso','Automatizaciones','Soporte prioritario']), JSON.stringify({users:-1, contacts:-1, tickets_mo:-1}));
  insertPlan.run('enterprise',0,   0,    JSON.stringify(['Todo Agency','SLA garantizado','Onboarding dedicado','Custom domain','SSO','Auditoría avanzada']), JSON.stringify({users:-1, contacts:-1, tickets_mo:-1}));
}

// ─── SEED DEFAULT KB ──────────────────────────────────────────────────────────
const kbCount = db.prepare('SELECT COUNT(*) as c FROM kb_categories').get().c;
if (kbCount === 0) {
  const cats = db.prepare(`INSERT INTO kb_categories (tenant_id, name, icon, order_num) VALUES (1,?,?,?)`);
  const art  = db.prepare(`INSERT INTO kb_articles (tenant_id, category_id, title, slug, content, is_published, created_by) VALUES (1,?,?,?,?,1,1)`);
  const c1 = cats.run('Primeros pasos', '🚀', 1).lastInsertRowid;
  const c2 = cats.run('Facturación', '💳', 2).lastInsertRowid;
  const c3 = cats.run('Soporte técnico', '🛠️', 3).lastInsertRowid;
  art.run(c1, 'Cómo crear tu cuenta', 'como-crear-cuenta', '## Crear una cuenta\n\n1. Haz clic en **Crear cuenta** en la página principal.\n2. Completa tu nombre, email y contraseña.\n3. Verifica tu email con el código que te enviamos.\n4. Accede a tu panel privado.\n\n¡Listo! Ya puedes empezar a usar la plataforma.', );
  art.run(c1, 'Primeros pasos con el CRM', 'primeros-pasos-crm', '## Tu CRM\n\nEl CRM te permite gestionar todos tus contactos, clientes y oportunidades de negocio en un solo lugar.\n\n### Agregar un contacto\n1. Ve a **CRM → Contactos**.\n2. Haz clic en **Nuevo contacto**.\n3. Completa los datos y guarda.\n\n### Pipeline de ventas\nEl pipeline te muestra el estado de cada oportunidad: Prospecto → Contactado → Propuesta → Negociación → Ganado.');
  art.run(c2, 'Planes y precios', 'planes-y-precios', '## Nuestros planes\n\n| Plan | Precio | Usuarios |\n|------|--------|----------|\n| Starter | $49/mes | 5 |\n| Business | $199/mes | 25 |\n| Agency | $499/mes | Ilimitado |\n\nTodos los planes incluyen 14 días de prueba gratuita.\n\nContáctanos para planes Enterprise personalizados.');
  art.run(c3, '¿Cómo abrir un ticket de soporte?', 'como-abrir-ticket', '## Abrir un ticket\n\n1. Ve a **Soporte → Tickets**.\n2. Haz clic en **Nuevo ticket**.\n3. Selecciona la categoría y prioridad.\n4. Describe tu problema con el mayor detalle posible.\n5. Adjunta capturas si es necesario.\n\nNuestro equipo responde en menos de 24 horas (plan Starter) o 4 horas (plan Agency).');
}

// ─── SEED DEFAULT TICKET TEMPLATES ───────────────────────────────────────────
const tmplCount = db.prepare('SELECT COUNT(*) as c FROM ticket_templates').get().c;
if (tmplCount === 0) {
  const tmpl = db.prepare(`INSERT INTO ticket_templates (tenant_id, name, body, category) VALUES (1,?,?,?)`);
  tmpl.run('Agradecimiento por contactar', 'Hola {{name}},\n\nGracias por contactarnos. Hemos recibido tu ticket #{{number}} y lo estamos revisando.\n\nNuestro tiempo de respuesta estimado es de {{sla_hours}} horas.\n\n¡Estamos para ayudarte!\n\nEquipo Nexuss X Sistems', 'general');
  tmpl.run('Solicitar más información', 'Hola {{name}},\n\nGracias por tu mensaje. Para poder ayudarte mejor, ¿podrías proporcionarnos los siguientes detalles?\n\n- [Detalle específico 1]\n- [Detalle específico 2]\n\nEsperamos tu respuesta.\n\nSaludos,\nEquipo de soporte', 'general');
  tmpl.run('Problema resuelto', 'Hola {{name}},\n\nTe confirmamos que tu solicitud ha sido resuelta.\n\n**Solución aplicada:** [Descripción de la solución]\n\nSi tienes alguna duda adicional, no dudes en contactarnos.\n\n¡Que tengas un excelente día!\n\nEquipo Nexuss X Sistems', 'general');
}

// ─── SEED DEFAULT AUTOMATION RULES ───────────────────────────────────────────
const autoCount = db.prepare('SELECT COUNT(*) as c FROM automation_rules').get().c;
if (autoCount === 0) {
  const rule = db.prepare(`INSERT INTO automation_rules (tenant_id, name, trigger_event, conditions_json, actions_json) VALUES (1,?,?,?,?)`);
  rule.run('Notificar ticket urgente', 'ticket.created', JSON.stringify([{field:'priority',op:'eq',value:'urgent'}]), JSON.stringify([{type:'notify_admin',message:'Nuevo ticket URGENTE: {{title}}'}]));
  rule.run('Auto-asignar tickets de facturación', 'ticket.created', JSON.stringify([{field:'category',op:'eq',value:'billing'}]), JSON.stringify([{type:'set_field',field:'assigned_to',value:'1'}]));
  rule.run('Cerrar tickets sin respuesta', 'ticket.stale', JSON.stringify([{field:'days_open',op:'gt',value:'7'}]), JSON.stringify([{type:'set_status',value:'closed'},{type:'notify_user',message:'Tu ticket fue cerrado por inactividad.'}]));
}

// ─── SEED TASK CATEGORIES + 20 TASKS ─────────────────────────────────────────
const taskCatCount = db.prepare('SELECT COUNT(*) as c FROM task_categories').get().c;
if (taskCatCount === 0) {
  const icat = db.prepare(`INSERT INTO task_categories (tenant_id, name, color, icon) VALUES (1,?,?,?)`);
  const c1 = icat.run('Desarrollo Web',    '#00d4ff', '💻').lastInsertRowid;
  const c2 = icat.run('Diseño UI/UX',      '#7926ff', '🎨').lastInsertRowid;
  const c3 = icat.run('Base de Datos',     '#22c55e', '🗄️').lastInsertRowid;
  const c4 = icat.run('Seguridad',         '#ef4444', '🔒').lastInsertRowid;
  const c5 = icat.run('Documentación',     '#f59e0b', '📝').lastInsertRowid;

  const itask = db.prepare(`INSERT INTO tasks (tenant_id, category_id, title, description, status, priority, assigned_email, progress, due_date) VALUES (1,?,?,?,?,?,?,?,?)`);
  itask.run(c1,'Crear página de inicio (index.html)','Diseñar y codificar la página principal del proyecto usando HTML5 y CSS3.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-10');
  itask.run(c1,'Implementar sistema de autenticación','Desarrollar login, registro y verificación por correo electrónico.','completada','urgente','nexussxsistem@gmail.com',100,'2026-04-12');
  itask.run(c1,'Desarrollar API REST con Express','Crear endpoints para usuarios, tareas, tickets y reportes.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-15');
  itask.run(c2,'Diseñar paleta de colores y tipografía','Definir variables CSS, tema oscuro y sistema de diseño.','completada','normal','nexussxsistem@gmail.com',100,'2026-04-08');
  itask.run(c2,'Crear componentes reutilizables CSS','Botones, tarjetas, badges, modales y tablas en nexus.css.','completada','normal','nexussxsistem@gmail.com',100,'2026-04-14');
  itask.run(c3,'Diseñar esquema de base de datos','Definir tablas, relaciones y llaves foráneas en SQLite.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-11');
  itask.run(c3,'Crear registros semilla (20 por tabla)','Poblar la base de datos con datos de prueba realistas.','completada','normal','nexussxsistem@gmail.com',100,'2026-04-20');
  itask.run(c3,'Implementar roles y permisos de BD','Configurar roles: owner, admin, manager, agent, viewer.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-18');
  itask.run(c3,'Configurar backup automático de datos','Sistema de respaldo de la base de datos SQLite.','en_progreso','alta','nexussxsistem@gmail.com',75,'2026-05-25');
  itask.run(c4,'Implementar JWT y rate limiting','Asegurar la API con tokens JWT y límites de petición.','completada','urgente','nexussxsistem@gmail.com',100,'2026-04-16');
  itask.run(c4,'Configurar CORS y Helmet','Añadir cabeceras de seguridad HTTP al servidor Express.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-17');
  itask.run(c1,'Desarrollar panel de tareas (tareas.html)','Página para crear, asignar, filtrar y completar tareas.','en_progreso','alta','nexussxsistem@gmail.com',80,'2026-05-28');
  itask.run(c1,'Integrar Chart.js para reportes','Gráficos de barras, dona y línea en el módulo de reportes.','completada','normal','nexussxsistem@gmail.com',100,'2026-04-25');
  itask.run(c5,'Redactar documentación técnica','Manual técnico del sistema con arquitectura y APIs.','completada','normal','nexussxsistem@gmail.com',100,'2026-05-01');
  itask.run(c5,'Crear manual de usuario','Guía de uso de la plataforma para usuarios finales.','completada','normal','nexussxsistem@gmail.com',100,'2026-05-05');
  itask.run(c2,'Diseñar módulo FOL/SDSS','Página informativa sobre el Sistema Dominicano de Seguridad Social.','en_progreso','alta','nexussxsistem@gmail.com',60,'2026-05-30');
  itask.run(c1,'Implementar módulo CRM','Gestión de contactos, deals y pipeline de ventas.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-22');
  itask.run(c1,'Desarrollar sistema de tickets de soporte','Módulo de soporte con prioridades, SLA y comentarios.','completada','alta','nexussxsistem@gmail.com',100,'2026-04-28');
  itask.run(c1,'Crear portafolio de trabajos realizados','Sección con ejemplos de proyectos anteriores.','en_progreso','normal','nexussxsistem@gmail.com',50,'2026-06-01');
  itask.run(c4,'Realizar pruebas de seguridad (QA)','Verificar inyección SQL, XSS, autenticación y autorización.','pendiente','alta','nexussxsistem@gmail.com',0,'2026-06-05');
}

// ─── SEED 20 CONTACTS ────────────────────────────────────────────────────────
const contactCount = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c;
if (contactCount === 0) {
  const ic = db.prepare(`INSERT INTO contacts (tenant_id,name,email,phone,company,position,status,stage,value) VALUES (1,?,?,?,?,?,?,?,?)`);
  ic.run('Ana Martínez','ana.martinez@gmail.com','809-555-0101','Politécnico Loyola','Directora','cliente','won',45000);
  ic.run('Carlos Rodríguez','carlos.rod@outlook.com','809-555-0102','ITLA','Coordinador','lead','contacted',12000);
  ic.run('María Peña','maria.pena@empresa.do','829-555-0103','INFOTEP','Gerente de TI','prospect','new',28000);
  ic.run('José Díaz','jose.diaz@techdo.com','809-555-0104','TechDO','CEO','cliente','won',95000);
  ic.run('Laura Gómez','laura.g@innovar.do','849-555-0105','InnovarDO','Diseñadora UX','lead','proposal',18000);
  ic.run('Pedro Sánchez','pedro.s@banreservas.do','809-555-0106','Banreservas','Director IT','prospect','new',150000);
  ic.run('Carmen López','c.lopez@claro.do','829-555-0107','Claro RD','Gerente Digital','lead','contacted',75000);
  ic.run('Roberto Jiménez','r.jimenez@gmail.com','809-555-0108','Freelance','Desarrollador','prospect','new',8000);
  ic.run('Sofía Ramírez','sofia.r@uasd.edu.do','849-555-0109','UASD','Profesora','cliente','won',22000);
  ic.run('Miguel Torres','m.torres@orange.do','809-555-0110','Orange RD','Analista','lead','negotiation',55000);
  ic.run('Isabella Núñez','isabella.n@tricom.do','829-555-0111','Tricom','Marketing Manager','prospect','proposal',32000);
  ic.run('Daniel Herrera','d.herrera@altice.do','809-555-0112','Altice','CTO','lead','contacted',200000);
  ic.run('Valentina Castro','v.castro@gmail.com','849-555-0113','Freelance','Diseñadora','cliente','won',15000);
  ic.run('Alejandro Morales','a.morales@bhdleon.do','809-555-0114','BHD León','VP Tecnología','prospect','new',300000);
  ic.run('Gabriela Reyes','g.reyes@scotiabank.do','829-555-0115','Scotiabank','Gerente Sistemas','lead','proposal',180000);
  ic.run('Andrés Vargas','a.vargas@adp.do','809-555-0116','ADP','Desarrollador','prospect','contacted',25000);
  ic.run('Natalia Flores','n.flores@politec.edu.do','849-555-0117','Politécnico María','Coordinadora IT','cliente','won',35000);
  ic.run('Luis Guzmán','l.guzman@gmail.com','809-555-0118','StartupRD','Fundador','lead','negotiation',65000);
  ic.run('Paola Medina','p.medina@dgii.gov.do','829-555-0119','DGII','Analista TI','prospect','new',90000);
  ic.run('Erick Rosario','e.rosario@mescyt.gob.do','809-555-0120','MESCYT','Técnico Web','lead','contacted',20000);
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
export function j(v) { try { return JSON.parse(v || '[]'); } catch { return []; } }
export function jObj(v) { try { return JSON.parse(v || '{}'); } catch { return {}; } }
export function now() { return new Date().toISOString(); }
export function slug(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

export function nextTicketNumber(tenantId) {
  const row = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE tenant_id=?').get(tenantId);
  return `TKT-${String(row.c + 1).padStart(4,'0')}`;
}

export function createNotification(tenantId, userId, userEmail, type, title, message, link = null) {
  db.prepare(`INSERT INTO notifications (tenant_id, user_id, user_email, type, title, message, link) VALUES (?,?,?,?,?,?,?)`).run(tenantId, userId, userEmail, type, title, message, link);
}

export function createAuditLog(tenantId, userId, userEmail, action, entityType, entityId, changes, ip) {
  db.prepare(`INSERT INTO audit_logs (tenant_id, user_id, user_email, action, entity_type, entity_id, changes_json, ip) VALUES (?,?,?,?,?,?,?,?)`).run(tenantId, userId, userEmail, action, entityType, String(entityId || ''), JSON.stringify(changes || {}), ip || '');
}

export function runAutomations(tenantId, event, data) {
  const rules = db.prepare('SELECT * FROM automation_rules WHERE tenant_id=? AND trigger_event=? AND is_active=1').all(tenantId, event);
  for (const rule of rules) {
    const conditions = j(rule.conditions_json);
    const passes = conditions.every(c => {
      const val = String(data[c.field] || '');
      if (c.op === 'eq')  return val === String(c.value);
      if (c.op === 'neq') return val !== String(c.value);
      if (c.op === 'gt')  return Number(val) > Number(c.value);
      if (c.op === 'lt')  return Number(val) < Number(c.value);
      if (c.op === 'contains') return val.includes(String(c.value));
      return true;
    });
    if (!passes) continue;
    const actions = j(rule.actions_json);
    for (const action of actions) {
      if (action.type === 'notify_admin') {
        const admins = db.prepare("SELECT id, email FROM users WHERE tenant_id=? AND role IN ('admin','owner')").all(tenantId);
        admins.forEach(a => createNotification(tenantId, a.id, a.email, 'warning', 'Automatización', interpolate(action.message, data), data.link || null));
      }
      if (action.type === 'notify_user' && data.user_id) {
        createNotification(tenantId, data.user_id, data.user_email, 'info', 'Actualización de ticket', interpolate(action.message, data), null);
      }
      if (action.type === 'set_field' && data._ticketId) {
        db.prepare(`UPDATE tickets SET ${action.field}=?, updated_at=datetime('now') WHERE id=?`).run(action.value, data._ticketId);
      }
      if (action.type === 'set_status' && data._ticketId) {
        db.prepare(`UPDATE tickets SET status=?, updated_at=datetime('now') WHERE id=?`).run(action.value, data._ticketId);
      }
    }
    db.prepare('UPDATE automation_rules SET runs_count=runs_count+1 WHERE id=?').run(rule.id);
  }
}

function interpolate(str, data) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] || '');
}

// ─── GARANTIZAR ROL OWNER AL ADMIN EMAIL ─────────────────────────────────────
// Cada vez que el servidor arranca, el ADMIN_EMAIL siempre tiene rol owner.
// Esto corrige cuentas que quedaron con rol viewer por error en el registro.
if (process.env.ADMIN_EMAIL) {
  const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const adminUser = db.prepare("SELECT id, role FROM users WHERE email=? AND tenant_id=1").get(adminEmail);
  if (adminUser && adminUser.role !== 'owner') {
    db.prepare("UPDATE users SET role='owner' WHERE email=? AND tenant_id=1").run(adminEmail);
    console.log(`[DB] Admin role fixed: ${adminEmail} → owner`);
  }
}

console.log('[DB] SQLite ready:', dbPath);

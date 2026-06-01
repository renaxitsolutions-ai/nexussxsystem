// ─── DATABASE LOCAL — SQLite (node:sqlite) ────────────────────────────────────
// Se usa automáticamente cuando DATABASE_URL no está definida (desarrollo local).
// En producción (Render) se usa db-pg.js (PostgreSQL).

import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dir, 'data', 'nexus.db');

const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec('PRAGMA journal_mode=WAL');
sqlite.exec('PRAGMA foreign_keys=ON');

console.log('[DB] Modo LOCAL — SQLite →', DB_PATH);

// ─── SQL ADAPTERS ─────────────────────────────────────────────────────────────
// Convierte sintaxis PostgreSQL → SQLite en tiempo de esquema
function schemaify(sql) {
  return sql
    .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/TIMESTAMPTZ\s+NOT NULL\s+DEFAULT\s+NOW\(\)/gi, "TEXT NOT NULL DEFAULT (datetime('now'))")
    .replace(/TIMESTAMPTZ\s+DEFAULT\s+NOW\(\)/gi, "TEXT DEFAULT (datetime('now'))")
    .replace(/TIMESTAMPTZ/gi, 'TEXT')
    .replace(/NUMERIC\(\d+,\d+\)\s+NOT NULL\s+DEFAULT\s+0/gi, 'REAL NOT NULL DEFAULT 0')
    .replace(/NUMERIC\(\d+,\d+\)/gi, 'REAL')
    .replace(/SMALLINT/gi, 'INTEGER')
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/CURRENT_DATE/gi, "date('now')");
}

// Convierte sintaxis PostgreSQL → SQLite en queries en tiempo de ejecución
function runtimeify(sql) {
  let i = 0;
  return sql
    .replace(/\$\d+/g, '?')
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/\bCURRENT_DATE\b/gi, "date('now')")
    .replace(/\s+RETURNING\s+\w+\s*/gi, ' ');
}

// ─── POOL MOCK (misma interfaz que pg.Pool) ───────────────────────────────────
export const pool = {
  query(rawSql, params = []) {
    const sql = runtimeify(rawSql);
    try {
      if (/^\s*(SELECT|WITH|PRAGMA)/i.test(sql.trim())) {
        const stmt = sqlite.prepare(sql);
        const rows = params.length ? stmt.all(...params) : stmt.all();
        return Promise.resolve({ rows, rowCount: rows.length });
      } else {
        const stmt = sqlite.prepare(sql);
        const info = params.length ? stmt.run(...params) : stmt.run();
        const id = sqlite.prepare('SELECT last_insert_rowid() as id').get();
        return Promise.resolve({
          rows: [{ id: id?.id ?? null }],
          rowCount: info.changes ?? 0
        });
      }
    } catch (e) {
      console.error('[SQLite pool.query error]', e.message, '\nSQL:', sql.slice(0, 300));
      return Promise.reject(e);
    }
  },
  connect() {
    const self = this;
    return Promise.resolve({
      query(sql, params) { return self.query(sql, params); },
      release() {}
    });
  },
  on() {}
};

// ─── DB PREPARE SHIM (misma interfaz que db-pg.js) ───────────────────────────
// Convierte $1,$2 → ? y envuelve node:sqlite (sync) en Promises
export const db = {
  prepare(rawSql) {
    const sql = runtimeify(rawSql);
    return {
      get(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        try {
          const stmt = sqlite.prepare(sql);
          const row = params.length ? stmt.get(...params) : stmt.get();
          return Promise.resolve(row ?? null);
        } catch (e) {
          console.error('[SQLite get error]', e.message, sql.slice(0, 200));
          return Promise.resolve(null);
        }
      },
      all(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        try {
          const stmt = sqlite.prepare(sql);
          const rows = params.length ? stmt.all(...params) : stmt.all();
          return Promise.resolve(rows);
        } catch (e) {
          console.error('[SQLite all error]', e.message, sql.slice(0, 200));
          return Promise.resolve([]);
        }
      },
      run(...args) {
        const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        try {
          const stmt = sqlite.prepare(sql);
          const info = params.length ? stmt.run(...params) : stmt.run();
          const lastRow = sqlite.prepare('SELECT last_insert_rowid() as id').get();
          return Promise.resolve({ changes: info.changes ?? 0, lastInsertRowid: lastRow?.id ?? null });
        } catch (e) {
          console.error('[SQLite run error]', e.message, sql.slice(0, 200));
          return Promise.resolve({ changes: 0, lastInsertRowid: null });
        }
      }
    };
  }
};

// ─── SCHEMA (PostgreSQL DDL convertido a SQLite) ──────────────────────────────
async function createSchema() {
  const schema = schemaify(`
CREATE TABLE IF NOT EXISTS tenants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'starter',
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#00d4ff',
  custom_domain TEXT,
  smtp_json     TEXT,
  branding_json TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL DEFAULT 1,
  email             TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  name              TEXT,
  role              TEXT NOT NULL DEFAULT 'viewer',
  avatar_url        TEXT,
  phone             TEXT,
  verified          INTEGER NOT NULL DEFAULT 0,
  verification_code TEXT,
  totp_secret       TEXT,
  totp_enabled      INTEGER NOT NULL DEFAULT 0,
  reset_token       TEXT,
  reset_expires     INTEGER,
  last_login_at     TEXT,
  login_count       INTEGER NOT NULL DEFAULT 0,
  metadata_json     TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
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
CREATE TABLE IF NOT EXISTS api_keys (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id        INTEGER NOT NULL DEFAULT 1,
  user_id          INTEGER NOT NULL,
  name             TEXT NOT NULL,
  key_prefix       TEXT NOT NULL,
  key_hash         TEXT NOT NULL,
  permissions_json TEXT DEFAULT '["read"]',
  last_used_at     TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
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
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS crm_notes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id    INTEGER NOT NULL DEFAULT 1,
  contact_id   INTEGER,
  client_email TEXT,
  text         TEXT NOT NULL,
  created_by   INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
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
  closed_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_email  ON tickets(user_email);
CREATE TABLE IF NOT EXISTS ticket_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id   INTEGER NOT NULL,
  text        TEXT NOT NULL,
  from_email  TEXT NOT NULL,
  from_name   TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0,
  is_ai       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ticket_templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
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
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id    INTEGER NOT NULL DEFAULT 1,
  category_id  INTEGER,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  views        INTEGER NOT NULL DEFAULT 0,
  helpful_yes  INTEGER NOT NULL DEFAULT 0,
  helpful_no   INTEGER NOT NULL DEFAULT 0,
  created_by   INTEGER,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
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
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
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
CREATE TABLE IF NOT EXISTS blog_posts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id      INTEGER NOT NULL DEFAULT 1,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL,
  excerpt        TEXT,
  content        TEXT NOT NULL,
  category       TEXT DEFAULT 'general',
  is_published   INTEGER NOT NULL DEFAULT 0,
  featured_image TEXT,
  author_id      INTEGER,
  views          INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
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
CREATE TABLE IF NOT EXISTS plans (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT UNIQUE NOT NULL,
  price_monthly  REAL NOT NULL DEFAULT 0,
  price_yearly   REAL NOT NULL DEFAULT 0,
  features_json  TEXT NOT NULL DEFAULT '[]',
  limits_json    TEXT NOT NULL DEFAULT '{}',
  is_active      INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id      INTEGER NOT NULL,
  plan_name      TEXT NOT NULL DEFAULT 'starter',
  status         TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at  TEXT,
  period_ends_at TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ai_conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id     INTEGER NOT NULL DEFAULT 1,
  session_id    TEXT NOT NULL,
  user_id       INTEGER,
  messages_json TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id   INTEGER NOT NULL DEFAULT 1,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#00d4ff',
  icon        TEXT DEFAULT '📋',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id      INTEGER NOT NULL DEFAULT 1,
  category_id    INTEGER,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pendiente',
  priority       TEXT NOT NULL DEFAULT 'normal',
  assigned_to    INTEGER,
  assigned_email TEXT,
  created_by     INTEGER,
  due_date       TEXT,
  completed_at   TEXT,
  progress       INTEGER NOT NULL DEFAULT 0,
  tags_json      TEXT DEFAULT '[]',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant   ON tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE TABLE IF NOT EXISTS task_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL,
  user_id     INTEGER,
  user_email  TEXT NOT NULL,
  user_name   TEXT,
  text        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
  sqlite.exec(schema);
  console.log('[DB] SQLite schema ready');
}

// ─── SEED ─────────────────────────────────────────────────────────────────────
async function seedAll() {
  const tenantCount = sqlite.prepare('SELECT COUNT(*) as c FROM tenants').get();
  if (!tenantCount?.c) {
    sqlite.prepare("INSERT INTO tenants (name, slug, plan) VALUES (?,?,?)").run('Nexuss X Sistems','nexuss','agency');
  }

  const planCount = sqlite.prepare('SELECT COUNT(*) as c FROM plans').get();
  if (!planCount?.c) {
    const p = sqlite.prepare('INSERT INTO plans (name, price_monthly, price_yearly, features_json, limits_json) VALUES (?,?,?,?,?)');
    p.run('starter',  49,   470,  JSON.stringify(['CRM básico','Tickets','5 usuarios','KB pública']),                                                         JSON.stringify({users:5,contacts:200,tickets_mo:50}));
    p.run('business', 199,  1990, JSON.stringify(['CRM completo','IA básica','25 usuarios','Pipeline','Reportes','Email integrado']),                         JSON.stringify({users:25,contacts:2000,tickets_mo:500}));
    p.run('agency',   499,  4990, JSON.stringify(['Todo Business','White-label','Usuarios ilimitados','API acceso','Automatizaciones','Soporte prioritario']),JSON.stringify({users:-1,contacts:-1,tickets_mo:-1}));
    p.run('enterprise',0,   0,    JSON.stringify(['Todo Agency','SLA garantizado','Onboarding dedicado','Custom domain','SSO','Auditoría avanzada']),         JSON.stringify({users:-1,contacts:-1,tickets_mo:-1}));
  }

  const kbCount = sqlite.prepare('SELECT COUNT(*) as c FROM kb_categories').get();
  if (!kbCount?.c) {
    const kbCat = sqlite.prepare("INSERT INTO kb_categories (tenant_id,name,icon,order_num) VALUES (1,?,?,?)");
    const c1id = kbCat.run('Primeros pasos','🚀',1).lastInsertRowid;
    const c2id = kbCat.run('Facturación','💳',2).lastInsertRowid;
    const c3id = kbCat.run('Soporte técnico','🛠️',3).lastInsertRowid;
    const art = sqlite.prepare("INSERT INTO kb_articles (tenant_id,category_id,title,slug,content,is_published,created_by) VALUES (1,?,?,?,?,1,1)");
    art.run(c1id,'Cómo crear tu cuenta','como-crear-cuenta','## Crear una cuenta\n\n1. Clic en **Crear cuenta**.\n2. Completa nombre, email y contraseña.\n3. Verifica tu email.\n4. Accede a tu panel.\n\n¡Listo!');
    art.run(c1id,'Primeros pasos con el CRM','primeros-pasos-crm','## Tu CRM\n\nGestiona contactos, clientes y oportunidades en un solo lugar.\n\n### Agregar contacto\n1. CRM → Contactos.\n2. Nuevo contacto.\n3. Completa datos y guarda.');
    art.run(c2id,'Planes y precios','planes-y-precios','## Nuestros planes\n\n| Plan | Precio | Usuarios |\n|------|--------|----------|\n| Starter | $49/mes | 5 |\n| Business | $199/mes | 25 |\n| Agency | $499/mes | Ilimitado |');
    art.run(c3id,'Cómo abrir un ticket','como-abrir-ticket','## Abrir un ticket\n\n1. Soporte → Tickets.\n2. Nuevo ticket.\n3. Selecciona categoría y prioridad.\n4. Describe el problema.\n\nRespuesta en menos de 24 horas.');
  }

  const tmplCount = sqlite.prepare('SELECT COUNT(*) as c FROM ticket_templates').get();
  if (!tmplCount?.c) {
    const t = sqlite.prepare("INSERT INTO ticket_templates (tenant_id,name,body,category) VALUES (1,?,?,?)");
    t.run('Agradecimiento por contactar','Hola {{name}},\n\nGracias por contactarnos. Hemos recibido tu ticket #{{number}}.\n\nEquipo Nexuss X Sistems','general');
    t.run('Solicitar más información','Hola {{name}},\n\nPara ayudarte mejor, ¿podrías darnos más detalles?\n\nEquipo de soporte','general');
    t.run('Problema resuelto','Hola {{name}},\n\nTu solicitud ha sido resuelta.\n\n¡Que tengas un excelente día!\n\nEquipo Nexuss X Sistems','general');
  }

  const autoCount = sqlite.prepare('SELECT COUNT(*) as c FROM automation_rules').get();
  if (!autoCount?.c) {
    const r = sqlite.prepare("INSERT INTO automation_rules (tenant_id,name,trigger_event,conditions_json,actions_json) VALUES (1,?,?,?,?)");
    r.run('Notificar ticket urgente','ticket.created',JSON.stringify([{field:'priority',op:'eq',value:'urgent'}]),JSON.stringify([{type:'notify_admin',message:'Nuevo ticket URGENTE: {{title}}'}]));
    r.run('Cerrar tickets sin respuesta','ticket.stale',JSON.stringify([{field:'days_open',op:'gt',value:'7'}]),JSON.stringify([{type:'set_status',value:'closed'}]));
  }

  const tcCount = sqlite.prepare('SELECT COUNT(*) as c FROM task_categories').get();
  if (!tcCount?.c) {
    const ic = sqlite.prepare("INSERT INTO task_categories (tenant_id,name,color,icon) VALUES (1,?,?,?)");
    const tc1 = ic.run('Desarrollo Web','#00d4ff','💻').lastInsertRowid;
    const tc2 = ic.run('Diseño UI/UX','#7926ff','🎨').lastInsertRowid;
    const tc3 = ic.run('Base de Datos','#22c55e','🗄️').lastInsertRowid;
    const tc4 = ic.run('Seguridad','#ef4444','🔒').lastInsertRowid;
    const tc5 = ic.run('Documentación','#f59e0b','📝').lastInsertRowid;
    const em = 'nexussxsistems@gmail.com';
    const it = sqlite.prepare("INSERT INTO tasks (tenant_id,category_id,title,description,status,priority,assigned_email,progress,due_date) VALUES (1,?,?,?,?,?,?,?,?)");
    it.run(tc1,'Crear página de inicio (index.html)','HTML5 y CSS3','completada','alta',em,100,'2026-04-10');
    it.run(tc1,'Implementar sistema de autenticación','Login, registro y verificación','completada','urgente',em,100,'2026-04-12');
    it.run(tc1,'Desarrollar API REST con Express','Endpoints usuarios, tareas, tickets','completada','alta',em,100,'2026-04-15');
    it.run(tc2,'Diseñar paleta de colores y tipografía','Variables CSS, tema oscuro','completada','normal',em,100,'2026-04-08');
    it.run(tc2,'Crear componentes reutilizables CSS','Botones, cards, modales en nexus.css','completada','normal',em,100,'2026-04-14');
    it.run(tc3,'Diseñar esquema de base de datos','Tablas, relaciones, FK','completada','alta',em,100,'2026-04-11');
    it.run(tc3,'Crear registros semilla','20 registros por tabla','completada','normal',em,100,'2026-04-20');
    it.run(tc3,'Configurar backup automático','Sistema de respaldo','en_progreso','alta',em,75,'2026-05-25');
    it.run(tc4,'Implementar JWT y rate limiting','Tokens JWT y límites de petición','completada','urgente',em,100,'2026-04-16');
    it.run(tc4,'Configurar CORS y Helmet','Cabeceras de seguridad HTTP','completada','alta',em,100,'2026-04-17');
    it.run(tc1,'Desarrollar panel de tareas','Crear, asignar, filtrar tareas','en_progreso','alta',em,80,'2026-05-28');
    it.run(tc1,'Integrar Chart.js para reportes','Gráficos de barras, dona y línea','completada','normal',em,100,'2026-04-25');
    it.run(tc5,'Redactar documentación técnica','Manual técnico del sistema','completada','normal',em,100,'2026-05-01');
    it.run(tc5,'Crear manual de usuario','Guía de uso de la plataforma','completada','normal',em,100,'2026-05-05');
    it.run(tc1,'Implementar módulo CRM','Gestión de contactos y pipeline','completada','alta',em,100,'2026-04-22');
    it.run(tc1,'Sistema de tickets de soporte','Tickets con prioridades y SLA','completada','alta',em,100,'2026-04-28');
    it.run(tc1,'Crear portafolio de trabajos','Sección con proyectos anteriores','en_progreso','normal',em,50,'2026-06-01');
    it.run(tc4,'Pruebas de seguridad QA','Inyección SQL, XSS, autenticación','pendiente','alta',em,0,'2026-06-05');
    it.run(tc2,'Diseñar módulo FOL/SDSS','Página Sistema Dominicano Seguridad Social','en_progreso','alta',em,60,'2026-05-30');
    it.run(tc1,'Portafolio de proyectos reales','Landing, app politécnico, restaurante','completada','normal',em,100,'2026-05-15');
  }

  const contactCount = sqlite.prepare('SELECT COUNT(*) as c FROM contacts').get();
  if (!contactCount?.c) {
    const ic = sqlite.prepare("INSERT INTO contacts (tenant_id,name,email,phone,company,position,status,stage,value) VALUES (1,?,?,?,?,?,?,?,?)");
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
  }
}

// ─── HELPER FUNCTIONS (idénticas a db-pg.js) ─────────────────────────────────
export function j(v)    { try { return JSON.parse(v || '[]'); } catch { return []; } }
export function jObj(v) { try { return JSON.parse(v || '{}'); } catch { return {}; } }
export function now()   { return new Date().toISOString(); }
export function slug(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

export async function nextTicketNumber(tenantId) {
  const row = await db.prepare('SELECT COUNT(*) as c FROM tickets WHERE tenant_id=?').get(tenantId);
  return `TKT-${String((row?.c || 0) + 1).padStart(4,'0')}`;
}

export async function createNotification(tenantId, userId, userEmail, type, title, message, link = null) {
  await db.prepare('INSERT INTO notifications (tenant_id,user_id,user_email,type,title,message,link) VALUES (?,?,?,?,?,?,?)').run(tenantId, userId, userEmail, type, title, message, link);
}

export async function createAuditLog(tenantId, userId, userEmail, action, entityType, entityId, changes, ip) {
  await db.prepare('INSERT INTO audit_logs (tenant_id,user_id,user_email,action,entity_type,entity_id,changes_json,ip) VALUES (?,?,?,?,?,?,?,?)').run(tenantId, userId, userEmail, action, entityType, String(entityId||''), JSON.stringify(changes||{}), ip||'');
}

function interpolate(str, data) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => data[k] || '');
}

export async function runAutomations(tenantId, event, data) {
  const rules = await db.prepare('SELECT * FROM automation_rules WHERE tenant_id=? AND trigger_event=? AND is_active=1').all(tenantId, event);
  for (const rule of rules) {
    const conditions = j(rule.conditions_json);
    const passes = conditions.every(c => {
      const val = String(data[c.field] || '');
      if (c.op === 'eq')       return val === String(c.value);
      if (c.op === 'neq')      return val !== String(c.value);
      if (c.op === 'gt')       return Number(val) > Number(c.value);
      if (c.op === 'lt')       return Number(val) < Number(c.value);
      if (c.op === 'contains') return val.includes(String(c.value));
      return true;
    });
    if (!passes) continue;
    const actions = j(rule.actions_json);
    for (const action of actions) {
      if (action.type === 'notify_admin') {
        const admins = await db.prepare("SELECT id,email FROM users WHERE tenant_id=? AND role IN ('admin','owner')").all(tenantId);
        for (const a of admins) await createNotification(tenantId, a.id, a.email, 'warning', 'Automatización', interpolate(action.message, data), data.link||null);
      }
      if (action.type === 'notify_user' && data.user_id) {
        await createNotification(tenantId, data.user_id, data.user_email, 'info', 'Actualización de ticket', interpolate(action.message, data), null);
      }
      if (action.type === 'set_field' && data._ticketId) {
        await db.prepare(`UPDATE tickets SET ${action.field}=?, updated_at=datetime('now') WHERE id=?`).run(action.value, data._ticketId);
      }
      if (action.type === 'set_status' && data._ticketId) {
        await db.prepare(`UPDATE tickets SET status=?, updated_at=datetime('now') WHERE id=?`).run(action.value, data._ticketId);
      }
    }
    await db.prepare('UPDATE automation_rules SET runs_count=runs_count+1 WHERE id=?').run(rule.id);
  }
}

// ─── INITIALIZE ───────────────────────────────────────────────────────────────
await createSchema();
await seedAll();

if (process.env.ADMIN_EMAIL) {
  const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const adminUser = sqlite.prepare("SELECT id, role FROM users WHERE email=? AND tenant_id=1").get(adminEmail);
  if (adminUser && adminUser.role !== 'owner') {
    sqlite.prepare("UPDATE users SET role='owner' WHERE email=? AND tenant_id=1").run(adminEmail);
    console.log(`[DB] Admin role fixed: ${adminEmail} → owner`);
  }
}

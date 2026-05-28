// ─── NEXUSS X SYSTEMS SERVER v2.0 ─────────────────────────────────────────────
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { createRequire } from 'module';
import fs from 'fs';
import crypto from 'crypto';

const __dir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dir, '.env') });

import express          from 'express';
import cors             from 'cors';
import bcrypt           from 'bcryptjs';
import jwt              from 'jsonwebtoken';
import Anthropic        from '@anthropic-ai/sdk';
import compression      from 'compression';
import { rateLimit }    from 'express-rate-limit';

let helmet, multer, nodemailer, otplib, qrcode;
try { helmet     = (await import('helmet')).default; } catch {}
try { multer     = (await import('multer')).default; } catch {}
try { nodemailer = (await import('nodemailer')).default; } catch {}
try { const m = await import('otplib'); otplib = m; } catch {}
try { qrcode     = (await import('qrcode')).default; } catch {}

import { db, j, jObj, now, slug, nextTicketNumber, createNotification, createAuditLog, runAutomations } from './db.js';

const PORT       = process.env.PORT       || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_secret_change_in_production_2025';
const ADMIN_EMAIL= (process.env.ADMIN_EMAIL || '').toLowerCase();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

// ─── MULTER (file uploads) ─────────────────────────────────────────────────────
const upload = multer ? multer({
  dest: join(__dir, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg','.jpeg','.png','.gif','.pdf','.doc','.docx','.txt','.zip'];
    cb(null, allowed.includes(extname(file.originalname).toLowerCase()));
  }
}) : { single: () => (req,res,next) => next(), array: () => (req,res,next) => next() };

// ─── EMAIL ────────────────────────────────────────────────────────────────────
function getMailer() {
  if (!nodemailer) return null;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  return nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT||587), auth: { user: SMTP_USER, pass: SMTP_PASS }, secure: Number(SMTP_PORT) === 465 });
}
async function sendEmail(to, subject, html) {
  const mailer = getMailer();
  if (!mailer) { console.log(`[MOCK EMAIL → ${to}] ${subject}`); return; }
  try { await mailer.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html }); }
  catch(e) { console.error('[Email error]', e.message); }
}

// ─── EXPRESS SETUP ────────────────────────────────────────────────────────────
const app = express();

if (helmet) app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
// Serve static files — sin cache para JS/CSS (evita que el browser muestre versiones viejas)
app.use(express.static(join(__dir, '..'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Serve uploads
app.use('/uploads', express.static(join(__dir, 'uploads')));

// ─── RATE LIMITS ──────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Too many attempts, try again later' } });
const apiLimiter  = rateLimit({ windowMs: 1*60*1000,  max: 120 });
const aiLimiter   = rateLimit({ windowMs: 1*60*1000,  max: 15  });

app.use('/api/login',    authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/jarvis',   aiLimiter);
app.use('/api/ai',       aiLimiter);
app.use('/api/',         apiLimiter);

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
function signToken(user, expiresIn = '7d') {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id || 1 }, JWT_SECRET, { expiresIn });
}
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}
const requireAdmin   = requireRole('admin', 'owner');
const requireManager = requireRole('admin', 'owner', 'manager');
const requireAgent   = requireRole('admin', 'owner', 'manager', 'agent');

function ip(req) { return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || ''; }
function randomCode(len=8) { return crypto.randomBytes(len).toString('hex').slice(0,len).toUpperCase(); }
function hashKey(key) { return crypto.createHash('sha256').update(key).digest('hex'); }

// ─── API KEY AUTH ─────────────────────────────────────────────────────────────
function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return auth(req, res, next);
  const prefix = key.slice(0, 8);
  const row = db.prepare('SELECT k.*, u.email, u.role, u.tenant_id FROM api_keys k JOIN users u ON k.user_id=u.id WHERE k.key_prefix=? AND k.key_hash=?').get(prefix, hashKey(key));
  if (!row) return res.status(401).json({ error: 'Invalid API key' });
  db.prepare('UPDATE api_keys SET last_used_at=? WHERE id=?').run(now(), row.id);
  req.user = { id: row.user_id, email: row.email, role: row.role, tenant_id: row.tenant_id };
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AUTH
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  try {
    let { name, email, password, referral_code } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Nombre e email requeridos' });
    email = email.toLowerCase().trim();
    if (!password) password = 'nxs-demo';
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });

    const existing = db.prepare('SELECT id FROM users WHERE email=? AND tenant_id=1').get(email);
    if (existing) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = bcrypt.hashSync(password, 12);
    const role = ADMIN_EMAIL && email === ADMIN_EMAIL ? 'owner' : 'viewer';
    const code = String(Math.floor(100000 + Math.random()*900000));

    const userId = db.prepare(`INSERT INTO users (tenant_id, email, password_hash, name, role, verification_code) VALUES (1,?,?,?,?,?)`).run(email, hash, name, role, code).lastInsertRowid;

    // Handle referral
    if (referral_code) {
      const ref = db.prepare('SELECT * FROM referrals WHERE code=?').get(referral_code.toUpperCase());
      if (ref) db.prepare('UPDATE referrals SET uses=uses+1 WHERE id=?').run(ref.id);
    }

    // Notify admins
    const admins = db.prepare("SELECT id, email FROM users WHERE tenant_id=1 AND role IN ('admin','owner')").all();
    admins.forEach(a => createNotification(1, a.id, a.email, 'success', 'Nuevo usuario registrado', `${name} (${email}) se registró en la plataforma.`));

    createAuditLog(1, userId, email, 'user.register', 'user', userId, { name, email, role }, ip(req));

    // Email de verificación al usuario que se registró
    await sendEmail(email, 'Verifica tu cuenta — Nexuss X Systems',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#7926ff">Nexuss X Systems</h2>
        <h3>Hola ${name}, bienvenido/a 👋</h3>
        <p>Tu código de verificación es:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#7926ff;text-align:center;padding:16px;background:#fff;border-radius:8px;margin:16px 0">${code}</div>
        <p style="color:#666">Válido por 24 horas.</p>
        <p style="color:#aaa;font-size:12px">Nexuss X Systems — Sistema de Gestión Empresarial</p>
      </div>`);

    // Notificación al admin de nuevo registro
    const adminNotif = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminNotif) {
      await sendEmail(adminNotif, `👤 Nuevo registro — ${name}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
          <h2 style="color:#7926ff">Nexuss X Systems</h2>
          <h3>Nuevo usuario registrado</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>Nombre</strong></td><td style="padding:8px 12px">${name}</td></tr>
            <tr><td style="padding:8px 12px"><strong>Email</strong></td><td style="padding:8px 12px">${email}</td></tr>
            <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>Rol asignado</strong></td><td style="padding:8px 12px">${role}</td></tr>
            <tr><td style="padding:8px 12px"><strong>Fecha</strong></td><td style="padding:8px 12px">${new Date().toLocaleString('es-DO')}</td></tr>
            <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>IP</strong></td><td style="padding:8px 12px">${ip(req)}</td></tr>
          </table>
          <a href="${process.env.APP_URL||'http://localhost:3002'}/admin.html" style="display:inline-block;margin-top:16px;background:#7926ff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Ver en Admin →</a>
          <p style="color:#aaa;font-size:12px;margin-top:16px">Nexuss X Systems — Alertas automáticas</p>
        </div>`);
    }

    const user = db.prepare('SELECT id, email, role, name, verified FROM users WHERE id=?').get(userId);
    res.json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role, name: user.name, verified: !!user.verified } });
  } catch(e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    let { email, password, totp_code } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    email = email.toLowerCase().trim();
    if (!password) password = 'nxs-demo';

    const user = db.prepare('SELECT * FROM users WHERE email=? AND tenant_id=1').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    // 2FA check
    if (user.totp_enabled && otplib) {
      if (!totp_code) return res.status(200).json({ requires_2fa: true });
      const valid = otplib.authenticator.check(totp_code, user.totp_secret);
      if (!valid) return res.status(401).json({ error: 'Código 2FA inválido' });
    }

    db.prepare('UPDATE users SET last_login_at=?, login_count=login_count+1, updated_at=? WHERE id=?').run(now(), now(), user.id);
    createAuditLog(1, user.id, user.email, 'user.login', 'user', user.id, {}, ip(req));

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email, role: user.role, name: user.name, verified: !!user.verified, totp_enabled: !!user.totp_enabled, avatar_url: user.avatar_url }
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, role, name, verified, totp_enabled, avatar_url, phone, created_at, last_login_at, login_count FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...user, verified: !!user.verified, totp_enabled: !!user.totp_enabled } });
});

app.patch('/api/me', auth, (req, res) => {
  const { name, phone, avatar_url } = req.body || {};
  db.prepare('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), avatar_url=COALESCE(?,avatar_url), updated_at=? WHERE id=?').run(name||null, phone||null, avatar_url||null, now(), req.user.id);
  createAuditLog(1, req.user.id, req.user.email, 'user.update_profile', 'user', req.user.id, {}, ip(req));
  res.json({ ok: true });
});

app.post('/api/me/change-password', auth, (req, res) => {
  const { current, newPassword } = req.body || {};
  if (!current || !newPassword) return res.status(400).json({ error: 'Campos requeridos' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Mínimo 6 caracteres' });
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password_hash)) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  db.prepare('UPDATE users SET password_hash=?, updated_at=? WHERE id=?').run(bcrypt.hashSync(newPassword, 12), now(), req.user.id);
  createAuditLog(1, req.user.id, req.user.email, 'user.change_password', 'user', req.user.id, {}, ip(req));
  res.json({ ok: true });
});

// ─── 2FA ──────────────────────────────────────────────────────────────────────
app.post('/api/me/2fa/setup', auth, async (req, res) => {
  if (!otplib || !qrcode) return res.status(503).json({ error: 'otplib/qrcode no disponible. Instala: npm install otplib qrcode' });
  const secret = otplib.authenticator.generateSecret();
  db.prepare('UPDATE users SET totp_secret=? WHERE id=?').run(secret, req.user.id);
  const user = db.prepare('SELECT email FROM users WHERE id=?').get(req.user.id);
  const otpauth = otplib.authenticator.keyuri(user.email, 'NexussXSystems', secret);
  const qr = await qrcode.toDataURL(otpauth);
  res.json({ secret, qr });
});

app.post('/api/me/2fa/enable', auth, (req, res) => {
  if (!otplib) return res.status(503).json({ error: 'otplib no disponible' });
  const { code } = req.body || {};
  const user = db.prepare('SELECT totp_secret FROM users WHERE id=?').get(req.user.id);
  if (!user?.totp_secret) return res.status(400).json({ error: 'Primero configura el 2FA' });
  if (!otplib.authenticator.check(code, user.totp_secret)) return res.status(401).json({ error: 'Código inválido' });
  db.prepare('UPDATE users SET totp_enabled=1 WHERE id=?').run(req.user.id);
  createAuditLog(1, req.user.id, req.user.email, 'user.2fa_enabled', 'user', req.user.id, {}, ip(req));
  res.json({ ok: true });
});

app.post('/api/me/2fa/disable', auth, (req, res) => {
  if (!otplib) return res.status(503).json({ error: 'otplib no disponible' });
  const { code } = req.body || {};
  const user = db.prepare('SELECT totp_secret FROM users WHERE id=?').get(req.user.id);
  if (!otplib.authenticator.check(code, user.totp_secret)) return res.status(401).json({ error: 'Código inválido' });
  db.prepare('UPDATE users SET totp_enabled=0, totp_secret=NULL WHERE id=?').run(req.user.id);
  createAuditLog(1, req.user.id, req.user.email, 'user.2fa_disabled', 'user', req.user.id, {}, ip(req));
  res.json({ ok: true });
});

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────
app.post('/auth/forgot-password', authLimiter, async (req, res) => {
  let { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  email = email.toLowerCase().trim();
  const user = db.prepare('SELECT id, name FROM users WHERE email=?').get(email);
  if (!user) return res.json({ ok: true }); // security: don't reveal
  const token = randomCode(32);
  db.prepare('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?').run(token, Date.now() + 86400000, user.id);
  await sendEmail(email, 'Recuperar contraseña — Nexuss X Systems',
    `<p>Hola ${user.name || ''},</p><p>Tu enlace para restablecer la contraseña:</p><p><a href="${process.env.APP_URL||'http://localhost:3002'}/reset-password.html?token=${token}">Restablecer contraseña</a></p><p>Válido por 24 horas.</p>`);
  console.log(`[MOCK RESET] token for ${email}: ${token}`);
  res.json({ ok: true, token }); // token returned for dev/demo only
});

app.post('/auth/reset-password', (req, res) => {
  const { token, email, password } = req.body || {};
  if (!token || !email || !password) return res.status(400).json({ error: 'Campos requeridos' });
  const user = db.prepare('SELECT * FROM users WHERE reset_token=? AND email=?').get(token, email.toLowerCase().trim());
  if (!user || user.reset_expires < Date.now()) return res.status(401).json({ error: 'Token inválido o expirado' });
  db.prepare('UPDATE users SET password_hash=?, reset_token=NULL, reset_expires=NULL, updated_at=? WHERE id=?').run(bcrypt.hashSync(password, 12), now(), user.id);
  createAuditLog(1, user.id, user.email, 'user.password_reset', 'user', user.id, {}, ip(req));
  res.json({ ok: true });
});

app.post('/auth/verify-email', (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: 'Campos requeridos' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.verification_code !== code) return res.status(401).json({ error: 'Código inválido' });
  db.prepare('UPDATE users SET verified=1, verification_code=NULL, updated_at=? WHERE id=?').run(now(), user.id);
  createAuditLog(1, user.id, user.email, 'user.email_verified', 'user', user.id, {}, ip(req));
  res.json({ ok: true, token: signToken(user), user: { id: user.id, email: user.email, role: user.role, verified: true } });
});

app.post('/auth/resend-code', authLimiter, async (req, res) => {
  let { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  email = email.toLowerCase().trim();
  const user = db.prepare('SELECT id, name FROM users WHERE email=?').get(email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const code = String(Math.floor(100000 + Math.random()*900000));
  db.prepare('UPDATE users SET verification_code=? WHERE id=?').run(code, user.id);
  await sendEmail(email, 'Código de verificación — Nexuss X Systems', `<p>Tu código: <strong style="font-size:24px">${code}</strong></p>`);
  console.log(`[MOCK CODE] ${email}: ${code}`);
  res.json({ ok: true });
});

// ─── API KEYS ─────────────────────────────────────────────────────────────────
app.get('/api/api-keys', auth, (req, res) => {
  const keys = db.prepare('SELECT id, name, key_prefix, permissions_json, last_used_at, created_at FROM api_keys WHERE user_id=?').all(req.user.id);
  res.json({ items: keys.map(k => ({ ...k, permissions: j(k.permissions_json) })) });
});

app.post('/api/api-keys', auth, (req, res) => {
  const { name, permissions = ['read'] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const rawKey = `nxs_${randomCode(32).toLowerCase()}`;
  const prefix = rawKey.slice(0, 8);
  const hash   = hashKey(rawKey);
  db.prepare('INSERT INTO api_keys (tenant_id, user_id, name, key_prefix, key_hash, permissions_json) VALUES (1,?,?,?,?,?)').run(req.user.id, name, prefix, hash, JSON.stringify(permissions));
  createAuditLog(1, req.user.id, req.user.email, 'api_key.created', 'api_key', prefix, { name }, ip(req));
  res.json({ ok: true, key: rawKey, prefix }); // key shown ONCE
});

app.delete('/api/api-keys/:id', auth, (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ADMIN — USERS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/admin/users', auth, requireAdmin, (req, res) => {
  const { q, role, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT id, email, name, role, verified, totp_enabled, created_at, last_login_at, login_count FROM users WHERE tenant_id=1';
  const params = [];
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (role) { sql += ' AND role=?'; params.push(role); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const items = db.prepare(sql).all(...params).map(u => ({ ...u, verified: !!u.verified, totp_enabled: !!u.totp_enabled }));
  const total = db.prepare('SELECT COUNT(*) as c FROM users WHERE tenant_id=1').get().c;
  res.json({ items, total });
});

app.patch('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { role, name } = req.body || {};
  const ROLES = ['viewer','agent','manager','admin','owner'];
  if (role && !ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' });
  db.prepare('UPDATE users SET role=COALESCE(?,role), name=COALESCE(?,name), updated_at=? WHERE id=? AND tenant_id=1').run(role||null, name||null, now(), id);
  createAuditLog(1, req.user.id, req.user.email, 'admin.update_user', 'user', id, { role }, ip(req));
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  db.prepare('DELETE FROM users WHERE id=? AND tenant_id=1').run(id);
  createAuditLog(1, req.user.id, req.user.email, 'admin.delete_user', 'user', id, {}, ip(req));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: MESSAGES (contact form)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, message, phone, subject } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Campos requeridos' });
  const id = db.prepare('INSERT INTO messages (tenant_id, name, email, phone, subject, message) VALUES (1,?,?,?,?,?)').run(name, email.toLowerCase(), phone||null, subject||null, message).lastInsertRowid;
  // Auto-create contact in CRM if not exists
  const existing = db.prepare('SELECT id FROM contacts WHERE email=? AND tenant_id=1').get(email.toLowerCase());
  if (!existing) db.prepare('INSERT INTO contacts (tenant_id, name, email, phone, source, status) VALUES (1,?,?,?,?,?)').run(name, email.toLowerCase(), phone||null, 'contact_form', 'lead');
  const admins = db.prepare("SELECT id, email FROM users WHERE tenant_id=1 AND role IN ('admin','owner')").all();
  admins.forEach(a => createNotification(1, a.id, a.email, 'info', 'Nuevo mensaje de contacto', `${name} (${email}) envió un mensaje.`, '/admin.html'));

  // Auto-respuesta al usuario que envió el formulario
  await sendEmail(email, '¡Recibimos tu mensaje! — Nexuss X Systems',
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
      <h2 style="color:#7926ff">Nexuss X Systems</h2>
      <h3>Hola ${name}, recibimos tu mensaje 👋</h3>
      <p>Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderá en menos de 24 horas.</p>
      <div style="background:#fff;border-left:4px solid #7926ff;padding:14px;border-radius:0 8px 8px 0;margin:16px 0">
        <strong>Tu mensaje:</strong><br>
        <p style="color:#555;margin-top:8px">${message}</p>
      </div>
      <a href="${process.env.APP_URL||'http://localhost:3002'}/servicios.html" style="display:inline-block;background:#7926ff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Ver nuestros servicios →</a>
      <p style="color:#aaa;font-size:12px;margin-top:16px">Nexuss X Systems — Más allá de los límites del planeta</p>
    </div>`);

  // Notificación completa al administrador con todos los datos del formulario
  const adminDest = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminDest) {
    await sendEmail(adminDest, `📬 Nuevo mensaje de contacto — ${name}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
        <h2 style="color:#7926ff">Nexuss X Systems</h2>
        <h3>Nuevo mensaje del formulario de contacto</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>Nombre</strong></td><td style="padding:8px 12px">${name}</td></tr>
          <tr><td style="padding:8px 12px"><strong>Email</strong></td><td style="padding:8px 12px"><a href="mailto:${email}">${email}</a></td></tr>
          <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>Teléfono</strong></td><td style="padding:8px 12px">${phone||'—'}</td></tr>
          <tr><td style="padding:8px 12px"><strong>Asunto</strong></td><td style="padding:8px 12px">${subject||'—'}</td></tr>
          <tr style="background:#f0f0f0"><td style="padding:8px 12px"><strong>Fecha</strong></td><td style="padding:8px 12px">${new Date().toLocaleString('es-DO')}</td></tr>
        </table>
        <div style="background:#fff;border-left:4px solid #7926ff;padding:14px;border-radius:0 8px 8px 0;margin:16px 0">
          <strong>Mensaje:</strong><br>
          <p style="color:#555;margin-top:8px">${message}</p>
        </div>
        <a href="${process.env.APP_URL||'http://localhost:3002'}/admin.html" style="display:inline-block;background:#7926ff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Ver en Admin →</a>
        <p style="color:#aaa;font-size:12px;margin-top:16px">Nexuss X Systems — Alertas automáticas del sistema</p>
      </div>`);
  }

  res.json({ ok: true });
});

app.get('/api/messages', auth, requireAgent, (req, res) => {
  const { q, status, from, to, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT * FROM messages WHERE tenant_id=1';
  const params = [];
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  if (status) { sql += ' AND status=?'; params.push(status); }
  if (from) { sql += ' AND created_at>=?'; params.push(from); }
  if (to)   { sql += ' AND created_at<=?'; params.push(to); }
  const total = db.prepare(sql.replace('SELECT *','SELECT COUNT(*) as c'), ...params).get(...params)?.c || 0;
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json({ items: db.prepare(sql).all(...params), total });
});

app.patch('/api/messages/:id', auth, requireAgent, (req, res) => {
  db.prepare('UPDATE messages SET status=?, replied_at=? WHERE id=?').run(req.body.status||'replied', now(), Number(req.params.id));
  res.json({ ok: true });
});

app.delete('/api/messages/:id', auth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/messages.csv', auth, requireAgent, (req, res) => {
  const items = db.prepare('SELECT * FROM messages WHERE tenant_id=1 ORDER BY id DESC LIMIT 1000').all();
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const hdr = ['id','name','email','phone','subject','message','status','created_at'].join(',');
  const body = items.map(r => [r.id,r.name,r.email,r.phone,r.subject,r.message,r.status,r.created_at].map(esc).join(',')).join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="messages.csv"');
  res.send(hdr+'\n'+body);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: CRM — CONTACTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/crm/contacts', auth, requireAgent, (req, res) => {
  const { q, status, stage, assigned_to, limit=50, offset=0 } = req.query;
  let sql = 'SELECT c.*, u.name as assigned_name FROM contacts c LEFT JOIN users u ON c.assigned_to=u.id WHERE c.tenant_id=1';
  const params = [];
  if (q) { sql += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  if (status) { sql += ' AND c.status=?'; params.push(status); }
  if (stage) { sql += ' AND c.stage=?'; params.push(stage); }
  if (assigned_to) { sql += ' AND c.assigned_to=?'; params.push(Number(assigned_to)); }
  const cSql = sql.replace('SELECT c.*, u.name as assigned_name FROM contacts c LEFT JOIN users u ON c.assigned_to=u.id','SELECT COUNT(*) as c FROM contacts c LEFT JOIN users u ON c.assigned_to=u.id');
  const total = db.prepare(cSql).get(...params)?.c || 0;
  sql += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const items = db.prepare(sql).all(...params).map(c => ({ ...c, tags: j(c.tags_json) }));
  res.json({ items, total });
});

app.post('/api/crm/contacts', auth, requireAgent, (req, res) => {
  const { name, email, phone, company, position, status='lead', stage='new', source='manual', value=0, assigned_to, tags=[], notes, linkedin, website, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const id = db.prepare('INSERT INTO contacts (tenant_id, name, email, phone, company, position, status, stage, source, value, assigned_to, tags_json, notes, linkedin, website, address) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(name, email?.toLowerCase()||null, phone||null, company||null, position||null, status, stage, source, Number(value), assigned_to||null, JSON.stringify(tags), notes||null, linkedin||null, website||null, address||null).lastInsertRowid;
  createAuditLog(1, req.user.id, req.user.email, 'contact.created', 'contact', id, { name, email }, ip(req));
  res.json({ ok: true, id });
});

app.get('/api/crm/contacts/:id', auth, requireAgent, (req, res) => {
  const c = db.prepare('SELECT * FROM contacts WHERE id=? AND tenant_id=1').get(Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Not found' });
  const notes    = db.prepare('SELECT n.*, u.name as author FROM crm_notes n LEFT JOIN users u ON n.created_by=u.id WHERE n.contact_id=? ORDER BY n.created_at DESC').all(c.id);
  const deals    = db.prepare('SELECT * FROM deals WHERE contact_id=? AND tenant_id=1 ORDER BY created_at DESC').all(c.id);
  const tickets  = db.prepare("SELECT id, number, title, status, priority, created_at FROM tickets WHERE user_email=? AND tenant_id=1 ORDER BY created_at DESC LIMIT 10").all(c.email || '');
  const activities = db.prepare('SELECT * FROM crm_activities WHERE contact_id=? ORDER BY created_at DESC LIMIT 20').all(c.id);
  res.json({ contact: { ...c, tags: j(c.tags_json) }, notes, deals: deals.map(d=>({...d})), tickets, activities });
});

app.patch('/api/crm/contacts/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const fields = ['name','email','phone','company','position','status','stage','source','value','assigned_to','notes','linkedin','website','address'];
  const updates = []; const params = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(f==='email'?req.body[f]?.toLowerCase():req.body[f]); } });
  if (req.body.tags !== undefined) { updates.push('tags_json=?'); params.push(JSON.stringify(req.body.tags)); }
  if (!updates.length) return res.json({ ok: true });
  updates.push("updated_at=datetime('now')");
  db.prepare(`UPDATE contacts SET ${updates.join(',')} WHERE id=? AND tenant_id=1`).run(...params, id);
  createAuditLog(1, req.user.id, req.user.email, 'contact.updated', 'contact', id, req.body, ip(req));
  res.json({ ok: true });
});

app.delete('/api/crm/contacts/:id', auth, requireManager, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM contacts WHERE id=? AND tenant_id=1').run(id);
  createAuditLog(1, req.user.id, req.user.email, 'contact.deleted', 'contact', id, {}, ip(req));
  res.json({ ok: true });
});

// Import contacts CSV
app.post('/api/crm/contacts/import', auth, requireManager, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
  const content = fs.readFileSync(req.file.path, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').toLowerCase());
  let imported = 0, skipped = 0;
  const insert = db.prepare('INSERT OR IGNORE INTO contacts (tenant_id, name, email, phone, company, source) VALUES (1,?,?,?,?,?)');
  const trx = db.transaction(() => {
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g,''));
      const row = {}; headers.forEach((h,idx) => row[h] = vals[idx]||'');
      if (!row.name && !row.nombre) { skipped++; continue; }
      const r = insert.run(row.name||row.nombre||'', row.email||null, row.phone||row.telefono||null, row.company||row.empresa||null, 'import');
      r.changes ? imported++ : skipped++;
    }
  });
  trx();
  fs.unlinkSync(req.file.path);
  createAuditLog(1, req.user.id, req.user.email, 'contacts.import', 'contact', 'bulk', { imported, skipped }, ip(req));
  res.json({ ok: true, imported, skipped });
});

// Export contacts CSV
app.get('/api/crm/contacts.csv', auth, requireAgent, (req, res) => {
  const items = db.prepare('SELECT * FROM contacts WHERE tenant_id=1 ORDER BY id DESC').all();
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const hdr = ['id','name','email','phone','company','position','status','stage','source','value','notes','created_at'].join(',');
  const body = items.map(r=>[r.id,r.name,r.email,r.phone,r.company,r.position,r.status,r.stage,r.source,r.value,r.notes,r.created_at].map(esc).join(',')).join('\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="contacts.csv"');
  res.send(hdr+'\n'+body);
});

// ─── CRM NOTES ────────────────────────────────────────────────────────────────
app.get('/api/crm/clients', auth, requireAgent, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE tenant_id=1 ORDER BY id DESC').all();
  const items = users.map(u => {
    const orders_count  = db.prepare("SELECT COUNT(*) as c FROM orders WHERE json_extract(customer_json,'$.email')=? AND tenant_id=1").get(u.email)?.c || 0;
    const total_spent   = db.prepare("SELECT SUM(total) as s FROM orders WHERE json_extract(customer_json,'$.email')=? AND tenant_id=1").get(u.email)?.s || 0;
    const tickets_count = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE user_email=? AND tenant_id=1').get(u.email)?.c || 0;
    const notes = db.prepare('SELECT * FROM crm_notes WHERE client_email=? ORDER BY created_at DESC').all(u.email);
    return { ...u, orders_count, total_spent, tickets_count, notes };
  });
  res.json({ items });
});

app.post('/api/crm/notes', auth, requireAgent, (req, res) => {
  const { client_email, contact_id, text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Texto requerido' });
  db.prepare('INSERT INTO crm_notes (tenant_id, contact_id, client_email, text, created_by) VALUES (1,?,?,?,?)').run(contact_id||null, client_email||null, text, req.user.id);
  res.json({ ok: true });
});

app.delete('/api/crm/notes/:id', auth, requireAgent, (req, res) => {
  db.prepare('DELETE FROM crm_notes WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─── CRM ACTIVITIES ───────────────────────────────────────────────────────────
app.post('/api/crm/activities', auth, requireAgent, (req, res) => {
  const { contact_id, deal_id, type, note } = req.body || {};
  if (!type) return res.status(400).json({ error: 'Tipo requerido' });
  db.prepare('INSERT INTO crm_activities (tenant_id, contact_id, deal_id, type, note, created_by) VALUES (1,?,?,?,?,?)').run(contact_id||null, deal_id||null, type, note||null, req.user.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: CRM — DEALS / PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/crm/deals', auth, requireAgent, (req, res) => {
  const { stage, assigned_to, contact_id } = req.query;
  let sql = 'SELECT d.*, c.name as contact_name, c.company as contact_company FROM deals d LEFT JOIN contacts c ON d.contact_id=c.id WHERE d.tenant_id=1';
  const params = [];
  if (stage) { sql += ' AND d.stage=?'; params.push(stage); }
  if (assigned_to) { sql += ' AND d.assigned_to=?'; params.push(Number(assigned_to)); }
  if (contact_id) { sql += ' AND d.contact_id=?'; params.push(Number(contact_id)); }
  sql += ' ORDER BY d.updated_at DESC';
  const items = db.prepare(sql).all(...params);
  // Pipeline summary
  const pipeline = ['prospecting','qualified','proposal','negotiation','won','lost'].map(s => ({
    stage: s,
    count: items.filter(d=>d.stage===s).length,
    value: items.filter(d=>d.stage===s).reduce((a,d)=>a+(d.value||0),0)
  }));
  res.json({ items, pipeline });
});

app.post('/api/crm/deals', auth, requireAgent, (req, res) => {
  const { contact_id, title, value=0, currency='DOP', stage='prospecting', probability=20, close_date, assigned_to, notes } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Título requerido' });
  const id = db.prepare('INSERT INTO deals (tenant_id, contact_id, title, value, currency, stage, probability, close_date, assigned_to, notes) VALUES (1,?,?,?,?,?,?,?,?,?)').run(contact_id||null, title, Number(value), currency, stage, Number(probability), close_date||null, assigned_to||null, notes||null).lastInsertRowid;
  createAuditLog(1, req.user.id, req.user.email, 'deal.created', 'deal', id, { title, value }, ip(req));
  // Activity
  if (contact_id) db.prepare('INSERT INTO crm_activities (tenant_id, contact_id, deal_id, type, note, created_by) VALUES (1,?,?,?,?,?)').run(contact_id, id, 'deal_created', `Deal creado: ${title}`, req.user.id);
  res.json({ ok: true, id });
});

app.patch('/api/crm/deals/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const deal = db.prepare('SELECT * FROM deals WHERE id=? AND tenant_id=1').get(id);
  if (!deal) return res.status(404).json({ error: 'Not found' });
  const { title, value, currency, stage, probability, close_date, assigned_to, notes, lost_reason } = req.body;
  const updates = []; const params = [];
  if (title!==undefined)       { updates.push('title=?'); params.push(title); }
  if (value!==undefined)       { updates.push('value=?'); params.push(Number(value)); }
  if (currency!==undefined)    { updates.push('currency=?'); params.push(currency); }
  if (stage!==undefined)       { updates.push('stage=?'); params.push(stage);
    if (stage==='won')  { updates.push("won_at=datetime('now')"); }
    if (stage==='lost') { updates.push("lost_at=datetime('now')"); if(lost_reason){updates.push('lost_reason=?');params.push(lost_reason);} }
  }
  if (probability!==undefined) { updates.push('probability=?'); params.push(Number(probability)); }
  if (close_date!==undefined)  { updates.push('close_date=?'); params.push(close_date); }
  if (assigned_to!==undefined) { updates.push('assigned_to=?'); params.push(assigned_to); }
  if (notes!==undefined)       { updates.push('notes=?'); params.push(notes); }
  updates.push("updated_at=datetime('now')");
  db.prepare(`UPDATE deals SET ${updates.join(',')} WHERE id=? AND tenant_id=1`).run(...params, id);
  createAuditLog(1, req.user.id, req.user.email, 'deal.updated', 'deal', id, req.body, ip(req));
  res.json({ ok: true });
});

app.delete('/api/crm/deals/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM deals WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TICKETS
// ─────────────────────────────────────────────────────────────────────────────
const SLA_HOURS = { urgent: 4, high: 8, normal: 24, low: 72 };

app.get('/api/tickets', auth, (req, res) => {
  const { status, priority, category, assigned_to, q, limit=50, offset=0 } = req.query;
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  let sql = 'SELECT t.*, u.name as assigned_name FROM tickets t LEFT JOIN users u ON t.assigned_to=u.id WHERE t.tenant_id=1';
  const params = [];
  if (!isAgent) { sql += ' AND t.user_email=?'; params.push(req.user.email); }
  if (status)   { sql += ' AND t.status=?'; params.push(status); }
  if (priority) { sql += ' AND t.priority=?'; params.push(priority); }
  if (category) { sql += ' AND t.category=?'; params.push(category); }
  if (assigned_to) { sql += ' AND t.assigned_to=?'; params.push(Number(assigned_to)); }
  if (q) { sql += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.number LIKE ?)'; params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  const cSql = sql.replace('SELECT t.*, u.name as assigned_name FROM tickets t LEFT JOIN users u ON t.assigned_to=u.id','SELECT COUNT(*) as c FROM tickets t LEFT JOIN users u ON t.assigned_to=u.id');
  const total = db.prepare(cSql).get(...params)?.c || 0;
  sql += ' ORDER BY t.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const items = db.prepare(sql).all(...params).map(t => {
    const sla_breached = t.sla_due_at && t.status !== 'closed' && new Date(t.sla_due_at) < new Date();
    return { ...t, tags: j(t.tags_json), sla_breached };
  });
  res.json({ items, total });
});

app.post('/api/tickets', auth, (req, res) => {
  const { title, description, priority='normal', category='general', tags=[] } = req.body || {};
  if (!title || !description) return res.status(400).json({ error: 'Título y descripción requeridos' });
  const slaH = SLA_HOURS[priority] || 24;
  const slaDue = new Date(Date.now() + slaH * 3600000).toISOString();
  const number = nextTicketNumber(1);
  const user = db.prepare('SELECT id, name FROM users WHERE id=?').get(req.user.id);
  const id = db.prepare('INSERT INTO tickets (tenant_id, number, title, description, priority, category, sla_hours, sla_due_at, user_id, user_email, user_name, tags_json) VALUES (1,?,?,?,?,?,?,?,?,?,?,?)').run(number, title, description, priority, category, slaH, slaDue, req.user.id, req.user.email, user?.name||req.user.email, JSON.stringify(tags)).lastInsertRowid;

  // Notify agents
  const agents = db.prepare("SELECT id, email FROM users WHERE tenant_id=1 AND role IN ('admin','owner','manager','agent')").all();
  agents.forEach(a => createNotification(1, a.id, a.email, priority==='urgent'?'error':'info', `Nuevo ticket ${priority==='urgent'?'URGENTE':''} #${number}`, title, '/tickets.html'));

  // Run automations
  runAutomations(1, 'ticket.created', { priority, category, title, _ticketId: id, user_id: req.user.id, user_email: req.user.email, link: '/tickets.html' });
  createAuditLog(1, req.user.id, req.user.email, 'ticket.created', 'ticket', id, { title, priority }, ip(req));
  res.json({ ok: true, id, number });
});

app.get('/api/tickets/:id', auth, (req, res) => {
  const t = db.prepare('SELECT t.*, u.name as assigned_name FROM tickets t LEFT JOIN users u ON t.assigned_to=u.id WHERE t.id=? AND t.tenant_id=1').get(Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'Not found' });
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  if (!isAgent && t.user_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });
  const comments = db.prepare('SELECT * FROM ticket_comments WHERE ticket_id=? ORDER BY created_at ASC').all(t.id);
  const sla_breached = t.sla_due_at && t.status !== 'closed' && new Date(t.sla_due_at) < new Date();
  res.json({ ticket: { ...t, tags: j(t.tags_json), sla_breached }, comments });
});

app.patch('/api/tickets/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const t = db.prepare('SELECT * FROM tickets WHERE id=? AND tenant_id=1').get(id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  if (!isAgent && t.user_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });

  const updates = []; const params = [];
  if (req.body.status && isAgent) {
    updates.push('status=?'); params.push(req.body.status);
    if (req.body.status === 'closed') { updates.push("closed_at=datetime('now')"); }
    // Notify user
    if (req.body.status !== t.status) createNotification(1, t.user_id, t.user_email, 'info', `Ticket #${t.number} actualizado`, `Estado: ${req.body.status}`, '/tickets.html');
  }
  if (req.body.priority && isAgent)    { updates.push('priority=?'); params.push(req.body.priority); }
  if (req.body.assigned_to !== undefined && isAgent) { updates.push('assigned_to=?'); params.push(req.body.assigned_to||null); }
  if (req.body.category && isAgent)    { updates.push('category=?'); params.push(req.body.category); }
  if (req.body.csat_score !== undefined) { updates.push('csat_score=?'); params.push(Number(req.body.csat_score)); }
  if (req.body.response && isAgent) {
    db.prepare('INSERT INTO ticket_comments (ticket_id, text, from_email, from_name, is_internal, is_ai) VALUES (?,?,?,?,?,?)').run(id, req.body.response, req.user.email, req.user.email, req.body.is_internal?1:0, 0);
    if (!updates.includes('status=?') && t.status === 'open') { updates.push('status=?'); params.push('in_progress'); }
    if (!req.body.is_internal) createNotification(1, t.user_id, t.user_email, 'success', `Respuesta en ticket #${t.number}`, req.body.response.slice(0,100), '/tickets.html');
  }
  if (req.body.comment) {
    db.prepare('INSERT INTO ticket_comments (ticket_id, text, from_email, from_name, is_internal) VALUES (?,?,?,?,0)').run(id, req.body.comment, req.user.email, req.user.email);
  }
  if (req.body.ai_summary && isAgent) { updates.push('ai_summary=?'); params.push(req.body.ai_summary); }
  if (updates.length) {
    updates.push("updated_at=datetime('now')");
    db.prepare(`UPDATE tickets SET ${updates.join(',')} WHERE id=? AND tenant_id=1`).run(...params, id);
  }
  createAuditLog(1, req.user.id, req.user.email, 'ticket.updated', 'ticket', id, req.body, ip(req));
  res.json({ ok: true });
});

app.delete('/api/tickets/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM tickets WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// Ticket templates
app.get('/api/tickets/templates', auth, requireAgent, (req, res) => {
  res.json({ items: db.prepare('SELECT * FROM ticket_templates WHERE tenant_id=1 ORDER BY name').all() });
});
app.post('/api/tickets/templates', auth, requireManager, (req, res) => {
  const { name, body, category } = req.body || {};
  if (!name || !body) return res.status(400).json({ error: 'Nombre y cuerpo requeridos' });
  const id = db.prepare('INSERT INTO ticket_templates (tenant_id, name, body, category) VALUES (1,?,?,?)').run(name, body, category||'general').lastInsertRowid;
  res.json({ ok: true, id });
});

// CSAT
app.post('/api/tickets/:id/csat', auth, (req, res) => {
  const { score } = req.body || {};
  if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'Score 1-5 requerido' });
  const t = db.prepare('SELECT * FROM tickets WHERE id=? AND tenant_id=1').get(Number(req.params.id));
  if (!t || t.user_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('UPDATE tickets SET csat_score=? WHERE id=?').run(Number(score), t.id);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/kb/categories', (req, res) => {
  const cats = db.prepare('SELECT * FROM kb_categories WHERE tenant_id=1 ORDER BY order_num').all();
  const result = cats.map(c => ({
    ...c,
    article_count: db.prepare('SELECT COUNT(*) as c FROM kb_articles WHERE category_id=? AND is_published=1').get(c.id)?.c || 0
  }));
  res.json({ items: result });
});

app.get('/api/kb/articles', (req, res) => {
  const { category_id, published_only = '1', q } = req.query;
  let sql = 'SELECT a.*, c.name as category_name, c.icon as category_icon FROM kb_articles a LEFT JOIN kb_categories c ON a.category_id=c.id WHERE a.tenant_id=1';
  const params = [];
  if (published_only === '1') { sql += ' AND a.is_published=1'; }
  if (category_id) { sql += ' AND a.category_id=?'; params.push(Number(category_id)); }
  if (q) { sql += ' AND (a.title LIKE ? OR a.content LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
  sql += ' ORDER BY a.updated_at DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

app.get('/api/kb/articles/:id', (req, res) => {
  const a = db.prepare('SELECT a.*, c.name as category_name FROM kb_articles a LEFT JOIN kb_categories c ON a.category_id=c.id WHERE a.id=?').get(Number(req.params.id));
  if (!a || (!a.is_published && !req.query.preview)) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE kb_articles SET views=views+1 WHERE id=?').run(a.id);
  res.json({ article: a });
});

app.post('/api/kb/articles', auth, requireAgent, (req, res) => {
  const { category_id, title, content, is_published=false } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Título y contenido requeridos' });
  const s = slug(title);
  const id = db.prepare('INSERT INTO kb_articles (tenant_id, category_id, title, slug, content, is_published, created_by) VALUES (1,?,?,?,?,?,?)').run(category_id||null, title, s, content, is_published?1:0, req.user.id).lastInsertRowid;
  res.json({ ok: true, id });
});

app.patch('/api/kb/articles/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const { title, content, category_id, is_published } = req.body || {};
  db.prepare(`UPDATE kb_articles SET title=COALESCE(?,title), content=COALESCE(?,content), category_id=COALESCE(?,category_id), is_published=COALESCE(?,is_published), updated_at=datetime('now') WHERE id=? AND tenant_id=1`).run(title||null, content||null, category_id||null, is_published!==undefined?(is_published?1:0):null, id);
  res.json({ ok: true });
});

app.delete('/api/kb/articles/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM kb_articles WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/kb/articles/:id/helpful', (req, res) => {
  const { helpful } = req.body || {};
  const col = helpful ? 'helpful_yes' : 'helpful_no';
  db.prepare(`UPDATE kb_articles SET ${col}=${col}+1 WHERE id=?`).run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/kb/categories', auth, requireManager, (req, res) => {
  const { name, icon='📄', description, order_num=0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const id = db.prepare('INSERT INTO kb_categories (tenant_id, name, icon, description, order_num) VALUES (1,?,?,?,?)').run(name, icon, description||null, Number(order_num)).lastInsertRowid;
  res.json({ ok: true, id });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/notifications', auth, (req, res) => {
  const { unread_only } = req.query;
  let sql = 'SELECT * FROM notifications WHERE user_id=? AND tenant_id=1';
  if (unread_only === '1') sql += ' AND is_read=0';
  sql += ' ORDER BY id DESC LIMIT 50';
  const items = db.prepare(sql).all(req.user.id);
  const unread_count = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id)?.c || 0;
  res.json({ items, unread_count });
});

app.patch('/api/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});

app.post('/api/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=? AND tenant_id=1').run(req.user.id);
  res.json({ ok: true });
});

// SSE — real-time notifications
const sseClients = new Map();
app.get('/api/notifications/stream', auth, (req, res) => {
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  res.flushHeaders();
  const userId = req.user.id;
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(res);
  res.write(`data: ${JSON.stringify({ type:'connected' })}\n\n`);
  const ping = setInterval(() => res.write(':ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); sseClients.get(userId)?.delete(res); });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/audit', auth, requireAdmin, (req, res) => {
  const { action, entity_type, user_email, from, to, limit=100, offset=0 } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE tenant_id=1';
  const params = [];
  if (action)      { sql += ' AND action LIKE ?'; params.push(`%${action}%`); }
  if (entity_type) { sql += ' AND entity_type=?'; params.push(entity_type); }
  if (user_email)  { sql += ' AND user_email LIKE ?'; params.push(`%${user_email}%`); }
  if (from) { sql += ' AND created_at>=?'; params.push(from); }
  if (to)   { sql += ' AND created_at<=?'; params.push(to); }
  const total = db.prepare(sql.replace('SELECT *','SELECT COUNT(*) as c')).get(...params)?.c || 0;
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json({ items: db.prepare(sql).all(...params), total });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: METRICS / ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/metrics', auth, requireAgent, (req, res) => {
  const tid = 1;
  const orders  = db.prepare('SELECT * FROM orders WHERE tenant_id=?').all(tid);
  const users   = db.prepare('SELECT COUNT(*) as c FROM users WHERE tenant_id=?').get(tid);
  const msgs    = db.prepare('SELECT COUNT(*) as c FROM messages WHERE tenant_id=?').get(tid);
  const tickets = db.prepare('SELECT * FROM tickets WHERE tenant_id=?').all(tid);
  const contacts= db.prepare('SELECT COUNT(*) as c FROM contacts WHERE tenant_id=?').get(tid);
  const deals   = db.prepare('SELECT * FROM deals WHERE tenant_id=?').all(tid);

  const totalRevenue   = orders.reduce((s,o)=>s+(o.total||0),0);
  const openTickets    = tickets.filter(t=>t.status==='open').length;
  const breachedSLA    = tickets.filter(t=>t.sla_due_at && t.status!=='closed' && new Date(t.sla_due_at)<new Date()).length;
  const avgCSAT        = (() => { const rated=tickets.filter(t=>t.csat_score); return rated.length ? (rated.reduce((s,t)=>s+t.csat_score,0)/rated.length).toFixed(1) : null; })();
  const pipelineValue  = deals.filter(d=>!['won','lost'].includes(d.stage)).reduce((s,d)=>s+(d.value||0),0);
  const wonRevenue     = deals.filter(d=>d.stage==='won').reduce((s,d)=>s+(d.value||0),0);

  const now2 = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now2.getFullYear(), now2.getMonth()-(5-i), 1);
    return { label: d.toLocaleString('es',{month:'short'}), year: d.getFullYear(), month: d.getMonth() };
  });
  const inMonth = (items, dateField, y, m) => items.filter(it => { const d=new Date(it[dateField]); return d.getFullYear()===y && d.getMonth()===m; });

  const revenueByMonth = months.map(m => ({ label: m.label, value: inMonth(orders,'created_at',m.year,m.month).reduce((s,o)=>s+(o.total||0),0) }));
  const leadsByMonth   = months.map(m => ({ label: m.label, value: inMonth(db.prepare('SELECT created_at FROM messages WHERE tenant_id=1').all(),'created_at',m.year,m.month).length }));
  const ticketsByMonth = months.map(m => ({ label: m.label, value: inMonth(tickets,'created_at',m.year,m.month).length }));
  const newContactsByMonth = months.map(m => ({ label: m.label, value: inMonth(db.prepare('SELECT created_at FROM contacts WHERE tenant_id=1').all(),'created_at',m.year,m.month).length }));

  const dealsByStage = ['prospecting','qualified','proposal','negotiation','won','lost'].map(s => ({
    stage: s, count: deals.filter(d=>d.stage===s).length, value: deals.filter(d=>d.stage===s).reduce((a,d)=>a+(d.value||0),0)
  }));

  const ticketsByCategory = db.prepare("SELECT category, COUNT(*) as count FROM tickets WHERE tenant_id=1 GROUP BY category").all();
  const ticketsByPriority = db.prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE tenant_id=1 GROUP BY priority").all();
  const tasksByStatus = db.prepare("SELECT status, COUNT(*) as count FROM tasks WHERE tenant_id=1 GROUP BY status ORDER BY count DESC").all();
  const tasksByUser   = db.prepare(`
    SELECT assigned_email,
      COUNT(*) as total,
      SUM(CASE WHEN status='completada'  THEN 1 ELSE 0 END) as completadas,
      SUM(CASE WHEN status='en_progreso' THEN 1 ELSE 0 END) as en_progreso,
      SUM(CASE WHEN status='pendiente'   THEN 1 ELSE 0 END) as pendientes,
      ROUND(AVG(CASE WHEN status='completada' THEN
        (julianday(updated_at)-julianday(created_at))*24
      END),1) as avg_horas
    FROM tasks WHERE tenant_id=1 AND assigned_email IS NOT NULL
    GROUP BY assigned_email ORDER BY completadas DESC LIMIT 10
  `).all();

  res.json({
    summary: {
      total_revenue: totalRevenue, total_orders: orders.length,
      pending_orders: orders.filter(o=>o.status==='pending').length,
      total_users: users.c, total_messages: msgs.c,
      open_tickets: openTickets, breached_sla: breachedSLA, avg_csat: avgCSAT,
      total_contacts: contacts.c, pipeline_value: pipelineValue, won_revenue: wonRevenue,
      total_deals: deals.length, won_deals: deals.filter(d=>d.stage==='won').length
    },
    revenue_by_month: revenueByMonth,
    leads_by_month: leadsByMonth,
    tickets_by_month: ticketsByMonth,
    contacts_by_month: newContactsByMonth,
    deals_by_stage: dealsByStage,
    tickets_by_category: ticketsByCategory,
    tickets_by_priority: ticketsByPriority,
    tasks_by_status: tasksByStatus,
    tasks_by_user: tasksByUser
  });
});

// Export metrics CSV
app.get('/api/metrics.csv', auth, requireAdmin, (req, res) => {
  const metrics = {
    orders: db.prepare('SELECT * FROM orders WHERE tenant_id=1').all(),
    tickets: db.prepare('SELECT * FROM tickets WHERE tenant_id=1').all(),
    contacts: db.prepare('SELECT * FROM contacts WHERE tenant_id=1').all(),
    deals: db.prepare('SELECT * FROM deals WHERE tenant_id=1').all(),
  };
  const esc = v => `"${String(v??'').replace(/"/g,'""')}"`;
  let csv = 'Tipo,Métrica,Valor\n';
  csv += `Órdenes,Total,${metrics.orders.length}\n`;
  csv += `Órdenes,Ingresos totales,${metrics.orders.reduce((s,o)=>s+(o.total||0),0)}\n`;
  csv += `Tickets,Total,${metrics.tickets.length}\n`;
  csv += `Tickets,Abiertos,${metrics.tickets.filter(t=>t.status==='open').length}\n`;
  csv += `Contactos,Total,${metrics.contacts.length}\n`;
  csv += `Deals,Total,${metrics.deals.length}\n`;
  csv += `Deals,Ganados,${metrics.deals.filter(d=>d.stage==='won').length}\n`;
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="metrics.csv"');
  res.send(csv);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ORDERS
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { customer, items, total, referral_code } = req.body || {};
  if (!customer || !items || !Array.isArray(items)) return res.status(400).json({ error: 'Campos requeridos' });
  const ref = referral_code ? db.prepare('SELECT * FROM referrals WHERE code=?').get(referral_code.toUpperCase()) : null;
  const discount = ref ? ref.discount : 0;
  const id = db.prepare('INSERT INTO orders (tenant_id, customer_json, items_json, total, discount, referral_code, status) VALUES (1,?,?,?,?,?,?)').run(JSON.stringify(customer), JSON.stringify(items), Number(total||0), discount, ref?.code||null, 'pending').lastInsertRowid;
  if (ref) db.prepare('UPDATE referrals SET uses=uses+1, earnings=earnings+? WHERE id=?').run(Number(total||0)*0.1, ref.id);
  const admins = db.prepare("SELECT id, email FROM users WHERE tenant_id=1 AND role IN ('admin','owner')").all();
  admins.forEach(a => createNotification(1, a.id, a.email, 'success', 'Nueva orden recibida', `${customer.name||'Cliente'} — $${total}`, '/admin.html'));
  res.json({ ok: true, id });
});

app.get('/api/orders', auth, requireAgent, (req, res) => {
  const { status, limit=50, offset=0 } = req.query;
  let sql = 'SELECT * FROM orders WHERE tenant_id=1';
  const params = [];
  if (status) { sql += ' AND status=?'; params.push(status); }
  const total = db.prepare(sql.replace('SELECT *','SELECT COUNT(*) as c')).get(...params)?.c || 0;
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const items = db.prepare(sql).all(...params).map(o=>({...o, customer:jObj(o.customer_json), items:j(o.items_json)}));
  res.json({ items, total });
});

app.patch('/api/orders/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  if (req.body.status) db.prepare('UPDATE orders SET status=?, updated_at=? WHERE id=? AND tenant_id=1').run(req.body.status, now(), id);
  if (req.body.notes) db.prepare('UPDATE orders SET notes=? WHERE id=? AND tenant_id=1').run(req.body.notes, id);
  createAuditLog(1, req.user.id, req.user.email, 'order.updated', 'order', id, req.body, ip(req));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: REFERRALS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/referrals', auth, (req, res) => {
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  const items = isAgent
    ? db.prepare('SELECT * FROM referrals WHERE tenant_id=1 ORDER BY uses DESC').all()
    : db.prepare('SELECT * FROM referrals WHERE email=? AND tenant_id=1').all(req.user.email);
  res.json({ items });
});

app.post('/api/referrals/generate', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM referrals WHERE email=? AND tenant_id=1').get(req.user.email);
  if (existing) return res.json({ code: existing.code, uses: existing.uses, earnings: existing.earnings });
  const code = randomCode(8);
  db.prepare('INSERT INTO referrals (tenant_id, user_id, email, name, code, discount) VALUES (1,?,?,?,?,10)').run(req.user.id, req.user.email, req.user.email, code);
  res.json({ code, uses: 0, earnings: 0 });
});

app.get('/api/referrals/:code', (req, res) => {
  const ref = db.prepare('SELECT * FROM referrals WHERE code=?').get(req.params.code.toUpperCase());
  if (!ref) return res.status(404).json({ error: 'Código inválido' });
  res.json({ valid: true, discount: ref.discount, uses: ref.uses });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/projects', auth, (req, res) => {
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  const items = isAgent
    ? db.prepare('SELECT * FROM projects WHERE tenant_id=1 ORDER BY id DESC').all()
    : db.prepare('SELECT * FROM projects WHERE client_email=? AND tenant_id=1 ORDER BY id DESC').all(req.user.email);
  res.json({ items: items.map(p=>({...p, stages:j(p.stages_json)})) });
});

app.post('/api/projects', auth, requireManager, (req, res) => {
  const { client_email, name, stages, start_date, due_date } = req.body || {};
  if (!client_email || !name) return res.status(400).json({ error: 'Campos requeridos' });
  const defaultStages = stages || ['Análisis','Diseño','Desarrollo','Revisión','Entrega'].map(l=>({label:l,done:false}));
  const id = db.prepare('INSERT INTO projects (tenant_id, client_email, name, stages_json, start_date, due_date) VALUES (1,?,?,?,?,?)').run(client_email, name, JSON.stringify(defaultStages), start_date||null, due_date||null).lastInsertRowid;
  const user = db.prepare('SELECT id FROM users WHERE email=? AND tenant_id=1').get(client_email);
  if (user) createNotification(1, user.id, client_email, 'success', 'Nuevo proyecto asignado', `El proyecto "${name}" ha sido creado.`, '/timeline.html');
  createAuditLog(1, req.user.id, req.user.email, 'project.created', 'project', id, { name, client_email }, ip(req));
  res.json({ ok: true, id });
});

app.patch('/api/projects/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const proj = db.prepare('SELECT * FROM projects WHERE id=? AND tenant_id=1').get(id);
  if (!proj) return res.status(404).json({ error: 'Not found' });
  const isAgent = ['admin','owner','manager','agent'].includes(req.user.role);
  if (!isAgent && proj.client_email !== req.user.email) return res.status(403).json({ error: 'Forbidden' });
  const updates = []; const params = [];
  if (req.body.stages) {
    const stages = req.body.stages;
    const done = stages.filter(s=>s.done).length;
    const progress = Math.round((done/stages.length)*100);
    updates.push('stages_json=?','progress=?'); params.push(JSON.stringify(stages), progress);
  }
  if (req.body.notes !== undefined) { updates.push('notes=?'); params.push(req.body.notes); }
  if (req.body.status) { updates.push('status=?'); params.push(req.body.status); }
  if (req.body.due_date) { updates.push('due_date=?'); params.push(req.body.due_date); }
  updates.push("updated_at=datetime('now')");
  db.prepare(`UPDATE projects SET ${updates.join(',')} WHERE id=?`).run(...params, id);
  const updated = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  res.json({ ok: true, progress: updated.progress });
});

app.delete('/api/projects/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: PLANS & SUBSCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/plans', (req, res) => {
  const items = db.prepare('SELECT * FROM plans WHERE is_active=1 ORDER BY price_monthly').all().map(p=>({...p, features:j(p.features_json), limits:jObj(p.limits_json)}));
  res.json({ items });
});

app.get('/api/subscription', auth, requireAdmin, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE tenant_id=1').get();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id=1').get();
  res.json({ subscription: sub, plan: tenant?.plan, tenant: { name: tenant?.name, slug: tenant?.slug, logo_url: tenant?.logo_url, primary_color: tenant?.primary_color } });
});

app.patch('/api/subscription/plan', auth, requireAdmin, (req, res) => {
  const { plan } = req.body || {};
  const valid = db.prepare('SELECT id FROM plans WHERE name=?').get(plan);
  if (!valid) return res.status(400).json({ error: 'Plan inválido' });
  db.prepare("UPDATE tenants SET plan=? WHERE id=1").run(plan);
  createAuditLog(1, req.user.id, req.user.email, 'subscription.plan_changed', 'tenant', 1, { plan }, ip(req));
  res.json({ ok: true, message: `Plan actualizado a ${plan}. Contacta soporte para activar el pago.` });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AUTOMATION RULES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/automations', auth, requireManager, (req, res) => {
  res.json({ items: db.prepare('SELECT * FROM automation_rules WHERE tenant_id=1 ORDER BY id').all().map(r=>({...r, conditions:j(r.conditions_json), actions:j(r.actions_json)})) });
});
app.post('/api/automations', auth, requireManager, (req, res) => {
  const { name, trigger_event, conditions=[], actions } = req.body || {};
  if (!name || !trigger_event || !actions?.length) return res.status(400).json({ error: 'Campos requeridos' });
  const id = db.prepare('INSERT INTO automation_rules (tenant_id, name, trigger_event, conditions_json, actions_json) VALUES (1,?,?,?,?)').run(name, trigger_event, JSON.stringify(conditions), JSON.stringify(actions)).lastInsertRowid;
  res.json({ ok: true, id });
});
app.patch('/api/automations/:id', auth, requireManager, (req, res) => {
  const id = Number(req.params.id);
  const { name, is_active } = req.body || {};
  db.prepare('UPDATE automation_rules SET name=COALESCE(?,name), is_active=COALESCE(?,is_active) WHERE id=? AND tenant_id=1').run(name||null, is_active!==undefined?Number(is_active):null, id);
  res.json({ ok: true });
});
app.delete('/api/automations/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM automation_rules WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: BRANDING / WHITE-LABEL
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/branding', (req, res) => {
  const t = db.prepare('SELECT name, logo_url, primary_color, custom_domain FROM tenants WHERE id=1').get();
  res.json({ branding: t });
});
app.patch('/api/branding', auth, requireAdmin, (req, res) => {
  const { name, logo_url, primary_color } = req.body || {};
  db.prepare('UPDATE tenants SET name=COALESCE(?,name), logo_url=COALESCE(?,logo_url), primary_color=COALESCE(?,primary_color) WHERE id=1').run(name||null, logo_url||null, primary_color||null);
  createAuditLog(1, req.user.id, req.user.email, 'branding.updated', 'tenant', 1, req.body, ip(req));
  res.json({ ok: true });
});

// SMTP config (admin only)
app.patch('/api/settings/smtp', auth, requireAdmin, (req, res) => {
  const { host, port, user, pass, from } = req.body || {};
  if (!host || !port || !user || !pass) return res.status(400).json({ error: 'Host, puerto, usuario y contraseña requeridos' });
  // Save to .env (append/update)
  const envPath = join(__dir, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath,'utf8') : '';
  const setEnv = (key, val) => {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(envContent)) envContent = envContent.replace(re, `${key}=${val}`);
    else envContent += `\n${key}=${val}`;
  };
  setEnv('SMTP_HOST', host); setEnv('SMTP_PORT', port);
  setEnv('SMTP_USER', user); setEnv('SMTP_PASS', pass);
  if (from) setEnv('SMTP_FROM', from);
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  res.json({ ok: true, message: 'SMTP configurado. Reinicia el servidor para aplicar.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: FILE UPLOADS
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
  const ext = extname(req.file.originalname);
  const newName = `${Date.now()}_${req.user.id}${ext}`;
  const newPath = join(__dir, 'uploads', newName);
  fs.renameSync(req.file.path, newPath);
  res.json({ ok: true, url: `/uploads/${newName}`, filename: req.file.originalname, size: req.file.size });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AI — JARVIS + TOOLS
// ─────────────────────────────────────────────────────────────────────────────
const _ai = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

const JARVIS_SYSTEM = `Eres Jarvina, asistente de inteligencia artificial de Nexuss eks Systems. Eres profesional, cálida y útil. Hablas SIEMPRE en español. Puedes responder cualquier pregunta: sobre la empresa, tecnología, programación, negocios, o temas generales. Eres una asistente completa.

EMPRESA:
- Nombre: Nexuss eks Systems (la X se pronuncia "eks" en inglés)
- Tipo: Empresa de tecnología — desarrollo web e inteligencia artificial
- Misión: Impulsar negocios con soluciones digitales de alto impacto
- Visión: Ser referente en innovación tecnológica en Latinoamérica
- Lema: "Nuestro trabajo supera los límites... va más allá de este planeta."
- Plataforma: Sistema empresarial premium con CRM, tickets, IA, pipeline de ventas y más.
- Contacto: nexussxsistem@gmail.com

SERVICIOS Y PRECIOS APROXIMADOS:
- Sitios web corporativos y landing pages (desde RD$15,000)
- Páginas de ventas y embudos de conversión (desde RD$20,000)
- Paneles de gestión y dashboards a medida (desde RD$35,000)
- Chatbots e inteligencia artificial integrados (desde RD$25,000)
- CRM y automatización de procesos empresariales (desde RD$40,000)
- Aplicaciones web personalizadas (cotización a medida)
- Los tiempos de entrega van de 1 a 8 semanas según el proyecto.

PÁGINAS DEL SITIO:
- Servicios: servicios.html
- Productos/Planes: productos.html y plans.html
- Calculadora de precios: calculadora.html
- Portafolio de proyectos: index.html#portfolio
- Contacto: contacto.html
- FAQ: faq.html
- Blog: blog.html

REGLAS:
1. Responde cualquier pregunta de forma clara y útil, no solo las de la empresa.
2. Para preguntas de la empresa: sé directo y conciso (2-4 oraciones).
3. Para preguntas generales (tecnología, programación, etc.): responde con claridad y detalle apropiado.
4. Siempre escribe "Nexuss eks Systems" (nunca "Nexuss X Systems")
5. Cuando haya una página relevante: [link:pagina.html:Texto →]
6. Para ÉNFASIS usa MAYÚSCULAS (máximo 2 por respuesta)
7. Para preguntas de precios exactos, envía a [link:calculadora.html:Calculadora de precios →]
8. Si el usuario quiere contratar o tiene un proyecto específico, envíalo a [link:contacto.html:Contactar →]`;

// ─── RESPUESTAS LOCALES INTELIGENTES (funciona sin API de Anthropic) ──────────
function localJarvisReply(msg) {
  const m = msg.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Servicios / desarrollo / tecnología solicitada
  if (/servicio|que (hacen|ofrecen|haceis|dan)|que (puedo|puede) (pedir|contratar|hacer)|portafolio|trabaj|front.?end|back.?end|full.?stack|chatbot|aplicacion|app web|sistema web|desarrollo|plataforma|panel|dashboard|crm|landing/i.test(m))
    return `Ofrecemos desarrollo web completo y a medida:\n• Sitios web corporativos y landing pages\n• Aplicaciones web (frontend + backend)\n• Chatbots e IA integrados\n• Paneles de gestión (CRM, dashboards)\n• Automatización de procesos empresariales\n\nSea básico o muy elaborado, lo construimos desde cero. [link:servicios.html:Ver todos los servicios →]`;

  // Precios
  if (/costo|precio|cuesta|cobran|cuanto vale|valor|tarifa|presupuesto|cotiza/i.test(m))
    return `Los precios varían según el proyecto:\n• Sitio web / Landing page: desde RD$15,000\n• Página de ventas / Embudo: desde RD$20,000\n• Dashboard a medida: desde RD$35,000\n• Chatbot con IA: desde RD$25,000\n\nUsa nuestra calculadora para una estimación exacta. [link:calculadora.html:Calculadora de precios →]`;

  // Tiempo / duración (va antes que contratar para no pisarse)
  if (/cuanto (tiempo|tarda|demora|dura)|tiempo|tarda|demora|entrega|plazo|semana|cuantos dias|cuanto mes|rapido|urgente/i.test(m))
    return `Los tiempos de entrega dependen del proyecto:\n• Landing page simple: 1–2 semanas\n• Sitio corporativo: 2–4 semanas\n• Aplicación web: 4–8 semanas\n• Chatbot / CRM: 3–6 semanas\n\nTe damos una fecha exacta en la propuesta. [link:contacto.html:Solicitar propuesta →]`;

  // Contratar / contacto
  if (/contratar|contactar|hablar|reunion|llamar|whatsapp|email|correo|empezar|iniciar un proyecto|quiero (un|mi|hacer)/i.test(m))
    return `Para contratar o agendar una reunión escríbenos directamente. Respondemos en menos de 24 horas y te enviamos una propuesta personalizada sin costo. [link:contacto.html:Contactar ahora →]`;

  // Quiénes son / empresa
  if (/quien|empresa|nexus|sobre|historia|fundador|equipo|ubicacion|pais|dominican/i.test(m))
    return `Nexuss eks Systems es una empresa de tecnología especializada en desarrollo web e inteligencia artificial. Nuestra misión es impulsar negocios con soluciones digitales de alto impacto. Operamos en República Dominicana y servimos clientes en toda Latinoamérica.`;

  // Tecnologías / stack
  if (/tecnolog|stack|lenguaje|framework|react|node|programacion|html|css|javascript|base de datos/i.test(m))
    return `Trabajamos con tecnologías modernas:\n• Frontend: HTML5, CSS3, JavaScript, React\n• Backend: Node.js, Express\n• Base de datos: SQLite, PostgreSQL, MySQL\n• IA: Claude (Anthropic), OpenAI\n• Hosting: VPS, Vercel, AWS\n\nElegimos el stack ideal según tu proyecto.`;

  // FAQ general
  if (/garantia|soporte|mantenimiento|actualizacion/i.test(m))
    return `Ofrecemos soporte post-entrega y mantenimiento mensual opcional. Cada proyecto incluye 30 días de soporte gratuito. Para planes de mantenimiento continuos, consulta nuestros planes. [link:plans.html:Ver planes →]`;

  // Saludo
  if (/^(hola|hey|buenos|buenas|ola|hi|hello|que tal|saludos)/.test(m))
    return `¡Hola! Soy Jarvina, tu asistente de Nexuss eks Systems. Estoy aquí para ayudarte con información sobre nuestros servicios, precios y proyectos. ¿En qué puedo ayudarte hoy?`;

  // Gracias
  if (/gracias|thank|perfecto|genial|excelente|buenisimo/.test(m))
    return `¡Con gusto! Si tienes más preguntas o quieres iniciar un proyecto, no dudes en escribirnos. [link:contacto.html:Contactar →]`;

  // Default inteligente
  return `Soy Jarvina, la asistente de Nexuss eks Systems. Puedo ayudarte con información sobre nuestros servicios de desarrollo web, precios, tiempos de entrega y más.\n\n¿Sobre qué te gustaría saber? [link:contacto.html:Hablar con un asesor →]`;
}

app.post('/api/jarvis', async (req, res) => {
  const { message, history = [], session_id } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

  // Save conversation
  if (session_id) {
    try {
      const conv = db.prepare('SELECT * FROM ai_conversations WHERE session_id=? AND tenant_id=1').get(session_id);
      const msgs = conv ? j(conv.messages_json) : [];
      msgs.push({ role:'user', content: message, ts: now() });
      if (conv) db.prepare("UPDATE ai_conversations SET messages_json=?, updated_at=datetime('now') WHERE session_id=?").run(JSON.stringify(msgs), session_id);
      else db.prepare('INSERT INTO ai_conversations (tenant_id, session_id, messages_json) VALUES (1,?,?)').run(session_id, JSON.stringify(msgs));
    } catch(_) {}
  }

  // Intentar con Claude IA primero (si hay API key y créditos)
  if (_ai) {
    try {
      const messages = [...history.slice(-10).map(m=>({ role: m.from==='user'?'user':'assistant', content: m.text })), { role:'user', content: message }];
      const r = await _ai.messages.create({ model:'claude-haiku-4-5', max_tokens:400, system: JARVIS_SYSTEM, messages });
      const reply = r.content[0].text;
      if (session_id) {
        try {
          const conv = db.prepare('SELECT * FROM ai_conversations WHERE session_id=?').get(session_id);
          if (conv) { const msgs = j(conv.messages_json); msgs.push({ role:'assistant', content: reply, ts: now() }); db.prepare("UPDATE ai_conversations SET messages_json=? WHERE session_id=?").run(JSON.stringify(msgs), session_id); }
        } catch(_) {}
      }
      return res.json({ reply });
    } catch(e) {
      console.warn('[Jarvis] IA no disponible, usando respuestas locales:', e.message);
    }
  }

  // Fallback: respuestas locales inteligentes (siempre funcionan)
  const reply = localJarvisReply(message);
  res.json({ reply });
});

// AI: Suggest ticket response
app.post('/api/ai/ticket-suggest', auth, requireAgent, async (req, res) => {
  if (!_ai) return res.status(503).json({ error: 'IA no configurada' });
  const { ticket_id, context } = req.body || {};
  const t = ticket_id ? db.prepare('SELECT * FROM tickets WHERE id=? AND tenant_id=1').get(Number(ticket_id)) : null;
  const ticketCtx = t ? `Ticket #${t.number}: "${t.title}"\nDescripción: ${t.description}\nPrioridad: ${t.priority}\nCategoría: ${t.category}` : context || '';
  try {
    const r = await _ai.messages.create({
      model:'claude-haiku-4-5-20251001', max_tokens:400,
      system: 'Eres un agente de soporte experto de Nexuss eks Systems. Redacta respuestas profesionales, empáticas y resolutivas en español. Sé conciso y ofrece pasos claros.',
      messages:[{ role:'user', content:`Redacta una respuesta profesional para este ticket de soporte:\n\n${ticketCtx}\n\nLa respuesta debe ser empática, clara y ofrecer una solución o siguiente paso.` }]
    });
    res.json({ suggestion: r.content[0].text });
  } catch(e) { res.status(500).json({ error: 'IA no disponible' }); }
});

// AI: Summarize ticket
app.post('/api/ai/ticket-summarize', auth, requireAgent, async (req, res) => {
  if (!_ai) return res.status(503).json({ error: 'IA no configurada' });
  const { ticket_id } = req.body || {};
  const t = db.prepare('SELECT * FROM tickets WHERE id=? AND tenant_id=1').get(Number(ticket_id));
  if (!t) return res.status(404).json({ error: 'Ticket no encontrado' });
  const comments = db.prepare('SELECT * FROM ticket_comments WHERE ticket_id=? ORDER BY created_at').all(t.id);
  const fullText = `Ticket: ${t.title}\nDescripción: ${t.description}\n\nConversación:\n${comments.map(c=>`[${c.from_email}]: ${c.text}`).join('\n')}`;
  try {
    const r = await _ai.messages.create({
      model:'claude-haiku-4-5-20251001', max_tokens:200,
      system:'Resume conversaciones de soporte en 2-3 líneas. Incluye: problema, estado actual, y acción pendiente si aplica. Español.',
      messages:[{ role:'user', content:`Resume este ticket:\n${fullText}` }]
    });
    db.prepare('UPDATE tickets SET ai_summary=? WHERE id=?').run(r.content[0].text, t.id);
    res.json({ summary: r.content[0].text });
  } catch(e) { res.status(500).json({ error: 'IA no disponible' }); }
});

// AI: Content generator
app.post('/api/ai/generate-content', auth, async (req, res) => {
  if (!_ai) return res.status(503).json({ error: 'IA no configurada' });
  const { type, topic, tone='profesional', length='medium', lang='es', extra } = req.body || {};
  if (!type || !topic) return res.status(400).json({ error: 'Tipo y tema requeridos' });
  const lengthMap = { short:'2-3 párrafos', medium:'4-6 párrafos', long:'800-1200 palabras' };
  const prompts = {
    blog_post:    `Escribe un artículo de blog completo sobre: "${topic}". Tono: ${tone}. Longitud: ${lengthMap[length]||lengthMap.medium}. Incluye título, subtítulos y CTA al final. ${extra||''}`,
    email:        `Redacta un email de marketing profesional sobre: "${topic}". Tono: ${tone}. Incluye asunto del email, saludo, cuerpo y firma. ${extra||''}`,
    social_post:  `Crea 3 variaciones de publicaciones para redes sociales sobre: "${topic}". Tono: ${tone}. Una para LinkedIn, una para Instagram, una para Twitter/X. ${extra||''}`,
    landing_copy: `Escribe el copy completo para una landing page de: "${topic}". Incluye: headline, subtítulo, propuesta de valor, 3 beneficios clave, testimonios simulados y CTA. Tono: ${tone}. ${extra||''}`,
    product_desc: `Escribe una descripción de producto/servicio para: "${topic}". Tono: ${tone}. Incluye características, beneficios y CTA de compra. ${extra||''}`,
    faq:          `Genera 8-10 preguntas frecuentes con respuestas detalladas sobre: "${topic}". Formato Q&A. ${extra||''}`,
    ad_copy:      `Crea 5 variaciones de copy publicitario (Google Ads / Facebook Ads) para: "${topic}". Incluye headline, descripción y CTA. ${extra||''}`
  };
  const prompt = prompts[type] || `Genera contenido de tipo "${type}" sobre: "${topic}". ${extra||''}`;
  try {
    const r = await _ai.messages.create({
      model:'claude-sonnet-4-5-20251001', max_tokens:1500,
      system:`Eres un copywriter experto especializado en marketing digital. Escribes en ${lang==='es'?'español':'inglés'} con excelente redacción, persuasión y SEO.`,
      messages:[{ role:'user', content: prompt }]
    });
    res.json({ content: r.content[0].text, type, topic });
  } catch(e) { res.status(500).json({ error: 'IA no disponible' }); }
});

// AI: CRM contact insights
app.post('/api/ai/contact-insights', auth, requireAgent, async (req, res) => {
  if (!_ai) return res.status(503).json({ error: 'IA no configurada' });
  const { contact_id } = req.body || {};
  const c = db.prepare('SELECT * FROM contacts WHERE id=? AND tenant_id=1').get(Number(contact_id));
  if (!c) return res.status(404).json({ error: 'Contacto no encontrado' });
  const deals = db.prepare('SELECT * FROM deals WHERE contact_id=? AND tenant_id=1').all(c.id);
  const notes = db.prepare('SELECT text FROM crm_notes WHERE contact_id=? ORDER BY created_at DESC LIMIT 5').all(c.id);
  const ctx = `Contacto: ${c.name} (${c.company||'sin empresa'})\nStatus: ${c.status}, Stage: ${c.stage}\nDeals: ${deals.map(d=>`${d.title} - $${d.value} (${d.stage})`).join(', ')||'ninguno'}\nNotas recientes: ${notes.map(n=>n.text).join(' | ')||'ninguna'}`;
  try {
    const r = await _ai.messages.create({
      model:'claude-haiku-4-5-20251001', max_tokens:300,
      system:'Eres un asesor de ventas experto. Analiza datos de CRM y da recomendaciones concretas y accionables en español. Máximo 3 recomendaciones claras.',
      messages:[{ role:'user', content:`Analiza este contacto y da 3 recomendaciones de ventas concretas:\n${ctx}` }]
    });
    res.json({ insights: r.content[0].text });
  } catch(e) { res.status(500).json({ error: 'IA no disponible' }); }
});

// AI: Business summary
app.post('/api/ai/business-summary', auth, requireAdmin, async (req, res) => {
  if (!_ai) return res.status(503).json({ error: 'IA no configurada' });
  const orders  = db.prepare('SELECT total, status, created_at FROM orders WHERE tenant_id=1').all();
  const tickets = db.prepare('SELECT status, priority, csat_score FROM tickets WHERE tenant_id=1').all();
  const contacts= db.prepare('SELECT stage, status FROM contacts WHERE tenant_id=1').all();
  const deals   = db.prepare('SELECT stage, value FROM deals WHERE tenant_id=1').all();
  const ctx = `MÉTRICAS DEL NEGOCIO:
Ingresos totales: $${orders.reduce((s,o)=>s+(o.total||0),0).toLocaleString()}
Órdenes pendientes: ${orders.filter(o=>o.status==='pending').length}
Tickets abiertos: ${tickets.filter(t=>t.status==='open').length}
Tickets urgentes: ${tickets.filter(t=>t.priority==='urgent').length}
CSAT promedio: ${tickets.filter(t=>t.csat_score).length ? (tickets.filter(t=>t.csat_score).reduce((s,t)=>s+t.csat_score,0)/tickets.filter(t=>t.csat_score).length).toFixed(1) : 'N/D'}
Contactos totales: ${contacts.length}
Deals activos: ${deals.filter(d=>!['won','lost'].includes(d.stage)).length}
Pipeline value: $${deals.filter(d=>!['won','lost'].includes(d.stage)).reduce((s,d)=>s+(d.value||0),0).toLocaleString()}
Deals ganados: ${deals.filter(d=>d.stage==='won').length}`;
  try {
    const r = await _ai.messages.create({
      model:'claude-haiku-4-5-20251001', max_tokens:400,
      system:'Eres un consultor de negocios. Analiza métricas empresariales y da un resumen ejecutivo conciso con 3 insights clave y 2 acciones prioritarias. Español.',
      messages:[{ role:'user', content:`Genera un resumen ejecutivo del negocio:\n${ctx}` }]
    });
    res.json({ summary: r.content[0].text });
  } catch(e) { res.status(500).json({ error: 'IA no disponible' }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: BLOG
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/blog', (req, res) => {
  const { category, q, limit=20, offset=0 } = req.query;
  let sql = 'SELECT * FROM blog_posts WHERE tenant_id=1 AND is_published=1';
  const params = [];
  if (category) { sql += ' AND category=?'; params.push(category); }
  if (q) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
  const total = db.prepare(sql.replace('SELECT *','SELECT COUNT(*) as c')).get(...params)?.c || 0;
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'; params.push(Number(limit), Number(offset));
  res.json({ items: db.prepare(sql).all(...params), total });
});

app.post('/api/blog', auth, requireAgent, (req, res) => {
  const { title, content, excerpt, category='general', is_published=false, featured_image } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'Título y contenido requeridos' });
  const s = slug(title);
  const id = db.prepare('INSERT INTO blog_posts (tenant_id, title, slug, excerpt, content, category, is_published, featured_image, author_id) VALUES (1,?,?,?,?,?,?,?,?)').run(title, s, excerpt||null, content, category, is_published?1:0, featured_image||null, req.user.id).lastInsertRowid;
  res.json({ ok: true, id });
});

app.patch('/api/blog/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const { title, content, excerpt, category, is_published, featured_image } = req.body || {};
  db.prepare(`UPDATE blog_posts SET title=COALESCE(?,title), content=COALESCE(?,content), excerpt=COALESCE(?,excerpt), category=COALESCE(?,category), is_published=COALESCE(?,is_published), featured_image=COALESCE(?,featured_image), updated_at=datetime('now') WHERE id=? AND tenant_id=1`).run(title||null, content||null, excerpt||null, category||null, is_published!==undefined?(is_published?1:0):null, featured_image||null, id);
  res.json({ ok: true });
});

app.delete('/api/blog/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: HEALTH + STATS
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbSize = (() => { try { return fs.statSync(join(__dir,'data','nexus.db')).size; } catch { return 0; } })();
  res.json({
    ok: true, version: '2.0.0',
    ai_ready: !!_ai,
    db_size_kb: Math.round(dbSize/1024),
    uptime_seconds: Math.round(process.uptime()),
    node: process.version
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TASKS (Gestión de Tareas)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/task-categories', auth, (req, res) => {
  const cats = db.prepare('SELECT tc.*, COUNT(t.id) as task_count FROM task_categories tc LEFT JOIN tasks t ON t.category_id=tc.id WHERE tc.tenant_id=1 GROUP BY tc.id ORDER BY tc.name').all();
  res.json({ items: cats });
});

app.get('/api/tasks', auth, (req, res) => {
  const { status, priority, category_id, assigned_email, q, limit=50, offset=0 } = req.query;
  let sql = 'SELECT t.*, tc.name as category_name, tc.color as category_color, tc.icon as category_icon FROM tasks t LEFT JOIN task_categories tc ON t.category_id=tc.id WHERE t.tenant_id=1';
  const params = [];
  if (status)         { sql += ' AND t.status=?'; params.push(status); }
  if (priority)       { sql += ' AND t.priority=?'; params.push(priority); }
  if (category_id)    { sql += ' AND t.category_id=?'; params.push(Number(category_id)); }
  if (assigned_email) { sql += ' AND t.assigned_email LIKE ?'; params.push(`%${assigned_email}%`); }
  if (q)              { sql += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${q}%`,`%${q}%`); }
  const total = db.prepare(sql.replace('SELECT t.*,tc.name as category_name,tc.color as category_color,tc.icon as category_icon','SELECT COUNT(*) as c')).get(...params)?.c || 0;
  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json({ items: db.prepare(sql).all(...params), total });
});

app.get('/api/tasks/stats', auth, requireAgent, (req, res) => {
  const total      = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1").get().c;
  const pendiente  = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1 AND status='pendiente'").get().c;
  const en_progreso= db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1 AND status='en_progreso'").get().c;
  const completada = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1 AND status='completada'").get().c;
  const urgente    = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1 AND priority='urgente'").get().c;
  const vencidas   = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE tenant_id=1 AND due_date < date('now') AND status != 'completada'").get().c;
  const byCategory = db.prepare("SELECT tc.name, tc.color, tc.icon, COUNT(t.id) as count FROM task_categories tc LEFT JOIN tasks t ON t.category_id=tc.id WHERE tc.tenant_id=1 GROUP BY tc.id").all();
  const byPriority = db.prepare("SELECT priority, COUNT(*) as count FROM tasks WHERE tenant_id=1 GROUP BY priority").all();
  res.json({ total, pendiente, en_progreso, completada, urgente, vencidas, by_category: byCategory, by_priority: byPriority });
});

app.get('/api/tasks/:id', auth, (req, res) => {
  const task = db.prepare('SELECT t.*, tc.name as category_name, tc.color as category_color FROM tasks t LEFT JOIN task_categories tc ON t.category_id=tc.id WHERE t.id=? AND t.tenant_id=1').get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  const comments = db.prepare('SELECT * FROM task_comments WHERE task_id=? ORDER BY created_at ASC').all(task.id);
  res.json({ task: { ...task, tags: j(task.tags_json) }, comments });
});

app.post('/api/tasks', auth, requireAgent, (req, res) => {
  const { title, description, status='pendiente', priority='normal', category_id, assigned_email, due_date, tags=[] } = req.body || {};
  if (!title) return res.status(400).json({ error: 'El título es requerido' });
  const id = db.prepare(`INSERT INTO tasks (tenant_id, category_id, title, description, status, priority, assigned_email, due_date, tags_json, created_by) VALUES (1,?,?,?,?,?,?,?,?,?)`).run(category_id||null, title, description||null, status, priority, assigned_email||null, due_date||null, JSON.stringify(tags), req.user.id).lastInsertRowid;
  createAuditLog(1, req.user.id, req.user.email, 'task.created', 'task', id, { title, status, priority }, ip(req));
  if (assigned_email) {
    const assignedUser = db.prepare('SELECT id FROM users WHERE email=? AND tenant_id=1').get(assigned_email);
    if (assignedUser) createNotification(1, assignedUser.id, assigned_email, 'info', 'Nueva tarea asignada', `Se te asignó: "${title}"`, '/tareas.html');
  }
  res.json({ ok: true, id });
});

app.patch('/api/tasks/:id', auth, requireAgent, (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id=? AND tenant_id=1').get(id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
  const { title, description, status, priority, category_id, assigned_email, due_date, progress, tags } = req.body || {};
  const updates = ["updated_at=datetime('now')"];
  const params = [];
  if (title!==undefined)         { updates.push('title=?');          params.push(title); }
  if (description!==undefined)   { updates.push('description=?');    params.push(description||null); }
  if (status!==undefined)        { updates.push('status=?');         params.push(status);
    if (status==='completada')   { updates.push('completed_at=?');   params.push(now()); }
  }
  if (priority!==undefined)      { updates.push('priority=?');       params.push(priority); }
  if (category_id!==undefined)   { updates.push('category_id=?');    params.push(category_id||null); }
  if (assigned_email!==undefined){ updates.push('assigned_email=?'); params.push(assigned_email||null); }
  if (due_date!==undefined)      { updates.push('due_date=?');       params.push(due_date||null); }
  if (progress!==undefined)      { updates.push('progress=?');       params.push(Number(progress)); }
  if (tags!==undefined)          { updates.push('tags_json=?');      params.push(JSON.stringify(tags)); }
  db.prepare(`UPDATE tasks SET ${updates.join(',')} WHERE id=?`).run(...params, id);
  createAuditLog(1, req.user.id, req.user.email, 'task.updated', 'task', id, req.body, ip(req));
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', auth, requireManager, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id=? AND tenant_id=1').run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/tasks/:id/comments', auth, (req, res) => {
  const taskId = Number(req.params.id);
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Comentario vacío' });
  const user = db.prepare('SELECT name FROM users WHERE id=?').get(req.user.id);
  const id = db.prepare('INSERT INTO task_comments (task_id, user_id, user_email, user_name, text) VALUES (?,?,?,?,?)').run(taskId, req.user.id, req.user.email, user?.name||req.user.email, text).lastInsertRowid;
  res.json({ ok: true, id });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: DATABASE BACKUP
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/backup/download', auth, requireAdmin, (req, res) => {
  const dbPath = join(__dir, 'data', 'nexus.db');
  if (!fs.existsSync(dbPath)) return res.status(404).json({ error: 'Base de datos no encontrada' });
  const timestamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  const backupName = `nexus-backup-${timestamp}.db`;
  createAuditLog(1, req.user.id, req.user.email, 'backup.downloaded', 'database', 'nexus.db', { filename: backupName }, ip(req));
  res.setHeader('Content-Type','application/octet-stream');
  res.setHeader('Content-Disposition',`attachment; filename="${backupName}"`);
  res.sendFile(dbPath);
});

app.post('/api/backup/create', auth, requireAdmin, (req, res) => {
  const dbPath = join(__dir, 'data', 'nexus.db');
  const backupDir = join(__dir, 'data', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  const backupPath = join(backupDir, `nexus-backup-${timestamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  const stat = fs.statSync(backupPath);
  const backups = fs.readdirSync(backupDir).filter(f=>f.endsWith('.db')).map(f=>{
    const s = fs.statSync(join(backupDir,f));
    return { name: f, size_kb: Math.round(s.size/1024), created_at: s.mtime.toISOString() };
  }).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  createAuditLog(1, req.user.id, req.user.email, 'backup.created', 'database', 'nexus.db', { filename: `nexus-backup-${timestamp}.db`, size_kb: Math.round(stat.size/1024) }, ip(req));
  res.json({ ok: true, filename: `nexus-backup-${timestamp}.db`, size_kb: Math.round(stat.size/1024), backups });
});

app.get('/api/backup/list', auth, requireAdmin, (req, res) => {
  const backupDir = join(__dir, 'data', 'backups');
  if (!fs.existsSync(backupDir)) return res.json({ backups: [] });
  const backups = fs.readdirSync(backupDir).filter(f=>f.endsWith('.db')).map(f=>{
    const s = fs.statSync(join(backupDir,f));
    return { name: f, size_kb: Math.round(s.size/1024), created_at: s.mtime.toISOString() };
  }).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  res.json({ backups });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: EMAIL ALERTS — monitoreo de BD + envío automático al correo
// ─────────────────────────────────────────────────────────────────────────────

// Verifica tareas vencidas y SLA incumplidos → envía email de alerta
app.post('/api/admin/check-overdue', auth, requireAdmin, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date().toISOString();

  // Tareas vencidas (fecha limite pasada, no completada)
  const overdueTasks = db.prepare(`
    SELECT id, title, assigned_email, due_date, status, priority
    FROM tasks
    WHERE tenant_id=1 AND status != 'completada'
      AND due_date IS NOT NULL AND due_date < ?
    ORDER BY priority DESC, due_date ASC
  `).all(today);

  // Tickets con SLA incumplido y aún abiertos
  const breachedTickets = db.prepare(`
    SELECT id, number, title, user_email, priority, sla_due_at, status
    FROM tickets
    WHERE tenant_id=1 AND status NOT IN ('closed','resolved')
      AND sla_due_at IS NOT NULL AND sla_due_at < ?
    ORDER BY priority DESC
  `).all(now);

  const smtpActive = !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'PEGAR_AQUI_TU_APP_PASSWORD_DE_16_LETRAS');
  const alerts = [];

  // Email por cada tarea vencida
  for (const task of overdueTasks) {
    if (!task.assigned_email) continue;
    const subject = `⚠️ Tarea vencida — ${task.title}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px">
        <h2 style="color:#7926ff;margin-bottom:4px">Nexuss X Systems</h2>
        <p style="color:#666;font-size:13px">Sistema de alertas automáticas</p>
        <hr style="border:1px solid #eee;margin:16px 0">
        <h3 style="color:#ef4444">⚠️ Tarea vencida</h3>
        <p>La tarea <strong>${task.title}</strong> venció el <strong>${task.due_date}</strong> y continúa en estado <strong>${task.status}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
          <tr style="background:#f0f0f0"><td style="padding:8px"><strong>Prioridad</strong></td><td style="padding:8px">${task.priority}</td></tr>
          <tr><td style="padding:8px"><strong>Asignado a</strong></td><td style="padding:8px">${task.assigned_email}</td></tr>
          <tr style="background:#f0f0f0"><td style="padding:8px"><strong>Estado</strong></td><td style="padding:8px">${task.status}</td></tr>
        </table>
        <a href="${process.env.APP_URL || 'http://localhost:3002'}/tareas.html" style="display:inline-block;background:#7926ff;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ver tareas →</a>
        <p style="color:#aaa;font-size:11px;margin-top:24px">Nexuss X Systems — Alertas automáticas de base de datos</p>
      </div>`;
    await sendEmail(task.assigned_email, subject, html);
    alerts.push({ type: 'task_overdue', id: task.id, to: task.assigned_email, subject, sent: smtpActive });
  }

  // Email por cada ticket con SLA incumplido
  for (const ticket of breachedTickets) {
    if (!ticket.user_email) continue;
    const subject = `🚨 SLA incumplido — Ticket ${ticket.number}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px">
        <h2 style="color:#7926ff;margin-bottom:4px">Nexuss X Systems</h2>
        <p style="color:#666;font-size:13px">Sistema de alertas automáticas</p>
        <hr style="border:1px solid #eee;margin:16px 0">
        <h3 style="color:#ef4444">🚨 SLA Incumplido</h3>
        <p>El ticket <strong>${ticket.number}: ${ticket.title}</strong> superó el tiempo de respuesta establecido (SLA).</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
          <tr style="background:#f0f0f0"><td style="padding:8px"><strong>Prioridad</strong></td><td style="padding:8px">${ticket.priority}</td></tr>
          <tr><td style="padding:8px"><strong>Venció el</strong></td><td style="padding:8px">${ticket.sla_due_at}</td></tr>
          <tr style="background:#f0f0f0"><td style="padding:8px"><strong>Estado actual</strong></td><td style="padding:8px">${ticket.status}</td></tr>
        </table>
        <a href="${process.env.APP_URL || 'http://localhost:3002'}/tickets.html" style="display:inline-block;background:#ef4444;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Ver ticket →</a>
        <p style="color:#aaa;font-size:11px;margin-top:24px">Nexuss X Systems — Alertas automáticas de base de datos</p>
      </div>`;
    await sendEmail(ticket.user_email, subject, html);
    alerts.push({ type: 'sla_breach', id: ticket.id, to: ticket.user_email, subject, sent: smtpActive });
  }

  createAuditLog(1, req.user.id, req.user.email, 'alerts.checked', 'system', null,
    { overdue_tasks: overdueTasks.length, breached_tickets: breachedTickets.length, emails: alerts.length }, ip(req));

  res.json({
    ok: true,
    smtp_active: smtpActive,
    overdue_tasks: overdueTasks.length,
    breached_tickets: breachedTickets.length,
    alerts_sent: alerts.length,
    mode: smtpActive ? 'email' : 'log',
    message: smtpActive
      ? `${alerts.length} email(s) enviados correctamente.`
      : `SMTP no configurado — ${alerts.length} alerta(s) registradas en consola. Configura SMTP_PASS para enviar emails reales.`,
    alerts,
    overdue_tasks_list: overdueTasks,
    breached_tickets_list: breachedTickets
  });
});

// Test de email — envía un correo de prueba al admin logueado
app.post('/api/admin/test-email', auth, requireAdmin, async (req, res) => {
  const to = req.user.email;
  const smtpActive = !!(process.env.SMTP_PASS && process.env.SMTP_PASS !== 'PEGAR_AQUI_TU_APP_PASSWORD_DE_16_LETRAS');
  const subject = '✅ Test SMTP — Nexuss X Systems';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px">
      <h2 style="color:#7926ff;margin-bottom:4px">Nexuss X Systems</h2>
      <p style="color:#666;font-size:13px">Sistema de alertas automáticas</p>
      <hr style="border:1px solid #eee;margin:16px 0">
      <h3 style="color:#22c55e">✅ Email de prueba exitoso</h3>
      <p>El sistema de alertas automáticas de Nexuss X Systems está correctamente configurado.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
        <tr style="background:#f0f0f0"><td style="padding:8px"><strong>Enviado a</strong></td><td style="padding:8px">${to}</td></tr>
        <tr><td style="padding:8px"><strong>Fecha</strong></td><td style="padding:8px">${new Date().toLocaleString('es-DO')}</td></tr>
        <tr style="background:#f0f0f0"><td style="padding:8px"><strong>SMTP Host</strong></td><td style="padding:8px">${process.env.SMTP_HOST || 'N/A'}</td></tr>
      </table>
      <p>Este sistema monitorea la base de datos y envía alertas automáticas cuando:</p>
      <ul style="color:#555;font-size:13px;line-height:1.8">
        <li>Una tarea supera su fecha límite sin completarse</li>
        <li>Un ticket supera el tiempo de SLA establecido</li>
        <li>Se registran nuevos eventos críticos en el sistema</li>
      </ul>
      <p style="color:#aaa;font-size:11px;margin-top:24px">Nexuss X Systems — Sistema de Gestión de Tareas · 5to B</p>
    </div>`;

  if (smtpActive) {
    try {
      await sendEmail(to, subject, html);
      createAuditLog(1, req.user.id, req.user.email, 'email.test_sent', 'system', null, { to }, ip(req));
      res.json({ ok: true, sent: true, to, message: `Email enviado correctamente a ${to}` });
    } catch(e) {
      res.json({ ok: false, sent: false, to, error: e.message, html });
    }
  } else {
    console.log(`\n[MOCK EMAIL → ${to}]\nSubject: ${subject}\n---`);
    createAuditLog(1, req.user.id, req.user.email, 'email.test_mock', 'system', null, { to, mode: 'log' }, ip(req));
    res.json({
      ok: true, sent: false, mock: true, to, subject, html,
      message: 'SMTP no configurado. Vista previa disponible. Configura SMTP en Branding → SMTP para enviar emails reales.'
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: SQL QUERIES (5 consultas para administración)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/queries/run', auth, requireAdmin, (req, res) => {
  const { q } = req.query;
  const queries = {
    '1': { name: 'Usuarios con rol y último acceso', sql: "SELECT id, name, email, role, verified, last_login_at, login_count, created_at FROM users WHERE tenant_id=1 ORDER BY created_at DESC" },
    '2': { name: 'Tareas por estado y prioridad', sql: "SELECT t.title, t.status, t.priority, t.progress, t.assigned_email, t.due_date, tc.name as categoria FROM tasks t LEFT JOIN task_categories tc ON t.category_id=tc.id WHERE t.tenant_id=1 ORDER BY t.created_at DESC" },
    '3': { name: 'Tickets abiertos con tiempo de respuesta', sql: "SELECT id, number, title, priority, status, category, user_email, sla_hours, sla_due_at, created_at, ROUND((julianday('now')-julianday(created_at))*24,1) as horas_abiertas FROM tickets WHERE tenant_id=1 ORDER BY created_at DESC" },
    '4': { name: 'Contactos por etapa del pipeline', sql: "SELECT stage, status, COUNT(*) as total, SUM(value) as valor_total, AVG(value) as valor_promedio FROM contacts WHERE tenant_id=1 GROUP BY stage, status ORDER BY total DESC" },
    '5': { name: 'Resumen de actividad del sistema (auditoría)', sql: "SELECT action, entity_type, COUNT(*) as veces, MAX(created_at) as ultima_vez FROM audit_logs WHERE tenant_id=1 GROUP BY action, entity_type ORDER BY veces DESC LIMIT 30" },
  };
  if (!q || !queries[q]) return res.status(400).json({ error: 'Consulta inválida. Use q=1..5' });
  const query = queries[q];
  try {
    const rows = db.prepare(query.sql).all();
    const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
    createAuditLog(1, req.user.id, req.user.email, 'query.executed', 'database', q, { query_name: query.name }, ip(req));
    res.json({ name: query.name, sql: query.sql, columns: cols, rows, total: rows.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/queries/list', auth, requireAgent, (req, res) => {
  res.json({ queries: [
    { id: '1', name: 'Usuarios con rol y último acceso', description: 'Lista todos los usuarios registrados con su rol, estado de verificación y último inicio de sesión.' },
    { id: '2', name: 'Tareas por estado y prioridad', description: 'Muestra todas las tareas con su categoría, estado, prioridad y progreso.' },
    { id: '3', name: 'Tickets abiertos con tiempo de respuesta', description: 'Lista los tickets de soporte con las horas que llevan abiertos y el SLA.' },
    { id: '4', name: 'Contactos por etapa del pipeline', description: 'Agrupa los contactos del CRM por etapa y muestra el valor total y promedio.' },
    { id: '5', name: 'Resumen de actividad del sistema', description: 'Muestra las acciones más frecuentes en el log de auditoría del sistema.' },
  ]});
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ADMIN SEED — 20 registros por tabla (datos de demostración)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/admin/seed', auth, requireAdmin, (req, res) => {
  const tid = 1;
  const results = {};

  // ── Contacts (20) ─────────────────────────────────────────────────────────
  const existingContacts = db.prepare('SELECT COUNT(*) as c FROM contacts WHERE tenant_id=?').get(tid).c;
  if (existingContacts < 20) {
    const contactsData = [
      { name:'Carlos Mendoza',   email:'carlos.mendoza@techdom.do',    phone:'809-555-0101', company:'TechDom Solutions',    position:'CEO',               status:'client',   stage:'won',         value:85000,  source:'referral'   },
      { name:'María García',     email:'maria.garcia@consulting-rd.do', phone:'809-555-0102', company:'Consulting RD',        position:'Directora',         status:'client',   stage:'won',         value:65000,  source:'website'    },
      { name:'Roberto Pérez',    email:'roberto@perez-assoc.do',        phone:'849-555-0103', company:'Pérez & Asociados',    position:'Gerente TI',        status:'lead',     stage:'qualified',   value:40000,  source:'linkedin'   },
      { name:'Ana Martínez',     email:'ana.m@innovatech.do',           phone:'809-555-0104', company:'InnovaTech DO',        position:'CTO',               status:'prospect', stage:'proposal',    value:120000, source:'event'      },
      { name:'Luis Rodríguez',   email:'luis.r@comercial-norte.do',     phone:'849-555-0105', company:'Comercial Norte',      position:'Dueño',             status:'lead',     stage:'new',         value:25000,  source:'manual'     },
      { name:'Carmen López',     email:'c.lopez@healthsolutions.do',    phone:'809-555-0106', company:'Health Solutions DR',  position:'Administradora',    status:'client',   stage:'won',         value:55000,  source:'referral'   },
      { name:'José Reyes',       email:'jose.reyes@constructora.do',    phone:'809-555-0107', company:'Constructora RD',      position:'Director',          status:'prospect', stage:'negotiation', value:200000, source:'website'    },
      { name:'Laura Sánchez',    email:'l.sanchez@boutique-dig.do',     phone:'849-555-0108', company:'Boutique Digital',     position:'Fundadora',         status:'client',   stage:'won',         value:35000,  source:'instagram'  },
      { name:'Pedro Castro',     email:'pedro@agro-solutions.do',       phone:'809-555-0109', company:'Agro Solutions DO',    position:'Gerente',           status:'lead',     stage:'qualified',   value:45000,  source:'manual'     },
      { name:'Sofía Jiménez',    email:'s.jimenez@moda-premium.do',     phone:'809-555-0110', company:'Moda Premium',         position:'Dir. Comercial',    status:'prospect', stage:'proposal',    value:30000,  source:'referral'   },
      { name:'Ramón Torres',     email:'ramon.t@fintech-do.do',         phone:'849-555-0111', company:'FinTech DO',           position:'CEO',               status:'prospect', stage:'negotiation', value:350000, source:'linkedin'   },
      { name:'Isabel Flores',    email:'i.flores@educa-pro.do',         phone:'809-555-0112', company:'EduCa Pro',            position:'Rectora',           status:'client',   stage:'won',         value:70000,  source:'event'      },
      { name:'Miguel Herrera',   email:'mherrera@logistics-do.do',      phone:'809-555-0113', company:'Logistics DO',         position:'Director Ops',      status:'lead',     stage:'new',         value:80000,  source:'cold_email' },
      { name:'Valentina Morales',email:'v.morales@studio-creativo.do',  phone:'849-555-0114', company:'Studio Creativo',      position:'Socia',             status:'client',   stage:'won',         value:20000,  source:'website'    },
      { name:'Fernando Vargas',  email:'f.vargas@inmobiliaria-do.do',   phone:'809-555-0115', company:'Inmobiliaria DO',      position:'Gerente',           status:'prospect', stage:'qualified',   value:150000, source:'referral'   },
      { name:'Patricia Díaz',    email:'p.diaz@farmacia-vida.do',       phone:'809-555-0116', company:'Farmacia Vida',        position:'Dueña',             status:'lead',     stage:'new',         value:18000,  source:'facebook'   },
      { name:'Eduardo Núñez',    email:'e.nunez@hotel-caribe.do',       phone:'849-555-0117', company:'Hotel Caribe',         position:'Gerente General',   status:'prospect', stage:'proposal',    value:250000, source:'event'      },
      { name:'Natalia Cabrera',  email:'n.cabrera@derecho-do.do',       phone:'809-555-0118', company:'Cabrera & Asociados',  position:'Abogada',           status:'client',   stage:'won',         value:40000,  source:'referral'   },
      { name:'Diego Espinal',    email:'d.espinal@distribuidora.do',    phone:'809-555-0119', company:'Distribuidora RD',     position:'Director',          status:'lead',     stage:'qualified',   value:60000,  source:'cold_email' },
      { name:'Mariana Polanco',  email:'m.polanco@mkt-digital.do',      phone:'849-555-0120', company:'Marketing Digital DO', position:'Directora',         status:'prospect', stage:'negotiation', value:95000,  source:'linkedin'   }
    ];
    const iContact = db.prepare(`INSERT INTO contacts (tenant_id,name,email,phone,company,position,status,stage,value,source) VALUES (1,?,?,?,?,?,?,?,?,?)`);
    let added = 0;
    for (const c of contactsData) {
      try { iContact.run(c.name,c.email,c.phone,c.company,c.position,c.status,c.stage,c.value,c.source); added++; } catch(e) {}
    }
    results.contacts = `+${added} contactos`;
  } else { results.contacts = `Ya tiene ${existingContacts} contactos`; }

  // ── Tickets (20) ───────────────────────────────────────────────────────────
  const existingTickets = db.prepare('SELECT COUNT(*) as c FROM tickets WHERE tenant_id=?').get(tid).c;
  if (existingTickets < 20) {
    const ticketsData = [
      { num:'TKT-001', title:'Error al iniciar sesión', desc:'El usuario no puede acceder a su cuenta. El sistema muestra error 401 aunque las credenciales son correctas.', pri:'urgent',  status:'open',        cat:'technical',       email:'carlos.mendoza@techdom.do',    name:'Carlos Mendoza',    sla:4,  csat:null },
      { num:'TKT-002', title:'Solicitud de factura abril 2026', desc:'Necesito la factura del plan Business del mes de abril 2026 para registros contables.', pri:'normal',  status:'closed',      cat:'billing',         email:'maria.garcia@consulting-rd.do', name:'María García',      sla:24, csat:5 },
      { num:'TKT-003', title:'Dashboard no carga gráficos', desc:'Los gráficos de métricas muestran "Cargando..." indefinidamente. Probé en Chrome y Firefox.', pri:'high',   status:'in_progress', cat:'technical',       email:'roberto@perez-assoc.do',        name:'Roberto Pérez',     sla:8,  csat:null },
      { num:'TKT-004', title:'Actualización de plan Starter a Business', desc:'Deseo actualizar mi suscripción. ¿Cuál es el procedimiento y cuándo aplica el cambio?', pri:'low',    status:'closed',      cat:'billing',         email:'c.lopez@healthsolutions.do',    name:'Carmen López',      sla:24, csat:4 },
      { num:'TKT-005', title:'Error importando contactos CSV', desc:'Al importar CSV de 500 contactos el sistema falla con "Formato inválido" aunque el archivo es correcto.', pri:'high',   status:'open',        cat:'technical',       email:'jose.reyes@constructora.do',    name:'José Reyes',        sla:8,  csat:null },
      { num:'TKT-006', title:'Cómo agregar miembros al equipo', desc:'¿Cómo invito nuevos usuarios a la plataforma? No encuentro la opción en configuración.', pri:'low',    status:'closed',      cat:'general',         email:'l.sanchez@boutique-dig.do',     name:'Laura Sánchez',     sla:48, csat:5 },
      { num:'TKT-007', title:'Notificaciones de email no llegan', desc:'Configuré alertas de tickets pero no recibo los correos. Revisé spam y no están.', pri:'normal',  status:'open',        cat:'technical',       email:'pedro@agro-solutions.do',        name:'Pedro Castro',      sla:24, csat:null },
      { num:'TKT-008', title:'Reporte de ventas exporta mal', desc:'Al exportar CSV de ventas los montos tienen formato incorrecto y los acentos se ven corruptos.', pri:'normal',  status:'in_progress', cat:'technical',       email:'s.jimenez@moda-premium.do',     name:'Sofía Jiménez',     sla:24, csat:null },
      { num:'TKT-009', title:'Acceso API para app móvil', desc:'Necesito documentación y credenciales de API para integrar el CRM con nuestra app en React Native.', pri:'high',   status:'open',        cat:'technical',       email:'ramon.t@fintech-do.do',         name:'Ramón Torres',      sla:8,  csat:null },
      { num:'TKT-010', title:'Cancelar suscripción y reembolso', desc:'Por cambio de prioridades necesito cancelar. ¿Aplica reembolso proporcional del mes?', pri:'normal',  status:'open',        cat:'billing',         email:'i.flores@educa-pro.do',         name:'Isabel Flores',     sla:24, csat:null },
      { num:'TKT-011', title:'Error 500 al guardar contacto con notas largas', desc:'Cuando guardo un contacto con notas de más de 1000 caracteres el sistema devuelve error 500.', pri:'urgent',  status:'closed',      cat:'technical',       email:'mherrera@logistics-do.do',      name:'Miguel Herrera',    sla:4,  csat:4 },
      { num:'TKT-012', title:'Personalizar colores del portal', desc:'Me gustaría cambiar los colores para que coincidan con la identidad visual de mi empresa.', pri:'low',    status:'closed',      cat:'general',         email:'v.morales@studio-creativo.do',  name:'Valentina Morales', sla:48, csat:5 },
      { num:'TKT-013', title:'Doble cobro en suscripción', desc:'Este mes me han cobrado dos veces el plan Agency. Adjunto capturas de los movimientos bancarios.', pri:'urgent',  status:'in_progress', cat:'billing',         email:'f.vargas@inmobiliaria-do.do',   name:'Fernando Vargas',   sla:2,  csat:null },
      { num:'TKT-014', title:'Tutorial para automatizaciones', desc:'¿Hay un manual sobre cómo configurar las reglas de automatización de tickets?', pri:'low',    status:'closed',      cat:'general',         email:'p.diaz@farmacia-vida.do',       name:'Patricia Díaz',     sla:48, csat:5 },
      { num:'TKT-015', title:'Lentitud extrema en horario pico', desc:'Entre las 9am y 12pm el sistema se pone muy lento. Las páginas tardan más de 10 segundos.', pri:'high',   status:'open',        cat:'technical',       email:'e.nunez@hotel-caribe.do',       name:'Eduardo Núñez',     sla:8,  csat:null },
      { num:'TKT-016', title:'Corrección de nombre de empresa', desc:'Necesito actualizar el nombre en mi perfil de "Cabrera" a "Cabrera & Asociados Legales".', pri:'low',    status:'closed',      cat:'general',         email:'n.cabrera@derecho-do.do',       name:'Natalia Cabrera',   sla:48, csat:4 },
      { num:'TKT-017', title:'Filtros del CRM no funcionan', desc:'Al filtrar contactos por etapa "Propuesta" el sistema también muestra contactos de otras etapas.', pri:'normal',  status:'open',        cat:'technical',       email:'d.espinal@distribuidora.do',    name:'Diego Espinal',     sla:24, csat:null },
      { num:'TKT-018', title:'Solicitud: campos personalizados en CRM', desc:'Sería útil poder agregar campos personalizados a los contactos para nuestro flujo.', pri:'low',    status:'closed',      cat:'feature_request', email:'m.polanco@mkt-digital.do',      name:'Mariana Polanco',   sla:72, csat:4 },
      { num:'TKT-019', title:'Error al subir archivos adjuntos', desc:'Al adjuntar un PDF de 3MB a un ticket el sistema muestra "Error al subir". Archivos pequeños sí funcionan.', pri:'normal',  status:'in_progress', cat:'technical',       email:'ana.m@innovatech.do',           name:'Ana Martínez',      sla:24, csat:null },
      { num:'TKT-020', title:'Integración con WhatsApp Business', desc:'¿La plataforma tiene integración con WhatsApp para gestionar conversaciones desde el sistema?', pri:'low',    status:'open',        cat:'feature_request', email:'luis.r@comercial-norte.do',     name:'Luis Rodríguez',    sla:72, csat:null }
    ];
    const iTicket = db.prepare(`INSERT INTO tickets (tenant_id,number,title,description,priority,status,category,sla_hours,user_email,user_name,csat_score) VALUES (1,?,?,?,?,?,?,?,?,?,?)`);
    let added = 0;
    for (const t of ticketsData) {
      try { iTicket.run(t.num,t.title,t.desc,t.pri,t.status,t.cat,t.sla,t.email,t.name,t.csat); added++; } catch(e) {}
    }
    results.tickets = `+${added} tickets`;
  } else { results.tickets = `Ya tiene ${existingTickets} tickets`; }

  // ── Deals (20) ─────────────────────────────────────────────────────────────
  const existingDeals = db.prepare('SELECT COUNT(*) as c FROM deals WHERE tenant_id=?').get(tid).c;
  if (existingDeals < 20) {
    const dealsData = [
      { title:'Sitio web corporativo TechDom',       value:85000,  stage:'won',          prob:100 },
      { title:'CRM personalizado Consulting RD',     value:150000, stage:'won',          prob:100 },
      { title:'Dashboard Analytics InnovaTech',      value:120000, stage:'negotiation',  prob:75  },
      { title:'Portal de clientes FinTech DO',       value:350000, stage:'proposal',     prob:40  },
      { title:'App web Agro Solutions',              value:80000,  stage:'qualified',    prob:30  },
      { title:'Rediseño Moda Premium',               value:30000,  stage:'won',          prob:100 },
      { title:'Sistema de inventario Distribuidora', value:95000,  stage:'negotiation',  prob:65  },
      { title:'Chatbot IA Hotel Caribe',             value:250000, stage:'proposal',     prob:45  },
      { title:'Landing page Farmacia Vida',          value:18000,  stage:'qualified',    prob:25  },
      { title:'Plataforma educativa EduCa Pro',      value:200000, stage:'won',          prob:100 },
      { title:'Automatización Logistics DO',         value:180000, stage:'prospecting',  prob:15  },
      { title:'Portal inmobiliario DO',              value:320000, stage:'qualified',    prob:35  },
      { title:'Sistema legal Cabrera & Asociados',   value:65000,  stage:'won',          prob:100 },
      { title:'E-commerce Studio Creativo',          value:75000,  stage:'won',          prob:100 },
      { title:'CRM Comercial Norte',                 value:40000,  stage:'prospecting',  prob:10  },
      { title:'Web Marketing Digital DO',            value:55000,  stage:'negotiation',  prob:70  },
      { title:'App móvil Pérez & Asociados',         value:110000, stage:'proposal',     prob:50  },
      { title:'Sistema de reservas Health Solutions',value:90000,  stage:'won',          prob:100 },
      { title:'Plataforma B2B Constructora RD',      value:420000, stage:'lost',         prob:0   },
      { title:'Dashboard Boutique Digital',          value:45000,  stage:'negotiation',  prob:80  }
    ];
    const iDeal = db.prepare(`INSERT INTO deals (tenant_id,title,value,stage,probability,currency) VALUES (1,?,?,?,?,'DOP')`);
    let added = 0;
    for (const d of dealsData) {
      try { iDeal.run(d.title,d.value,d.stage,d.prob); added++; } catch(e) {}
    }
    results.deals = `+${added} deals`;
  } else { results.deals = `Ya tiene ${existingDeals} deals`; }

  // ── Orders (20) ────────────────────────────────────────────────────────────
  const existingOrders = db.prepare('SELECT COUNT(*) as c FROM orders WHERE tenant_id=?').get(tid).c;
  if (existingOrders < 20) {
    const ordersData = [
      { cust:{name:'Carlos Mendoza',   email:'carlos.mendoza@techdom.do'},    items:[{name:'Plan Agency - Anual',         qty:1, price:4990}],           total:4990,   status:'completed'  },
      { cust:{name:'María García',     email:'maria.garcia@consulting-rd.do'},items:[{name:'Plan Business - Mensual',     qty:1, price:199}],            total:199,    status:'completed'  },
      { cust:{name:'Ana Martínez',     email:'ana.m@innovatech.do'},          items:[{name:'Dashboard Custom',           qty:1, price:35000}],           total:35000,  status:'processing' },
      { cust:{name:'Carmen López',     email:'c.lopez@healthsolutions.do'},   items:[{name:'Plan Agency Anual',          qty:1, price:4990},{name:'Soporte Premium',qty:1,price:1500}], total:6490, status:'completed'},
      { cust:{name:'Laura Sánchez',    email:'l.sanchez@boutique-dig.do'},    items:[{name:'Sitio Web Corporativo',      qty:1, price:25000}],           total:25000,  status:'completed'  },
      { cust:{name:'Isabel Flores',    email:'i.flores@educa-pro.do'},        items:[{name:'Plataforma Educativa',       qty:1, price:70000}],           total:70000,  status:'processing' },
      { cust:{name:'Valentina Morales',email:'v.morales@studio-creativo.do'}, items:[{name:'Plan Starter - Mensual',    qty:3, price:49}],              total:147,    status:'completed'  },
      { cust:{name:'Natalia Cabrera',  email:'n.cabrera@derecho-do.do'},      items:[{name:'Sistema Legal a Medida',    qty:1, price:40000}],           total:40000,  status:'completed'  },
      { cust:{name:'Ramón Torres',     email:'ramon.t@fintech-do.do'},        items:[{name:'Consultoria Tecnica',       qty:5, price:2500}],            total:12500,  status:'pending'    },
      { cust:{name:'Fernando Vargas',  email:'f.vargas@inmobiliaria-do.do'},  items:[{name:'Landing Page Premium',      qty:1, price:20000}],           total:20000,  status:'pending'    },
      { cust:{name:'José Reyes',       email:'jose.reyes@constructora.do'},   items:[{name:'Plan Business - Anual',     qty:1, price:1990}],            total:1990,   status:'completed'  },
      { cust:{name:'Pedro Castro',     email:'pedro@agro-solutions.do'},      items:[{name:'Chatbot IA Basico',         qty:1, price:25000}],           total:25000,  status:'processing' },
      { cust:{name:'Sofía Jiménez',    email:'s.jimenez@moda-premium.do'},    items:[{name:'Rediseno Web Completo',     qty:1, price:30000}],           total:30000,  status:'completed'  },
      { cust:{name:'Eduardo Núñez',    email:'e.nunez@hotel-caribe.do'},      items:[{name:'Sistema de Reservas',      qty:1, price:45000},{name:'Integracion Pago',qty:1,price:8000}], total:53000, status:'processing'},
      { cust:{name:'Mariana Polanco',  email:'m.polanco@mkt-digital.do'},     items:[{name:'Plan Agency - Mensual',    qty:1, price:499}],             total:499,    status:'completed'  },
      { cust:{name:'Diego Espinal',    email:'d.espinal@distribuidora.do'},   items:[{name:'CRM Empresarial',          qty:1, price:55000}],           total:55000,  status:'pending'    },
      { cust:{name:'Miguel Herrera',   email:'mherrera@logistics-do.do'},     items:[{name:'Sistema de Logistica',     qty:1, price:80000}],           total:80000,  status:'processing' },
      { cust:{name:'Roberto Pérez',    email:'roberto@perez-assoc.do'},       items:[{name:'Mantenimiento Web',        qty:6, price:3500}],            total:21000,  status:'completed'  },
      { cust:{name:'Patricia Díaz',    email:'p.diaz@farmacia-vida.do'},      items:[{name:'Plan Starter - Anual',     qty:1, price:470}],             total:470,    status:'cancelled'  },
      { cust:{name:'Luis Rodríguez',   email:'luis.r@comercial-norte.do'},    items:[{name:'Consultoria Estrategia Digital',qty:1,price:8500}],        total:8500,   status:'pending'    }
    ];
    const iOrder = db.prepare(`INSERT INTO orders (tenant_id,customer_json,items_json,total,status) VALUES (1,?,?,?,?)`);
    let added = 0;
    for (const o of ordersData) {
      try { iOrder.run(JSON.stringify(o.cust),JSON.stringify(o.items),o.total,o.status); added++; } catch(e) {}
    }
    results.orders = `+${added} ordenes`;
  } else { results.orders = `Ya tiene ${existingOrders} ordenes`; }

  createAuditLog(tid, req.user.id, req.user.email, 'admin.seed', 'database', null, results, ip(req));
  res.json({ ok:true, seeded:results, message:'Datos de demostración creados exitosamente' });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATCH-ALL → serve frontend
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  const htmlFile = join(__dir, '..', 'index.html');
  if (fs.existsSync(htmlFile)) res.sendFile(htmlFile);
  else res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Nexuss X Systems Server v2.0`);
  console.log(`   URL:    http://localhost:${PORT}`);
  console.log(`   AI:     ${_ai ? '✅ Anthropic connected' : '❌ No API key'}`);
  console.log(`   DB:     SQLite @ server/data/nexus.db`);
  console.log(`   2FA:    ${otplib ? '✅ Available' : '⚠️  Install otplib'}`);
  console.log(`   Email:  ${process.env.SMTP_HOST ? '✅ SMTP configured' : '⚠️  No SMTP (logging only)'}\n`);
});

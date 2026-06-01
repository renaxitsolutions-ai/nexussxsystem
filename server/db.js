// ─── DATABASE DISPATCHER ──────────────────────────────────────────────────────
// LOCAL (sin DATABASE_URL)  → SQLite  via db-sqlite.js  (node:sqlite, Node 22+)
// PRODUCCIÓN (con DATABASE_URL) → PostgreSQL via db-pg.js  (pg pool, Render)

import { config as loadEnv } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dir, '.env') });

const USE_SQLITE = !process.env.DATABASE_URL;
console.log(`[DB] Driver: ${USE_SQLITE ? 'SQLite (local)' : 'PostgreSQL (producción)'}`);

let mod;
if (USE_SQLITE) {
  mod = await import('./db-sqlite.js');
} else {
  mod = await import('./db-pg.js');
}

export const { db, pool, j, jObj, now, slug, nextTicketNumber, createNotification, createAuditLog, runAutomations } = mod;

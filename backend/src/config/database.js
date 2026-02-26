require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const sslEnabled = process.env.DB_SSL === 'true';

let pool = null;
let pgliteDb = null;
let usingPglite = false;

// ── PGlite adapter ──────────────────────────────────────────────────────
// Wraps PGlite to expose the same { query, getClient } interface as pg Pool.
async function initPglite() {
  const { PGlite } = require('@electric-sql/pglite');
  const dataDir = path.join(__dirname, '..', '..', '.pgdata');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  pgliteDb = new PGlite(dataDir);
  usingPglite = true;
  console.log('[DB] Using embedded PGlite (PostgreSQL WASM) — data stored in .pgdata/');
  return pgliteDb;
}

// ── Unified query function ──────────────────────────────────────────────
async function query(text, params) {
  if (usingPglite) {
    return pgliteDb.query(text, params);
  }
  return pool.query(text, params);
}

// ── Unified getClient function ──────────────────────────────────────────
async function getClient() {
  if (usingPglite) {
    // PGlite is single-connection; return a thin wrapper
    return {
      query: (text, params) => pgliteDb.query(text, params),
      release: () => {},
    };
  }
  return pool.connect();
}

// ── Startup: try PostgreSQL, fall back to PGlite ────────────────────────
async function initDatabase() {
  // 1. Try real PostgreSQL first
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'azure_cost_monitor',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', () => {});

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[DB] Connected to PostgreSQL');
    return;
  } catch (err) {
    console.log('[DB] PostgreSQL not available:', err.message || err.code);
    if (pool) { pool.end().catch(() => {}); pool = null; }
  }

  // 2. Fall back to embedded PGlite
  console.log('[DB] Falling back to embedded PGlite...');
  await initPglite();

  // Create uuid_generate_v4() compatibility function (PGlite has gen_random_uuid built-in)
  try {
    await pgliteDb.query(`CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid AS 'SELECT gen_random_uuid()' LANGUAGE SQL`);
    console.log('[DB] UUID compatibility function created');
  } catch (e) {
    // May already exist from a previous run
  }

  // Run schema init
  const sqlPath = path.join(__dirname, 'init-db.sql');
  const sqlRaw = fs.readFileSync(sqlPath, 'utf8');

  // Strip comments and split by semicolons
  const sql = sqlRaw.replace(/--[^\n]*/g, '').trim();
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await pgliteDb.query(stmt);
    } catch (e) {
      // Skip errors for IF NOT EXISTS / already exists
      if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
        // Silently skip extension/index errors, they're non-critical
        if (!stmt.includes('CREATE EXTENSION') && !stmt.includes('CREATE INDEX')) {
          console.warn('[DB] Schema warning:', e.message.substring(0, 80));
        }
      }
    }
  }
  console.log('[DB] Schema initialized in PGlite');

  // Check if seed data exists
  const check = await pgliteDb.query('SELECT COUNT(*) FROM users');
  if (parseInt(check.rows[0].count) === 0) {
    console.log('[DB] No data found — run `npm run seed` to populate demo data');
  } else {
    console.log(`[DB] Found ${check.rows[0].count} users in database`);
  }
}

module.exports = { query, getClient, initDatabase, isUsingPglite: () => usingPglite };

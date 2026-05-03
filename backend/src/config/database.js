require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const sslEnabled = process.env.DB_SSL === 'true';

let pool = null;
let pgliteDb = null;
let usingPglite = false;
// Scale applied to demo base costs so totals are small and realistic for local demos
const COST_SCALE = 0.005;

// ── PGlite adapter ──────────────────────────────────────────────────────
// Wraps PGlite to expose the same { query, getClient } interface as pg Pool.
async function initPglite() {
  const { PGlite } = require('@electric-sql/pglite');
  const dbUrl = process.env.PGLITE_URL || 'memory://';
  if (dbUrl !== 'memory://') {
    if (!fs.existsSync(dbUrl)) fs.mkdirSync(dbUrl, { recursive: true });
  }

  pgliteDb = new PGlite(dbUrl);
  usingPglite = true;
  console.log(`[DB] Using embedded PGlite (PostgreSQL WASM) at ${dbUrl}`);
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

  // PGlite on some Node/Windows combinations can trap on advanced Postgres DDL.
  // Bootstrap a minimal compatible schema so the API can start reliably.
  const minimalStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'viewer',
      avatar_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subscription_id VARCHAR(255) UNIQUE,
      display_name VARCHAR(255),
      monthly_budget DECIMAL(12,2) DEFAULT 0,
      state VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS resource_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      subscription_id UUID,
      location VARCHAR(100),
      tags JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id VARCHAR(500) UNIQUE,
      name VARCHAR(255),
      type VARCHAR(255),
      location VARCHAR(100),
      resource_group_id UUID,
      subscription_id UUID,
      sku VARCHAR(100),
      status VARCHAR(50) DEFAULT 'running',
      tags JSONB DEFAULT '{}'::jsonb,
      properties JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cost_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID,
      subscription_id UUID,
      date DATE,
      cost DECIMAL(12,4) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'USD',
      service_name VARCHAR(255),
      meter_category VARCHAR(255),
      meter_subcategory VARCHAR(255),
      region VARCHAR(100),
      tags JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS budgets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      amount DECIMAL(12,2) DEFAULT 0,
      period VARCHAR(50) DEFAULT 'monthly',
      subscription_id UUID,
      resource_group_id UUID,
      alert_thresholds JSONB DEFAULT '[50,75,90,100]'::jsonb,
      current_spend DECIMAL(12,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50),
      severity VARCHAR(50) DEFAULT 'medium',
      title VARCHAR(255),
      message TEXT,
      resource_id UUID,
      budget_id UUID,
      is_read BOOLEAN DEFAULT false,
      is_resolved BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID,
      type VARCHAR(100),
      category VARCHAR(100),
      impact VARCHAR(50) DEFAULT 'medium',
      title VARCHAR(255),
      description TEXT,
      estimated_savings DECIMAL(12,2) DEFAULT 0,
      current_value VARCHAR(255),
      recommended_value VARCHAR(255),
      action VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      type VARCHAR(50),
      period_start DATE,
      period_end DATE,
      data JSONB DEFAULT '{}'::jsonb,
      generated_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS usage_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID,
      metric_name VARCHAR(100),
      metric_value DECIMAL(12,4),
      unit VARCHAR(50),
      timestamp TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cost_anomalies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID,
      subscription_id UUID,
      date DATE,
      expected_cost DECIMAL(12,4),
      actual_cost DECIMAL(12,4),
      deviation_percentage DECIMAL(8,2),
      z_score DECIMAL(8,4),
      severity VARCHAR(50),
      is_resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const stmt of minimalStatements) {
    await pgliteDb.query(stmt);
  }
  console.log('[DB] Minimal schema initialized in PGlite');

  // Bootstrap demo users for local dev when running with in-memory PGlite.
  const check = await pgliteDb.query('SELECT COUNT(*) FROM users');
  if (parseInt(check.rows[0].count) === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await pgliteDb.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
       ($1, $2, $3, $4, true),
       ($5, $6, $7, $8, true),
       ($9, $10, $11, $12, true),
       ($13, $14, $15, $16, true)`,
      [
        'admin@azureflow.com', passwordHash, 'Admin User', 'admin',
        'editor@azureflow.com', passwordHash, 'Editor User', 'editor',
        'viewer@azureflow.com', passwordHash, 'Viewer User', 'viewer',
        'demo@azureflow.com', passwordHash, 'Demo User', 'viewer'
      ]
    );
    console.log('[DB] Demo users created for local login');
  } else {
    console.log(`[DB] Found ${check.rows[0].count} users in database`);
  }

  // Seed dashboard/cost demo data only in explicit mock mode.
  const subCheck = await pgliteDb.query('SELECT COUNT(*) FROM subscriptions');
  const shouldSeedMockData = process.env.AZURE_USE_MOCK === 'true';
  if (shouldSeedMockData && parseInt(subCheck.rows[0].count) === 0) {
    const adminUser = await pgliteDb.query("SELECT id FROM users WHERE email = 'admin@azureflow.com' LIMIT 1");
    const adminId = adminUser.rows[0]?.id;

    const subRes = await pgliteDb.query(
      `INSERT INTO subscriptions (subscription_id, display_name, monthly_budget, state)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['sub-demo-001', 'Demo Production Subscription', 5000, 'active']
    );
    const subscriptionId = subRes.rows[0].id;

    const rgProd = await pgliteDb.query(
      `INSERT INTO resource_groups (name, subscription_id, location, tags)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      ['rg-prod-core', subscriptionId, 'eastus', '{"environment":"prod","department":"platform"}']
    );
    const rgData = await pgliteDb.query(
      `INSERT INTO resource_groups (name, subscription_id, location, tags)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      ['rg-data-services', subscriptionId, 'eastus2', '{"environment":"prod","department":"data"}']
    );
    const rgDev = await pgliteDb.query(
      `INSERT INTO resource_groups (name, subscription_id, location, tags)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      ['rg-dev-test', subscriptionId, 'centralus', '{"environment":"dev","department":"engineering"}']
    );

    const resourceRows = [];
    const resourcesToInsert = [
      ['vm-prod-web-01', 'Microsoft.Compute/virtualMachines', 'eastus', rgProd.rows[0].id, 'Standard_D4s_v5'],
      ['aks-prod-cluster', 'Microsoft.ContainerService/managedClusters', 'eastus', rgProd.rows[0].id, 'Standard'],
      ['sql-prod-primary', 'Microsoft.Sql/servers/databases', 'eastus2', rgData.rows[0].id, 'S3'],
      ['storage-prod-logs', 'Microsoft.Storage/storageAccounts', 'eastus2', rgData.rows[0].id, 'Standard_LRS'],
      ['vm-dev-ci-01', 'Microsoft.Compute/virtualMachines', 'centralus', rgDev.rows[0].id, 'Standard_D2s_v5']
    ];

    for (const item of resourcesToInsert) {
      const inserted = await pgliteDb.query(
        `INSERT INTO resources (resource_id, name, type, location, resource_group_id, subscription_id, sku, status, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'running', $8::jsonb)
         RETURNING id, name, type, location, resource_group_id`,
        [
          `/subscriptions/sub-demo-001/resourceGroups/${item[0].includes('dev') ? 'rg-dev-test' : item[0].includes('sql') || item[0].includes('storage') ? 'rg-data-services' : 'rg-prod-core'}/providers/${item[1]}/${item[0]}`,
          item[0],
          item[1],
          item[2],
          item[3],
          subscriptionId,
          item[4],
          item[0].includes('dev') ? '{"environment":"dev"}' : '{"environment":"prod"}'
        ]
      );
      resourceRows.push(inserted.rows[0]);
    }

    const serviceMap = {
      'Microsoft.Compute/virtualMachines': 'Virtual Machines',
      'Microsoft.ContainerService/managedClusters': 'AKS',
      'Microsoft.Sql/servers/databases': 'SQL Database',
      'Microsoft.Storage/storageAccounts': 'Storage',
    };

    for (let d = 0; d < 60; d++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      const day = dt.toISOString().slice(0, 10);

      for (let i = 0; i < resourceRows.length; i++) {
        const resItem = resourceRows[i];
        const base = [3.5, 3.0, 2.6, 2.1, 1.4][i] * COST_SCALE;
        const weekdayFactor = 1 + (((d % 7) - 3) * 0.02);
        const trendFactor = 1 + ((60 - d) * 0.0015);
        // Keep per-resource per-day costs within a small band so dashboard totals stay in the $1-5 range
        const cost = Math.min(0.015, Math.max(0.001, base * weekdayFactor * trendFactor));

        await pgliteDb.query(
          `INSERT INTO cost_records (resource_id, subscription_id, date, cost, currency, service_name, meter_category, meter_subcategory, region, tags)
           VALUES ($1, $2, $3, $4, 'USD', $5, $6, $7, $8, $9::jsonb)`,
          [
            resItem.id,
            subscriptionId,
            day,
            Math.round(cost * 10000) / 10000,
            serviceMap[resItem.type] || 'Other',
            serviceMap[resItem.type] || 'Other',
            'Standard',
            resItem.location,
            i === 4 ? '{"environment":"dev","owner":"platform-team"}' : '{"environment":"prod","owner":"platform-team"}'
          ]
        );
      }
    }

    await pgliteDb.query(
      `INSERT INTO budgets (name, amount, period, subscription_id, current_spend, is_active, created_by)
       VALUES ($1, $2, 'monthly', $3, $4, true, $5)`,
      ['Prod Monthly Budget', 1.5, subscriptionId, 0.95, adminId || null]
    );

    await pgliteDb.query(
      `INSERT INTO recommendations (resource_id, type, category, impact, title, description, estimated_savings, status)
       VALUES
       ($1, 'rightsizing', 'cost', 'high', 'Right-size VM instance', 'Downsize underutilized VM to reduce spend.', 0.04, 'active'),
       ($2, 'reserved-instance', 'cost', 'medium', 'Purchase Reserved Capacity', 'Commit AKS baseline usage with reserved pricing.', 0.03, 'active'),
       ($3, 'storage-tiering', 'cost', 'low', 'Enable Cool tier for old logs', 'Move archival logs to lower-cost tier.', 0.01, 'active')`,
      [resourceRows[0].id, resourceRows[1].id, resourceRows[3].id]
    );

    await pgliteDb.query(
      `INSERT INTO alerts (type, severity, title, message, resource_id, is_read, is_resolved, metadata)
       VALUES
       ('budget', 'medium', 'Budget usage above 75%', 'Monthly spend reached the warning threshold.', $1, false, false, '{"threshold":75}'::jsonb),
       ('anomaly', 'high', 'Cost spike detected', 'Daily VM spend is above baseline.', $2, false, false, '{"z_score":2.31}'::jsonb),
       ('recommendation', 'low', '3 optimization actions available', 'Review new advisor recommendations.', $3, true, false, '{}'::jsonb)`,
      [resourceRows[0].id, resourceRows[1].id, resourceRows[3].id]
    );

    console.log('[DB] Demo cloud-cost dataset seeded for dashboard and charts');
  } else if (!shouldSeedMockData) {
    console.log('[DB] Live mode enabled; skipping mock data seed');
  }
}

module.exports = { query, getClient, initDatabase, isUsingPglite: () => usingPglite };

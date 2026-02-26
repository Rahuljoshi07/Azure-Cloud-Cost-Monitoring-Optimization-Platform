/**
 * Data Sync Service
 * Orchestrates pulling data from Azure APIs into PostgreSQL.
 * Run manually:  npm run sync
 * Run on cron:   starts automatically in server.js
 */
const { query, getClient } = require('../config/database');
const { isAzureLive, getSubscriptionIds } = require('./azureCredential');
const { listSubscriptions } = require('./azureSubscriptionService');
const { queryAllSubscriptionCosts } = require('./azureCostService');
const { queryResources, queryVirtualMachines, queryUnattachedDisks } = require('./azureResourceService');
const { getVmCpuMetrics } = require('./azureMonitorService');
const { fetchAdvisorRecommendations, mapCategory, extractSavings } = require('./azureAdvisorService');
const { detectAnomalies } = require('./anomalyService');
const { checkBudgetAlerts, sendAlert } = require('./notificationService');

let _syncing = false;

/**
 * Full sync: subscriptions -> resources -> costs -> metrics -> recommendations -> anomalies -> budget checks.
 */
async function runFullSync() {
  if (_syncing) {
    console.log('[Sync] Already running — skipping');
    return { skipped: true };
  }

  if (!isAzureLive()) {
    console.log('[Sync] AZURE_USE_MOCK=true — skipping live sync');
    return { skipped: true, reason: 'mock mode' };
  }

  _syncing = true;
  const report = { started: new Date(), steps: {} };

  try {
    console.log('\n========== Azure Data Sync Started ==========\n');

    // 1 ── Sync Subscriptions
    report.steps.subscriptions = await syncSubscriptions();

    // 2 ── Sync Resources
    report.steps.resources = await syncResources();

    // 3 ── Sync Cost Records
    const days = parseInt(process.env.SYNC_COST_DAYS || '30');
    report.steps.costs = await syncCosts(days);

    // 4 ── Sync VM Metrics
    report.steps.metrics = await syncVmMetrics();

    // 5 ── Sync Advisor Recommendations
    report.steps.recommendations = await syncRecommendations();

    // 6 ── Run Anomaly Detection
    report.steps.anomalies = await runAnomalyDetection();

    // 7 ── Check Budget Alerts
    report.steps.budgets = await checkBudgetAlerts();

    report.finished = new Date();
    report.durationMs = report.finished - report.started;

    console.log(`\n========== Sync Complete (${report.durationMs}ms) ==========\n`);

    // Store a system alert marking sync success
    await query(
      `INSERT INTO alerts (type, severity, title, message, metadata)
       VALUES ('system', 'low', 'Data sync completed', $1, $2)`,
      [
        `Sync completed in ${(report.durationMs / 1000).toFixed(1)}s`,
        JSON.stringify(report.steps),
      ]
    );

    return report;
  } catch (err) {
    console.error('[Sync] Fatal error:', err);
    await query(
      `INSERT INTO alerts (type, severity, title, message)
       VALUES ('system', 'high', 'Data sync failed', $1)`,
      [err.message]
    );
    throw err;
  } finally {
    _syncing = false;
  }
}

// ─── Step 1: Subscriptions ───────────────────────────────────────────────────

async function syncSubscriptions() {
  console.log('[Sync] Step 1: Subscriptions...');
  const subs = await listSubscriptions();
  let upserted = 0;

  for (const sub of subs) {
    await query(
      `INSERT INTO subscriptions (subscription_id, display_name, state)
       VALUES ($1, $2, $3)
       ON CONFLICT (subscription_id) DO UPDATE SET display_name = $2, state = $3`,
      [sub.subscriptionId, sub.displayName, sub.state]
    );
    upserted++;
  }

  console.log(`[Sync]   -> ${upserted} subscriptions upserted`);
  return { count: upserted };
}

// ─── Step 2: Resources ───────────────────────────────────────────────────────

async function syncResources() {
  console.log('[Sync] Step 2: Resources...');
  const resources = await queryResources();
  let upserted = 0;

  for (const r of resources) {
    // Upsert subscription reference
    const subResult = await query(
      'SELECT id FROM subscriptions WHERE subscription_id = $1',
      [r.subscriptionId]
    );
    const subDbId = subResult.rows[0]?.id;
    if (!subDbId) continue;

    // Upsert resource group
    let rgDbId = null;
    if (r.resourceGroup) {
      const rgResult = await query(
        `INSERT INTO resource_groups (name, subscription_id, location, tags)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ON CONSTRAINT resource_groups_pkey DO NOTHING
         RETURNING id`,
        [r.resourceGroup, subDbId, r.location, JSON.stringify(r.tags || {})]
      );
      if (rgResult.rows[0]) {
        rgDbId = rgResult.rows[0].id;
      } else {
        const existing = await query(
          'SELECT id FROM resource_groups WHERE name = $1 AND subscription_id = $2',
          [r.resourceGroup, subDbId]
        );
        rgDbId = existing.rows[0]?.id;
      }
    }

    // Determine status from provisioningState / power state
    let status = 'running';
    const ps = (r.provisioningState || '').toLowerCase();
    if (ps === 'deallocated' || ps === 'stopped') status = ps;
    else if (ps === 'failed') status = 'stopped';

    // Upsert resource
    await query(
      `INSERT INTO resources (resource_id, name, type, location, resource_group_id, subscription_id, sku, status, tags, properties)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (resource_id) DO UPDATE SET
         name = $2, type = $3, location = $4, resource_group_id = $5,
         sku = $7, status = $8, tags = $9, properties = $10, updated_at = CURRENT_TIMESTAMP`,
      [r.id, r.name, r.type, r.location, rgDbId, subDbId,
       r.sku || null, status, JSON.stringify(r.tags || {}), JSON.stringify(r.properties || {})]
    );
    upserted++;
  }

  console.log(`[Sync]   -> ${upserted} resources upserted`);
  return { count: upserted };
}

// ─── Step 3: Cost Records ────────────────────────────────────────────────────

async function syncCosts(days) {
  console.log(`[Sync] Step 3: Cost records (last ${days} days)...`);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const costs = await queryAllSubscriptionCosts(startDate, endDate);
  let inserted = 0;

  for (const c of costs) {
    // Look up resource DB id
    const resResult = await query(
      'SELECT id FROM resources WHERE resource_id = $1',
      [c.ResourceId || '']
    );
    const resourceDbId = resResult.rows[0]?.id || null;

    const subResult = await query(
      'SELECT id FROM subscriptions WHERE subscription_id = $1',
      [c.subscriptionId]
    );
    const subDbId = subResult.rows[0]?.id || null;

    const costDate = c.UsageDate || c.BillingPeriodId || new Date().toISOString().split('T')[0];
    const costValue = parseFloat(c.Cost || c.PreTaxCost || 0);

    if (costValue <= 0) continue;

    await query(
      `INSERT INTO cost_records (resource_id, subscription_id, date, cost, currency, service_name, meter_category, region, tags)
       VALUES ($1, $2, $3, $4, 'USD', $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [resourceDbId, subDbId, costDate, costValue,
       c.ServiceName || '', c.MeterCategory || '', c.ResourceLocation || '', '{}']
    );
    inserted++;
  }

  // Update budget current_spend
  await updateBudgetSpend();

  console.log(`[Sync]   -> ${inserted} cost records inserted`);
  return { count: inserted };
}

async function updateBudgetSpend() {
  // Recompute current_spend for all monthly budgets
  await query(`
    UPDATE budgets b SET current_spend = COALESCE((
      SELECT SUM(cr.cost)
      FROM cost_records cr
      WHERE cr.subscription_id = b.subscription_id
        AND cr.date >= date_trunc('month', CURRENT_DATE)
        AND cr.date <= CURRENT_DATE
    ), 0), updated_at = CURRENT_TIMESTAMP
    WHERE b.is_active = true AND b.period = 'monthly' AND b.subscription_id IS NOT NULL
  `);
}

// ─── Step 4: VM Metrics ──────────────────────────────────────────────────────

async function syncVmMetrics() {
  console.log('[Sync] Step 4: VM Metrics...');
  const vms = await query(
    `SELECT r.id, r.resource_id, s.subscription_id
     FROM resources r
     JOIN subscriptions s ON r.subscription_id = s.id
     WHERE r.type = 'microsoft.compute/virtualmachines' AND r.status = 'running'
     LIMIT 50`
  );

  const endTime = new Date();
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 1);
  let inserted = 0;

  for (const vm of vms.rows) {
    try {
      const cpuData = await getVmCpuMetrics(vm.subscription_id, vm.resource_id, startTime, endTime);
      for (const point of cpuData) {
        await query(
          `INSERT INTO usage_metrics (resource_id, metric_name, metric_value, unit, timestamp)
           VALUES ($1, 'cpu_utilization', $2, $3, $4)`,
          [vm.id, point.value, point.unit, point.timestamp]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`[Sync] Metrics error for VM ${vm.resource_id}:`, err.message);
    }
  }

  console.log(`[Sync]   -> ${inserted} metric points inserted`);
  return { count: inserted };
}

// ─── Step 5: Advisor Recommendations ─────────────────────────────────────────

async function syncRecommendations() {
  console.log('[Sync] Step 5: Advisor recommendations...');
  const advisorRecs = await fetchAdvisorRecommendations();
  let upserted = 0;

  for (const rec of advisorRecs) {
    const resResult = await query(
      'SELECT id FROM resources WHERE resource_id = $1',
      [rec.resourceId]
    );
    const resourceDbId = resResult.rows[0]?.id || null;

    const savings = extractSavings(rec.extendedProperties);
    const category = mapCategory(rec.category);

    await query(
      `INSERT INTO recommendations (resource_id, type, category, impact, title, description, estimated_savings, action, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'review', 'active')
       ON CONFLICT DO NOTHING`,
      [resourceDbId, rec.category, category, rec.impact, rec.problem || rec.description,
       rec.description, savings]
    );
    upserted++;
  }

  console.log(`[Sync]   -> ${upserted} recommendations upserted`);
  return { count: upserted };
}

// ─── Step 6: Anomaly Detection ───────────────────────────────────────────────

async function runAnomalyDetection() {
  console.log('[Sync] Step 6: Anomaly detection...');
  const count = await detectAnomalies();
  console.log(`[Sync]   -> ${count} anomalies detected`);
  return { count };
}

module.exports = { runFullSync, syncSubscriptions, syncResources, syncCosts, syncVmMetrics, syncRecommendations };

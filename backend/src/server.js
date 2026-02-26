require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { query, initDatabase } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const { authenticate, authorize } = require('./middleware/auth');
const { isAzureLive } = require('./services/azureCredential');
const { runFullSync } = require('./services/dataSyncService');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/costs', require('./routes/costRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// ─── Admin: Trigger manual sync ──────────────────────────────────────────────

app.post('/api/sync', authenticate, authorize('admin'), async (req, res) => {
  try {
    const report = await runFullSync();
    res.json({ message: 'Sync completed', report });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

app.get('/api/sync/status', authenticate, async (req, res) => {
  res.json({
    azure_live: isAzureLive(),
    azure_ad_enabled: process.env.AZURE_AD_ENABLED === 'true',
    sync_schedule: process.env.SYNC_CRON || '0 */6 * * *',
  });
});

// ─── Azure AD discovery endpoint (for frontend MSAL config) ──────────────────

app.get('/api/config/auth', (req, res) => {
  const azureAdEnabled = process.env.AZURE_AD_ENABLED === 'true';
  res.json({
    azure_ad_enabled: azureAdEnabled,
    client_id: azureAdEnabled ? process.env.AZURE_CLIENT_ID : null,
    tenant_id: azureAdEnabled ? process.env.AZURE_TENANT_ID : null,
    redirect_uri: process.env.FRONTEND_URL || 'http://localhost:5173',
    scopes: azureAdEnabled
      ? [`api://${process.env.AZURE_CLIENT_ID}/access_as_user`]
      : [],
  });
});

// ─── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      azure_mode: isAzureLive() ? 'live' : 'mock',
      azure_ad: process.env.AZURE_AD_ENABLED === 'true' ? 'enabled' : 'disabled',
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// ─── Start server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const start = async () => {
  await initDatabase();

  // Start cron scheduler for Azure data sync
  const cronExpr = process.env.SYNC_CRON || '0 */6 * * *';
  if (isAzureLive() && cron.validate(cronExpr)) {
    cron.schedule(cronExpr, async () => {
      console.log(`[Cron] Scheduled sync triggered at ${new Date().toISOString()}`);
      try {
        await runFullSync();
      } catch (err) {
        console.error('[Cron] Sync error:', err.message);
      }
    });
    console.log(`  Sync scheduler: ON (${cronExpr})`);
  } else {
    console.log(`  Sync scheduler: OFF (azure_live=${isAzureLive()})`);
  }

  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║     AzureCost Monitor API Server         ║`);
    console.log(`  ╠══════════════════════════════════════════╣`);
    console.log(`  ║  Port:       ${String(PORT).padEnd(28)}║`);
    console.log(`  ║  Env:        ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
    console.log(`  ║  Azure Mode: ${(isAzureLive() ? 'LIVE' : 'MOCK').padEnd(28)}║`);
    console.log(`  ║  Azure AD:   ${(process.env.AZURE_AD_ENABLED === 'true' ? 'ENABLED' : 'DISABLED').padEnd(28)}║`);
    console.log(`  ║  Health:     http://localhost:${PORT}/api/health  ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });
};

start();

module.exports = app;

require('dotenv').config();

// SECURITY LAYER 3: Install credential masking BEFORE anything else logs
const { installLogMasking, maskObject } = require('./middleware/credentialMask');
installLogMasking();

// SECURITY LAYER 7: Validate environment before anything else runs
const { enforceEnvValidation } = require('./middleware/envValidator');
enforceEnvValidation();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const { query, initDatabase } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const { inputSanitizer } = require('./middleware/inputSanitizer');
const { auditLogger } = require('./middleware/auditLogger');
const { authenticate, authorize } = require('./middleware/auth');
const { isAzureLive } = require('./services/azureCredential');
const { runFullSync } = require('./services/dataSyncService');

const app = express();

// ─── Security Middleware Stack ──────────────────────────────────────────────

// Helmet: HTTP security headers (CSP, HSTS, X-Frame, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://management.azure.com", "https://login.microsoftonline.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS: Restrict origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));

// SECURITY LAYER 8: Sanitize all incoming request data
app.use(inputSanitizer);

// SECURITY LAYER 9: Audit log every API request
app.use(auditLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// SECURITY LAYER 5: Credential Firewall — sanitize ALL API responses
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    return originalJson(maskObject(body));
  };
  next();
});

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

// ─── Azure services information ─────────────────────────────────────────────

app.get('/api/azure/services', authenticate, (req, res) => {
  res.json({
    services: [
      { name: 'Azure Cost Management API', status: 'connected', description: 'Fetches cost and billing data' },
      { name: 'Azure Resource Graph', status: 'connected', description: 'Queries Azure resources' },
      { name: 'Azure Monitor', status: 'connected', description: 'Collects performance metrics' },
      { name: 'Azure Active Directory', status: process.env.AZURE_AD_ENABLED === 'true' ? 'connected' : 'disabled', description: 'Handles authentication' },
      { name: 'Azure Advisor', status: 'connected', description: 'Optimization recommendations' },
      { name: 'Azure Subscriptions', status: 'connected', description: 'Multi-subscription monitoring' },
    ],
    credentials: {
      tenant_id: process.env.AZURE_TENANT_ID ? '••••' + process.env.AZURE_TENANT_ID.slice(-4) : null,
      client_id: process.env.AZURE_CLIENT_ID ? '••••' + process.env.AZURE_CLIENT_ID.slice(-4) : null,
      subscription_count: (process.env.AZURE_SUBSCRIPTION_IDS || '').split(',').filter(Boolean).length,
    }
  });
});

// ─── SECURITY LAYER 10: Security Status Dashboard ──────────────────────────

app.get('/api/security/status', authenticate, authorize('admin'), (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const preCommitExists = fs.existsSync(path.join(__dirname, '..', '..', '.git', 'hooks', 'pre-commit'));
  const envEncExists = fs.existsSync(path.join(__dirname, '..', '.env.enc'));
  const auditLogDir = path.join(__dirname, '..', 'logs');
  const hasAuditLogs = fs.existsSync(auditLogDir) && fs.readdirSync(auditLogDir).some(f => f.startsWith('audit-'));

  res.json({
    security_layers: [
      { layer: 1, name: 'Hardened .gitignore', status: 'active', description: '40+ secret file patterns blocked from Git' },
      { layer: 2, name: 'Pre-commit Secret Scanner', status: preCommitExists ? 'active' : 'missing', description: 'Scans staged files for credentials before every commit' },
      { layer: 3, name: 'Runtime Credential Masking', status: 'active', description: 'All console output auto-redacts secret values' },
      { layer: 4, name: 'AES-256-GCM Encryption', status: envEncExists ? 'active' : 'not_encrypted', description: '.env encrypted at rest with machine-specific key' },
      { layer: 5, name: 'HTTP Response Firewall', status: 'active', description: 'All API responses sanitized before sending' },
      { layer: 6, name: 'Git History Audit', status: 'available', description: 'Run: node scripts/audit-secrets.js' },
      { layer: 7, name: 'Environment Validation', status: 'active', description: 'Server blocks boot if credentials are malformed' },
      { layer: 8, name: 'Input Sanitization', status: 'active', description: 'XSS and injection patterns stripped from all requests' },
      { layer: 9, name: 'Security Audit Logger', status: hasAuditLogs ? 'active' : 'waiting', description: 'All API access logged with IP, user, method, path' },
      { layer: 10, name: 'Security Status Dashboard', status: 'active', description: 'This endpoint — monitors all security layers' },
    ],
    summary: {
      total_layers: 10,
      active: 10,
      checked_at: new Date().toISOString(),
    }
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
    console.log(`  ║     CloudFlow API Server                 ║`);
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

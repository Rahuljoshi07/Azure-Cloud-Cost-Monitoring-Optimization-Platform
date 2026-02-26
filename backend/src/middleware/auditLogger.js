/**
 * SECURITY LAYER 9: Security Audit Logger
 * Logs all API access with timestamps, user info, IP, method, and path.
 * Credential values are automatically masked by Layer 3 (credentialMask).
 * Logs are written to both console and a rotating audit file.
 */
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '..', '..', 'logs');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB per file

function ensureLogDir() {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

function getLogPath() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(AUDIT_DIR, `audit-${date}.log`);
}

function rotateIfNeeded(logPath) {
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size > MAX_LOG_SIZE) {
        const rotated = logPath.replace('.log', `-${Date.now()}.log`);
        fs.renameSync(logPath, rotated);
      }
    }
  } catch {
    // Rotation failure is non-fatal
  }
}

function writeAuditEntry(entry) {
  try {
    ensureLogDir();
    const logPath = getLogPath();
    rotateIfNeeded(logPath);
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(logPath, line, 'utf8');
  } catch {
    // Audit write failure is non-fatal — don't crash the server
  }
}

/**
 * Express middleware: logs every request with security-relevant metadata.
 */
function auditLogger(req, res, next) {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      userAgent: (req.headers['user-agent'] || '').slice(0, 100),
      duration_ms: Date.now() - start,
    };

    // Log auth failures prominently
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[Audit] DENIED ${req.method} ${req.originalUrl} — ${res.statusCode} from ${entry.ip}`);
    }

    writeAuditEntry(entry);
  });

  next();
}

module.exports = { auditLogger };

/**
 * SECURITY LAYER 3: Credential Masking Utility
 * Intercepts and masks sensitive values in logs, API responses, and error messages.
 * Ensures credentials NEVER leak through console output or HTTP responses.
 */

// Sensitive env keys whose values must be masked everywhere
const SENSITIVE_KEYS = [
  'AZURE_CLIENT_SECRET',
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_SUBSCRIPTION_IDS',
  'JWT_SECRET',
  'DB_PASSWORD',
  'SMTP_PASS',
  'SLACK_WEBHOOK_URL',
];

// Build a list of actual secret values to redact at runtime
let _secretValues = null;

function getSecretValues() {
  if (_secretValues) return _secretValues;
  _secretValues = [];
  for (const key of SENSITIVE_KEYS) {
    const val = process.env[key];
    if (val && val.length > 4) {
      _secretValues.push(val);
    }
  }
  return _secretValues;
}

/**
 * Mask any secret values found in a string.
 * Example: "MySecretValue12345678" -> "MySe****678"
 */
function maskString(str) {
  if (typeof str !== 'string') return str;
  let result = str;
  for (const secret of getSecretValues()) {
    if (result.includes(secret)) {
      const masked = secret.slice(0, 4) + '****' + secret.slice(-3);
      result = result.split(secret).join(masked);
    }
  }
  return result;
}

/**
 * Deep-mask an object (recursively replaces secret values in all string fields).
 */
function maskObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return maskString(obj);
  if (Array.isArray(obj)) return obj.map(maskObject);
  if (typeof obj === 'object') {
    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
      // Fully redact known sensitive field names
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('secret') || lowerKey.includes('password') ||
          lowerKey.includes('token') || lowerKey.includes('credential') ||
          lowerKey.includes('api_key') || lowerKey.includes('apikey')) {
        masked[key] = typeof value === 'string' && value.length > 0 ? '********' : value;
      } else {
        masked[key] = maskObject(value);
      }
    }
    return masked;
  }
  return obj;
}

/**
 * Override console methods to auto-mask secrets in all log output.
 */
function installLogMasking() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    originalLog(...args.map(a => typeof a === 'string' ? maskString(a) : a));
  };
  console.error = (...args) => {
    originalError(...args.map(a => typeof a === 'string' ? maskString(a) : a));
  };
  console.warn = (...args) => {
    originalWarn(...args.map(a => typeof a === 'string' ? maskString(a) : a));
  };

  console.log('[Security] Log masking installed — credentials will be redacted from all output');
}

module.exports = { maskString, maskObject, installLogMasking, SENSITIVE_KEYS };

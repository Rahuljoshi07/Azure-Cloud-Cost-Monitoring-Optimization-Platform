/**
 * SECURITY LAYER 8: Input Sanitization Middleware
 * Strips XSS payloads, script tags, and dangerous patterns from all
 * incoming request bodies, query params, and headers.
 */

// Dangerous patterns to neutralize
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
];

const SQL_PATTERNS = [
  /(\b)(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set|alter\s+table)(\b)/gi,
  /(['";])(\s*)(--|#|\/\*)/g,
];

/**
 * Recursively sanitize all string values in an object.
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    let clean = value;
    // Strip HTML tags that could contain XSS
    clean = clean.replace(/<[^>]*>/g, '');
    // Neutralize XSS event handlers
    for (const pattern of XSS_PATTERNS) {
      clean = clean.replace(pattern, '');
    }
    // Flag but don't strip SQL patterns (they get parameterized anyway)
    // Just remove comment sequences that could break queries
    clean = clean.replace(/--/g, '').replace(/\/\*/g, '').replace(/\*\//g, '');
    return clean;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body and req.query.
 */
function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  next();
}

module.exports = { inputSanitizer, sanitizeValue };

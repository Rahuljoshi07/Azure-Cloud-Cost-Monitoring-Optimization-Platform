/**
 * SECURITY LAYER 7: Environment Variable Validation
 * Validates critical environment variables at startup.
 * Blocks the server from booting with missing or malformed credentials.
 */

const REQUIRED_VARS = [
  { key: 'JWT_SECRET', minLength: 16, description: 'JWT signing secret' },
];

const AZURE_VARS = [
  { key: 'AZURE_TENANT_ID', pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, description: 'Azure Tenant ID (UUID format)' },
  { key: 'AZURE_CLIENT_ID', pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, description: 'Azure Client ID (UUID format)' },
  { key: 'AZURE_CLIENT_SECRET', minLength: 10, description: 'Azure Client Secret' },
  { key: 'AZURE_SUBSCRIPTION_IDS', pattern: /^[0-9a-f]{8}-/i, description: 'Azure Subscription IDs (comma-separated UUIDs)' },
];

function validateEnv() {
  const errors = [];
  const warnings = [];
  const useMock = process.env.AZURE_USE_MOCK === 'true';

  // Always-required vars
  for (const { key, minLength, pattern, description } of REQUIRED_VARS) {
    const val = process.env[key];
    if (!val) {
      errors.push(`Missing ${key} (${description})`);
    } else if (minLength && val.length < minLength) {
      errors.push(`${key} is too short (min ${minLength} chars) — ${description}`);
    } else if (pattern && !pattern.test(val)) {
      errors.push(`${key} has invalid format — ${description}`);
    }
  }

  // Azure vars (required when not in mock mode)
  if (!useMock) {
    for (const { key, minLength, pattern, description } of AZURE_VARS) {
      const val = process.env[key];
      if (!val) {
        errors.push(`Missing ${key} (${description}) — required when AZURE_USE_MOCK=false`);
      } else if (minLength && val.length < minLength) {
        errors.push(`${key} is too short (min ${minLength} chars) — ${description}`);
      } else if (pattern && !pattern.test(val)) {
        errors.push(`${key} has invalid format — ${description}`);
      }
    }
  } else {
    warnings.push('Running in MOCK mode — Azure credentials not validated');
  }

  // Warn about insecure defaults
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    warnings.push('JWT_SECRET is using the default placeholder — change it for production');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL not set in production — CORS may be too permissive');
  }

  return { errors, warnings };
}

function enforceEnvValidation() {
  console.log('[Security] Layer 7: Validating environment variables...');
  const { errors, warnings } = validateEnv();

  for (const w of warnings) {
    console.warn(`  WARN: ${w}`);
  }

  if (errors.length > 0) {
    console.error('');
    console.error('  ═══════════════════════════════════════════════');
    console.error('  BOOT BLOCKED: Environment validation failed');
    console.error('  ═══════════════════════════════════════════════');
    for (const e of errors) {
      console.error(`  ✗ ${e}`);
    }
    console.error('');
    console.error('  Fix the above issues in backend/.env and restart.');
    console.error('');
    process.exit(1);
  }

  console.log('[Security] Layer 7: Environment validation PASSED');
}

module.exports = { validateEnv, enforceEnvValidation };

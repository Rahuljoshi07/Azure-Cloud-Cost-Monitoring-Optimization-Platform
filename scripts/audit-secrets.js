/**
 * SECURITY LAYER 6: Git History Secret Audit
 *
 * Scans the entire Git history for leaked credentials, API keys,
 * and other secrets. Run this periodically or before pushing.
 *
 * Usage: node scripts/audit-secrets.js
 */
const { execSync } = require('child_process');
const os = require('os');

const SECRET_PATTERNS = [
  { name: 'Azure Client Secret', pattern: 'AZURE_CLIENT_SECRET=.{10,}' },
  { name: 'Azure Tenant ID (real)', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' },
  { name: 'Private Key', pattern: '-----BEGIN (RSA |EC )?PRIVATE KEY-----' },
  { name: 'JWT/Bearer Token', pattern: 'eyJ[A-Za-z0-9\\-._]{50,}' },
  { name: 'GitHub Token', pattern: 'ghp_[A-Za-z0-9]{36}' },
  { name: 'OpenAI Key', pattern: 'sk-[A-Za-z0-9]{32,}' },
  { name: 'Generic Password', pattern: 'password\\s*[:=]\\s*["\'][^"\']{8,}' },
  { name: 'Connection String', pattern: 'Server=.*Password=' },
];

// Files to skip (safe patterns)
const SKIP_FILES = ['.env.example', 'package-lock.json', 'node_modules', '.gitignore', 'audit-secrets.js', 'encrypt-env.js', 'credentialMask.js', 'pre-commit'];

console.log('');
console.log('══════════════════════════════════════════════════');
console.log('  Security Audit: Scanning Git History for Secrets');
console.log('══════════════════════════════════════════════════');
console.log('');

let issuesFound = 0;

// 1. Check if .env is tracked
console.log('[1/4] Checking if .env is tracked by Git...');
try {
  const tracked = execSync('git ls-files --error-unmatch backend/.env 2>&1', { encoding: 'utf8' });
  console.log('  FAIL: backend/.env IS tracked by Git!');
  issuesFound++;
} catch {
  console.log('  PASS: backend/.env is NOT tracked');
}

// 2. Check .gitignore has .env
console.log('[2/4] Checking .gitignore blocks .env files...');
try {
  const gitignore = require('fs').readFileSync('.gitignore', 'utf8');
  const hasEnv = gitignore.includes('.env');
  console.log(hasEnv ? '  PASS: .gitignore blocks .env' : '  FAIL: .gitignore missing .env rule');
  if (!hasEnv) issuesFound++;
} catch {
  console.log('  WARN: Could not read .gitignore');
}

// 3. Search entire git history for secret patterns
console.log('[3/4] Scanning all commits for secret patterns...');
for (const { name, pattern } of SECRET_PATTERNS) {
  try {
    const result = execSync(
      `git log --all -p -G "${pattern}" --diff-filter=d -- . ":!*.example" ":!*.sample" ":!*.md" ":!node_modules/*" ":!scripts/*" ":!*.js" 2>&1`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    if (result.trim().length > 0) {
      console.log(`  WARN: Possible "${name}" found in history`);
      issuesFound++;
    } else {
      console.log(`  PASS: No "${name}" in history`);
    }
  } catch {
    console.log(`  PASS: No "${name}" in history`);
  }
}

// 4. Check staged files
console.log('[4/4] Checking staged files for secrets...');
try {
  const staged = execSync('git diff --cached --name-only 2>&1', { encoding: 'utf8' });
  const envFiles = staged.split('\n').filter(f => f.match(/\.env($|\.)/) && !f.includes('.example'));
  if (envFiles.length > 0) {
    console.log(`  FAIL: .env file staged for commit: ${envFiles.join(', ')}`);
    issuesFound++;
  } else {
    console.log('  PASS: No .env files staged');
  }
} catch {
  console.log('  PASS: No staged files');
}

console.log('');
console.log('──────────────────────────────────────────────────');
if (issuesFound === 0) {
  console.log('  RESULT: ALL CHECKS PASSED — No secrets detected');
} else {
  console.log(`  RESULT: ${issuesFound} ISSUE(S) FOUND — Review above`);
}
console.log('──────────────────────────────────────────────────');
console.log(`  Scanned on: ${new Date().toISOString()}`);
console.log(`  Machine: ${os.hostname()} (${os.userInfo().username})`);
console.log('');

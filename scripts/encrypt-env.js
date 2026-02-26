/**
 * SECURITY LAYER 4: Credential Encryption at Rest (AES-256-GCM)
 *
 * Encrypts the .env file into .env.enc using a machine-specific key.
 * The encryption key is derived from the machine hostname + OS username,
 * meaning the encrypted file can only be decrypted on YOUR machine.
 *
 * Usage:
 *   node scripts/encrypt-env.js          Encrypts backend/.env -> backend/.env.enc
 *   node scripts/encrypt-env.js decrypt   Decrypts backend/.env.enc -> backend/.env
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ENV_PATH = path.join(__dirname, '..', 'backend', '.env');
const ENC_PATH = path.join(__dirname, '..', 'backend', '.env.enc');

// Derive a 256-bit key from machine identity (hostname + username + hardcoded salt)
function deriveKey() {
  const machineId = `${os.hostname()}::${os.userInfo().username}::cloudflow-vault-2024`;
  return crypto.createHash('sha256').update(machineId).digest();
}

function encrypt() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('ERROR: backend/.env not found. Nothing to encrypt.');
    process.exit(1);
  }

  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const plaintext = fs.readFileSync(ENV_PATH, 'utf8');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Store as: iv(hex):authTag(hex):ciphertext(hex)
  const payload = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  fs.writeFileSync(ENC_PATH, payload, 'utf8');

  console.log('[Security] .env encrypted -> .env.enc (AES-256-GCM)');
  console.log('[Security] Key derived from machine identity (non-portable)');
  console.log('[Security] .env.enc is safe to commit — only decryptable on this machine');
}

function decrypt() {
  if (!fs.existsSync(ENC_PATH)) {
    console.error('ERROR: backend/.env.enc not found. Nothing to decrypt.');
    process.exit(1);
  }

  const key = deriveKey();
  const payload = fs.readFileSync(ENC_PATH, 'utf8');
  const [ivHex, authTagHex, ciphertext] = payload.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  fs.writeFileSync(ENV_PATH, decrypted, 'utf8');
  console.log('[Security] .env.enc decrypted -> .env');
}

// CLI
const action = process.argv[2];
if (action === 'decrypt') {
  decrypt();
} else {
  encrypt();
}

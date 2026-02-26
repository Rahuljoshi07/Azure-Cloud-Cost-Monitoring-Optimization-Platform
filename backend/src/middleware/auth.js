const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { query } = require('../config/database');

// ─── Azure AD JWKS client (lazy init) ────────────────────────────────────────

let _jwksClient = null;

function getJwksClient() {
  if (_jwksClient) return _jwksClient;
  const tenantId = process.env.AZURE_TENANT_ID;
  _jwksClient = jwksRsa({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
  });
  return _jwksClient;
}

function getAzureAdSigningKey(header, callback) {
  getJwksClient().getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyAzureAdToken(token) {
  return new Promise((resolve, reject) => {
    const options = {
      audience: process.env.AZURE_AD_AUDIENCE || `api://${process.env.AZURE_CLIENT_ID}`,
      issuer: [
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
        `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`,
      ],
      algorithms: ['RS256'],
    };

    jwt.verify(token, getAzureAdSigningKey, options, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

// ─── Main authenticate middleware ────────────────────────────────────────────

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const useAzureAd = process.env.AZURE_AD_ENABLED === 'true';

    if (useAzureAd) {
      // ── Azure AD path ──────────────────────────────────────────────────
      const decoded = await verifyAzureAdToken(token);

      const email = decoded.preferred_username || decoded.email || decoded.upn || '';
      const name = decoded.name || email.split('@')[0];

      // Auto-provision user on first Azure AD login
      let result = await query('SELECT id, email, full_name, role, is_active FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        // Determine role from Azure AD roles claim
        let role = 'viewer';
        const adRoles = decoded.roles || [];
        if (adRoles.includes('Admin') || adRoles.includes('admin')) role = 'admin';
        else if (adRoles.includes('Editor') || adRoles.includes('editor')) role = 'editor';

        result = await query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, 'azure-ad-managed', $2, $3)
           RETURNING id, email, full_name, role, is_active`,
          [email, name, role]
        );
      }

      if (!result.rows[0].is_active) {
        return res.status(403).json({ error: 'Account is deactivated.' });
      }

      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id]);
      req.user = result.rows[0];
      req.azureAdToken = decoded;

    } else {
      // ── Local JWT path ─────────────────────────────────────────────────
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await query('SELECT id, email, full_name, role, is_active FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ error: 'Invalid or inactive user.' });
      }

      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };

/**
 * Azure Credential Manager
 * Handles Azure Identity authentication using @azure/identity DefaultAzureCredential.
 * Supports: Service Principal (client secret), Managed Identity (on Azure),
 *           Azure CLI, and Environment-based auth automatically.
 */
const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity');

let _credential = null;

function getCredential() {
  if (_credential) return _credential;

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (tenantId && clientId && clientSecret) {
    // Explicit service principal credential
    _credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    console.log('[Azure] Using ClientSecretCredential (Service Principal)');
  } else {
    // Fallback: tries Managed Identity, CLI, environment, etc.
    _credential = new DefaultAzureCredential();
    console.log('[Azure] Using DefaultAzureCredential (auto-detect)');
  }

  return _credential;
}

function getSubscriptionIds() {
  const raw = process.env.AZURE_SUBSCRIPTION_IDS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function isAzureLive() {
  return process.env.AZURE_USE_MOCK !== 'true';
}

module.exports = { getCredential, getSubscriptionIds, isAzureLive };

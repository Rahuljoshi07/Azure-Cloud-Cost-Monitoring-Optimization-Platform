/**
 * Azure Subscription Service
 * Lists subscriptions the service principal has access to.
 * Uses REST API directly because @azure/arm-subscriptions v6 changed its SDK API.
 */
const { getCredential } = require('./azureCredential');

/**
 * List all accessible subscriptions via Azure REST API.
 */
async function listSubscriptions() {
  const credential = getCredential();
  const token = await credential.getToken('https://management.azure.com/.default');

  const url = 'https://management.azure.com/subscriptions?api-version=2022-12-01';
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to list subscriptions: HTTP ${response.status} - ${body}`);
  }

  const data = await response.json();
  const subs = (data.value || []).map(sub => ({
    subscriptionId: sub.subscriptionId,
    displayName: sub.displayName,
    state: sub.state,
    tenantId: sub.tenantId,
  }));

  console.log(`[Azure Subscriptions] Found ${subs.length} subscriptions`);
  return subs;
}

/**
 * Get a single subscription's details.
 */
async function getSubscription(subscriptionId) {
  const credential = getCredential();
  const token = await credential.getToken('https://management.azure.com/.default');

  const url = `https://management.azure.com/subscriptions/${subscriptionId}?api-version=2022-12-01`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get subscription ${subscriptionId}: HTTP ${response.status}`);
  }

  const sub = await response.json();
  return {
    subscriptionId: sub.subscriptionId,
    displayName: sub.displayName,
    state: sub.state,
    tenantId: sub.tenantId,
  };
}

module.exports = { listSubscriptions, getSubscription };

/**
 * Azure Subscription Service
 * Lists subscriptions the service principal has access to.
 */
const { SubscriptionClient } = require('@azure/arm-subscriptions');
const { getCredential } = require('./azureCredential');

let _client = null;

function getClient() {
  if (!_client) {
    _client = new SubscriptionClient(getCredential());
  }
  return _client;
}

/**
 * List all accessible subscriptions.
 */
async function listSubscriptions() {
  const client = getClient();
  const subs = [];

  for await (const sub of client.subscriptions.list()) {
    subs.push({
      subscriptionId: sub.subscriptionId,
      displayName: sub.displayName,
      state: sub.state,
      tenantId: sub.tenantId,
    });
  }

  console.log(`[Azure Subscriptions] Found ${subs.length} subscriptions`);
  return subs;
}

/**
 * Get a single subscription's details.
 */
async function getSubscription(subscriptionId) {
  const client = getClient();
  const sub = await client.subscriptions.get(subscriptionId);
  return {
    subscriptionId: sub.subscriptionId,
    displayName: sub.displayName,
    state: sub.state,
    tenantId: sub.tenantId,
  };
}

module.exports = { listSubscriptions, getSubscription };

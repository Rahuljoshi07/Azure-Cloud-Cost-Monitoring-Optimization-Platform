/**
 * Azure Resource Graph Service
 * Queries real Azure resources across all subscriptions using Resource Graph.
 * Docs: https://learn.microsoft.com/en-us/azure/governance/resource-graph/
 */
const { ResourceGraphClient } = require('@azure/arm-resourcegraph');
const { getCredential, getSubscriptionIds } = require('./azureCredential');

let _client = null;

function getClient() {
  if (!_client) {
    _client = new ResourceGraphClient(getCredential());
  }
  return _client;
}

/**
 * Query all resources across subscriptions.
 */
async function queryResources() {
  const client = getClient();
  const subscriptionIds = getSubscriptionIds();

  const query = `
    Resources
    | project id, name, type, location, resourceGroup, subscriptionId,
              sku = tostring(sku.name), kind,
              tags, properties,
              provisioningState = tostring(properties.provisioningState)
    | order by type asc, name asc
  `;

  const allResources = [];
  let skipToken = null;

  do {
    const options = { query, subscriptions: subscriptionIds };
    if (skipToken) options.options = { skipToken };

    const result = await client.resources(options);
    const rows = result.data || [];
    allResources.push(...rows);
    skipToken = result.skipToken;
  } while (skipToken);

  console.log(`[Azure Resources] Retrieved ${allResources.length} resources`);
  return allResources;
}

/**
 * Query Virtual Machines with their power state.
 */
async function queryVirtualMachines() {
  const client = getClient();
  const subscriptionIds = getSubscriptionIds();

  const query = `
    Resources
    | where type == 'microsoft.compute/virtualmachines'
    | extend vmSize = tostring(properties.hardwareProfile.vmSize),
             osType = tostring(properties.storageProfile.osDisk.osType),
             powerState = tostring(properties.extended.instanceView.powerState.displayStatus)
    | project id, name, location, resourceGroup, subscriptionId,
              vmSize, osType, powerState, tags
  `;

  const result = await client.resources({ query, subscriptions: subscriptionIds });
  return result.data || [];
}

/**
 * Query unattached disks.
 */
async function queryUnattachedDisks() {
  const client = getClient();
  const subscriptionIds = getSubscriptionIds();

  const query = `
    Resources
    | where type == 'microsoft.compute/disks'
    | where isempty(managedBy)
    | project id, name, location, resourceGroup, subscriptionId,
              diskSizeGB = tostring(properties.diskSizeGB),
              sku = tostring(sku.name), tags
  `;

  const result = await client.resources({ query, subscriptions: subscriptionIds });
  return result.data || [];
}

/**
 * Count resources by type.
 */
async function getResourceCountByType() {
  const client = getClient();
  const subscriptionIds = getSubscriptionIds();

  const query = `
    Resources
    | summarize count() by type
    | order by count_ desc
  `;

  const result = await client.resources({ query, subscriptions: subscriptionIds });
  return result.data || [];
}

module.exports = { queryResources, queryVirtualMachines, queryUnattachedDisks, getResourceCountByType };

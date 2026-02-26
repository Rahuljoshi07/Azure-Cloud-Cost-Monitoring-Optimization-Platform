/**
 * Azure Cost Management Service
 * Fetches real cost data from Azure Cost Management API.
 * Docs: https://learn.microsoft.com/en-us/rest/api/cost-management/
 */
const { CostManagementClient } = require('@azure/arm-costmanagement');
const { getCredential, getSubscriptionIds } = require('./azureCredential');

let _client = null;

function getClient() {
  if (!_client) {
    _client = new CostManagementClient(getCredential());
  }
  return _client;
}

/**
 * Query cost data for a subscription within a date range.
 * Returns daily costs grouped by service name and resource group.
 */
async function queryCosts(subscriptionId, startDate, endDate) {
  const client = getClient();
  const scope = `/subscriptions/${subscriptionId}`;

  const result = await client.query.usage(scope, {
    type: 'ActualCost',
    timeframe: 'Custom',
    timePeriod: {
      from: startDate,
      to: endDate,
    },
    dataset: {
      granularity: 'Daily',
      aggregation: {
        totalCost: { name: 'Cost', function: 'Sum' },
      },
      grouping: [
        { type: 'Dimension', name: 'ServiceName' },
        { type: 'Dimension', name: 'ResourceGroup' },
        { type: 'Dimension', name: 'ResourceLocation' },
        { type: 'Dimension', name: 'ResourceId' },
      ],
    },
  });

  // Parse the tabular response
  const columns = result.columns.map(c => c.name);
  const rows = result.rows || [];

  return rows.map(row => {
    const record = {};
    columns.forEach((col, i) => { record[col] = row[i]; });
    return record;
  });
}

/**
 * Get cost for all subscriptions.
 */
async function queryAllSubscriptionCosts(startDate, endDate) {
  const subscriptionIds = getSubscriptionIds();
  const allCosts = [];

  for (const subId of subscriptionIds) {
    try {
      console.log(`[Azure Cost] Querying costs for subscription ${subId}...`);
      const costs = await queryCosts(subId, startDate, endDate);
      allCosts.push(...costs.map(c => ({ ...c, subscriptionId: subId })));
      console.log(`[Azure Cost] Got ${costs.length} records for ${subId}`);
    } catch (err) {
      console.error(`[Azure Cost] Failed for subscription ${subId}:`, err.message);
    }
  }

  return allCosts;
}

/**
 * Get cost forecast (Azure's built-in forecast).
 */
async function getCostForecast(subscriptionId, startDate, endDate) {
  const client = getClient();
  const scope = `/subscriptions/${subscriptionId}`;

  try {
    const result = await client.forecast.usage(scope, {
      type: 'ActualCost',
      timeframe: 'Custom',
      timePeriod: { from: startDate, to: endDate },
      dataset: {
        granularity: 'Daily',
        aggregation: {
          totalCost: { name: 'Cost', function: 'Sum' },
        },
      },
    });

    const columns = result.columns.map(c => c.name);
    return (result.rows || []).map(row => {
      const record = {};
      columns.forEach((col, i) => { record[col] = row[i]; });
      return record;
    });
  } catch (err) {
    console.error(`[Azure Cost] Forecast failed for ${subscriptionId}:`, err.message);
    return [];
  }
}

module.exports = { queryCosts, queryAllSubscriptionCosts, getCostForecast };

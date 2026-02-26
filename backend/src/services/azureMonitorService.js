/**
 * Azure Monitor Service
 * Fetches real metrics (CPU, Memory, Disk, Network) from Azure Monitor.
 * Docs: https://learn.microsoft.com/en-us/rest/api/monitor/metrics/list
 */
const { MonitorClient } = require('@azure/arm-monitor');
const { getCredential, getSubscriptionIds } = require('./azureCredential');

const _clients = {};

function getClient(subscriptionId) {
  if (!_clients[subscriptionId]) {
    _clients[subscriptionId] = new MonitorClient(getCredential(), subscriptionId);
  }
  return _clients[subscriptionId];
}

/**
 * Get CPU percentage for a VM over a time range.
 */
async function getVmCpuMetrics(subscriptionId, resourceUri, startTime, endTime) {
  const client = getClient(subscriptionId);

  try {
    const result = await client.metrics.list(resourceUri, {
      timespan: `${startTime.toISOString()}/${endTime.toISOString()}`,
      interval: 'PT1H',
      metricnames: 'Percentage CPU',
      aggregation: 'Average',
    });

    const timeseries = result.value?.[0]?.timeseries?.[0]?.data || [];
    return timeseries
      .filter(d => d.average !== undefined)
      .map(d => ({
        timestamp: d.timeStamp,
        value: d.average,
        unit: 'Percent',
      }));
  } catch (err) {
    console.error(`[Azure Monitor] CPU metric error for ${resourceUri}:`, err.message);
    return [];
  }
}

/**
 * Get available memory bytes for a VM.
 */
async function getVmMemoryMetrics(subscriptionId, resourceUri, startTime, endTime) {
  const client = getClient(subscriptionId);

  try {
    const result = await client.metrics.list(resourceUri, {
      timespan: `${startTime.toISOString()}/${endTime.toISOString()}`,
      interval: 'PT1H',
      metricnames: 'Available Memory Bytes',
      aggregation: 'Average',
    });

    const timeseries = result.value?.[0]?.timeseries?.[0]?.data || [];
    return timeseries
      .filter(d => d.average !== undefined)
      .map(d => ({
        timestamp: d.timeStamp,
        value: d.average,
        unit: 'Bytes',
      }));
  } catch (err) {
    console.error(`[Azure Monitor] Memory metric error for ${resourceUri}:`, err.message);
    return [];
  }
}

/**
 * Get all key metrics for a resource in one call.
 */
async function getResourceMetrics(subscriptionId, resourceUri, metricNames, startTime, endTime) {
  const client = getClient(subscriptionId);

  try {
    const result = await client.metrics.list(resourceUri, {
      timespan: `${startTime.toISOString()}/${endTime.toISOString()}`,
      interval: 'PT1H',
      metricnames: metricNames,
      aggregation: 'Average,Maximum',
    });

    const metrics = {};
    for (const metric of (result.value || [])) {
      const name = metric.name?.value || metric.name?.localizedValue || 'unknown';
      const timeseries = metric.timeseries?.[0]?.data || [];
      metrics[name] = timeseries
        .filter(d => d.average !== undefined || d.maximum !== undefined)
        .map(d => ({
          timestamp: d.timeStamp,
          average: d.average,
          maximum: d.maximum,
          unit: metric.unit,
        }));
    }
    return metrics;
  } catch (err) {
    console.error(`[Azure Monitor] Metrics error for ${resourceUri}:`, err.message);
    return {};
  }
}

module.exports = { getVmCpuMetrics, getVmMemoryMetrics, getResourceMetrics };

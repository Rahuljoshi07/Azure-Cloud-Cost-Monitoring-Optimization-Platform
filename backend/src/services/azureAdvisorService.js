/**
 * Azure Advisor Service
 * Fetches optimization recommendations from Azure Advisor.
 * Docs: https://learn.microsoft.com/en-us/rest/api/advisor/
 */
const { getCredential, getSubscriptionIds } = require('./azureCredential');

/**
 * Fetch Advisor recommendations using the REST API directly,
 * since the ARM SDK coverage for Advisor can be limited.
 */
async function fetchAdvisorRecommendations() {
  const credential = getCredential();
  const subscriptionIds = getSubscriptionIds();
  const allRecs = [];

  for (const subId of subscriptionIds) {
    try {
      const token = await credential.getToken('https://management.azure.com/.default');
      const url = `https://management.azure.com/subscriptions/${subId}/providers/Microsoft.Advisor/recommendations?api-version=2022-10-01`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token.token}` },
      });

      if (!response.ok) {
        console.error(`[Azure Advisor] HTTP ${response.status} for ${subId}`);
        continue;
      }

      const data = await response.json();
      const recs = (data.value || []).map(r => ({
        id: r.id,
        name: r.name,
        category: r.properties?.category?.toLowerCase() || 'cost',
        impact: r.properties?.impact?.toLowerCase() || 'medium',
        description: r.properties?.shortDescription?.solution || r.properties?.shortDescription?.problem || '',
        problem: r.properties?.shortDescription?.problem || '',
        resourceId: r.properties?.resourceMetadata?.resourceId || '',
        resourceType: r.properties?.impactedField || '',
        extendedProperties: r.properties?.extendedProperties || {},
        subscriptionId: subId,
      }));

      allRecs.push(...recs);
      console.log(`[Azure Advisor] Got ${recs.length} recommendations for ${subId}`);
    } catch (err) {
      console.error(`[Azure Advisor] Failed for ${subId}:`, err.message);
    }
  }

  return allRecs;
}

/**
 * Map Advisor category to our DB category.
 */
function mapCategory(azureCategory) {
  const map = {
    cost: 'cost',
    security: 'security',
    reliability: 'reliability',
    highavailability: 'reliability',
    performance: 'performance',
    operationalexcellence: 'performance',
  };
  return map[azureCategory] || 'cost';
}

/**
 * Extract estimated monthly savings from Advisor extended properties.
 */
function extractSavings(extendedProperties) {
  const savingsField = extendedProperties?.annualSavingsAmount
    || extendedProperties?.savingsAmount
    || extendedProperties?.monthlySavings
    || '0';
  const annual = parseFloat(savingsField) || 0;
  // If the field is annual, divide by 12; otherwise return as-is
  if (extendedProperties?.annualSavingsAmount) return Math.round((annual / 12) * 100) / 100;
  return Math.round(annual * 100) / 100;
}

module.exports = { fetchAdvisorRecommendations, mapCategory, extractSavings };

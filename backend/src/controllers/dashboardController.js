const { query } = require('../config/database');

/**
 * GET /api/dashboard/summary
 * Returns all dashboard data in a single response using parallel DB queries.
 */
const getDashboardSummary = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Run all queries in parallel
    const [
      totalResult,
      prevResult,
      dailyTrend,
      byService,
      byRegion,
      byResourceGroup,
      bySubscription,
      monthComparison,
      alertStats,
      topRecommendations,
      historyForForecast,
      budgets,
      topResources,
      recentAlerts,
      resourceTypes,
      recSummary,
    ] = await Promise.all([
      // 1. Total cost for period
      query(
        `SELECT COALESCE(SUM(cost), 0) as total_cost, COUNT(DISTINCT resource_id) as resource_count
         FROM cost_records WHERE date >= CURRENT_DATE - $1::integer`,
        [days]
      ),

      // 2. Previous period for comparison
      query(
        `SELECT COALESCE(SUM(cost), 0) as total_cost
         FROM cost_records WHERE date >= CURRENT_DATE - ($1::integer * 2) AND date < CURRENT_DATE - $1::integer`,
        [days]
      ),

      // 3. Daily cost trend
      query(
        `SELECT date, SUM(cost) as daily_cost
         FROM cost_records WHERE date >= CURRENT_DATE - $1::integer
         GROUP BY date ORDER BY date`,
        [days]
      ),

      // 4. Cost by service (top 10)
      query(
        `SELECT service_name, SUM(cost) as total_cost, COUNT(*) as record_count
         FROM cost_records WHERE date >= CURRENT_DATE - $1::integer
         GROUP BY service_name ORDER BY total_cost DESC LIMIT 10`,
        [days]
      ),

      // 5. Cost by region
      query(
        `SELECT region, SUM(cost) as total_cost
         FROM cost_records WHERE date >= CURRENT_DATE - $1::integer
         GROUP BY region ORDER BY total_cost DESC`,
        [days]
      ),

      // 6. Cost by resource group (top 10)
      query(
        `SELECT rg.name as resource_group, SUM(cr.cost) as total_cost
         FROM cost_records cr
         JOIN resources r ON cr.resource_id = r.id
         LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
         WHERE cr.date >= CURRENT_DATE - $1::integer
         GROUP BY rg.name ORDER BY total_cost DESC LIMIT 10`,
        [days]
      ),

      // 7. Cost by subscription
      query(
        `SELECT s.subscription_id, s.display_name, COALESCE(SUM(cr.cost), 0) as total_cost
         FROM subscriptions s
         LEFT JOIN cost_records cr ON s.id = cr.subscription_id AND cr.date >= CURRENT_DATE - $1::integer
         GROUP BY s.id, s.subscription_id, s.display_name
         ORDER BY total_cost DESC`,
        [days]
      ),

      // 8. Month-over-month comparison (last 6 months)
      query(
        `SELECT
           TO_CHAR(date, 'YYYY-MM') as month,
           SUM(cost) as total_cost,
           COUNT(DISTINCT resource_id) as resource_count
         FROM cost_records
         WHERE date >= CURRENT_DATE - 180
         GROUP BY TO_CHAR(date, 'YYYY-MM')
         ORDER BY month DESC LIMIT 6`
      ),

      // 9. Alert statistics
      query(
        `SELECT
           COUNT(*) FILTER (WHERE is_resolved = false) as active,
           COUNT(*) FILTER (WHERE severity = 'critical' AND is_resolved = false) as critical,
           COUNT(*) FILTER (WHERE severity = 'high' AND is_resolved = false) as high,
           COUNT(*) FILTER (WHERE severity = 'medium' AND is_resolved = false) as medium,
           COUNT(*) FILTER (WHERE severity = 'low' AND is_resolved = false) as low,
           COUNT(*) as total
         FROM alerts`
      ),

      // 10. Top 5 recommendations with savings
      query(
        `SELECT rec.id, rec.title, rec.description, rec.category, rec.impact,
                rec.estimated_savings, rec.status, r.name as resource_name, r.type as resource_type
         FROM recommendations rec
         LEFT JOIN resources r ON rec.resource_id = r.id
         WHERE rec.status = 'active'
         ORDER BY rec.estimated_savings DESC LIMIT 5`
      ),

      // 11. Historical data for forecast (90 days)
      query(
        `SELECT date, SUM(cost) as daily_cost
         FROM cost_records WHERE date >= CURRENT_DATE - 90
         GROUP BY date ORDER BY date`
      ),

      // 12. Active budgets with usage
      query(
        `SELECT b.id, b.name, b.amount, b.period, b.current_spend as spent
         FROM budgets b
         WHERE b.is_active = true
         ORDER BY b.name`
      ),

      // 13. Top 10 expensive resources
      query(
        `SELECT r.name, r.type, r.location, rg.name as resource_group,
                SUM(cr.cost) as total_cost, AVG(cr.cost) as avg_daily_cost
         FROM cost_records cr
         JOIN resources r ON cr.resource_id = r.id
         LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
         WHERE cr.date >= CURRENT_DATE - $1::integer
         GROUP BY r.id, r.name, r.type, r.location, rg.name
         ORDER BY total_cost DESC LIMIT 10`,
        [days]
      ),

      // 14. Recent 10 alerts
      query(
        `SELECT id, title, severity, type, is_resolved, is_read, created_at, message
         FROM alerts ORDER BY created_at DESC LIMIT 10`
      ),

      // 15. Resource type distribution
      query(
        `SELECT type, COUNT(*) as count
         FROM resources
         GROUP BY type ORDER BY count DESC LIMIT 12`
      ),

      // 16. Recommendation summary
      query(
        `SELECT
           COUNT(*) as total_count,
           COUNT(*) FILTER (WHERE status = 'active') as active_count,
           COALESCE(SUM(estimated_savings) FILTER (WHERE status = 'active'), 0) as total_estimated_savings,
           COUNT(DISTINCT category) as category_count
         FROM recommendations`
      ),
    ]);

    // Compute cost summary
    const currentTotal = parseFloat(totalResult.rows[0].total_cost);
    const previousTotal = parseFloat(prevResult.rows[0].total_cost);
    const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0;

    // Compute forecast using linear regression
    const historicalRows = historyForForecast.rows;
    let forecast = [];
    let forecastSummary = { total_forecasted_cost: 0, avg_daily_forecast: 0, trend: 'stable', trend_rate: 0 };

    if (historicalRows.length >= 7) {
      const costs = historicalRows.map(r => parseFloat(r.daily_cost));
      const n = costs.length;
      const xMean = (n - 1) / 2;
      const yMean = costs.reduce((a, b) => a + b, 0) / n;

      let numerator = 0, denominator = 0;
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (costs[i] - yMean);
        denominator += (i - xMean) * (i - xMean);
      }

      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = yMean - slope * xMean;

      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const predictedCost = Math.max(0, intercept + slope * (n + i));
        const confidence = Math.max(0.5, 1 - (i * 0.01));

        forecast.push({
          date: date.toISOString().split('T')[0],
          predicted_cost: Math.round(predictedCost * 100) / 100,
          lower_bound: Math.round(predictedCost * (1 - (1 - confidence) * 2) * 100) / 100,
          upper_bound: Math.round(predictedCost * (1 + (1 - confidence) * 2) * 100) / 100,
          confidence: Math.round(confidence * 100),
        });
      }

      const totalForecast = forecast.reduce((s, f) => s + f.predicted_cost, 0);
      forecastSummary = {
        total_forecasted_cost: Math.round(totalForecast * 100) / 100,
        avg_daily_forecast: Math.round((totalForecast / 30) * 100) / 100,
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        trend_rate: Math.round(slope * 100) / 100,
      };
    }

    res.json({
      summary: {
        total_cost: currentTotal,
        previous_period_cost: previousTotal,
        change_percent: Math.round(changePercent * 100) / 100,
        resource_count: parseInt(totalResult.rows[0].resource_count),
        period_days: days,
        currency: 'USD',
      },
      daily_trend: dailyTrend.rows,
      by_service: byService.rows,
      by_region: byRegion.rows,
      by_resource_group: byResourceGroup.rows,
      by_subscription: bySubscription.rows,
      month_comparison: monthComparison.rows,
      alerts: {
        stats: alertStats.rows[0] || { active: 0, critical: 0, high: 0, medium: 0, low: 0, total: 0 },
        recent: recentAlerts.rows,
      },
      recommendations: {
        summary: recSummary.rows[0] || { total_count: 0, active_count: 0, total_estimated_savings: 0 },
        top: topRecommendations.rows,
      },
      forecast: {
        historical: historicalRows,
        predictions: forecast,
        summary: forecastSummary,
      },
      budgets: budgets.rows,
      top_resources: topResources.rows,
      resource_types: resourceTypes.rows,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getDashboardSummary };

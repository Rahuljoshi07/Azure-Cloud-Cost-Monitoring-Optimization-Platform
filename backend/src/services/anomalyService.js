/**
 * Anomaly Detection Service
 * Uses Z-score statistical analysis on cost data to detect cost spikes.
 */
const { query } = require('../config/database');

/**
 * Detect anomalies across all resources by comparing recent daily cost
 * against a rolling mean + standard deviation.
 * Returns number of anomalies inserted.
 */
async function detectAnomalies(lookbackDays = 30, zScoreThreshold = 2.0) {
  // Get average and standard deviation per resource over the lookback period
  const stats = await query(`
    SELECT resource_id, subscription_id,
           AVG(cost) as mean_cost,
           STDDEV_POP(cost) as stddev_cost,
           COUNT(*) as sample_count
    FROM cost_records
    WHERE date >= CURRENT_DATE - $1::integer
    GROUP BY resource_id, subscription_id
    HAVING COUNT(*) >= 7 AND STDDEV_POP(cost) > 0
  `, [lookbackDays]);

  let anomalyCount = 0;

  for (const stat of stats.rows) {
    const mean = parseFloat(stat.mean_cost);
    const stddev = parseFloat(stat.stddev_cost);
    if (stddev === 0) continue;

    // Check last 3 days for anomalies
    const recent = await query(`
      SELECT date, SUM(cost) as daily_cost
      FROM cost_records
      WHERE resource_id = $1 AND date >= CURRENT_DATE - 3
      GROUP BY date
    `, [stat.resource_id]);

    for (const day of recent.rows) {
      const dailyCost = parseFloat(day.daily_cost);
      const zScore = (dailyCost - mean) / stddev;

      if (zScore >= zScoreThreshold) {
        const deviation = ((dailyCost - mean) / mean) * 100;
        const severity = zScore >= 4 ? 'critical' : zScore >= 3 ? 'high' : 'medium';

        // Insert only if not already detected for this resource+date
        const existing = await query(
          `SELECT id FROM cost_anomalies WHERE resource_id = $1 AND date = $2`,
          [stat.resource_id, day.date]
        );

        if (existing.rows.length === 0) {
          await query(`
            INSERT INTO cost_anomalies (resource_id, subscription_id, date, expected_cost, actual_cost, deviation_percentage, z_score, severity)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [stat.resource_id, stat.subscription_id, day.date,
              Math.round(mean * 100) / 100, Math.round(dailyCost * 100) / 100,
              Math.round(deviation * 100) / 100, Math.round(zScore * 100) / 100, severity]);

          // Create an alert for high/critical anomalies
          if (severity === 'critical' || severity === 'high') {
            await query(`
              INSERT INTO alerts (type, severity, title, message, resource_id)
              VALUES ('anomaly', $1, $2, $3, $4)
            `, [severity,
                `Cost anomaly detected (${deviation.toFixed(0)}% spike)`,
                `Resource cost jumped from expected $${mean.toFixed(2)} to $${dailyCost.toFixed(2)} (z-score: ${zScore.toFixed(2)})`,
                stat.resource_id]);
          }

          anomalyCount++;
        }
      }
    }
  }

  return anomalyCount;
}

module.exports = { detectAnomalies };

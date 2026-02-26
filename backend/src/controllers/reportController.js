const { query } = require('../config/database');

const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    let params = [];
    let conditions = [];

    if (type) { params.push(type); conditions.push(`r.type = $${params.length}`); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await query(
      `SELECT r.*, u.full_name as generated_by_name
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       ${whereClause}
       ORDER BY r.created_at DESC LIMIT 50`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const generateReport = async (req, res) => {
  try {
    const { type, period_start, period_end } = req.body;

    // Generate different report types
    let reportData = {};
    const params = [period_start, period_end];

    if (type === 'monthly' || type === 'cost_summary') {
      const totalCost = await query(
        'SELECT COALESCE(SUM(cost), 0) as total FROM cost_records WHERE date >= $1 AND date <= $2',
        params
      );

      const byService = await query(
        `SELECT service_name, SUM(cost) as total_cost, COUNT(*) as records
         FROM cost_records WHERE date >= $1 AND date <= $2
         GROUP BY service_name ORDER BY total_cost DESC`,
        params
      );

      const byRegion = await query(
        `SELECT region, SUM(cost) as total_cost
         FROM cost_records WHERE date >= $1 AND date <= $2
         GROUP BY region ORDER BY total_cost DESC`,
        params
      );

      const dailyTrend = await query(
        `SELECT date, SUM(cost) as daily_cost
         FROM cost_records WHERE date >= $1 AND date <= $2
         GROUP BY date ORDER BY date`,
        params
      );

      reportData = {
        total_cost: parseFloat(totalCost.rows[0].total),
        by_service: byService.rows,
        by_region: byRegion.rows,
        daily_trend: dailyTrend.rows
      };
    }

    if (type === 'optimization') {
      const recs = await query(
        `SELECT category, COUNT(*) as count, COALESCE(SUM(estimated_savings), 0) as total_savings
         FROM recommendations WHERE status = 'active'
         GROUP BY category`
      );

      const topSavings = await query(
        `SELECT rec.title, rec.estimated_savings, rec.impact, r.name as resource_name
         FROM recommendations rec
         LEFT JOIN resources r ON rec.resource_id = r.id
         WHERE rec.status = 'active'
         ORDER BY rec.estimated_savings DESC LIMIT 10`
      );

      reportData = {
        recommendations_summary: recs.rows,
        top_savings_opportunities: topSavings.rows,
        total_potential_savings: recs.rows.reduce((s, r) => s + parseFloat(r.total_savings), 0)
      };
    }

    const name = `${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${period_start} to ${period_end}`;
    const result = await query(
      `INSERT INTO reports (name, type, period_start, period_end, data, generated_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, period_start, period_end, JSON.stringify(reportData), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, u.full_name as generated_by_name
       FROM reports r LEFT JOIN users u ON r.generated_by = u.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get report by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getForecast = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get historical daily costs
    const history = await query(
      `SELECT date, SUM(cost) as daily_cost
       FROM cost_records WHERE date >= CURRENT_DATE - 90
       GROUP BY date ORDER BY date`
    );

    if (history.rows.length < 7) {
      return res.json({ forecast: [], message: 'Insufficient data for forecasting' });
    }

    const costs = history.rows.map(r => parseFloat(r.daily_cost));

    // Simple linear regression for forecasting
    const n = costs.length;
    const xMean = (n - 1) / 2;
    const yMean = costs.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (costs[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Generate forecast
    const forecast = [];
    const forecastDays = parseInt(days);
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const predictedCost = Math.max(0, intercept + slope * (n + i));
      const confidence = Math.max(0.5, 1 - (i * 0.01));

      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_cost: Math.round(predictedCost * 100) / 100,
        lower_bound: Math.round(predictedCost * (1 - (1 - confidence) * 2) * 100) / 100,
        upper_bound: Math.round(predictedCost * (1 + (1 - confidence) * 2) * 100) / 100,
        confidence: Math.round(confidence * 100)
      });
    }

    const totalForecast = forecast.reduce((s, f) => s + f.predicted_cost, 0);

    res.json({
      historical: history.rows,
      forecast,
      summary: {
        total_forecasted_cost: Math.round(totalForecast * 100) / 100,
        avg_daily_forecast: Math.round((totalForecast / forecastDays) * 100) / 100,
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
        trend_rate: Math.round(slope * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getReports, generateReport, getReportById, getForecast };

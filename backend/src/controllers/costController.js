const { query } = require('../config/database');

const getCostOverview = async (req, res) => {
  try {
    const { period = '30', subscription_id } = req.query;
    let params = [parseInt(period)];
    let subFilter = '';

    if (subscription_id) {
      subFilter = ' AND cr.subscription_id = $2';
      params.push(subscription_id);
    }

    // Total cost for the period
    const totalResult = await query(
      `SELECT COALESCE(SUM(cost), 0) as total_cost, COUNT(DISTINCT resource_id) as resource_count
       FROM cost_records cr WHERE date >= CURRENT_DATE - $1::integer${subFilter}`,
      params
    );

    // Previous period for comparison
    const prevResult = await query(
      `SELECT COALESCE(SUM(cost), 0) as total_cost
       FROM cost_records cr WHERE date >= CURRENT_DATE - ($1::integer * 2) AND date < CURRENT_DATE - $1::integer${subFilter}`,
      params
    );

    const currentTotal = parseFloat(totalResult.rows[0].total_cost);
    const previousTotal = parseFloat(prevResult.rows[0].total_cost);
    const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0;

    // Daily cost trend
    const dailyTrend = await query(
      `SELECT date, SUM(cost) as daily_cost
       FROM cost_records cr WHERE date >= CURRENT_DATE - $1::integer${subFilter}
       GROUP BY date ORDER BY date`,
      params
    );

    // Cost by service
    const byService = await query(
      `SELECT service_name, SUM(cost) as total_cost, COUNT(*) as record_count
       FROM cost_records cr WHERE date >= CURRENT_DATE - $1::integer${subFilter}
       GROUP BY service_name ORDER BY total_cost DESC LIMIT 10`,
      params
    );

    // Cost by region
    const byRegion = await query(
      `SELECT region, SUM(cost) as total_cost
       FROM cost_records cr WHERE date >= CURRENT_DATE - $1::integer${subFilter}
       GROUP BY region ORDER BY total_cost DESC`,
      params
    );

    // Cost by resource group
    const byResourceGroup = await query(
      `SELECT rg.name as resource_group, SUM(cr.cost) as total_cost
       FROM cost_records cr
       JOIN resources r ON cr.resource_id = r.id
       JOIN resource_groups rg ON r.resource_group_id = rg.id
       WHERE cr.date >= CURRENT_DATE - $1::integer${subFilter}
       GROUP BY rg.name ORDER BY total_cost DESC LIMIT 10`,
      params
    );

    res.json({
      summary: {
        total_cost: currentTotal,
        previous_period_cost: previousTotal,
        change_percent: Math.round(changePercent * 100) / 100,
        resource_count: parseInt(totalResult.rows[0].resource_count),
        period_days: parseInt(period),
        currency: 'USD'
      },
      daily_trend: dailyTrend.rows,
      by_service: byService.rows,
      by_region: byRegion.rows,
      by_resource_group: byResourceGroup.rows
    });
  } catch (error) {
    console.error('Get cost overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCostBySubscription = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const result = await query(
      `SELECT s.subscription_id, s.display_name, COALESCE(SUM(cr.cost), 0) as total_cost
       FROM subscriptions s
       LEFT JOIN cost_records cr ON s.id = cr.subscription_id AND cr.date >= CURRENT_DATE - $1::integer
       GROUP BY s.id, s.subscription_id, s.display_name
       ORDER BY total_cost DESC`,
      [parseInt(period)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get cost by subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTopExpensiveResources = async (req, res) => {
  try {
    const { period = '30', limit = '10' } = req.query;
    const result = await query(
      `SELECT r.name, r.type, r.location, rg.name as resource_group,
              SUM(cr.cost) as total_cost, AVG(cr.cost) as avg_daily_cost
       FROM cost_records cr
       JOIN resources r ON cr.resource_id = r.id
       LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
       WHERE cr.date >= CURRENT_DATE - $1::integer
       GROUP BY r.id, r.name, r.type, r.location, rg.name
       ORDER BY total_cost DESC
       LIMIT $2`,
      [parseInt(period), parseInt(limit)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get top expensive resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCostByTags = async (req, res) => {
  try {
    const { period = '30', tag_key = 'environment' } = req.query;
    const result = await query(
      `SELECT cr.tags->>$2 as tag_value, SUM(cr.cost) as total_cost
       FROM cost_records cr
       WHERE cr.date >= CURRENT_DATE - $1::integer AND cr.tags->>$2 IS NOT NULL
       GROUP BY cr.tags->>$2
       ORDER BY total_cost DESC`,
      [parseInt(period), tag_key]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get cost by tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDailyCosts = async (req, res) => {
  try {
    const { start_date, end_date, subscription_id } = req.query;
    let params = [];
    let conditions = [];

    if (start_date) {
      params.push(start_date);
      conditions.push(`date >= $${params.length}`);
    }
    if (end_date) {
      params.push(end_date);
      conditions.push(`date <= $${params.length}`);
    }
    if (subscription_id) {
      params.push(subscription_id);
      conditions.push(`subscription_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await query(
      `SELECT date, SUM(cost) as total_cost, COUNT(DISTINCT resource_id) as resources
       FROM cost_records ${whereClause}
       GROUP BY date ORDER BY date`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get daily costs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getCostOverview, getCostBySubscription, getTopExpensiveResources, getCostByTags, getDailyCosts };

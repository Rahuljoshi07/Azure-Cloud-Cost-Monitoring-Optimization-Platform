const { query } = require('../config/database');

const getResources = async (req, res) => {
  try {
    const { type, status, resource_group, subscription_id, page = 1, limit = 20 } = req.query;
    let params = [];
    let conditions = [];

    if (type) { params.push(type); conditions.push(`r.type = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`r.status = $${params.length}`); }
    if (resource_group) { params.push(resource_group); conditions.push(`rg.name = $${params.length}`); }
    if (subscription_id) { params.push(subscription_id); conditions.push(`r.subscription_id = $${params.length}`); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    params.push(parseInt(limit));
    params.push(offset);

    const result = await query(
      `SELECT r.*, rg.name as resource_group_name, s.display_name as subscription_name,
              (SELECT COALESCE(SUM(cost), 0) FROM cost_records WHERE resource_id = r.id AND date >= CURRENT_DATE - 30) as monthly_cost
       FROM resources r
       LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
       LEFT JOIN subscriptions s ON r.subscription_id = s.id
       ${whereClause}
       ORDER BY monthly_cost DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM resources r LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      resources: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT r.*, rg.name as resource_group_name, s.display_name as subscription_name
       FROM resources r
       LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
       LEFT JOIN subscriptions s ON r.subscription_id = s.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Get cost history
    const costHistory = await query(
      `SELECT date, cost FROM cost_records WHERE resource_id = $1 ORDER BY date DESC LIMIT 30`,
      [id]
    );

    // Get usage metrics
    const metrics = await query(
      `SELECT metric_name, metric_value, unit, timestamp
       FROM usage_metrics WHERE resource_id = $1
       ORDER BY timestamp DESC LIMIT 100`,
      [id]
    );

    res.json({
      ...result.rows[0],
      cost_history: costHistory.rows,
      usage_metrics: metrics.rows
    });
  } catch (error) {
    console.error('Get resource by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getResourceTypes = async (req, res) => {
  try {
    const result = await query(
      `SELECT type, COUNT(*) as count, SUM(
        (SELECT COALESCE(SUM(cost), 0) FROM cost_records WHERE resource_id = r.id AND date >= CURRENT_DATE - 30)
       ) as total_monthly_cost
       FROM resources r
       GROUP BY type ORDER BY total_monthly_cost DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get resource types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getResources, getResourceById, getResourceTypes };

const { query } = require('../config/database');

const getRecommendations = async (req, res) => {
  try {
    const { category, impact, status = 'active' } = req.query;
    let params = [];
    let conditions = [];

    if (category) { params.push(category); conditions.push(`rec.category = $${params.length}`); }
    if (impact) { params.push(impact); conditions.push(`rec.impact = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`rec.status = $${params.length}`); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await query(
      `SELECT rec.*, r.name as resource_name, r.type as resource_type, r.location as resource_location,
              rg.name as resource_group_name
       FROM recommendations rec
       LEFT JOIN resources r ON rec.resource_id = r.id
       LEFT JOIN resource_groups rg ON r.resource_group_id = rg.id
       ${whereClause}
       ORDER BY rec.estimated_savings DESC NULLS LAST`,
      params
    );

    const totalSavings = result.rows.reduce((sum, r) => sum + parseFloat(r.estimated_savings || 0), 0);

    res.json({
      recommendations: result.rows,
      summary: {
        total_count: result.rows.length,
        total_estimated_savings: Math.round(totalSavings * 100) / 100,
        by_impact: {
          high: result.rows.filter(r => r.impact === 'high').length,
          medium: result.rows.filter(r => r.impact === 'medium').length,
          low: result.rows.filter(r => r.impact === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'dismissed', 'implemented'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE recommendations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRecommendationSummary = async (req, res) => {
  try {
    const result = await query(
      `SELECT
        category,
        COUNT(*) as count,
        COALESCE(SUM(estimated_savings), 0) as total_savings,
        COUNT(*) FILTER (WHERE impact = 'high') as high_impact,
        COUNT(*) FILTER (WHERE impact = 'medium') as medium_impact,
        COUNT(*) FILTER (WHERE impact = 'low') as low_impact
       FROM recommendations
       WHERE status = 'active'
       GROUP BY category
       ORDER BY total_savings DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get recommendation summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getRecommendations, updateRecommendationStatus, getRecommendationSummary };

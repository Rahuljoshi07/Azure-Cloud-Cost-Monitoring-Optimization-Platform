const { query } = require('../config/database');

const getAnomalies = async (req, res) => {
  try {
    const { period = '30', severity, is_resolved } = req.query;
    let params = [parseInt(period)];
    let conditions = ['ca.date >= CURRENT_DATE - $1::integer'];

    if (severity) { params.push(severity); conditions.push(`ca.severity = $${params.length}`); }
    if (is_resolved !== undefined) { params.push(is_resolved === 'true'); conditions.push(`ca.is_resolved = $${params.length}`); }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const result = await query(
      `SELECT ca.*, r.name as resource_name, r.type as resource_type,
              s.display_name as subscription_name
       FROM cost_anomalies ca
       LEFT JOIN resources r ON ca.resource_id = r.id
       LEFT JOIN subscriptions s ON ca.subscription_id = s.id
       ${whereClause}
       ORDER BY ca.date DESC, ca.deviation_percentage DESC`,
      params
    );

    res.json({
      anomalies: result.rows,
      summary: {
        total: result.rows.length,
        unresolved: result.rows.filter(a => !a.is_resolved).length,
        by_severity: {
          critical: result.rows.filter(a => a.severity === 'critical').length,
          high: result.rows.filter(a => a.severity === 'high').length,
          medium: result.rows.filter(a => a.severity === 'medium').length,
          low: result.rows.filter(a => a.severity === 'low').length
        }
      }
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resolveAnomaly = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE cost_anomalies SET is_resolved = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Resolve anomaly error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAnomalies, resolveAnomaly };

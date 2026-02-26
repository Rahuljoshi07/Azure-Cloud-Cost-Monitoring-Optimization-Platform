const { query } = require('../config/database');

const getAlerts = async (req, res) => {
  try {
    const { type, severity, is_read, page = 1, limit = 20 } = req.query;
    let params = [];
    let conditions = [];

    if (type) { params.push(type); conditions.push(`a.type = $${params.length}`); }
    if (severity) { params.push(severity); conditions.push(`a.severity = $${params.length}`); }
    if (is_read !== undefined) { params.push(is_read === 'true'); conditions.push(`a.is_read = $${params.length}`); }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    params.push(parseInt(limit));
    params.push(offset);

    const result = await query(
      `SELECT a.*, r.name as resource_name, r.type as resource_type
       FROM alerts a
       LEFT JOIN resources r ON a.resource_id = r.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM alerts a ${whereClause}`,
      params.slice(0, -2)
    );

    const unreadCount = await query(
      `SELECT COUNT(*) FROM alerts WHERE is_read = false`
    );

    res.json({
      alerts: result.rows,
      unread_count: parseInt(unreadCount.rows[0].count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAlertRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE alerts SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const markAllAlertsRead = async (req, res) => {
  try {
    await query('UPDATE alerts SET is_read = true WHERE is_read = false');
    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE alerts SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAlertStats = async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND is_resolved = false) as critical,
        COUNT(*) FILTER (WHERE severity = 'high' AND is_resolved = false) as high,
        COUNT(*) FILTER (WHERE severity = 'medium' AND is_resolved = false) as medium,
        COUNT(*) FILTER (WHERE severity = 'low' AND is_resolved = false) as low,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_resolved = false) as active
       FROM alerts`
    );
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAlerts, markAlertRead, markAllAlertsRead, resolveAlert, getAlertStats };

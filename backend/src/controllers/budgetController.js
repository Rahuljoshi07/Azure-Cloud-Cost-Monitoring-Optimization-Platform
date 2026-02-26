const { query } = require('../config/database');

const getBudgets = async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, s.display_name as subscription_name, rg.name as resource_group_name,
              u.full_name as created_by_name,
              ROUND((b.current_spend / NULLIF(b.amount, 0) * 100)::numeric, 1) as usage_percent
       FROM budgets b
       LEFT JOIN subscriptions s ON b.subscription_id = s.id
       LEFT JOIN resource_groups rg ON b.resource_group_id = rg.id
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.is_active = true
       ORDER BY usage_percent DESC NULLS LAST`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createBudget = async (req, res) => {
  try {
    const { name, amount, period, subscription_id, resource_group_id, alert_thresholds } = req.body;
    const result = await query(
      `INSERT INTO budgets (name, amount, period, subscription_id, resource_group_id, alert_thresholds, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, amount, period, subscription_id || null, resource_group_id || null,
       JSON.stringify(alert_thresholds || [50, 75, 90, 100]), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, period, alert_thresholds, is_active } = req.body;
    const result = await query(
      `UPDATE budgets SET
        name = COALESCE($1, name),
        amount = COALESCE($2, amount),
        period = COALESCE($3, period),
        alert_thresholds = COALESCE($4, alert_thresholds),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, amount, period, alert_thresholds ? JSON.stringify(alert_thresholds) : null, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE budgets SET is_active = false WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    res.json({ message: 'Budget deactivated' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };

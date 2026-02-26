/**
 * Notification Service
 * Sends alerts via email (Nodemailer) and/or Slack webhook.
 * Also checks budget thresholds and creates alerts.
 */
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

// ─── Email ───────────────────────────────────────────────────────────────────

let _transporter = null;

function getMailTransporter() {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  if (!host || !user) return null;

  _transporter = nodemailer.createTransport({
    host, port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getMailTransporter();
  if (!transport) {
    console.log('[Notification] SMTP not configured — skipping email');
    return false;
  }
  try {
    await transport.sendMail({
      from: `"AzureCost Monitor" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
    console.log(`[Notification] Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[Notification] Email failed:', err.message);
    return false;
  }
}

// ─── Slack ───────────────────────────────────────────────────────────────────

async function sendSlack(text, blocks) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log('[Notification] Slack webhook not configured — skipping');
    return false;
  }
  try {
    const body = blocks ? { blocks } : { text };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[Notification] Slack webhook: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error('[Notification] Slack failed:', err.message);
    return false;
  }
}

// ─── Alert helper ────────────────────────────────────────────────────────────

async function sendAlert(type, severity, title, message, resourceId = null) {
  // Store in DB
  await query(
    `INSERT INTO alerts (type, severity, title, message, resource_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [type, severity, title, message, resourceId]
  );

  // Notify
  if (severity === 'critical' || severity === 'high') {
    await sendSlack(`*[${severity.toUpperCase()}]* ${title}\n${message}`);

    // Email admins
    const admins = await query("SELECT email FROM users WHERE role = 'admin' AND is_active = true");
    for (const admin of admins.rows) {
      await sendEmail(admin.email, `[${severity.toUpperCase()}] ${title}`,
        `<h3>${title}</h3><p>${message}</p><p style="color:#888">— AzureCost Monitor</p>`);
    }
  }
}

// ─── Budget checks ───────────────────────────────────────────────────────────

async function checkBudgetAlerts() {
  console.log('[Notification] Checking budget thresholds...');
  const budgets = await query(`
    SELECT b.*, s.display_name as subscription_name
    FROM budgets b
    LEFT JOIN subscriptions s ON b.subscription_id = s.id
    WHERE b.is_active = true
  `);

  let alertsCreated = 0;

  for (const budget of budgets.rows) {
    const pct = budget.amount > 0 ? (parseFloat(budget.current_spend) / parseFloat(budget.amount)) * 100 : 0;
    const thresholds = (typeof budget.alert_thresholds === 'string'
      ? JSON.parse(budget.alert_thresholds)
      : budget.alert_thresholds) || [50, 75, 90, 100];

    for (const threshold of thresholds.sort((a, b) => b - a)) {
      if (pct >= threshold) {
        // Check if we already alerted for this budget + threshold today
        const existing = await query(`
          SELECT id FROM alerts
          WHERE type = 'budget' AND budget_id = $1
            AND metadata->>'threshold' = $2
            AND created_at >= CURRENT_DATE
        `, [budget.id, String(threshold)]);

        if (existing.rows.length === 0) {
          const severity = threshold >= 100 ? 'critical' : threshold >= 90 ? 'high' : threshold >= 75 ? 'medium' : 'low';
          const title = `Budget "${budget.name}" reached ${Math.round(pct)}%`;
          const message = `Spent $${parseFloat(budget.current_spend).toLocaleString()} of $${parseFloat(budget.amount).toLocaleString()} ${budget.period} budget${budget.subscription_name ? ` (${budget.subscription_name})` : ''}.`;

          await query(
            `INSERT INTO alerts (type, severity, title, message, budget_id, metadata)
             VALUES ('budget', $1, $2, $3, $4, $5)`,
            [severity, title, message, budget.id, JSON.stringify({ threshold })]
          );
          alertsCreated++;

          // Only alert for the highest crossed threshold
          break;
        }
        break;
      }
    }
  }

  console.log(`[Notification]   -> ${alertsCreated} budget alerts created`);
  return { alertsCreated };
}

module.exports = { sendEmail, sendSlack, sendAlert, checkBudgetAlerts };

/**
 * Standalone sync runner.
 * Run:  node src/services/syncRunner.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { runFullSync } = require('./dataSyncService');
const { pool } = require('../config/database');

(async () => {
  try {
    const report = await runFullSync();
    console.log('\nSync report:', JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Sync runner failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

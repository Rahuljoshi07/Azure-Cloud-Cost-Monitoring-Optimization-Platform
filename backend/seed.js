require('dotenv').config();
const { pool, query } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const AZURE_REGIONS = ['eastus', 'westus2', 'westeurope', 'southeastasia', 'centralindia', 'japaneast', 'australiaeast', 'uksouth'];
const ENVIRONMENTS = ['production', 'staging', 'development', 'testing'];
const DEPARTMENTS = ['engineering', 'data-science', 'marketing', 'finance', 'operations'];

const SERVICE_COSTS = {
  'Virtual Machines': { min: 5, max: 85 },
  'Azure SQL Database': { min: 3, max: 45 },
  'Storage Accounts': { min: 0.5, max: 15 },
  'App Service': { min: 2, max: 35 },
  'Azure Kubernetes Service': { min: 10, max: 120 },
  'Cosmos DB': { min: 5, max: 60 },
  'Azure Functions': { min: 0.1, max: 8 },
  'Load Balancer': { min: 1, max: 12 },
  'Virtual Network': { min: 0.5, max: 5 },
  'Azure Monitor': { min: 1, max: 10 },
  'Key Vault': { min: 0.1, max: 2 },
  'Redis Cache': { min: 3, max: 30 },
  'Container Registry': { min: 1, max: 8 },
  'CDN': { min: 0.5, max: 15 },
  'API Management': { min: 5, max: 40 }
};

const RESOURCE_TYPES = {
  'Virtual Machines': 'Microsoft.Compute/virtualMachines',
  'Azure SQL Database': 'Microsoft.Sql/servers/databases',
  'Storage Accounts': 'Microsoft.Storage/storageAccounts',
  'App Service': 'Microsoft.Web/sites',
  'Azure Kubernetes Service': 'Microsoft.ContainerService/managedClusters',
  'Cosmos DB': 'Microsoft.DocumentDB/databaseAccounts',
  'Azure Functions': 'Microsoft.Web/sites',
  'Load Balancer': 'Microsoft.Network/loadBalancers',
  'Virtual Network': 'Microsoft.Network/virtualNetworks',
  'Azure Monitor': 'Microsoft.Insights/components',
  'Key Vault': 'Microsoft.KeyVault/vaults',
  'Redis Cache': 'Microsoft.Cache/Redis',
  'Container Registry': 'Microsoft.ContainerRegistry/registries',
  'CDN': 'Microsoft.Cdn/profiles',
  'API Management': 'Microsoft.ApiManagement/service'
};

const VM_SKUS = ['Standard_B2s', 'Standard_D4s_v3', 'Standard_D8s_v3', 'Standard_E4s_v3', 'Standard_F4s_v2', 'Standard_DS2_v2', 'Standard_B4ms'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateResourceName(service, env, index) {
  const prefixes = {
    'Virtual Machines': 'vm',
    'Azure SQL Database': 'sqldb',
    'Storage Accounts': 'stg',
    'App Service': 'app',
    'Azure Kubernetes Service': 'aks',
    'Cosmos DB': 'cosmos',
    'Azure Functions': 'func',
    'Load Balancer': 'lb',
    'Virtual Network': 'vnet',
    'Azure Monitor': 'monitor',
    'Key Vault': 'kv',
    'Redis Cache': 'redis',
    'Container Registry': 'acr',
    'CDN': 'cdn',
    'API Management': 'apim'
  };
  return `${prefixes[service]}-${env}-${String(index).padStart(3, '0')}`;
}

async function seed() {
  console.log('\n  Seeding Azure Cost Monitor database...\n');

  try {
    // Initialize schema
    const sqlFile = path.join(__dirname, 'src', 'config', 'init-db.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await query(sql);
    console.log('  [OK] Schema initialized');

    // Clear existing data
    await query('DELETE FROM cost_anomalies');
    await query('DELETE FROM usage_metrics');
    await query('DELETE FROM reports');
    await query('DELETE FROM recommendations');
    await query('DELETE FROM alerts');
    await query('DELETE FROM budgets');
    await query('DELETE FROM cost_records');
    await query('DELETE FROM resources');
    await query('DELETE FROM resource_groups');
    await query('DELETE FROM subscriptions');
    await query('DELETE FROM users');
    console.log('  [OK] Existing data cleared');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 12);
    const users = [
      { email: 'admin@azureflow.com', name: 'Rajesh Kumar', role: 'admin' },
      { email: 'editor@azureflow.com', name: 'Priya Sharma', role: 'editor' },
      { email: 'viewer@azureflow.com', name: 'Amit Patel', role: 'viewer' },
      { email: 'demo@azureflow.com', name: 'Demo User', role: 'admin' }
    ];

    const userIds = [];
    for (const user of users) {
      const res = await query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.email, passwordHash, user.name, user.role]
      );
      userIds.push(res.rows[0].id);
    }
    console.log(`  [OK] Created ${users.length} users`);

    // Create subscriptions
    const subscriptions = [
      { id: 'sub-prod-001', name: 'Production Subscription' },
      { id: 'sub-dev-002', name: 'Development Subscription' },
      { id: 'sub-staging-003', name: 'Staging Subscription' }
    ];

    const subIds = [];
    for (const sub of subscriptions) {
      const res = await query(
        'INSERT INTO subscriptions (subscription_id, display_name, monthly_budget) VALUES ($1, $2, $3) RETURNING id',
        [sub.id, sub.name, sub.name.includes('Production') ? 15000 : sub.name.includes('Staging') ? 5000 : 3000]
      );
      subIds.push(res.rows[0].id);
    }
    console.log(`  [OK] Created ${subscriptions.length} subscriptions`);

    // Create resource groups
    const rgNames = [
      'rg-webapp-prod', 'rg-database-prod', 'rg-networking-prod', 'rg-monitoring-prod',
      'rg-webapp-dev', 'rg-database-dev', 'rg-kubernetes-prod', 'rg-storage-prod',
      'rg-analytics-prod', 'rg-webapp-staging'
    ];

    const rgIds = [];
    for (const rgName of rgNames) {
      const subIndex = rgName.includes('dev') ? 1 : rgName.includes('staging') ? 2 : 0;
      const res = await query(
        'INSERT INTO resource_groups (name, subscription_id, location, tags) VALUES ($1, $2, $3, $4) RETURNING id',
        [rgName, subIds[subIndex], randomElement(AZURE_REGIONS),
         JSON.stringify({ environment: rgName.includes('prod') ? 'production' : rgName.includes('staging') ? 'staging' : 'development',
                         department: randomElement(DEPARTMENTS) })]
      );
      rgIds.push(res.rows[0].id);
    }
    console.log(`  [OK] Created ${rgNames.length} resource groups`);

    // Create resources
    const resourceIds = [];
    const resourceServiceMap = [];
    let resourceCounter = 1;

    for (const [service, type] of Object.entries(RESOURCE_TYPES)) {
      const count = service === 'Virtual Machines' ? 12 : service === 'Storage Accounts' ? 8 : service === 'Azure Functions' ? 6 : Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < count; i++) {
        const env = randomElement(ENVIRONMENTS);
        const name = generateResourceName(service, env, resourceCounter++);
        const region = randomElement(AZURE_REGIONS);
        const rgIndex = Math.floor(Math.random() * rgIds.length);
        const subIndex = env === 'production' ? 0 : env === 'development' ? 1 : 2;
        const status = Math.random() > 0.15 ? 'running' : Math.random() > 0.5 ? 'stopped' : 'deallocated';

        const tags = {
          environment: env,
          department: randomElement(DEPARTMENTS),
          project: randomElement(['web-platform', 'data-pipeline', 'mobile-api', 'analytics', 'infra']),
          owner: randomElement(['team-backend', 'team-frontend', 'team-devops', 'team-data'])
        };

        const properties = {};
        if (service === 'Virtual Machines') {
          properties.vmSize = randomElement(VM_SKUS);
          properties.osType = Math.random() > 0.3 ? 'Linux' : 'Windows';
        }

        const res = await query(
          `INSERT INTO resources (resource_id, name, type, location, resource_group_id, subscription_id, sku, status, tags, properties)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [`/subscriptions/${subscriptions[subIndex].id}/resourceGroups/${rgNames[rgIndex]}/${type}/${name}`,
           name, type, region, rgIds[rgIndex], subIds[subIndex],
           service === 'Virtual Machines' ? properties.vmSize : null,
           status, JSON.stringify(tags), JSON.stringify(properties)]
        );
        resourceIds.push(res.rows[0].id);
        resourceServiceMap.push({ id: res.rows[0].id, service, region, subId: subIds[subIndex], tags });
      }
    }
    console.log(`  [OK] Created ${resourceIds.length} resources`);

    // Generate 90 days of cost records
    console.log('  [..] Generating cost records (90 days)...');
    const today = new Date();
    let totalRecords = 0;

    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const monthProgress = date.getDate() / 30;

      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const resource of resourceServiceMap) {
        const costRange = SERVICE_COSTS[resource.service] || { min: 1, max: 20 };
        let baseCost = randomBetween(costRange.min, costRange.max);

        // Add realistic patterns
        if (isWeekend) baseCost *= 0.7; // Lower on weekends
        baseCost *= (1 + Math.sin(monthProgress * Math.PI) * 0.15); // Monthly wave
        baseCost *= (1 + (90 - dayOffset) * 0.001); // Gradual increase over time

        // Add some random spikes for anomaly detection
        if (Math.random() < 0.02) baseCost *= randomBetween(2.5, 5);

        const cost = Math.round(baseCost * 10000) / 10000;

        values.push(resource.id, resource.subId, dateStr, cost, resource.service,
                     resource.service, resource.region, JSON.stringify(resource.tags));
        placeholders.push(
          `($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, 'USD', $${paramIndex+4}, $${paramIndex+5}, NULL, $${paramIndex+6}, $${paramIndex+7})`
        );
        paramIndex += 8;
        totalRecords++;
      }

      if (placeholders.length > 0) {
        await query(
          `INSERT INTO cost_records (resource_id, subscription_id, date, cost, currency, service_name, meter_category, meter_subcategory, region, tags)
           VALUES ${placeholders.join(',')}`,
          values
        );
      }
    }
    console.log(`  [OK] Created ${totalRecords} cost records`);

    // Generate usage metrics
    console.log('  [..] Generating usage metrics...');
    let metricCount = 0;
    for (const resource of resourceServiceMap) {
      if (resource.service !== 'Virtual Machines') continue;
      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);

        const cpuUsage = randomBetween(5, 85);
        const memoryUsage = randomBetween(20, 90);

        await query(
          `INSERT INTO usage_metrics (resource_id, metric_name, metric_value, unit, timestamp) VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $8, $5)`,
          [resource.id, 'cpu_utilization', cpuUsage, 'percent', date.toISOString(),
           'memory_utilization', memoryUsage, 'percent']
        );
        metricCount += 2;
      }
    }
    console.log(`  [OK] Created ${metricCount} usage metrics`);

    // Generate recommendations
    const recommendations = [];
    for (const resource of resourceServiceMap) {
      if (resource.service === 'Virtual Machines' && Math.random() < 0.4) {
        const cpuCheck = await query(
          `SELECT AVG(metric_value) as avg_cpu FROM usage_metrics WHERE resource_id = $1 AND metric_name = 'cpu_utilization'`,
          [resource.id]
        );
        const avgCpu = cpuCheck.rows[0]?.avg_cpu || 50;

        if (avgCpu < 30) {
          recommendations.push({
            resource_id: resource.id, type: 'right-size', category: 'cost', impact: avgCpu < 15 ? 'high' : 'medium',
            title: `Resize underutilized VM`, description: `Average CPU usage is ${Math.round(avgCpu)}%. Consider downsizing to save costs.`,
            estimated_savings: randomBetween(50, 300), current_value: 'Standard_D4s_v3', recommended_value: 'Standard_B2s', action: 'resize'
          });
        }
      }
      if (resource.service === 'Virtual Machines' && Math.random() < 0.15) {
        recommendations.push({
          resource_id: resource.id, type: 'idle-resource', category: 'cost', impact: 'high',
          title: `Stop idle Virtual Machine`, description: `This VM has been running with minimal activity. Consider stopping it during off-hours.`,
          estimated_savings: randomBetween(100, 500), current_value: 'Running 24/7', recommended_value: 'Run 12h/day', action: 'stop'
        });
      }
      if (resource.service === 'Storage Accounts' && Math.random() < 0.3) {
        recommendations.push({
          resource_id: resource.id, type: 'unattached-disk', category: 'cost', impact: 'medium',
          title: `Delete unattached storage`, description: `This storage account has unattached disks consuming costs.`,
          estimated_savings: randomBetween(20, 100), current_value: 'Premium SSD', recommended_value: 'Delete or move to Cool tier', action: 'delete'
        });
      }
      if (resource.service === 'Azure SQL Database' && Math.random() < 0.2) {
        recommendations.push({
          resource_id: resource.id, type: 'over-provisioned', category: 'cost', impact: 'high',
          title: `Right-size SQL Database`, description: `Database DTU utilization is consistently low. Consider moving to a lower tier.`,
          estimated_savings: randomBetween(80, 400), current_value: 'S3 (100 DTUs)', recommended_value: 'S1 (20 DTUs)', action: 'resize'
        });
      }
    }

    for (const rec of recommendations) {
      await query(
        `INSERT INTO recommendations (resource_id, type, category, impact, title, description, estimated_savings, current_value, recommended_value, action)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [rec.resource_id, rec.type, rec.category, rec.impact, rec.title, rec.description,
         rec.estimated_savings, rec.current_value, rec.recommended_value, rec.action]
      );
    }
    console.log(`  [OK] Created ${recommendations.length} recommendations`);

    // Generate alerts
    const alertTemplates = [
      { type: 'budget', severity: 'critical', title: 'Production budget exceeded 90%', message: 'The Production Subscription has used 92% of its monthly budget ($15,000).' },
      { type: 'budget', severity: 'high', title: 'Development budget at 75%', message: 'Development Subscription spending has reached 75% of the budgeted amount.' },
      { type: 'anomaly', severity: 'critical', title: 'Cost spike detected on AKS cluster', message: 'Azure Kubernetes Service costs increased by 340% compared to the 7-day average.' },
      { type: 'anomaly', severity: 'high', title: 'Unusual storage costs in East US', message: 'Storage Account costs in East US region spiked 180% above normal levels.' },
      { type: 'recommendation', severity: 'medium', title: 'New optimization found', message: '5 new cost optimization recommendations identified with potential savings of $1,200/month.' },
      { type: 'anomaly', severity: 'medium', title: 'SQL Database cost increase', message: 'Azure SQL Database spending increased 45% over the past week.' },
      { type: 'budget', severity: 'high', title: 'Staging budget threshold reached', message: 'Staging Subscription has reached 80% of its $5,000 monthly budget.' },
      { type: 'system', severity: 'low', title: 'Cost data sync completed', message: 'Successfully synced cost data from Azure Cost Management API for all subscriptions.' },
      { type: 'anomaly', severity: 'high', title: 'VM costs doubled overnight', message: 'Virtual Machine costs in West Europe increased by 200% in the last 24 hours.' },
      { type: 'recommendation', severity: 'low', title: 'Reserved Instance opportunity', message: 'Consider purchasing Reserved Instances for 8 VMs to save up to 40% on compute costs.' },
      { type: 'budget', severity: 'medium', title: 'Monthly cost projection exceeds budget', message: 'Based on current spending rate, projected month-end cost will exceed budget by 15%.' },
      { type: 'anomaly', severity: 'critical', title: 'Data transfer cost anomaly', message: 'Outbound data transfer costs increased 500% - possible data exfiltration or misconfigured service.' }
    ];

    for (let i = 0; i < alertTemplates.length; i++) {
      const alert = alertTemplates[i];
      const createdAt = new Date(today);
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 14));
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      await query(
        `INSERT INTO alerts (type, severity, title, message, is_read, is_resolved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [alert.type, alert.severity, alert.title, alert.message,
         i > 5, i > 8, createdAt.toISOString()]
      );
    }
    console.log(`  [OK] Created ${alertTemplates.length} alerts`);

    // Generate budgets
    const budgets = [
      { name: 'Production Monthly Budget', amount: 15000, period: 'monthly', subIndex: 0, spend: 13800 },
      { name: 'Development Monthly Budget', amount: 3000, period: 'monthly', subIndex: 1, spend: 2250 },
      { name: 'Staging Monthly Budget', amount: 5000, period: 'monthly', subIndex: 2, spend: 4000 },
      { name: 'Compute Quarterly Budget', amount: 40000, period: 'quarterly', subIndex: 0, spend: 28500 },
      { name: 'Storage Monthly Limit', amount: 2000, period: 'monthly', subIndex: 0, spend: 1650 }
    ];

    for (const budget of budgets) {
      await query(
        `INSERT INTO budgets (name, amount, period, subscription_id, current_spend, created_by, alert_thresholds)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [budget.name, budget.amount, budget.period, subIds[budget.subIndex],
         budget.spend, userIds[0], JSON.stringify([50, 75, 90, 100])]
      );
    }
    console.log(`  [OK] Created ${budgets.length} budgets`);

    // Generate anomalies
    let anomalyCount = 0;
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      if (Math.random() < 0.15) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        const resource = randomElement(resourceServiceMap);
        const expected = randomBetween(30, 150);
        const deviation = randomBetween(50, 300);
        const actual = expected * (1 + deviation / 100);
        const zScore = randomBetween(2.0, 5.5);

        await query(
          `INSERT INTO cost_anomalies (resource_id, subscription_id, date, expected_cost, actual_cost, deviation_percentage, z_score, severity, is_resolved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [resource.id, resource.subId, date.toISOString().split('T')[0],
           Math.round(expected * 100) / 100, Math.round(actual * 100) / 100,
           Math.round(deviation * 100) / 100, Math.round(zScore * 100) / 100,
           zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
           dayOffset > 15]
        );
        anomalyCount++;
      }
    }
    console.log(`  [OK] Created ${anomalyCount} cost anomalies`);

    console.log('\n  Seeding complete!\n');
    console.log('  Login credentials:');
    console.log('  ------------------');
    console.log('  Admin:  admin@azureflow.com / password123');
    console.log('  Editor: editor@azureflow.com / password123');
    console.log('  Viewer: viewer@azureflow.com / password123');
    console.log('  Demo:   demo@azureflow.com / password123\n');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();

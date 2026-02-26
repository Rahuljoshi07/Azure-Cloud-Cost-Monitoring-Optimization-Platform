-- Azure Cost Monitor Database Schema

-- Note: uuid_generate_v4() compatibility is handled by the app layer.
-- On real PostgreSQL, CREATE EXTENSION "uuid-ossp" is run first.
-- On PGlite/embedded, gen_random_uuid() alias is created automatically.

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    state VARCHAR(50) DEFAULT 'active',
    monthly_budget DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Groups table
CREATE TABLE IF NOT EXISTS resource_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    location VARCHAR(100),
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    resource_group_id UUID REFERENCES resource_groups(id),
    subscription_id UUID REFERENCES subscriptions(id),
    sku VARCHAR(100),
    status VARCHAR(50) DEFAULT 'running',
    tags JSONB DEFAULT '{}',
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Records table
CREATE TABLE IF NOT EXISTS cost_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id),
    subscription_id UUID REFERENCES subscriptions(id),
    date DATE NOT NULL,
    cost DECIMAL(12,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    service_name VARCHAR(255),
    meter_category VARCHAR(255),
    meter_subcategory VARCHAR(255),
    region VARCHAR(100),
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on cost_records for faster queries
CREATE INDEX IF NOT EXISTS idx_cost_records_date ON cost_records(date);
CREATE INDEX IF NOT EXISTS idx_cost_records_resource ON cost_records(resource_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_subscription ON cost_records(subscription_id);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    period VARCHAR(50) DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    subscription_id UUID REFERENCES subscriptions(id),
    resource_group_id UUID REFERENCES resource_groups(id),
    alert_thresholds JSONB DEFAULT '[50, 75, 90, 100]',
    current_spend DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('budget', 'anomaly', 'recommendation', 'system')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resource_id UUID REFERENCES resources(id),
    budget_id UUID REFERENCES budgets(id),
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id),
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('cost', 'performance', 'security', 'reliability')),
    impact VARCHAR(50) DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_savings DECIMAL(12,2),
    current_value VARCHAR(255),
    recommended_value VARCHAR(255),
    action VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'implemented')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('monthly', 'cost_summary', 'optimization', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data JSONB NOT NULL,
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Metrics table (for resource utilization tracking)
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    unit VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_resource ON usage_metrics(resource_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_timestamp ON usage_metrics(timestamp);

-- Anomalies detected table
CREATE TABLE IF NOT EXISTS cost_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id),
    subscription_id UUID REFERENCES subscriptions(id),
    date DATE NOT NULL,
    expected_cost DECIMAL(12,4),
    actual_cost DECIMAL(12,4),
    deviation_percentage DECIMAL(8,2),
    z_score DECIMAL(8,4),
    severity VARCHAR(50) DEFAULT 'medium',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# AzureCost Monitor - Cloud Cost Optimization Platform

A full-stack cloud monitoring platform that tracks Azure cloud spending, analyzes resource usage, detects cost anomalies, and provides optimization recommendations. Deploys natively to Azure Container Apps with real Azure Cost Management API integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │Dashboard │ │Cost View │ │Resources │ │Recommendations│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Alerts   │ │ Reports  │ │ Settings │ │   Auth (AD)  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────────┐
│                   Backend (Node.js + Express)                │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────────────┐    │
│  │  Auth  │ │ Costs  │ │Resources │ │ Recommendations │    │
│  └────────┘ └────────┘ └──────────┘ └─────────────────┘    │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────────────┐    │
│  │Alerts  │ │Budgets │ │ Reports  │ │ Anomaly Detect  │    │
│  └────────┘ └────────┘ └──────────┘ └─────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       Azure Service Layer (Cost / Monitor / Graph)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Data Sync Pipeline (cron-scheduled)          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    PostgreSQL Database                        │
│  users │ cost_records │ resources │ alerts │ recommendations │
│  budgets │ subscriptions │ resource_groups │ usage_metrics   │
│  cost_anomalies │ reports                                    │
└──────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                     Azure APIs                               │
│  Cost Management │ Resource Graph │ Monitor │ Advisor        │
│  Azure AD (MSAL) │ Subscriptions                            │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                                          |
|----------------|-----------------------------------------------------|
| Frontend       | React 18, Vite, Tailwind CSS                        |
| Charts         | Recharts                                            |
| Icons          | Lucide React                                        |
| State          | Zustand                                             |
| Auth (client)  | MSAL (@azure/msal-browser) + local JWT              |
| Backend        | Node.js, Express                                    |
| Database       | PostgreSQL 15                                       |
| Auth (server)  | JWT + Azure AD (jwks-rsa)                           |
| Azure SDKs     | @azure/arm-costmanagement, arm-monitor, arm-resourcegraph, identity |
| Infra          | Bicep (Container Apps, PostgreSQL Flexible, ACR, Key Vault) |
| DevOps         | Docker, Docker Compose, GitHub Actions              |

## Features

- **Cost Dashboard** - KPI cards, daily cost trend, cost by service/region/resource group
- **Cost Breakdown** - Subscription costs, tag-based analysis, top expensive resources
- **Resource Management** - Browse, filter, and search all cloud resources
- **Optimization Recommendations** - Azure Advisor integration, idle VMs, right-sizing
- **Budget Management** - Set budgets with threshold alerts and progress tracking
- **Alert System** - Budget alerts, anomaly alerts, severity-based filtering
- **Cost Anomaly Detection** - Z-score statistical analysis to detect spending spikes
- **Cost Forecasting** - Linear regression-based cost predictions
- **Report Generation** - Monthly, cost summary, and optimization reports
- **Data Sync Pipeline** - Cron-scheduled sync from Azure APIs to local database
- **Dark Mode** - Full dark/light theme support
- **Authentication** - Dual-mode: Azure AD (MSAL) or local JWT with RBAC
- **Multi-subscription** - Track costs across multiple Azure subscriptions
- **Tag-based Analysis** - Filter costs by environment, department, project, owner
- **Infrastructure as Code** - Full Bicep templates for Azure deployment

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm

### 1. Clone and Setup

```bash
git clone <repository-url>
cd azure-cost-monitor
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env` — for local development with mock data, the defaults work out of the box:
```env
AZURE_USE_MOCK=true
AZURE_AD_ENABLED=false
```

### 3. Create Database

```bash
createdb azure_cost_monitor

# Or using psql
psql -U postgres -c "CREATE DATABASE azure_cost_monitor;"
```

### 4. Seed Database

```bash
cd backend
npm run seed
```

This creates demo data including:
- 4 users with different roles
- 3 Azure subscriptions
- 10 resource groups
- 70+ resources across 15 service types
- 90 days of cost records
- Recommendations, alerts, budgets, and anomalies

### 5. Start Backend

```bash
cd backend
npm run dev
```

Server runs at http://localhost:5000

### 6. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

### 7. Login

| Role   | Email                   | Password     |
|--------|-------------------------|--------------|
| Admin  | admin@azureflow.com     | password123  |
| Editor | editor@azureflow.com    | password123  |
| Viewer | viewer@azureflow.com    | password123  |
| Demo   | demo@azureflow.com      | password123  |

---

## Docker Setup (Local)

```bash
# Build and start all services
docker compose up --build

# In another terminal — seed the database
docker compose exec backend node seed.js

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000
```

---

## Azure Deployment

### Prerequisites

1. An Azure subscription with Owner or Contributor role
2. Azure CLI installed and logged in (`az login`)
3. A GitHub repository with Actions enabled

### Step 1: Register an Azure AD App (Service Principal)

```bash
# Create a service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "azurecostmon-cicd" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID> \
  --sdk-auth

# Save the JSON output — this becomes AZURE_CREDENTIALS secret
```

### Step 2: Register an Azure AD App (for user authentication)

```bash
# Create an app registration for user login
az ad app create \
  --display-name "AzureCost Monitor" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://<your-frontend-fqdn>/api/auth/callback"

# Note the appId — this is your AZURE_CLIENT_ID
# Create a client secret
az ad app credential reset --id <APP_ID>
```

### Step 3: Grant Cost Management Permissions

The service principal needs these role assignments:
```bash
SUBSCRIPTION_ID="<your-subscription-id>"
SP_OBJECT_ID="<service-principal-object-id>"

# Cost Management Reader — read cost data
az role assignment create \
  --assignee $SP_OBJECT_ID \
  --role "Cost Management Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID

# Reader — list resources and resource groups
az role assignment create \
  --assignee $SP_OBJECT_ID \
  --role "Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID

# Monitoring Reader — read VM metrics
az role assignment create \
  --assignee $SP_OBJECT_ID \
  --role "Monitoring Reader" \
  --scope /subscriptions/$SUBSCRIPTION_ID
```

### Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret                    | Description                                |
|---------------------------|--------------------------------------------|
| `AZURE_CREDENTIALS`      | Service principal JSON from Step 1         |
| `AZURE_RESOURCE_GROUP`   | Resource group name (e.g., `rg-azurecostmon-prod`) |
| `ACR_LOGIN_SERVER`       | ACR server (e.g., `azurecostmonprod.azurecr.io`) |
| `ACR_USERNAME`           | ACR admin username                          |
| `ACR_PASSWORD`           | ACR admin password                          |
| `DB_ADMIN_PASSWORD`      | PostgreSQL admin password                   |
| `JWT_SECRET`             | Secret key for JWT signing                  |
| `AZURE_TENANT_ID`        | Azure AD tenant ID                          |
| `AZURE_CLIENT_ID`        | App registration client ID                 |
| `AZURE_CLIENT_SECRET`    | App registration client secret             |
| `AZURE_SUBSCRIPTION_IDS` | Comma-separated subscription IDs to monitor |

### Step 5: Deploy Infrastructure

The Bicep templates in `infra/` create:
- Resource Group
- Azure Container Registry
- Container Apps Environment with Log Analytics
- Azure Database for PostgreSQL Flexible Server
- Key Vault for secrets
- Backend and Frontend Container Apps

```bash
# Deploy manually (or let CI/CD handle it)
az deployment sub create \
  --location eastus \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json \
  --parameters dbAdminPassword="<password>" \
               jwtSecret="<secret>" \
               azureTenantId="<tenant-id>" \
               azureClientId="<client-id>" \
               azureClientSecret="<client-secret>" \
               azureSubscriptionIds="<sub-id-1,sub-id-2>"
```

### Step 6: Push to Main

Pushing to `main` triggers the full CI/CD pipeline:

1. **Test** - Backend tests with PostgreSQL, frontend build
2. **Docker Push** - Build and push images to ACR
3. **Deploy Infra** - Run Bicep deployment
4. **Deploy Apps** - Update Container Apps with new images

### Step 7: Seed the Database

```bash
# Via Azure CLI
az containerapp exec \
  --resource-group rg-azurecostmon-prod \
  --name azurecostmon-backend-prod \
  --command "node seed.js"
```

---

## Azure Services Integration

### Data Sync Pipeline

The backend runs a cron-scheduled data sync (default: every 6 hours) that:
1. Fetches subscriptions from Azure
2. Queries resources via Resource Graph
3. Pulls cost data from Cost Management API
4. Collects VM metrics from Azure Monitor
5. Fetches recommendations from Azure Advisor
6. Runs anomaly detection (Z-score analysis)
7. Checks budget thresholds and sends alerts

Trigger manually via the Settings page (admin only) or API:
```bash
curl -X POST http://localhost:5000/api/sync \
  -H "Authorization: Bearer <token>"
```

### Mock vs Live Mode

Control Azure integration via environment variables:
```env
AZURE_USE_MOCK=true   # Use seed data only (no Azure API calls)
AZURE_USE_MOCK=false  # Pull real data from Azure APIs
```

### Authentication Modes

| Mode       | Config                  | Description                    |
|------------|-------------------------|--------------------------------|
| Local JWT  | `AZURE_AD_ENABLED=false`| Username/password login        |
| Azure AD   | `AZURE_AD_ENABLED=true` | Microsoft SSO via MSAL         |

Both modes can coexist — the backend checks the token format and validates accordingly.

---

## API Endpoints

### Authentication
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | /api/auth/register | Register new user   |
| POST   | /api/auth/login    | Login               |
| GET    | /api/auth/profile  | Get user profile    |

### Costs
| Method | Endpoint                   | Description              |
|--------|----------------------------|--------------------------|
| GET    | /api/costs/overview        | Cost dashboard overview  |
| GET    | /api/costs/by-subscription | Cost by subscription     |
| GET    | /api/costs/top-resources   | Top expensive resources  |
| GET    | /api/costs/by-tags         | Cost breakdown by tags   |
| GET    | /api/costs/daily           | Daily cost records       |

### Resources
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/resources        | List all resources   |
| GET    | /api/resources/:id    | Get resource details |
| GET    | /api/resources/types  | Get resource types   |

### Alerts
| Method | Endpoint                   | Description       |
|--------|----------------------------|-------------------|
| GET    | /api/alerts                | List alerts       |
| GET    | /api/alerts/stats          | Alert statistics  |
| PUT    | /api/alerts/:id/read       | Mark as read      |
| PUT    | /api/alerts/:id/resolve    | Resolve alert     |

### Recommendations
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | /api/recommendations             | List recommendations     |
| GET    | /api/recommendations/summary     | Summary by category      |
| PUT    | /api/recommendations/:id/status  | Update status            |

### Budgets
| Method | Endpoint            | Description    |
|--------|---------------------|----------------|
| GET    | /api/budgets        | List budgets   |
| POST   | /api/budgets        | Create budget  |
| PUT    | /api/budgets/:id    | Update budget  |
| DELETE | /api/budgets/:id    | Delete budget  |

### Reports
| Method | Endpoint                 | Description      |
|--------|--------------------------|------------------|
| GET    | /api/reports             | List reports     |
| POST   | /api/reports/generate    | Generate report  |
| GET    | /api/reports/forecast    | Cost forecast    |
| GET    | /api/reports/anomalies   | Cost anomalies   |

### Sync & Config
| Method | Endpoint           | Description                       |
|--------|--------------------|-----------------------------------|
| POST   | /api/sync          | Trigger manual sync (admin only)  |
| GET    | /api/sync/status   | Sync configuration status         |
| GET    | /api/config/auth   | Auth config for frontend MSAL     |

---

## Database Schema

The system uses 11 PostgreSQL tables:

- **users** - User accounts with role-based access (admin/editor/viewer)
- **subscriptions** - Azure subscriptions being monitored
- **resource_groups** - Azure resource groups
- **resources** - Cloud resources with tags and properties
- **cost_records** - Daily cost records per resource
- **budgets** - Budget definitions with thresholds
- **alerts** - System alerts (budget, anomaly, recommendation)
- **recommendations** - Optimization recommendations from Azure Advisor
- **usage_metrics** - Resource utilization metrics (CPU, memory)
- **cost_anomalies** - Detected cost anomalies with Z-scores
- **reports** - Generated reports

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database config, SQL schema
│   │   ├── controllers/    # Route handlers (8 controllers)
│   │   ├── middleware/      # Auth (JWT + Azure AD), validation, rate limiting
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Azure service layer
│   │   │   ├── azureCredential.js      # Azure Identity management
│   │   │   ├── azureCostService.js     # Cost Management API
│   │   │   ├── azureResourceService.js # Resource Graph queries
│   │   │   ├── azureMonitorService.js  # Azure Monitor metrics
│   │   │   ├── azureSubscriptionService.js # Subscription listing
│   │   │   ├── azureAdvisorService.js  # Azure Advisor recommendations
│   │   │   ├── dataSyncService.js      # Sync orchestrator
│   │   │   ├── anomalyService.js       # Z-score anomaly detection
│   │   │   ├── notificationService.js  # Email + Slack alerts
│   │   │   └── syncRunner.js           # Standalone sync runner
│   │   └── server.js       # Express app + cron scheduler
│   ├── seed.js             # Database seeder with mock data
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, Sidebar, Header
│   │   ├── pages/          # Dashboard, Costs, Resources, etc.
│   │   ├── store/          # Zustand state management
│   │   ├── lib/            # API client, MSAL auth
│   │   ├── App.jsx         # React Router + MSAL init
│   │   └── main.jsx        # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── infra/                  # Bicep infrastructure-as-code
│   ├── main.bicep          # Subscription-level orchestration
│   ├── parameters.json     # Deployment parameters
│   └── modules/
│       ├── acr.bicep               # Azure Container Registry
│       ├── containerApp.bicep      # Generic Container App
│       ├── containerAppsEnv.bicep  # Container Apps Environment
│       ├── keyVault.bicep          # Key Vault
│       ├── logAnalytics.bicep      # Log Analytics Workspace
│       └── postgres.bicep          # PostgreSQL Flexible Server
├── .github/workflows/ci.yml # CI/CD pipeline (5 stages)
├── docker-compose.yml      # Local development stack
└── README.md
```

## Security

- JWT token authentication with expiry
- Azure AD SSO with MSAL and JWKS verification
- Password hashing with bcrypt (12 rounds)
- Role-based access control (admin, editor, viewer)
- Helmet.js security headers
- CORS configuration
- Rate limiting on API endpoints
- Input validation on all routes
- Environment variables for secrets
- Key Vault for production secrets
- SSL/TLS for Azure PostgreSQL connections

## License

MIT

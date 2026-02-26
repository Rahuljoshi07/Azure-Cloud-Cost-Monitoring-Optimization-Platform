// ─── AzureCost Monitor – Full Infrastructure ──────────────────────────────
// Deploys: Resource Group, ACR, Container Apps Environment, PostgreSQL Flexible Server,
//          Backend + Frontend Container Apps, Key Vault, Log Analytics.
//
// Deploy:  az deployment sub create --location eastus --template-file infra/main.bicep --parameters infra/parameters.json

targetScope = 'subscription'

@description('Environment name (dev, staging, prod)')
param environment string = 'prod'

@description('Azure region')
param location string = 'eastus'

@description('Project name prefix')
param projectName string = 'azurecostmon'

@description('PostgreSQL admin username')
param dbAdminUser string = 'pgadmin'

@secure()
@description('PostgreSQL admin password')
param dbAdminPassword string

@secure()
@description('JWT secret for the backend')
param jwtSecret string

@description('Azure AD tenant ID')
param azureTenantId string = ''

@description('Azure AD client ID')
param azureClientId string = ''

@secure()
@description('Azure AD client secret')
param azureClientSecret string = ''

@description('Comma-separated subscription IDs to monitor')
param azureSubscriptionIds string = ''

@description('Enable Azure AD authentication')
param azureAdEnabled bool = false

@description('Use real Azure APIs (false = mock data)')
param azureUseMock bool = false

var rgName = 'rg-${projectName}-${environment}'
var suffix = uniqueString(subscription().id, rgName)

// ─── Resource Group ──────────────────────────────────────────────────────────

resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: rgName
  location: location
  tags: {
    project: projectName
    environment: environment
    managedBy: 'bicep'
  }
}

// ─── Log Analytics ───────────────────────────────────────────────────────────

module logAnalytics 'modules/logAnalytics.bicep' = {
  scope: rg
  name: 'logAnalytics'
  params: {
    name: 'log-${projectName}-${suffix}'
    location: location
  }
}

// ─── Container Registry ──────────────────────────────────────────────────────

module acr 'modules/acr.bicep' = {
  scope: rg
  name: 'acr'
  params: {
    name: 'acr${projectName}${suffix}'
    location: location
  }
}

// ─── PostgreSQL Flexible Server ──────────────────────────────────────────────

module postgres 'modules/postgres.bicep' = {
  scope: rg
  name: 'postgres'
  params: {
    name: 'psql-${projectName}-${suffix}'
    location: location
    adminUser: dbAdminUser
    adminPassword: dbAdminPassword
    databaseName: 'azure_cost_monitor'
  }
}

// ─── Key Vault ───────────────────────────────────────────────────────────────

module keyVault 'modules/keyVault.bicep' = {
  scope: rg
  name: 'keyVault'
  params: {
    name: 'kv-${projectName}-${suffix}'
    location: location
    secrets: {
      'db-password': dbAdminPassword
      'jwt-secret': jwtSecret
      'azure-client-secret': azureClientSecret
    }
  }
}

// ─── Container Apps Environment ──────────────────────────────────────────────

module containerEnv 'modules/containerAppsEnv.bicep' = {
  scope: rg
  name: 'containerAppsEnv'
  params: {
    name: 'cae-${projectName}-${environment}'
    location: location
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
  }
}

// ─── Backend Container App ───────────────────────────────────────────────────

module backendApp 'modules/containerApp.bicep' = {
  scope: rg
  name: 'backendApp'
  params: {
    name: 'ca-backend-${projectName}'
    location: location
    environmentId: containerEnv.outputs.environmentId
    registryServer: acr.outputs.loginServer
    imageName: '${acr.outputs.loginServer}/azurecost-backend:latest'
    targetPort: 5000
    isExternal: false
    minReplicas: 1
    maxReplicas: 3
    cpu: '0.5'
    memory: '1Gi'
    envVars: [
      { name: 'PORT', value: '5000' }
      { name: 'NODE_ENV', value: 'production' }
      { name: 'DB_HOST', value: postgres.outputs.fqdn }
      { name: 'DB_PORT', value: '5432' }
      { name: 'DB_NAME', value: 'azure_cost_monitor' }
      { name: 'DB_USER', value: dbAdminUser }
      { name: 'DB_SSL', value: 'true' }
      { name: 'AZURE_TENANT_ID', value: azureTenantId }
      { name: 'AZURE_CLIENT_ID', value: azureClientId }
      { name: 'AZURE_SUBSCRIPTION_IDS', value: azureSubscriptionIds }
      { name: 'AZURE_USE_MOCK', value: azureUseMock ? 'true' : 'false' }
      { name: 'AZURE_AD_ENABLED', value: azureAdEnabled ? 'true' : 'false' }
      { name: 'SYNC_CRON', value: '0 */6 * * *' }
      { name: 'SYNC_COST_DAYS', value: '30' }
    ]
    secretEnvVars: [
      { name: 'DB_PASSWORD', secretRef: 'db-password' }
      { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'AZURE_CLIENT_SECRET', secretRef: 'azure-client-secret' }
    ]
    secrets: [
      { name: 'db-password', value: dbAdminPassword }
      { name: 'jwt-secret', value: jwtSecret }
      { name: 'azure-client-secret', value: azureClientSecret }
    ]
  }
}

// ─── Frontend Container App ─────────────────────────────────────────────────

module frontendApp 'modules/containerApp.bicep' = {
  scope: rg
  name: 'frontendApp'
  params: {
    name: 'ca-frontend-${projectName}'
    location: location
    environmentId: containerEnv.outputs.environmentId
    registryServer: acr.outputs.loginServer
    imageName: '${acr.outputs.loginServer}/azurecost-frontend:latest'
    targetPort: 80
    isExternal: true
    minReplicas: 1
    maxReplicas: 3
    cpu: '0.25'
    memory: '0.5Gi'
    envVars: []
    secretEnvVars: []
    secrets: []
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

output resourceGroupName string = rg.name
output acrLoginServer string = acr.outputs.loginServer
output postgresHost string = postgres.outputs.fqdn
output backendFqdn string = backendApp.outputs.fqdn
output frontendFqdn string = frontendApp.outputs.fqdn
output frontendUrl string = 'https://${frontendApp.outputs.fqdn}'

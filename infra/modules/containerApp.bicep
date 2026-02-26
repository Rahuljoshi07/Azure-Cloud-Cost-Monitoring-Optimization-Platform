param name string
param location string
param environmentId string
param registryServer string
param imageName string
param targetPort int
param isExternal bool
param minReplicas int = 1
param maxReplicas int = 3
param cpu string = '0.5'
param memory string = '1Gi'
param envVars array = []
param secretEnvVars array = []
param secrets array = []

resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: isExternal
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registryServer
          username: split(registryServer, '.')[0]
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: union(secrets, [
        {
          name: 'acr-password'
          value: 'placeholder'
        }
      ])
    }
    template: {
      containers: [
        {
          name: name
          image: imageName
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: union(
            envVars,
            [for item in secretEnvVars: {
              name: item.name
              secretRef: item.secretRef
            }]
          )
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: { metadata: { concurrentRequests: '50' } }
          }
        ]
      }
    }
  }
}

output fqdn string = app.properties.configuration.ingress.fqdn
output name string = app.name

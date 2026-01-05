# Azure CI/CD Pipeline Project

## 📋 Project Overview

A production-ready web application demonstrating modern DevOps practices with automated CI/CD pipeline deployment to Microsoft Azure. This project showcases continuous integration, automated testing, and continuous deployment using GitHub Actions and Azure App Service.

## 🚀 Key Features

- **Automated CI/CD Pipeline**: GitHub Actions workflow for continuous integration and deployment
- **Azure App Service Integration**: Seamless deployment to Azure cloud platform
- **Automated Testing**: Unit and integration tests with code coverage
- **Health Monitoring**: Built-in health check endpoints
- **Environment Management**: Separate staging and production environments
- **Docker Support**: Containerized application for consistent deployments
- **Infrastructure as Code**: Azure configuration for reproducible deployments

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions
- **Cloud Platform**: Microsoft Azure App Service
- **Containerization**: Docker
- **Version Control**: Git, GitHub

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── azure-deploy.yml      # CI/CD pipeline configuration
├── src/
│   ├── app.js                    # Express application
│   ├── routes/
│   │   └── api.js                # API routes
│   └── controllers/
│       └── healthController.js   # Health check logic
├── tests/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── azure/
│   └── app-service-config.json   # Azure deployment config
├── Dockerfile                    # Container configuration
├── .dockerignore                 # Docker ignore file
├── package.json                  # Dependencies and scripts
├── .gitignore                    # Git ignore file
└── README.md                     # Project documentation
```

## 🔄 CI/CD Pipeline Workflow

1. **Code Push**: Developer pushes code to GitHub
2. **Automated Build**: GitHub Actions triggers build process
3. **Testing**: Runs unit and integration tests
4. **Code Quality**: Checks code coverage and linting
5. **Docker Build**: Creates container image
6. **Azure Deployment**: Deploys to Azure App Service
7. **Health Check**: Verifies deployment success

## 🎯 Pipeline Features

- ✅ Automated testing on every commit
- ✅ Parallel job execution for faster builds
- ✅ Environment-specific deployments
- ✅ Automatic rollback on failure
- ✅ Slack/Email notifications
- ✅ Security scanning
- ✅ Performance monitoring

## 📊 Getting Started

### Prerequisites

- Node.js 18.x or higher
- Azure Account
- GitHub Account
- Docker (optional)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm run build
```

### Azure Setup

1. **Create Azure App Service**:
   ```bash
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myUniqueAppName --runtime "NODE|18-lts"
   ```

2. **Configure GitHub Secrets**:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`: Download from Azure Portal
   - `AZURE_WEBAPP_NAME`: Your app service name

3. **Enable Deployment**:
   - Push to `main` branch triggers automatic deployment

## 🔐 Environment Variables

```env
NODE_ENV=production
PORT=8080
AZURE_REGION=eastus
LOG_LEVEL=info
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📈 Monitoring & Logging

- **Application Insights**: Real-time performance monitoring
- **Azure Monitor**: Infrastructure metrics
- **Log Analytics**: Centralized logging
- **Health Endpoints**: `/health` and `/ready`

## 🌟 Best Practices Demonstrated

- ✅ **12-Factor App Methodology**: Environment-based configuration
- ✅ **Blue-Green Deployment**: Zero-downtime deployments
- ✅ **Infrastructure as Code**: Reproducible infrastructure
- ✅ **Security First**: Secrets management, dependency scanning
- ✅ **Observability**: Logging, monitoring, and alerting
- ✅ **Documentation**: Comprehensive README and inline comments

## 🚀 Deployment

### Automatic Deployment
Push to `main` branch triggers automatic deployment:
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### Manual Deployment
```bash
# Deploy to Azure manually
npm run deploy
```

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Welcome message |
| `/api/health` | GET | Health check |
| `/api/info` | GET | Application info |
| `/api/status` | GET | System status |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎓 Skills Demonstrated

- DevOps & CI/CD Pipeline Design
- Cloud Computing (Microsoft Azure)
- Infrastructure as Code
- Automated Testing & QA
- Container Orchestration
- GitHub Actions Automation
- RESTful API Development
- Monitoring & Observability
- Security Best Practices
- Agile Development Practices

---

**⭐ If you found this project helpful, please give it a star!**

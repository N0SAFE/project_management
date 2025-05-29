# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline setup for the Project Management application, which enforces best practices for branch protection and automated testing.

## 🏗️ Architecture Overview

Our CI/CD pipeline consists of:
- **Spring Boot API** (Java 21, Maven)
- **Angular Web Application** (Node.js 20)
- **MySQL Database**
- **Docker** containerization
- **GitHub Actions** for CI/CD

## 🚀 Workflows

### 1. CI Pipeline (`ci.yml`)
**Triggers**: Push to feature branches, Pull Requests to master/main/develop

**Jobs**:
- **API Tests & Build**: Tests Spring Boot application with MySQL
- **Web Tests & Build**: Tests Angular application with unit tests and linting
- **Integration Tests**: Full Docker Compose stack testing
- **Security Scan**: Vulnerability scanning with Trivy
- **Code Quality**: SonarQube analysis (optional)

### 2. CD Pipeline (`cd.yml`)
**Triggers**: Push to master/main, CI pipeline completion

**Jobs**:
- **Build & Push**: Creates Docker images and pushes to GitHub Container Registry
- **Deploy Staging**: Deploys to staging environment
- **Deploy Production**: Deploys to production (requires manual approval)

### 3. Branch Protection (`branch-protection.yml`)
**Triggers**: Pull Requests to master/main

**Checks**:
- Enforces feature branch workflow
- Validates branch naming conventions
- Checks commit message format (Conventional Commits)

### 4. Dependency Updates (`dependency-updates.yml`)
**Triggers**: Weekly schedule, manual dispatch

**Actions**:
- Updates npm and Maven dependencies
- Runs tests to ensure compatibility
- Creates automated Pull Request

## 🛡️ Branch Protection Rules

### Required Setup in GitHub Repository Settings

1. **Go to Settings → Branches → Add Rule**

2. **Branch name pattern**: `master` (or `main`)

3. **Enable these protection rules**:
   ```
   ✅ Require a pull request before merging
   ✅ Require approvals (minimum 1)
   ✅ Dismiss stale PR approvals when new commits are pushed
   ✅ Require review from code owners
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Require conversation resolution before merging
   ✅ Restrict pushes that create files larger than 100MB
   ✅ Restrict force pushes
   ✅ Restrict deletions
   ```

4. **Required Status Checks**:
   ```
   - API Tests & Build
   - Web Tests & Build
   - Integration Tests
   - Security Scan
   - Branch Protection Check
   ```

## 📋 Branch Naming Convention

Follow this naming pattern for all feature branches:
```
feature/your-feature-name
bugfix/issue-description
hotfix/critical-fix
docs/documentation-update
```

**Examples**:
```
feature/user-authentication
feature/project-dashboard
bugfix/login-validation-error
hotfix/security-vulnerability
docs/api-documentation
```

## 💬 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding/modifying tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples**:
```
feat(auth): add password reset functionality
fix(api): resolve database connection timeout
docs(readme): update setup instructions
refactor(components): simplify user management logic
test(auth): add unit tests for login service
chore(deps): update Angular to version 17
```

## 🔄 Development Workflow

### 1. Starting New Work
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Commit with conventional format
git commit -m "feat(feature): add new functionality"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Creating Pull Request
1. Go to GitHub and create Pull Request
2. Target branch: `master` (or `main`)
3. Fill in PR template
4. Wait for CI checks to pass
5. Request review from team members

### 3. Merging Process
1. All CI checks must pass ✅
2. At least 1 approval required ✅
3. Branch must be up-to-date ✅
4. No merge conflicts ✅
5. Use "Squash and merge" for clean history

## 🏃‍♂️ Local Development

### Prerequisites
- Java 21
- Node.js 20+
- Docker & Docker Compose
- Maven

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd project_management

# Start development environment
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up
```

### Running Tests Locally
```bash
# API Tests
cd apps/api
./mvnw test

# Web Tests
cd apps/web
npm test

# Integration Tests
docker-compose -f docker-compose.yaml build
docker-compose -f docker-compose.yaml up -d
# Test endpoints manually or with scripts
docker-compose -f docker-compose.yaml down
```

## 🔧 Environment Configuration

### GitHub Secrets (Required)
Set these in Repository Settings → Secrets and variables → Actions:

```
SONAR_TOKEN          # SonarQube/SonarCloud token (optional)
SONAR_HOST_URL       # SonarQube URL (optional)
GITHUB_TOKEN         # Automatically provided
```

### Environment Protection Rules
1. **Staging Environment**: No restrictions
2. **Production Environment**: 
   - Required reviewers: [team-leads, devops-team]
   - Deployment protection rules enabled

## 📊 Monitoring & Notifications

### Available Integrations
- **Slack**: Add webhook URL to secrets for deployment notifications
- **Email**: Configure for failed pipeline notifications
- **Teams**: Microsoft Teams integration for status updates

### Metrics Tracked
- Build success rate
- Test coverage
- Deployment frequency
- Lead time for changes
- Mean time to recovery

## 🚨 Troubleshooting

### Common Issues

**1. CI Pipeline Fails**
```bash
# Check logs in GitHub Actions tab
# Common fixes:
- Ensure all dependencies are properly defined
- Check environment variables
- Verify database connectivity
```

**2. Branch Protection Errors**
```bash
# Force push denied
git rebase main          # Update your branch
git push --force-with-lease origin feature/your-branch

# Status checks failing
# Check GitHub Actions tab for detailed error logs
```

**3. Docker Issues**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Spring Boot Testing](https://spring.io/guides/gs/testing-web/)
- [Angular Testing](https://angular.io/guide/testing)

## 🤝 Contributing

1. Read this documentation thoroughly
2. Follow the branch naming convention
3. Write meaningful commit messages
4. Ensure all tests pass locally before pushing
5. Request appropriate reviewers for your PR
6. Respond to review feedback promptly

---

For questions or issues with the CI/CD pipeline, please contact the DevOps team or create an issue in the repository.

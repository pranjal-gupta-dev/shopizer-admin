# CI/CD Implementation Plan - Shopizer Admin (Angular)

**Date**: March 25, 2026  
**Project**: Shopizer Admin Frontend  
**Technology**: Angular 11, TypeScript, Node.js, Nginx

---

## Current State

### Technology Stack
- **Framework**: Angular 11.2.14
- **Language**: TypeScript 4.0.8
- **Package Manager**: npm
- **Build Tool**: Angular CLI
- **Testing**: Jasmine, Karma
- **Linting**: ESLint, Stylelint
- **Container**: Docker (Nginx Alpine)

### Existing Scripts
- `npm run build` - Production build
- `npm test` - Run unit tests
- `npm run test:coverage` - Generate coverage reports
- `npm run lint` - ESLint checks
- `npm run lint:styles` - Stylelint checks
- `npm run e2e` - End-to-end tests

---

## CI/CD Pipeline Structure

### Stage 1: Build and Test (5-7 minutes)
```yaml
- Install dependencies (npm ci)
- Run linting (ESLint + Stylelint)
- Run unit tests with coverage
- Build production bundle
- Upload artifacts
```

### Stage 2: Code Quality (3-5 minutes)
```yaml
- Run ESLint with detailed reports
- Run Stylelint for SCSS
- SonarCloud analysis (optional)
- Check bundle size
```

### Stage 3: Security Scan (3-5 minutes)
```yaml
- npm audit for vulnerabilities
- Snyk security scan
- Secret detection (TruffleHog)
- License compliance check
```

### Stage 4: Docker Build (3-5 minutes)
```yaml
- Build Docker image
- Tag with version/SHA
- Push to Docker Hub
- Trivy container scan
```

### Stage 5: Deploy Staging (2-3 minutes)
```yaml
- Deploy to staging environment
- Run smoke tests
- Verify deployment
```

### Stage 6: Deploy Production (2-3 minutes)
```yaml
- Manual approval required
- Deploy to production
- Health checks
- Slack notification
```

---

## Implementation Steps

### Phase 1: Setup CI Configuration (Week 1)

#### 1.1 Create GitHub Actions Workflow

**File**: `.github/workflows/ci-cd.yml`

```yaml
name: Shopizer Admin CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '14'
  DOCKER_IMAGE: shopizerecomm/shopizer-admin

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: |
          npm run lint
          npm run lint:styles
      
      - name: Run unit tests
        run: npm run test:coverage -- --watch=false --browsers=ChromeHeadless
      
      - name: Build production
        run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-admin
        continue-on-error: true
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: admin-dist
          path: dist/
          retention-days: 7

  code-quality:
    name: Code Quality
    runs-on: ubuntu-latest
    needs: build-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint with report
        run: npm run lint -- --format=json --output-file=eslint-report.json
        continue-on-error: true
      
      - name: Check bundle size
        run: |
          npm run build -- --stats-json
          npx webpack-bundle-analyzer dist/stats.json --mode static --report bundle-report.html --no-open
        continue-on-error: true
      
      - name: SonarCloud Scan
        if: github.event_name == 'push'
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        continue-on-error: true

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: build-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        continue-on-error: true
      
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
        continue-on-error: true

  docker-build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [build-and-test, security-scan]
    if: github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: admin-dist
          path: dist/
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Docker Hub
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_PASSWORD }}
        continue-on-error: true
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKER_IMAGE }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
        continue-on-error: true
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.DOCKER_IMAGE }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
        continue-on-error: true

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: staging
      url: https://admin-staging.shopizer.com
    
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"
        # Add actual deployment commands here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://admin.shopizer.com
    
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
        # Add actual deployment commands here
```

#### 1.2 Update package.json Scripts

Add these scripts:
```json
{
  "scripts": {
    "test:ci": "ng test --watch=false --code-coverage --browsers=ChromeHeadless",
    "lint:ci": "ng lint && npm run lint:styles",
    "build:prod": "ng build --prod --output-hashing=all"
  }
}
```

#### 1.3 Create SonarCloud Configuration

**File**: `sonar-project.properties`

```properties
sonar.projectKey=shopizer-admin
sonar.organization=shopizer
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/*.spec.ts,**/dist/**
```

---

### Phase 2: Optimize Build (Week 2)

#### 2.1 Add Build Optimizations

**File**: `angular.json` (update configurations)

```json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "extractLicenses": true,
      "vendorChunk": false,
      "buildOptimizer": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "2mb",
          "maximumError": "5mb"
        }
      ]
    }
  }
}
```

#### 2.2 Add .npmrc for CI

**File**: `.npmrc`

```
package-lock=true
audit=true
fund=false
```

---

### Phase 3: Testing Improvements (Week 3)

#### 3.1 Update Karma Configuration

**File**: `karma.conf.js`

```javascript
module.exports = function(config) {
  config.set({
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ]
    }
  });
};
```

---

### Phase 4: Docker Optimization (Week 4)

#### 4.1 Optimize Dockerfile

**File**: `Dockerfile`

```dockerfile
# Build stage
FROM node:14-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Add environment template
COPY docker/env.template.js /usr/share/nginx/html/assets/

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
```

#### 4.2 Add .dockerignore

**File**: `.dockerignore`

```
node_modules
npm-debug.log
dist
coverage
.git
.gitignore
README.md
.editorconfig
.vscode
*.md
```

---

## Required Secrets

Configure in GitHub: Settings → Secrets and variables → Actions

```
DOCKERHUB_USERNAME=<docker-hub-username>
DOCKERHUB_PASSWORD=<docker-hub-token>
SONAR_TOKEN=<sonarcloud-token>
SNYK_TOKEN=<snyk-token>
SLACK_WEBHOOK_URL=<slack-webhook>
```

---

## Success Metrics

- Build time: < 7 minutes
- Test coverage: > 60%
- Bundle size: < 5MB
- Zero high/critical vulnerabilities
- Deployment frequency: Multiple per day

---

## Quick Start

```bash
# Test locally
npm ci
npm run lint:ci
npm run test:ci
npm run build

# Build Docker image
docker build -t shopizer-admin:local .
docker run -p 8080:80 shopizer-admin:local

# Push to trigger CI
git checkout -b feature/ci-cd-admin
git add .
git commit -m "feat: implement CI/CD for admin"
git push origin feature/ci-cd-admin
```

---

## Next Steps

1. Create `.github/workflows/ci-cd.yml`
2. Update `package.json` scripts
3. Create `sonar-project.properties`
4. Optimize `Dockerfile`
5. Add `.dockerignore`
6. Configure GitHub secrets
7. Test pipeline with PR

---

**Estimated Implementation Time**: 2-3 weeks

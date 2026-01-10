# GitHub Pages Deployment Guide

## Setup Instructions

### 1. Configure GitHub Secrets

Go to your GitHub repository settings and add the following secrets:

1. Navigate to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

2. Add each of these secrets with your Firebase values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 2. Enable GitHub Pages

1. Go to `Settings` → `Pages`
2. Under "Source", select **GitHub Actions**

### 3. Deploy

Once you push the workflow file to the `master` branch, GitHub Actions will automatically:
- Build your project with the environment variables from secrets
- Deploy to GitHub Pages

Your site will be available at: `https://chardila.github.io/cartographers/`

## Manual Deployment (Alternative)

If you prefer to build locally and push the dist folder:

```bash
# Build with your local .env
npm run build

# Deploy dist folder to gh-pages branch
npx gh-pages -d dist
```

Note: This requires the `gh-pages` package: `npm install -D gh-pages`

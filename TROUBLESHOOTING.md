# GitHub Pages Deployment - Troubleshooting

## Issue Found

The site is deploying the **source code** instead of the **built production bundle**.

### Root Cause
GitHub Pages is likely set to deploy from the `master` branch directly, rather than using GitHub Actions to build and deploy the `dist/` folder.

### Solution

1. **Verify GitHub Pages Source**:
   - Go to: Settings → Pages
   - Under "Source", it MUST say **"GitHub Actions"** (not "Deploy from a branch")
   
2. **Move Variables from Environment to Secrets**:
   - The variables you created in the "github-pages" environment won't work
   - You need to create them as **Repository Secrets**:
     - Go to: Settings → Secrets and variables → **Actions** (not Environments)
     - Click "New repository secret"
     - Add each variable:
       - `VITE_FIREBASE_API_KEY`
       - `VITE_FIREBASE_AUTH_DOMAIN`
       - `VITE_FIREBASE_DATABASE_URL`
       - `VITE_FIREBASE_PROJECT_ID`
       - `VITE_FIREBASE_STORAGE_BUCKET`
       - `VITE_FIREBASE_MESSAGING_SENDER_ID`
       - `VITE_FIREBASE_APP_ID`

3. **Trigger a New Deployment**:
   - After setting up the secrets, go to Actions tab
   - Find the latest workflow run
   - Click "Re-run all jobs"
   
   OR make a small commit to trigger a new build:
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push
   ```

### How to Verify It's Working

After the workflow runs successfully:
1. Visit your site
2. Open browser DevTools (F12)
3. You should see:
   - NO errors about "MIME type text/css"
   - NO exposed `/src/` files
   - The page should be styled correctly

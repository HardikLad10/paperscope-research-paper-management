# Deploy PaperScope API to Vercel

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PaperScope API"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the `api` folder (or root if it's the only project)

3. **Configure Environment Variables:**
   In Vercel project settings, add these environment variables:
   - `DB_HOST` = `104.197.169.189` (your GCP Cloud SQL IP)
   - `DB_PORT` = `3306`
   - `DB_USER` = `team126`
   - `DB_PASSWORD` = `Team@126`
   - `DB_NAME` = `research_paper_review_db`
   - `PORT` = `4000` (optional, Vercel sets this automatically)

4. **Important: Update Authorized Networks in GCP:**
   - Go to GCP Console → SQL → mysqlteam126 → Networking
   - Add Vercel's IP ranges or use "0.0.0.0/0" for testing (not recommended for production)
   - Better: Use Cloud SQL Proxy or Private IP

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your API will be available at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd api
   vercel
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add DB_HOST
   vercel env add DB_PORT
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add DB_NAME
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Post-Deployment

1. **Update Frontend API URL:**
   - Update `cs_411_frontend/src/config.js`:
   ```javascript
   export const API_BASE_URL = 'https://your-project.vercel.app'
   ```

2. **Test the API:**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

## Important Notes

- **SSL/TLS:** The code already includes SSL configuration for GCP Cloud SQL
- **CORS:** Already enabled for frontend integration
- **Cold Starts:** Vercel serverless functions may have cold starts (first request after inactivity)
- **Database Connection:** Uses connection pooling for efficiency

## Troubleshooting

- **Connection Timeout:** Check GCP authorized networks
- **SSL Errors:** Verify SSL configuration in server.js
- **Environment Variables:** Ensure all are set in Vercel dashboard
- **Build Errors:** Check Vercel build logs

## Production Considerations

1. Use Cloud SQL Private IP (more secure)
2. Implement rate limiting
3. Add authentication/authorization
4. Set up monitoring and logging
5. Use environment-specific configurations


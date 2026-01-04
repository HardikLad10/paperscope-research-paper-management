# Deploy Frontend to Vercel

## Quick Deploy

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Important:** Set the **Root Directory** to `cs_411_frontend`
5. Vercel will auto-detect Vite
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
cd cs_411_frontend
npm i -g vercel
vercel
```

Follow the prompts to deploy.

## Configuration

The frontend is already configured to use:
- Backend API: `https://cs-411-git-main-bharath-ganeshs-projects.vercel.app`

If you need to change it, update `src/config.js` or set the `VITE_API_BASE_URL` environment variable in Vercel.


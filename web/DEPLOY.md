# Frontend Deployment Guide

## Environment Variables

Before deploying, you need to set these environment variables in Vercel:

1. **NEXT_PUBLIC_API_URL**: `https://diamond-auction-api-782007384020.us-central1.run.app`
2. **NEXT_PUBLIC_INSTANTDB_APP_ID**: `fdfdd9c1-9d26-46cb-8659-ca0547ed8a71`

## Local Development Setup

Create a `.env.local` file in the `web` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_INSTANTDB_APP_ID=fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

## Deploy to Vercel

### Option 1: Using Vercel CLI

```powershell
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Navigate to web directory
cd Diamond-Auction-Intelligence-App\web

# Install dependencies (if not already done)
npm install

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No (first time)
# - Project name? diamond-auction-intelligence (or your choice)
# - Directory? ./
# - Override settings? No
```

### Option 2: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository (or upload the `web` folder)
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://diamond-auction-api-782007384020.us-central1.run.app`
   - `NEXT_PUBLIC_INSTANTDB_APP_ID` = `fdfdd9c1-9d26-46cb-8659-ca0547ed8a71`
6. Click "Deploy"

## After Deployment

1. Note your Vercel deployment URL (e.g., `https://diamond-auction-intelligence.vercel.app`)
2. Update Cloud Run CORS settings:
   ```powershell
   gcloud run services update diamond-auction-api `
     --region us-central1 `
     --update-env-vars VERCEL_URL=https://your-app.vercel.app
   ```

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check that TypeScript compiles: `npm run build`

### Environment Variables Not Working
- Vercel requires a redeploy after adding environment variables
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Check Vercel dashboard → Settings → Environment Variables

### CORS Errors
- Ensure `VERCEL_URL` is set in Cloud Run
- Check that `NEXT_PUBLIC_API_URL` matches your Cloud Run URL


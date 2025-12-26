# Vercel Deployment Guide

## Option 1: Deploy via Vercel Dashboard (Recommended - No CLI needed)

### Step 1: Prepare Your Code
1. Ensure your code is in a Git repository (GitHub, GitLab, or Bitbucket)
2. Or use Vercel's direct upload feature

### Step 2: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Choose one of these options:
   - **Import Git Repository**: Connect your GitHub/GitLab/Bitbucket repo
   - **Upload**: Directly upload the `web` folder

### Step 3: Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `web` (if deploying from repo root) or `.` (if uploading web folder)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 4: Set Environment Variables
Before deploying, click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = https://diamond-auction-api-782007384020.us-central1.run.app
NEXT_PUBLIC_INSTANTDB_APP_ID = fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

### Step 5: Deploy
Click **"Deploy"** and wait for the build to complete.

### Step 6: Update CORS
After deployment, note your Vercel URL (e.g., `https://your-app.vercel.app`) and run:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
.\update-cors.ps1 -VercelUrl https://your-app.vercel.app
```

---

## Option 2: Deploy via Vercel CLI

### Prerequisites
1. Install Node.js (if not installed):
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use conda: `conda install nodejs npm`

2. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Step 1: Install Dependencies
```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
npm install
```

### Step 2: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 3: Login to Vercel
```powershell
vercel login
```
This will open a browser for authentication.

### Step 4: Deploy
```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (first time)
- Project name: `diamond-auction-intelligence` (or your choice)
- Directory: `./`
- Override settings? **No**

### Step 5: Set Environment Variables
After first deployment, set environment variables:

**Via CLI:**
```powershell
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://diamond-auction-api-782007384020.us-central1.run.app

vercel env add NEXT_PUBLIC_INSTANTDB_APP_ID
# Enter: fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

**Or via Dashboard:**
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add the variables above

### Step 6: Redeploy
```powershell
vercel --prod
```

### Step 7: Update CORS
```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
.\update-cors.ps1 -VercelUrl https://your-app.vercel.app
```

---

## Quick Deploy Script

If you have Node.js installed, you can use the automated script:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
.\deploy.ps1
```

Then run:
```powershell
vercel
```

---

## Troubleshooting

### Node.js Not Found
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Or use: `conda install nodejs npm`
- Restart your terminal after installation

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (should be 18+)
- Review build logs in Vercel dashboard

### Environment Variables Not Working
- Variables must start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check Vercel dashboard → Settings → Environment Variables

### CORS Errors
- Ensure `VERCEL_URL` is set in Cloud Run
- Wait a few seconds for changes to propagate
- Check browser console for specific CORS errors

---

## After Deployment

1. ✅ Note your Vercel URL
2. ✅ Update CORS in Cloud Run using `update-cors.ps1`
3. ✅ Test the application:
   - Visit your Vercel URL
   - Sign up/Login
   - Upload a dataset
   - Run predictions

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure CORS is configured properly


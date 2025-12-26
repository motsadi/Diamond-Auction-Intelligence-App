# 🚀 Deploy to Vercel Now - Step by Step

## Option A: Vercel Web Dashboard (Easiest - No Node.js Required!)

### Step 1: Go to Vercel
1. Open your browser and go to: **https://vercel.com**
2. Sign in (or create an account if you don't have one)
3. Click **"Add New Project"**

### Step 2: Import Your Project

**Option 2a: If you have a Git Repository**
1. Connect your GitHub/GitLab/Bitbucket account
2. Select your repository
3. Set **Root Directory** to `web` (if repo is at root) or `.` (if uploading web folder)
4. Click **"Import"**

**Option 2b: If you don't have Git (Direct Upload)**
1. Click **"Upload"** or **"Deploy"**
2. Create a ZIP file of the `web` folder:
   ```powershell
   cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
   Compress-Archive -Path web\* -DestinationPath web-deploy.zip
   ```
3. Upload the ZIP file to Vercel

### Step 3: Configure Project Settings

Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `web` or `.` (depending on your setup)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Set Environment Variables (IMPORTANT!)

**Before clicking Deploy**, click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL
Value: https://diamond-auction-api-782007384020.us-central1.run.app

NEXT_PUBLIC_INSTANTDB_APP_ID
Value: fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

### Step 5: Deploy!
Click **"Deploy"** and wait 2-3 minutes for the build to complete.

### Step 6: Get Your Vercel URL
After deployment, Vercel will show you your URL (e.g., `https://diamond-auction-intelligence.vercel.app`)

### Step 7: Update CORS
Run this command with your Vercel URL:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
.\update-cors.ps1 -VercelUrl https://your-app.vercel.app
```

---

## Option B: Install Node.js via Conda (Then Use CLI)

### Step 1: Install Node.js via Conda
```powershell
conda install -c conda-forge nodejs npm
```

### Step 2: Verify Installation
```powershell
node --version
npm --version
```

### Step 3: Install Dependencies
```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
npm install
```

### Step 4: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 5: Login to Vercel
```powershell
vercel login
```
This opens a browser for authentication.

### Step 6: Deploy
```powershell
vercel
```

Follow prompts, then set environment variables in Vercel dashboard.

---

## Quick Checklist

- [ ] Vercel account created/signed in
- [ ] Project imported or uploaded
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_INSTANTDB_APP_ID`
- [ ] Deployment successful
- [ ] Vercel URL noted
- [ ] CORS updated in Cloud Run

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Ensure CORS is updated after deployment
4. Check browser console for errors


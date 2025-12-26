# 🚀 Deploy to Vercel via Web Dashboard - Complete Guide

## Step-by-Step Instructions

### Step 1: Prepare Deployment Package (Optional but Recommended)

Run this script to create a clean ZIP file for upload:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
.\PREPARE_FOR_VERCEL.ps1
```

This creates `web-deploy.zip` in the parent directory.

**OR** you can manually create a ZIP:
1. Navigate to `C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web`
2. Select all files and folders (except `node_modules`, `.next`, `.vercel` if they exist)
3. Right-click → Send to → Compressed (zipped) folder
4. Name it `web-deploy.zip`

---

### Step 2: Go to Vercel Dashboard

1. Open your browser
2. Go to: **https://vercel.com**
3. Sign in (or create an account if needed)
4. Click **"Add New Project"** button

---

### Step 3: Upload Your Project

**Option A: Direct Upload (Easiest)**
1. Click **"Upload"** or **"Deploy"** button
2. Drag and drop your `web-deploy.zip` file OR click to browse and select it
3. Wait for upload to complete

**Option B: Import from Git (If you have a repository)**
1. Connect your GitHub/GitLab/Bitbucket account
2. Select your repository
3. Set **Root Directory** to `web` (if repo is at root) or `.` (if web is the repo root)

---

### Step 4: Configure Project Settings

Vercel should auto-detect Next.js, but verify these settings:

- **Framework Preset**: `Next.js` (should be auto-detected)
- **Root Directory**: `.` (current directory - since you're uploading the web folder)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**Important**: Don't click "Deploy" yet! Set environment variables first.

---

### Step 5: Set Environment Variables (CRITICAL!)

**Before deploying**, click on **"Environment Variables"** section and add:

#### Variable 1:
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://diamond-auction-api-782007384020.us-central1.run.app`
- **Environment**: Select all (Production, Preview, Development)

#### Variable 2:
- **Name**: `NEXT_PUBLIC_INSTANTDB_APP_ID`
- **Value**: `fdfdd9c1-9d26-46cb-8659-ca0547ed8a71`
- **Environment**: Select all (Production, Preview, Development)

Click **"Save"** after adding each variable.

---

### Step 6: Deploy!

1. Click the **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. Watch the build logs for any errors (usually there won't be any)

---

### Step 7: Get Your Deployment URL

After deployment completes:
1. You'll see a success message
2. Your app URL will be displayed (e.g., `https://diamond-auction-intelligence.vercel.app`)
3. **Copy this URL** - you'll need it for the next step

---

### Step 8: Update CORS in Cloud Run

Open PowerShell and run:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
.\update-cors.ps1 -VercelUrl https://your-actual-vercel-url.vercel.app
```

Replace `https://your-actual-vercel-url.vercel.app` with your actual Vercel URL.

---

### Step 9: Test Your Application

1. Visit your Vercel URL in a browser
2. You should see the login/signup page
3. Create an account or sign in
4. Try uploading a dataset
5. Run a prediction

---

## ✅ Deployment Checklist

- [ ] Vercel account created/signed in
- [ ] Project uploaded or imported
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_INSTANTDB_APP_ID`
- [ ] Deployment successful
- [ ] Vercel URL copied
- [ ] CORS updated in Cloud Run
- [ ] Application tested

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all files were uploaded correctly
- Verify `package.json` is included

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_`
- Redeploy after adding variables
- Check that variables are set for all environments

### CORS Errors
- Verify `VERCEL_URL` is set in Cloud Run
- Wait a few seconds for changes to propagate
- Check browser console for specific errors

### App Doesn't Load
- Check Vercel deployment logs
- Verify environment variables are correct
- Ensure backend API is accessible

---

## 📋 Quick Reference

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://diamond-auction-api-782007384020.us-central1.run.app
NEXT_PUBLIC_INSTANTDB_APP_ID=fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

**Backend API:** https://diamond-auction-api-782007384020.us-central1.run.app

**After Deployment:**
```powershell
.\update-cors.ps1 -VercelUrl https://your-app.vercel.app
```

---

## 🎉 You're Done!

Once you complete these steps, your full-stack application will be live!

- Frontend: Your Vercel URL
- Backend: https://diamond-auction-api-782007384020.us-central1.run.app
- Full integration ready to use!


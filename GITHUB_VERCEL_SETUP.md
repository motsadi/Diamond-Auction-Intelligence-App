# Deploy to Vercel via GitHub - Complete Guide

Since Vercel requires GitHub integration, here's how to set it up:

## Option 1: Create GitHub Repository and Connect (Recommended)

### Step 1: Initialize Git Repository (if not already done)

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Diamond Auction Intelligence App"
```

### Step 2: Create GitHub Repository

1. Go to **https://github.com** and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `diamond-auction-intelligence` (or your choice)
4. Description: "Diamond Auction Intelligence Platform"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### Step 3: Connect Local Repository to GitHub

GitHub will show you commands. Use these (replace YOUR_USERNAME with your GitHub username):

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/diamond-auction-intelligence.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: You may need to authenticate. GitHub may prompt for:
- Username and Personal Access Token (PAT)
- Or use GitHub Desktop app for easier authentication

### Step 4: Connect to Vercel

1. Go to **https://vercel.com** and sign in
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub account
5. Find and select `diamond-auction-intelligence` repository
6. Click **"Import"**

### Step 5: Configure Project in Vercel

1. **Root Directory**: Click "Edit" and set to `web`
   - This tells Vercel the Next.js app is in the `web` folder

2. **Framework Preset**: Should auto-detect as Next.js

3. **Build Settings** (should auto-detect):
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 6: Set Environment Variables (BEFORE DEPLOYING!)

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL = https://diamond-auction-api-782007384020.us-central1.run.app
NEXT_PUBLIC_INSTANTDB_APP_ID = fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

Set both for: Production, Preview, and Development

### Step 7: Deploy!

Click **"Deploy"** and wait 2-3 minutes.

### Step 8: Update CORS

After deployment, note your Vercel URL and run:

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App
.\update-cors.ps1 -VercelUrl https://your-app.vercel.app
```

---

## Option 2: Use GitHub Desktop (Easier for Git Beginners)

### Step 1: Install GitHub Desktop

1. Download from: **https://desktop.github.com/**
2. Install and sign in with your GitHub account

### Step 2: Add Repository

1. Open GitHub Desktop
2. File → Add Local Repository
3. Browse to: `C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App`
4. Click "Add Repository"

### Step 3: Commit and Push

1. In GitHub Desktop, you'll see all your files
2. Write commit message: "Initial commit"
3. Click "Commit to main"
4. Click "Publish repository" (top right)
5. Choose name and visibility
6. Click "Publish Repository"

### Step 4: Continue with Vercel

Follow Steps 4-8 from Option 1 above.

---

## Option 3: Alternative - Use Vercel CLI (If You Can Install Node.js)

If you can install Node.js, you can use Vercel CLI which doesn't require GitHub:

1. Install Node.js from https://nodejs.org/
2. Install Vercel CLI: `npm install -g vercel`
3. Run: `vercel` in the web directory
4. Follow prompts

---

## Quick Setup Script

I'll create a script to help you set up Git and prepare for GitHub. Run:

```powershell
.\setup-github.ps1
```

---

## Troubleshooting

### Git Authentication Issues
- Use GitHub Desktop for easier authentication
- Or create a Personal Access Token (PAT) in GitHub Settings → Developer settings → Personal access tokens

### Vercel Can't Find Next.js
- Make sure Root Directory is set to `web`
- Verify `package.json` exists in the `web` folder

### Build Fails
- Check that all files are committed to Git
- Verify environment variables are set
- Check Vercel build logs for specific errors

---

## Important Notes

1. **Root Directory**: Must be set to `web` in Vercel project settings
2. **Environment Variables**: Must be set BEFORE first deployment
3. **GitHub Repository**: Can be private or public - Vercel works with both
4. **Future Updates**: Just push to GitHub, Vercel will auto-deploy

---

## After Setup

Once connected:
- Every push to GitHub main branch = automatic deployment
- Vercel will show deployment status
- You can preview deployments before going live


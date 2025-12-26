# Quick Start - Deployment Complete! 🚀

## ✅ What's Been Completed

### 1. Backend API (Cloud Run) - ✅ DEPLOYED
- **URL**: https://diamond-auction-api-782007384020.us-central1.run.app
- **Status**: Live and healthy
- **Environment Variables**: All configured
- **GCS Permissions**: Verified and working

### 2. GCS Bucket - ✅ CONFIGURED
- **Bucket**: `gs://diamond-auction-datasets-ounas-12202025`
- **Permissions**: Service account has full access
- **Structure**: Ready for datasets and predictions

### 3. Frontend - ⏳ READY TO DEPLOY

## 🎯 Next Steps (Frontend Deployment)

### Option A: Using PowerShell Script (Recommended)

```powershell
cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
.\deploy.ps1
```

Then run:
```powershell
vercel
```

### Option B: Manual Deployment

1. **Install dependencies**:
   ```powershell
   cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web
   npm install
   ```

2. **Install Vercel CLI** (if not installed):
   ```powershell
   npm i -g vercel
   ```

3. **Deploy**:
   ```powershell
   vercel
   ```
   - Follow prompts (first time: create new project)
   - Project name: `diamond-auction-intelligence` (or your choice)

4. **Set Environment Variables in Vercel**:
   - Go to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL = https://diamond-auction-api-782007384020.us-central1.run.app
     NEXT_PUBLIC_INSTANTDB_APP_ID = fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
     ```

5. **Redeploy** (to apply environment variables):
   ```powershell
   vercel --prod
   ```

6. **Update CORS in Cloud Run**:
   ```powershell
   # Replace YOUR_VERCEL_URL with your actual Vercel URL
   gcloud run services update diamond-auction-api `
     --region us-central1 `
     --update-env-vars VERCEL_URL=https://your-app.vercel.app
   ```

## 🧪 Testing

### Test Backend:
```powershell
$API = "https://diamond-auction-api-782007384020.us-central1.run.app"
Invoke-RestMethod "$API/health"
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T..."
}
```

### Test Frontend:
1. Visit your Vercel URL
2. Sign up/Login
3. Upload a dataset
4. Run predictions

## 📋 Configuration Summary

| Component | Value |
|-----------|-------|
| **Backend URL** | https://diamond-auction-api-782007384020.us-central1.run.app |
| **GCS Bucket** | diamond-auction-datasets-ounas-12202025 |
| **InstantDB App ID** | fdfdd9c1-9d26-46cb-8659-ca0547ed8a71 |
| **InstantDB API Key** | 166d86cb-0d95-450a-97d2-5beea31dc818 |

## 📚 Documentation Files

- `DEPLOYMENT_STATUS.md` - Detailed deployment status
- `DEPLOY_NEXT_STEPS.md` - Complete deployment guide
- `web/DEPLOY.md` - Frontend-specific deployment guide
- `web/deploy.ps1` - Automated deployment script

## 🆘 Troubleshooting

### Frontend won't connect to backend
- Check `NEXT_PUBLIC_API_URL` in Vercel matches Cloud Run URL
- Verify CORS: Set `VERCEL_URL` in Cloud Run after frontend deployment

### CORS errors
- Ensure `VERCEL_URL` environment variable is set in Cloud Run
- Check that frontend URL matches exactly (including https://)

### Build errors
- Run `npm install` in the `web` directory
- Check Node.js version (should be 18+)

## ✨ You're Almost There!

Once the frontend is deployed and environment variables are set, your full-stack application will be live! 🎉


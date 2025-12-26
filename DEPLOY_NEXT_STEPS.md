# Next Steps After Backend Deployment

Your FastAPI backend is successfully deployed to Cloud Run! 🎉

**Service URL**: https://diamond-auction-api-782007384020.us-central1.run.app

## Step 1: Configure Cloud Run Environment Variables

Set the required environment variables in your Cloud Run service:

```powershell
# Set environment variables
gcloud run services update diamond-auction-api `
  --region us-central1 `
  --update-env-vars GCS_BUCKET_NAME=diamond-auction-datasets-ounas-12202025,INSTANTDB_API_KEY=166d86cb-0d95-450a-97d2-5beea31dc818,INSTANTDB_APP_ID=fdfdd9c1-9d26-46cb-8659-ca0547ed8a71,INSTANTDB_API_URL=https://api.instantdb.com
```

**Important**: After deploying your frontend to Vercel, you'll also need to add:
```powershell
gcloud run services update diamond-auction-api `
  --region us-central1 `
  --update-env-vars VERCEL_URL=https://your-app.vercel.app
```

## Step 2: Verify GCS Bucket and Permissions

Ensure your GCS bucket exists and Cloud Run has access:

```powershell
# Check if bucket exists
gsutil ls gs://diamond-auction-datasets-ounas-12202025

# If it doesn't exist, create it:
gsutil mb -p igneous-fort-481817-q4 -l us-central1 gs://diamond-auction-datasets-ounas-12202025
```

**Note**: Cloud Run uses the default Compute Engine service account. Ensure it has:
- Storage Object Admin role (or at minimum: Storage Object Creator + Storage Object Viewer)
- Service Account Token Creator (for signed URLs)

## Step 3: Deploy Next.js Frontend to Vercel

### 3.1 Install Vercel CLI (if not already installed)
```powershell
npm i -g vercel
```

### 3.2 Navigate to web directory and deploy
```powershell
cd Diamond-Auction-Intelligence-App\web
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (first time) or **Yes** (if redeploying)
- Project name? (e.g., `diamond-auction-intelligence`)
- Directory? `./` (current directory)
- Override settings? **No**

### 3.3 Set Vercel Environment Variables

After deployment, go to Vercel Dashboard → Your Project → Settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://diamond-auction-api-782007384020.us-central1.run.app
NEXT_PUBLIC_INSTANTDB_APP_ID=fdfdd9c1-9d26-46cb-8659-ca0547ed8a71
```

### 3.4 Redeploy with Environment Variables

After setting environment variables, trigger a new deployment:
```powershell
vercel --prod
```

## Step 4: Update CORS in Backend

Once you have your Vercel URL, update the CORS origins in `main.py` and redeploy:

1. Update `main.py` CORS origins (line 34-37) to include your Vercel URL
2. Or set `VERCEL_URL` environment variable in Cloud Run (recommended)

The code already reads from `VERCEL_URL` env var, so just set it in Cloud Run:
```powershell
gcloud run services update diamond-auction-api `
  --region us-central1 `
  --update-env-vars VERCEL_URL=https://your-app.vercel.app
```

## Step 5: Test the Integration

### 5.1 Test Health Endpoint
```powershell
$API = "https://diamond-auction-api-782007384020.us-central1.run.app"
Invoke-RestMethod "$API/health"
```

### 5.2 Test from Frontend
1. Visit your Vercel deployment URL
2. Sign up/Login (InstantDB auth)
3. Upload a dataset
4. Run predictions

## Step 6: Verify InstantDB Setup

Ensure your InstantDB schema is configured according to `INSTANTDB_SCHEMA.md`:
- Users table
- Datasets table
- Predictions table
- Models table
- Audit logs table

## Troubleshooting

### CORS Errors
- Ensure `VERCEL_URL` is set in Cloud Run
- Check that frontend is using correct `NEXT_PUBLIC_API_URL`

### GCS Upload Failures
- Verify Cloud Run service account has Storage permissions
- Check bucket name matches `GCS_BUCKET_NAME` env var

### Authentication Issues
- Verify `INSTANTDB_API_KEY` and `INSTANTDB_APP_ID` are correct
- Check InstantDB dashboard for API status

## Quick Reference Commands

```powershell
# View Cloud Run service details
gcloud run services describe diamond-auction-api --region us-central1

# View Cloud Run logs
gcloud run services logs read diamond-auction-api --region us-central1 --limit 50

# Update environment variables
gcloud run services update diamond-auction-api --region us-central1 --update-env-vars KEY=VALUE

# View Vercel deployments
cd web
vercel ls

# View Vercel logs
vercel logs
```

## What's Next?

After completing these steps:
1. ✅ Backend API is live and configured
2. ✅ Frontend is deployed and connected
3. ✅ Full stack is operational

Then you can:
- Add monitoring (Cloud Monitoring, Sentry)
- Set up CI/CD pipelines
- Implement proper JWT verification
- Add automated testing
- Set up backup strategies


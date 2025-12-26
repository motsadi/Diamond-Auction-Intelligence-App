# Deployment Guide

This guide covers deploying the Diamond Auction Intelligence platform to production.

## Architecture Overview

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: FastAPI service deployed on Google Cloud Run
- **Database & Auth**: InstantDB
- **Storage**: Google Cloud Storage (GCS)

## Prerequisites

1. Google Cloud Platform account with billing enabled
2. InstantDB account
3. Vercel account (or alternative hosting for Next.js)

## Step 1: InstantDB Setup

### 1.1 Create InstantDB App

1. Go to [InstantDB Dashboard](https://instantdb.com)
2. Create a new app
3. Note your **App ID** and generate an **API Key**

### 1.2 Define Schema

In the InstantDB console, define the following schema:

```json
{
  "users": {
    "id": "string",
    "email": "string",
    "role": "string", // "user" | "admin"
    "createdAt": "number"
  },
  "datasets": {
    "id": "string",
    "ownerId": "string",
    "name": "string",
    "createdAt": "number",
    "gcsBucket": "string",
    "gcsObject": "string",
    "rowCount": "number",
    "columns": "array<string>",
    "notes": "string?"
  },
  "predictions": {
    "id": "string",
    "ownerId": "string",
    "datasetId": "string",
    "modelName": "string",
    "horizon": "number?",
    "createdAt": "number",
    "metrics": "object?",
    "outputGcsObject": "string?",
    "previewRows": "array<object>?"
  },
  "models": {
    "id": "string",
    "name": "string",
    "version": "string",
    "description": "string?",
    "features": "array<string>",
    "createdAt": "number"
  },
  "audit_logs": {
    "id": "string",
    "actorId": "string",
    "action": "string",
    "entityType": "string",
    "entityId": "string",
    "createdAt": "number",
    "meta": "object?"
  }
}
```

### 1.3 Set Permissions

Configure permissions so:
- Users can only read/write their own datasets and predictions
- Only admins can write models and read audit_logs

Example permission rules (adjust based on InstantDB's permission syntax):

```json
{
  "datasets": {
    "read": "ownerId == auth.id",
    "write": "ownerId == auth.id"
  },
  "predictions": {
    "read": "ownerId == auth.id",
    "write": "ownerId == auth.id"
  },
  "models": {
    "read": "true",
    "write": "auth.role == 'admin'"
  },
  "audit_logs": {
    "read": "auth.role == 'admin'",
    "write": "auth.role == 'admin'"
  }
}
```

### 1.4 Bootstrap First Admin User

After creating your first user account through the app, assign admin role:

1. Use InstantDB console to update the user record:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'
   ```

   Or use InstantDB's GraphQL/REST API to update the user's role field.

## Step 2: Google Cloud Storage Setup

### 2.1 Create GCS Bucket

```bash
gsutil mb -p YOUR_PROJECT_ID -l us-central1 gs://diamond-auction-data
```

### 2.2 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com) > IAM & Admin > Service Accounts
2. Create a new service account (e.g., `diamond-auction-api`)
3. Grant the following roles:
   - **Storage Object Admin** (for reading/writing objects)
   - **Service Account Token Creator** (for signing URLs)

### 2.3 Generate Service Account Key

1. Click on the service account
2. Go to "Keys" tab
3. Create a new JSON key
4. Download and securely store the key file
5. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of this file

### 2.4 Required Permissions

The service account needs:
- `storage.objects.create` - Create objects in bucket
- `storage.objects.get` - Read objects from bucket
- `storage.objects.delete` - Delete objects (optional)
- `iam.serviceAccounts.signBlob` - Generate signed URLs

## Step 3: Deploy FastAPI Backend to Cloud Run

### 3.1 Build Docker Image

```bash
cd api
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/diamond-auction-api
```

### 3.2 Deploy to Cloud Run

```bash
gcloud run deploy diamond-auction-api \
  --image gcr.io/YOUR_PROJECT_ID/diamond-auction-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCS_BUCKET_NAME=your-bucket-name,INSTANTDB_API_KEY=your_key,INSTANTDB_APP_ID=your_app_id
```

### 3.3 Set Environment Variables

Set the following environment variables in Cloud Run:

- `GCS_BUCKET_NAME` - Your GCS bucket name
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON (or use Workload Identity)
- `INSTANTDB_API_KEY` - Your InstantDB API key
- `INSTANTDB_APP_ID` - Your InstantDB app ID
- `INSTANTDB_API_URL` - InstantDB API URL (default: https://api.instantdb.com)
- `VERCEL_URL` - Your Vercel deployment URL (for CORS)

### 3.4 Note the Service URL

After deployment, note the Cloud Run service URL (e.g., `https://diamond-auction-api-xxx.run.app`).

## Step 4: Deploy Next.js Frontend to Vercel

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 4.2 Deploy

```bash
cd web
vercel
```

Follow the prompts to link your project.

### 4.3 Set Environment Variables

In Vercel dashboard, set:

- `NEXT_PUBLIC_INSTANTDB_APP_ID` - Your InstantDB app ID
- `NEXT_PUBLIC_API_URL` - Your Cloud Run service URL

### 4.4 Configure Build Settings

Vercel should auto-detect Next.js. Ensure:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

## Step 5: Local Development

### 5.1 Backend Setup

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file (copy from `env.example`):
```bash
cp env.example .env
# Edit .env with your values
```

Run the API:
```bash
uvicorn main:app --reload --port 8000
```

### 5.2 Frontend Setup

```bash
cd web
npm install
```

Create `.env.local` file:
```
NEXT_PUBLIC_INSTANTDB_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

Visit `http://localhost:3000`

### 5.3 Testing Upload Flow

1. Sign up/login in the app
2. Go to Datasets > Upload Dataset
3. Select a CSV file
4. The app will:
   - Request signed upload URL from API
   - Upload directly to GCS
   - Register dataset metadata in InstantDB

### 5.4 Testing Prediction Flow

1. Select a dataset
2. Go to Forecast page
3. Choose model and run forecast
4. View results and metrics

## Troubleshooting

### CORS Errors

- Ensure `VERCEL_URL` is set in Cloud Run environment variables
- Check that `NEXT_PUBLIC_API_URL` in Vercel matches your Cloud Run URL

### GCS Upload Failures

- Verify service account has correct permissions
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to valid JSON key
- Ensure bucket name is correct

### InstantDB Connection Issues

- Verify `INSTANTDB_API_KEY` and `INSTANTDB_APP_ID` are correct
- Check InstantDB dashboard for API status
- Review permission rules in InstantDB console

### Model Training Failures

- Ensure dataset has required columns: `carat`, `color`, `clarity`, `viewings`, `price_index`
- For training, dataset must also have `final_price` and `sold` columns
- Check Cloud Run logs for detailed error messages

## Security Notes

- Never commit `.env` files or service account keys to git
- Use Google Cloud Secret Manager for sensitive values in production
- Implement proper JWT verification in the FastAPI auth dependency
- Use HTTPS for all API endpoints
- Regularly rotate API keys and service account keys

## Cost Optimization

- Use Cloud Run's min instances = 0 to scale to zero when not in use
- Set up GCS lifecycle policies to archive old datasets
- Monitor Cloud Run and GCS usage in Google Cloud Console

## Next Steps

- Set up monitoring and alerting (Cloud Monitoring, Sentry)
- Implement CI/CD pipelines
- Add automated testing
- Set up backup strategies for InstantDB data











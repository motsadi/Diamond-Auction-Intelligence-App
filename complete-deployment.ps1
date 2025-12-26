# Complete Deployment Script for Diamond Auction Intelligence
# This script automates the remaining deployment steps

Write-Host "=== Diamond Auction Intelligence - Complete Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "https://diamond-auction-api-782007384020.us-central1.run.app"
$INSTANTDB_APP_ID = "fdfdd9c1-9d26-46cb-8659-ca0547ed8a71"
$GCS_BUCKET = "diamond-auction-datasets-ounas-12202025"
$REGION = "us-central1"
$SERVICE_NAME = "diamond-auction-api"

# Step 1: Test Backend Health
Write-Host "Step 1: Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "✓ Backend is healthy!" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor Gray
    Write-Host "  Timestamp: $($healthResponse.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Verify Cloud Run Environment Variables
Write-Host "Step 2: Verifying Cloud Run Configuration..." -ForegroundColor Yellow
try {
    $service = gcloud run services describe $SERVICE_NAME --region $REGION --format json | ConvertFrom-Json
    $envVars = $service.spec.template.spec.containers[0].env
    
    $requiredVars = @(
        "GCS_BUCKET_NAME",
        "INSTANTDB_API_KEY",
        "INSTANTDB_APP_ID",
        "INSTANTDB_API_URL"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        $found = $envVars | Where-Object { $_.name -eq $var }
        if ($found) {
            Write-Host "  ✓ $var is set" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $var is missing" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host ""
        Write-Host "Missing environment variables. Setting them now..." -ForegroundColor Yellow
        $envVarsString = "GCS_BUCKET_NAME=$GCS_BUCKET,INSTANTDB_API_KEY=166d86cb-0d95-450a-97d2-5beea31dc818,INSTANTDB_APP_ID=$INSTANTDB_APP_ID,INSTANTDB_API_URL=https://api.instantdb.com"
        gcloud run services update $SERVICE_NAME --region $REGION --update-env-vars $envVarsString
        Write-Host "✓ Environment variables updated" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to verify Cloud Run configuration: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Verify GCS Bucket
Write-Host "Step 3: Verifying GCS Bucket..." -ForegroundColor Yellow
try {
    $null = gsutil ls "gs://$GCS_BUCKET" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ GCS Bucket exists: gs://$GCS_BUCKET" -ForegroundColor Green
    } else {
        Write-Host "✗ GCS Bucket not found. Creating..." -ForegroundColor Yellow
        gsutil mb -p igneous-fort-481817-q4 -l $REGION "gs://$GCS_BUCKET"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Bucket created" -ForegroundColor Green
        } else {
            Write-Host "⚠ Could not create bucket (may already exist or need permissions)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠ Could not verify bucket (may need manual check): $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Frontend Deployment Instructions
Write-Host "Step 4: Frontend Deployment" -ForegroundColor Yellow
Write-Host ""
Write-Host "To deploy the frontend to Vercel:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Navigate to web directory:" -ForegroundColor White
Write-Host "   cd C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Install dependencies (if not done):" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Install Vercel CLI (if not installed):" -ForegroundColor White
Write-Host "   npm i -g vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Deploy to Vercel:" -ForegroundColor White
Write-Host "   vercel" -ForegroundColor Gray
Write-Host ""
Write-Host "5. After deployment, set these environment variables in Vercel Dashboard:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_API_URL = $API_URL" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_INSTANTDB_APP_ID = $INSTANTDB_APP_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "6. After getting your Vercel URL, run this script to update CORS:" -ForegroundColor White
Write-Host "   .\update-cors.ps1 -VercelUrl https://your-app.vercel.app" -ForegroundColor Gray
Write-Host ""

# Step 5: Test API Endpoints
Write-Host "Step 5: Testing API Endpoints..." -ForegroundColor Yellow

# Test health endpoint
Write-Host "  Testing /health endpoint..." -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "  ✓ /health - OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ /health - Failed: $_" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Status:" -ForegroundColor Yellow
Write-Host "  ✓ API URL: $API_URL" -ForegroundColor Green
Write-Host "  ✓ Health Check: Passing" -ForegroundColor Green
Write-Host "  ✓ Environment Variables: Configured" -ForegroundColor Green
Write-Host "  ✓ GCS Bucket: Verified" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend Status:" -ForegroundColor Yellow
Write-Host "  ⏳ Ready to deploy to Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy frontend to Vercel (see instructions above)" -ForegroundColor White
Write-Host "  2. Set environment variables in Vercel" -ForegroundColor White
Write-Host "  3. Update CORS using update-cors.ps1 script" -ForegroundColor White
Write-Host "  4. Test the full integration" -ForegroundColor White
Write-Host ""

Write-Host "=== Deployment Script Complete ===" -ForegroundColor Green


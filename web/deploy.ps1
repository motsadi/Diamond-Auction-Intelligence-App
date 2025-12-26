# Frontend Deployment Script for Vercel
# Run this script from the web directory

Write-Host "=== Diamond Auction Intelligence - Frontend Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✓ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm i -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Vercel CLI installed" -ForegroundColor Green
}

# Check for environment variables
Write-Host ""
Write-Host "Environment Variables Check:" -ForegroundColor Cyan
Write-Host "  NEXT_PUBLIC_API_URL: https://diamond-auction-api-782007384020.us-central1.run.app" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_INSTANTDB_APP_ID: fdfdd9c1-9d26-46cb-8659-ca0547ed8a71" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠ Note: These will need to be set in Vercel Dashboard after deployment" -ForegroundColor Yellow
Write-Host ""

# Build check
Write-Host "Running build check..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Deploy to Vercel
Write-Host ""
Write-Host "Ready to deploy to Vercel!" -ForegroundColor Cyan
Write-Host "Run: vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "After deployment:" -ForegroundColor Cyan
Write-Host "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables" -ForegroundColor White
Write-Host "2. Add NEXT_PUBLIC_API_URL = https://diamond-auction-api-782007384020.us-central1.run.app" -ForegroundColor White
Write-Host "3. Add NEXT_PUBLIC_INSTANTDB_APP_ID = fdfdd9c1-9d26-46cb-8659-ca0547ed8a71" -ForegroundColor White
Write-Host "4. Redeploy or trigger a new deployment" -ForegroundColor White
Write-Host ""


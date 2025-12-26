# Script to prepare web folder for Vercel deployment
# This creates a clean deployment package

Write-Host "=== Preparing Web Folder for Vercel Deployment ===" -ForegroundColor Cyan
Write-Host ""

$webPath = "C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web"
$zipPath = "C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App\web-deploy.zip"

# Check if web folder exists
if (-not (Test-Path $webPath)) {
    Write-Host "Error: Web folder not found at $webPath" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating deployment package..." -ForegroundColor Yellow

# Create a temporary directory for clean files
$tempDir = Join-Path $env:TEMP "vercel-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Copy all necessary files (excluding node_modules, .next, etc.)
    $excludePatterns = @('node_modules', '.next', '.vercel', '*.log', '.env.local', '.env')
    
    Get-ChildItem -Path $webPath -Recurse | Where-Object {
        $item = $_
        $shouldExclude = $false
        
        foreach ($pattern in $excludePatterns) {
            if ($item.FullName -like "*\$pattern\*" -or $item.Name -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        -not $shouldExclude
    } | ForEach-Object {
        $relativePath = $_.FullName.Substring($webPath.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $_.FullName -Destination $destPath -Force
    }
    
    Write-Host "  Files prepared" -ForegroundColor Green
    
    # Create ZIP file
    Write-Host "Step 2: Creating ZIP file..." -ForegroundColor Yellow
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
    
    Write-Host "  ZIP file created: $zipPath" -ForegroundColor Green
    
    # Clean up temp directory
    Remove-Item $tempDir -Recurse -Force
    
    Write-Host ""
    Write-Host "=== Preparation Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com and sign in" -ForegroundColor White
    Write-Host "2. Click 'Add New Project'" -ForegroundColor White
    Write-Host "3. Click 'Upload' or 'Deploy'" -ForegroundColor White
    Write-Host "4. Upload the file: $zipPath" -ForegroundColor White
    Write-Host "5. BEFORE deploying, set environment variables:" -ForegroundColor Yellow
    Write-Host "   - NEXT_PUBLIC_API_URL = https://diamond-auction-api-782007384020.us-central1.run.app" -ForegroundColor Gray
    Write-Host "   - NEXT_PUBLIC_INSTANTDB_APP_ID = fdfdd9c1-9d26-46cb-8659-ca0547ed8a71" -ForegroundColor Gray
    Write-Host "6. Click 'Deploy'" -ForegroundColor White
    Write-Host "7. After deployment, note your Vercel URL and run:" -ForegroundColor White
    Write-Host "   .\update-cors.ps1 -VercelUrl https://your-app.vercel.app" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    exit 1
}


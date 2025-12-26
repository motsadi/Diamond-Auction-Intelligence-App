# Script to update CORS settings in Cloud Run after frontend deployment
param(
    [Parameter(Mandatory=$true)]
    [string]$VercelUrl
)

Write-Host "=== Updating CORS Configuration ===" -ForegroundColor Cyan
Write-Host ""

$SERVICE_NAME = "diamond-auction-api"
$REGION = "us-central1"

# Remove https:// if present (we'll add it properly)
$VercelUrl = $VercelUrl.Trim()
if (-not $VercelUrl.StartsWith("http")) {
    $VercelUrl = "https://$VercelUrl"
}

Write-Host "Updating Cloud Run service with Vercel URL: $VercelUrl" -ForegroundColor Yellow

try {
    # Get current environment variables
    $service = gcloud run services describe $SERVICE_NAME --region $REGION --format json | ConvertFrom-Json
    $currentEnvVars = $service.spec.template.spec.containers[0].env
    
    # Build environment variables string
    $envVars = @()
    foreach ($env in $currentEnvVars) {
        if ($env.name -ne "VERCEL_URL") {
            $envVars += "$($env.name)=$($env.value)"
        }
    }
    # Add or update VERCEL_URL
    $envVars += "VERCEL_URL=$VercelUrl"
    
    $envVarsString = $envVars -join ","
    
    # Update the service
    Write-Host "Updating environment variables..." -ForegroundColor Gray
    gcloud run services update $SERVICE_NAME `
        --region $REGION `
        --update-env-vars $envVarsString
    
    Write-Host ""
    Write-Host "✓ CORS configuration updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The backend will now accept requests from:" -ForegroundColor Cyan
    Write-Host "  - http://localhost:3000" -ForegroundColor Gray
    Write-Host "  - http://localhost:3001" -ForegroundColor Gray
    Write-Host "  - $VercelUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: It may take a few seconds for the changes to propagate." -ForegroundColor Yellow
    
} catch {
    Write-Host ""
    Write-Host "✗ Failed to update CORS: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual update command:" -ForegroundColor Yellow
    Write-Host "gcloud run services update $SERVICE_NAME --region $REGION --update-env-vars VERCEL_URL=$VercelUrl" -ForegroundColor Gray
    exit 1
}


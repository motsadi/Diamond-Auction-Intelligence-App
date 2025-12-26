# API Testing Script
# Tests all available API endpoints

$API_URL = "https://diamond-auction-api-782007384020.us-central1.run.app"

Write-Host "=== API Endpoint Testing ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing API: $API_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check (/health)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "  Status: $($response.status)" -ForegroundColor Green
    Write-Host "  Timestamp: $($response.timestamp)" -ForegroundColor Green
} catch {
    Write-Host "  Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: CORS Headers (if accessible)
Write-Host "Test 2: CORS Headers" -ForegroundColor Yellow
try {
    $headers = Invoke-WebRequest -Uri "$API_URL/health" -Method Options -UseBasicParsing
    $corsHeaders = $headers.Headers["Access-Control-Allow-Origin"]
    if ($corsHeaders) {
        Write-Host "  CORS Headers Present" -ForegroundColor Green
        Write-Host "    Allow-Origin: $corsHeaders" -ForegroundColor Gray
    } else {
        Write-Host "  CORS Headers not visible (may be normal)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not check CORS headers: $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: API Documentation (if available)
Write-Host "Test 3: API Documentation" -ForegroundColor Yellow
try {
    $docs = Invoke-WebRequest -Uri "$API_URL/docs" -UseBasicParsing
    Write-Host "  API Docs available at: $API_URL/docs" -ForegroundColor Green
} catch {
    Write-Host "  API Docs endpoint not accessible" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: OpenAPI Schema
Write-Host "Test 4: OpenAPI Schema" -ForegroundColor Yellow
try {
    $schema = Invoke-RestMethod -Uri "$API_URL/openapi.json" -Method Get
    Write-Host "  OpenAPI Schema available" -ForegroundColor Green
    Write-Host "    Title: $($schema.info.title)" -ForegroundColor Gray
    Write-Host "    Version: $($schema.info.version)" -ForegroundColor Gray
    Write-Host "    Endpoints: $($schema.paths.PSObject.Properties.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  OpenAPI Schema not accessible" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Protected endpoints require authentication tokens." -ForegroundColor Yellow
Write-Host "To test authenticated endpoints:" -ForegroundColor Yellow
Write-Host "  1. Sign up/login via the frontend" -ForegroundColor White
Write-Host "  2. Get the auth token from localStorage" -ForegroundColor White
Write-Host "  3. Include it in the Authorization header" -ForegroundColor White
Write-Host ""

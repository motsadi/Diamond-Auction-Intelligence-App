# Local development script for Windows PowerShell
# Starts both frontend and backend

Write-Host "Starting Diamond Auction Intelligence Platform..." -ForegroundColor Green

# Start backend
Write-Host "Starting FastAPI backend on port 8000..." -ForegroundColor Yellow
Set-Location api
if (-not (Test-Path venv)) {
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt -q
Start-Process powershell -ArgumentList "-NoExit", "-Command", "uvicorn main:app --reload --port 8000"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Next.js frontend on port 3000..." -ForegroundColor Yellow
Set-Location ..\web
if (-not (Test-Path node_modules)) {
    npm install
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "Backend running on http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend running on http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Both servers are running in separate windows. Close them when done." -ForegroundColor Cyan























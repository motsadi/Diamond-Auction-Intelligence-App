# Script to set up Git repository for GitHub deployment

Write-Host "=== GitHub Repository Setup ===" -ForegroundColor Cyan
Write-Host ""

$repoPath = "C:\Users\Onalethata\Desktop\DAI\Diamond-Auction-Intelligence-App"

# Check if Git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Install Git from https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Use GitHub Desktop from https://desktop.github.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing Git, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Git found: $(git --version)" -ForegroundColor Green
Write-Host ""

# Navigate to repository
Set-Location $repoPath

# Check if already a git repository
if (Test-Path .git) {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
    $response = Read-Host "Do you want to reinitialize? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Skipping initialization." -ForegroundColor Gray
    } else {
        Write-Host "Reinitializing..." -ForegroundColor Yellow
        git init
    }
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized." -ForegroundColor Green
}

Write-Host ""

# Check if .gitignore exists
if (-not (Test-Path .gitignore)) {
    Write-Host "Creating .gitignore..." -ForegroundColor Yellow
    @"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Node
node_modules/
.next/
.vercel/

# Environment
.env
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log

# Deployment
web-deploy.zip
"@ | Out-File -FilePath .gitignore -Encoding UTF8
    Write-Host ".gitignore created." -ForegroundColor Green
}

Write-Host ""

# Check current status
Write-Host "Checking repository status..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $response = Read-Host "Do you want to add and commit all changes? (Y/n)"
    if ($response -ne "n" -and $response -ne "N") {
        Write-Host "Adding all files..." -ForegroundColor Yellow
        git add .
        Write-Host "Creating commit..." -ForegroundColor Yellow
        git commit -m "Initial commit - Diamond Auction Intelligence App"
        Write-Host "Files committed." -ForegroundColor Green
    }
} else {
    Write-Host "No uncommitted changes." -ForegroundColor Green
}

Write-Host ""

# Check for remote
$remotes = git remote -v
if ($remotes) {
    Write-Host "Existing remotes found:" -ForegroundColor Yellow
    Write-Host $remotes
    Write-Host ""
} else {
    Write-Host "No remote repository configured." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://github.com and create a new repository" -ForegroundColor White
    Write-Host "2. Copy the repository URL (e.g., https://github.com/username/repo.git)" -ForegroundColor White
    Write-Host "3. Run this command to add remote:" -ForegroundColor White
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git" -ForegroundColor Gray
    Write-Host "4. Push to GitHub:" -ForegroundColor White
    Write-Host "   git branch -M main" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use GitHub Desktop for easier setup!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "After pushing to GitHub:" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com" -ForegroundColor White
Write-Host "2. Click 'Add New Project'" -ForegroundColor White
Write-Host "3. Import from GitHub" -ForegroundColor White
Write-Host "4. Set Root Directory to 'web'" -ForegroundColor White
Write-Host "5. Set environment variables" -ForegroundColor White
Write-Host "6. Deploy!" -ForegroundColor White
Write-Host ""


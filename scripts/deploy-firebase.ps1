# Firebase Deployment Script (PowerShell)
# Deploys all Firebase services in sequence for production deployment

param(
    [switch]$WithHosting
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Starting Firebase deployment..." -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Error "Firebase CLI is not installed. Please install it first:"
    Write-Host "npm install -g firebase-tools"
    exit 1
}

# Check if user is logged in to Firebase
try {
    firebase projects:list | Out-Null
} catch {
    Write-Error "Not logged in to Firebase. Please run 'firebase login' first."
    exit 1
}

Write-Status "Checking Firebase project configuration..."

# Verify firebase.json exists
if (-not (Test-Path "firebase.json")) {
    Write-Error "firebase.json not found. Make sure you're in the project root directory."
    exit 1
}

# Deploy Firestore security rules
Write-Status "Deploying Firestore security rules..."
$result = firebase deploy --only firestore:rules 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Firestore security rules"
    Write-Host $result
    exit 1
} else {
    Write-Success "Firestore security rules deployed successfully"
}

# Deploy Firestore indexes
Write-Status "Deploying Firestore indexes..."
$result = firebase deploy --only firestore:indexes 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Firestore indexes"
    Write-Host $result
    exit 1
} else {
    Write-Success "Firestore indexes deployed successfully"
}

# Deploy Storage security rules
Write-Status "Deploying Storage security rules..."
$result = firebase deploy --only storage 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to deploy Storage security rules"
    Write-Host $result
    exit 1
} else {
    Write-Success "Storage security rules deployed successfully"
}

# Optional: Deploy hosting (if needed for static assets)
if ($WithHosting) {
    Write-Status "Deploying Firebase Hosting..."
    $result = firebase deploy --only hosting 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Firebase Hosting deployment failed (this is optional)"
        Write-Host $result
    } else {
        Write-Success "Firebase Hosting deployed successfully"
    }
}

Write-Success "Firebase deployment completed successfully!"
Write-Host "==================================" -ForegroundColor Blue
Write-Host "Services deployed:"
Write-Host "  [OK] Firestore Security Rules"
Write-Host "  [OK] Firestore Indexes"
Write-Host "  [OK] Storage Security Rules"
if ($WithHosting) {
    Write-Host "  [OK] Firebase Hosting"
}
Write-Host ""
Write-Host "Your Firebase backend is now ready for production!" -ForegroundColor Green
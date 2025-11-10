# Pre-Deployment Check Script (PowerShell)
# Validates environment and runs tests before deployment

Write-Host "Running pre-deployment checks..." -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Track overall status
$ChecksPassed = 0
$TotalChecks = 0

# Function to run a check and track results
function Test-DeploymentCheck {
    param(
        [string]$CheckName,
        [string]$Command
    )
    
    $script:TotalChecks++
    Write-Host "[INFO] Running: $CheckName" -ForegroundColor Cyan
    
    try {
        $output = Invoke-Expression $Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] $CheckName passed" -ForegroundColor Green
            $script:ChecksPassed++
            return $true
        } else {
            Write-Host "[ERROR] $CheckName failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] $CheckName failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Environment Variables Validation
if (Test-DeploymentCheck "Environment validation" "npm run validate:env") {
    Write-Host "  [OK] All required environment variables are set"
} else {
    Write-Host "  [FAIL] Missing required environment variables"
    Write-Host "  [TIP] Check .env.example for required variables"
}

# 2. TypeScript Compilation Check
if (Test-DeploymentCheck "TypeScript check" "npx tsc --noEmit") {
    Write-Host "  [OK] TypeScript compilation successful"
} else {
    Write-Host "  [FAIL] TypeScript compilation errors found"
    Write-Host "  [TIP] Fix TypeScript errors before deployment"
}

# 3. Linting Check
if (Test-DeploymentCheck "ESLint check" "npm run lint") {
    Write-Host "  [OK] No linting errors found"
} else {
    Write-Host "  [WARN] Linting issues found (warnings may be acceptable)"
}

# 4. Build Test
if (Test-DeploymentCheck "Build test" "npm run build") {
    Write-Host "  [OK] Production build successful"
} else {
    Write-Host "  [FAIL] Production build failed"
    Write-Host "  [TIP] Fix build errors before deployment"
}

# 5. Unit Tests
if (Test-DeploymentCheck "Unit tests" "npm run test") {
    Write-Host "  [OK] All unit tests passed"
} else {
    Write-Host "  [FAIL] Unit tests failed"
    Write-Host "  [TIP] Fix failing tests before deployment"
}

# 6. Check for required files
Write-Host "[INFO] Checking required deployment files..." -ForegroundColor Cyan
$RequiredFiles = @(
    "package.json",
    "next.config.mjs", 
    "firebase.json",
    "firestore.rules",
    "firestore.indexes.json",
    "storage.rules",
    ".env.example"
)

$FilesCheckPassed = $true
foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file exists"
    } else {
        Write-Host "  [FAIL] $file missing"
        $FilesCheckPassed = $false
    }
}

$TotalChecks++
if ($FilesCheckPassed) {
    $ChecksPassed++
    Write-Host "[SUCCESS] Required files check passed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Required files check failed" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Blue
Write-Host "Pre-deployment Check Summary" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host "Checks passed: $ChecksPassed/$TotalChecks"

if ($ChecksPassed -eq $TotalChecks) {
    Write-Host "All checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Deploy Firebase backend: npm run deploy:firebase"
    Write-Host "2. Deploy to Vercel: git push (if auto-deploy enabled)"
    Write-Host "3. Run post-deployment verification"
    exit 0
} elseif ($ChecksPassed -ge ($TotalChecks - 1)) {
    Write-Host "Most checks passed, but some issues found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You may proceed with deployment, but consider fixing the issues above."
    exit 1
} else {
    Write-Host "Multiple critical issues found. Please fix before deployment." -ForegroundColor Red
    Write-Host ""
    Write-Host "Critical issues must be resolved before deployment."
    exit 1
}
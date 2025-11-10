#!/bin/bash

# Pre-Deployment Check Script
# Validates environment and runs tests before deployment

set -e  # Exit on any error

echo "🔍 Running pre-deployment checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Track overall status
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Function to run a check and track results
run_check() {
    local check_name="$1"
    local check_command="$2"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_status "Running: $check_name"
    
    if eval "$check_command"; then
        print_success "$check_name passed"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        print_error "$check_name failed"
        return 1
    fi
}

# 1. Environment Variables Validation
print_status "Validating environment variables..."
if run_check "Environment validation" "npm run validate:env"; then
    echo "  ✅ All required environment variables are set"
else
    echo "  ❌ Missing required environment variables"
    echo "  💡 Check .env.example for required variables"
fi

# 2. TypeScript Compilation Check
print_status "Checking TypeScript compilation..."
if run_check "TypeScript check" "npx tsc --noEmit"; then
    echo "  ✅ TypeScript compilation successful"
else
    echo "  ❌ TypeScript compilation errors found"
    echo "  💡 Fix TypeScript errors before deployment"
fi

# 3. Linting Check
print_status "Running ESLint..."
if run_check "ESLint check" "npm run lint"; then
    echo "  ✅ No linting errors found"
else
    echo "  ⚠️  Linting issues found (warnings may be acceptable)"
fi

# 4. Build Test
print_status "Testing production build..."
if run_check "Build test" "npm run build"; then
    echo "  ✅ Production build successful"
else
    echo "  ❌ Production build failed"
    echo "  💡 Fix build errors before deployment"
fi

# 5. Unit Tests
print_status "Running unit tests..."
if run_check "Unit tests" "npm run test"; then
    echo "  ✅ All unit tests passed"
else
    echo "  ❌ Unit tests failed"
    echo "  💡 Fix failing tests before deployment"
fi

# 6. Firebase Rules Validation (dry run)
print_status "Validating Firebase security rules..."
if command -v firebase &> /dev/null; then
    if run_check "Firebase rules validation" "firebase deploy --only firestore:rules --dry-run"; then
        echo "  ✅ Firebase security rules are valid"
    else
        echo "  ❌ Firebase security rules validation failed"
        echo "  💡 Check firestore.rules for syntax errors"
    fi
else
    print_warning "Firebase CLI not found, skipping rules validation"
    echo "  ⚠️  Install Firebase CLI: npm install -g firebase-tools"
fi

# 7. Check for required files
print_status "Checking required deployment files..."
REQUIRED_FILES=(
    "package.json"
    "next.config.mjs"
    "firebase.json"
    "firestore.rules"
    "firestore.indexes.json"
    "storage.rules"
    ".env.example"
)

FILES_CHECK_PASSED=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        FILES_CHECK_PASSED=false
    fi
done

if [ "$FILES_CHECK_PASSED" = true ]; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# 8. Check package.json scripts
print_status "Verifying deployment scripts..."
REQUIRED_SCRIPTS=("build" "start" "validate:env")
SCRIPTS_CHECK_PASSED=true

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run "$script" --silent 2>/dev/null | grep -q "Missing script" || ! grep -q "\"$script\"" package.json; then
        echo "  ❌ Script '$script' missing in package.json"
        SCRIPTS_CHECK_PASSED=false
    else
        echo "  ✅ Script '$script' available"
    fi
done

if [ "$SCRIPTS_CHECK_PASSED" = true ]; then
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Summary
echo ""
echo "=================================="
echo "📊 Pre-deployment Check Summary"
echo "=================================="
echo "Checks passed: $CHECKS_PASSED/$TOTAL_CHECKS"

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    print_success "🎉 All checks passed! Ready for deployment."
    echo ""
    echo "Next steps:"
    echo "1. Deploy Firebase backend: npm run deploy:firebase"
    echo "2. Deploy to Vercel: git push (if auto-deploy enabled)"
    echo "3. Run post-deployment verification"
    exit 0
elif [ $CHECKS_PASSED -ge $((TOTAL_CHECKS * 3 / 4)) ]; then
    print_warning "⚠️  Most checks passed, but some issues found."
    echo ""
    echo "You may proceed with deployment, but consider fixing the issues above."
    exit 1
else
    print_error "❌ Multiple critical issues found. Please fix before deployment."
    echo ""
    echo "Critical issues must be resolved before deployment."
    exit 1
fi
#!/bin/bash

# Firebase Deployment Script
# Deploys all Firebase services in sequence for production deployment

set -e  # Exit on any error

echo "🚀 Starting Firebase deployment..."
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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run 'firebase login' first."
    exit 1
fi

print_status "Checking Firebase project configuration..."

# Verify firebase.json exists
if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Deploy Firestore security rules
print_status "Deploying Firestore security rules..."
if firebase deploy --only firestore:rules; then
    print_success "Firestore security rules deployed successfully"
else
    print_error "Failed to deploy Firestore security rules"
    exit 1
fi

# Deploy Firestore indexes
print_status "Deploying Firestore indexes..."
if firebase deploy --only firestore:indexes; then
    print_success "Firestore indexes deployed successfully"
else
    print_error "Failed to deploy Firestore indexes"
    exit 1
fi

# Deploy Storage security rules
print_status "Deploying Storage security rules..."
if firebase deploy --only storage; then
    print_success "Storage security rules deployed successfully"
else
    print_error "Failed to deploy Storage security rules"
    exit 1
fi

# Optional: Deploy hosting (if needed for static assets)
if [ "$1" = "--with-hosting" ]; then
    print_status "Deploying Firebase Hosting..."
    if firebase deploy --only hosting; then
        print_success "Firebase Hosting deployed successfully"
    else
        print_warning "Firebase Hosting deployment failed (this is optional)"
    fi
fi

print_success "🎉 Firebase deployment completed successfully!"
echo "=================================="
echo "Services deployed:"
echo "  ✅ Firestore Security Rules"
echo "  ✅ Firestore Indexes"
echo "  ✅ Storage Security Rules"
if [ "$1" = "--with-hosting" ]; then
    echo "  ✅ Firebase Hosting"
fi
echo ""
echo "Your Firebase backend is now ready for production! 🚀"
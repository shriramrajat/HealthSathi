# Deployment Guide

This guide provides step-by-step instructions for deploying the NeuraNovaa healthcare platform to production using Vercel (frontend) and Firebase (backend).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Firebase Backend Deployment](#firebase-backend-deployment)
- [Vercel Frontend Deployment](#vercel-frontend-deployment)
- [Environment Variables Setup](#environment-variables-setup)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedure](#rollback-procedure)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed (`npm install -g pnpm`)
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Vercel CLI installed (optional, for CLI deployment: `npm install -g vercel`)
- [ ] Firebase project created at [Firebase Console](https://console.firebase.google.com)
- [ ] Vercel account created at [Vercel](https://vercel.com)
- [ ] Git repository connected to Vercel
- [ ] All required environment variables documented

---

## Pre-Deployment Checklist

Complete these steps before deploying:

### 1. Local Build Verification

```bash
# Navigate to project directory
cd NeuraNovaa

# Install dependencies
pnpm install

# Validate environment variables
pnpm run validate:env

# Run local build
pnpm build

# Verify build succeeded
# Check for any TypeScript or build errors
```

### 2. Test Suite Execution

```bash
# Run all tests
pnpm test

# Run integration tests
pnpm run test:integration

# Run performance tests
pnpm run test:performance
```

### 3. Code Quality Checks

```bash
# Run linter
pnpm lint

# Validate translations (if using i18n)
pnpm run i18n:validate
```

### 4. Firebase Configuration Review

```bash
# Validate Firebase security rules (dry run)
pnpm run security:validate

# Review firestore.rules file
# Review storage.rules file
# Review firestore.indexes.json file
```

---

## Firebase Backend Deployment

Deploy Firebase services in the following order:

### Step 1: Login to Firebase

```bash
# Login to Firebase CLI
firebase login

# Verify you're logged in
firebase projects:list

# Select your project
firebase use <your-project-id>
```

### Step 2: Deploy Firestore Security Rules

```bash
# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Verify deployment
# Check Firebase Console > Firestore Database > Rules
```

**Expected Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/<your-project-id>/overview
```

### Step 3: Deploy Firestore Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# This may take several minutes
# Monitor progress in Firebase Console > Firestore Database > Indexes
```

**Note:** Index creation can take 5-15 minutes depending on existing data.

### Step 4: Deploy Storage Security Rules

```bash
# Deploy Storage rules
firebase deploy --only storage

# Verify deployment
# Check Firebase Console > Storage > Rules
```

### Step 5: Deploy All Firebase Services (Alternative)

```bash
# Deploy all Firebase services at once
pnpm run firebase:deploy

# Or use Firebase CLI directly
firebase deploy
```

### Step 6: Verify Firebase Deployment

- [ ] Visit [Firebase Console](https://console.firebase.google.com)
- [ ] Navigate to your project
- [ ] Check Firestore Rules tab - rules should show recent deployment timestamp
- [ ] Check Firestore Indexes tab - all indexes should be "Enabled" (not "Building")
- [ ] Check Storage Rules tab - rules should show recent deployment timestamp

---

## Vercel Frontend Deployment

### Option A: Deploy via Git Push (Recommended)

This is the simplest method and enables automatic deployments on every push.

#### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository containing NeuraNovaa
5. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `NeuraNovaa` (if in monorepo) or `./` (if standalone)
   - **Build Command:** `pnpm run validate:env && pnpm build` (auto-detected from vercel.json)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `pnpm install`

#### Step 2: Configure Environment Variables

See [Environment Variables Setup](#environment-variables-setup) section below.

#### Step 3: Deploy

```bash
# Commit your changes
git add .
git commit -m "chore: prepare for production deployment"

# Push to main branch (triggers automatic deployment)
git push origin main
```

#### Step 4: Monitor Deployment

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Monitor build logs in real-time
4. Wait for "Building" → "Deploying" → "Ready"

**Expected Timeline:** 2-5 minutes

### Option B: Deploy via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to link project
```

---

## Environment Variables Setup

### Step 1: Gather Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click gear icon → "Project settings"
4. Scroll to "Your apps" section
5. Select your web app or create one
6. Copy the Firebase configuration values

### Step 2: Add Environment Variables to Vercel

#### Via Vercel Dashboard (Recommended)

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase app ID | Production, Preview, Development |
| `NEXT_PUBLIC_JITSI_DOMAIN` | `meet.jit.si` (or custom) | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

**Important Notes:**
- Select all three environments (Production, Preview, Development) for each variable
- Click "Save" after adding each variable
- `NEXT_PUBLIC_APP_URL` should be your production domain (e.g., `https://neuranovaa.vercel.app`)

#### Via Vercel CLI (Alternative)

```bash
# Add environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

# You'll be prompted to enter the value
```

### Step 3: Redeploy After Adding Variables

```bash
# Trigger new deployment to apply environment variables
vercel --prod

# Or push a new commit to trigger automatic deployment
git commit --allow-empty -m "chore: trigger deployment with env vars"
git push origin main
```

### Step 4: Verify Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all required variables are present
3. Check that variables are assigned to correct environments

---

## Post-Deployment Verification

### Deployment Verification Checklist

Complete these smoke tests after deployment:

#### 1. Basic Functionality Tests

- [ ] **Homepage Loads**
  - Visit `https://your-app.vercel.app`
  - Page loads without errors
  - No console errors in browser DevTools

- [ ] **Authentication Flow**
  - Navigate to login page
  - Attempt to sign in with test credentials
  - Verify Firebase authentication works
  - Check that user is redirected to dashboard

- [ ] **Dashboard Pages Load**
  - [ ] Doctor Dashboard: `/dashboard/doctor`
  - [ ] Patient Dashboard: `/dashboard/patient`
  - [ ] Admin Dashboard: `/dashboard/admin`
  - [ ] Pharmacy Dashboard: `/dashboard/pharmacy`
  - [ ] CHW Dashboard: `/dashboard/chw`
  - [ ] Emergency Help: `/dashboard/emergency-help`

- [ ] **Theme Toggle Functionality**
  - Click theme toggle in dashboard header
  - Switch between Light, Dark, and System themes
  - Verify theme persists after page refresh
  - Check that theme applies across all pages

- [ ] **Language Switcher** (if applicable)
  - Switch between available languages
  - Verify translations load correctly
  - Check that language preference persists

#### 2. Firebase Integration Tests

- [ ] **Firestore Operations**
  - Create a test document (e.g., add a patient record)
  - Read data from Firestore
  - Update a document
  - Delete a test document
  - Verify security rules are enforced

- [ ] **Firebase Authentication**
  - Sign up with new test account
  - Sign in with existing account
  - Sign out
  - Password reset flow (if implemented)

- [ ] **Firebase Storage**
  - Upload a test file (e.g., profile picture)
  - Verify file appears in Firebase Storage Console
  - Download/view uploaded file
  - Verify storage rules are enforced

#### 3. Performance Tests

- [ ] **Lighthouse Audit**
  ```bash
  # Run Lighthouse audit
  npx lighthouse https://your-app.vercel.app --view
  ```
  
  **Target Scores:**
  - Performance: > 90
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

- [ ] **Core Web Vitals**
  - First Contentful Paint (FCP): < 1.5s
  - Largest Contentful Paint (LCP): < 2.5s
  - Time to Interactive (TTI): < 3.0s
  - Cumulative Layout Shift (CLS): < 0.1

- [ ] **Bundle Size Check**
  - Check Vercel deployment logs for bundle size
  - Initial bundle should be < 500KB
  - Verify code splitting is working

#### 4. SEO and Metadata Tests

- [ ] **Open Graph Preview**
  - Share URL on social media (Twitter, Facebook, LinkedIn)
  - Verify preview shows correct title, description, and image
  - Check that og-image.png loads correctly

- [ ] **Favicon and Icons**
  - Check browser tab shows favicon
  - Test on mobile devices for PWA icons
  - Verify Apple touch icon on iOS

- [ ] **Robots and Sitemap**
  - Visit `https://your-app.vercel.app/robots.txt`
  - Verify robots.txt is accessible
  - Check sitemap if implemented

#### 5. Cross-Browser Testing

Test on the following browsers:

- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)

#### 6. Mobile Testing

Test on mobile devices:

- [ ] iOS Safari (iPhone)
- [ ] Android Chrome
- [ ] Responsive design at various breakpoints (375px, 768px, 1024px, 1440px)

#### 7. Security Headers Verification

```bash
# Check security headers
curl -I https://your-app.vercel.app

# Verify the following headers are present:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Build Fails with "Missing Environment Variables"

**Symptoms:**
```
Error: Missing required environment variables:
  - NEXT_PUBLIC_FIREBASE_API_KEY
```

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add missing variables
3. Redeploy: `vercel --prod` or push new commit

#### Issue 2: Firebase Connection Error

**Symptoms:**
- "Firebase: Error (auth/invalid-api-key)"
- "Firebase: Error (auth/project-not-found)"

**Solution:**
1. Verify Firebase credentials in Vercel environment variables
2. Check that Firebase project is active in Firebase Console
3. Ensure API key is not restricted (or whitelist Vercel domain)
4. Redeploy after fixing

#### Issue 3: Firestore Permission Denied

**Symptoms:**
- "Missing or insufficient permissions"
- Firestore operations fail with 403 errors

**Solution:**
1. Check Firestore security rules in Firebase Console
2. Verify rules were deployed: `firebase deploy --only firestore:rules`
3. Test rules with Firebase Emulator locally
4. Ensure user is authenticated before accessing protected data

#### Issue 4: Images Not Loading

**Symptoms:**
- Images show broken icon
- Console error: "Invalid src prop"

**Solution:**
1. Verify Firebase Storage domain is in `next.config.mjs`:
   ```javascript
   images: {
     domains: ['firebasestorage.googleapis.com'],
   }
   ```
2. Check Storage security rules allow read access
3. Redeploy after configuration changes

#### Issue 5: Theme Flash (FOUC)

**Symptoms:**
- Page briefly shows wrong theme before switching
- Flash of unstyled content on load

**Solution:**
- This should be prevented by next-themes configuration
- Verify ThemeProvider has `disableTransitionOnChange={false}`
- Check that `suppressHydrationWarning` is on `<html>` tag in layout.tsx

#### Issue 6: Slow Build Times

**Symptoms:**
- Vercel build takes > 5 minutes
- Build times out

**Solution:**
1. Check for large dependencies in package.json
2. Verify dynamic imports are used for heavy components
3. Clear Vercel build cache: Settings → General → Clear Build Cache
4. Consider upgrading Vercel plan for more build resources

---

## Rollback Procedure

If deployment introduces critical issues:

### Option 1: Instant Rollback via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the last working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback

**Timeline:** Instant (< 30 seconds)

### Option 2: Rollback via Git

```bash
# Find the last working commit
git log --oneline

# Revert to previous commit
git revert <commit-hash>

# Or reset to previous commit (destructive)
git reset --hard <commit-hash>

# Force push to trigger new deployment
git push origin main --force
```

**Timeline:** 2-5 minutes (build time)

### Option 3: Rollback Firebase Rules

```bash
# View deployment history
firebase deploy:history

# Rollback to previous version
firebase rollback firestore:rules <version-id>
```

---

## Deployment Timeline

Expected timeline for full deployment:

| Step | Duration | Notes |
|------|----------|-------|
| Pre-deployment checks | 5-10 min | Local build, tests |
| Firebase rules deployment | 1-2 min | Quick deployment |
| Firestore indexes deployment | 5-15 min | Depends on data size |
| Vercel build | 2-5 min | Automatic on git push |
| Post-deployment verification | 10-15 min | Manual testing |
| **Total** | **25-45 min** | First-time deployment |

Subsequent deployments (after initial setup): **5-10 minutes**

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## Support and Contact

For deployment issues:

1. Check [Troubleshooting](#troubleshooting) section above
2. Review Vercel build logs in dashboard
3. Check Firebase Console for backend errors
4. Contact team lead or DevOps support

---

**Last Updated:** November 2025  
**Version:** 1.0.0

# Environment Configuration Guide

This document provides comprehensive information about all environment variables required for the NeuraNovaa healthcare platform. Follow this guide to properly configure your development, staging, and production environments.

## Table of Contents

- [Overview](#overview)
- [Required Environment Variables](#required-environment-variables)
- [Optional Environment Variables](#optional-environment-variables)
- [Environment Setup Instructions](#environment-setup-instructions)
- [Firebase Configuration](#firebase-configuration)
- [Obtaining Firebase Credentials](#obtaining-firebase-credentials)
- [Vercel Deployment Configuration](#vercel-deployment-configuration)
- [Environment Validation](#environment-validation)
- [Troubleshooting](#troubleshooting)

## Overview

The NeuraNovaa platform requires several environment variables to function properly. These variables configure Firebase backend services, video conferencing, analytics, and application metadata. All variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side code and should not contain sensitive information.

## Required Environment Variables

### Firebase Configuration

These variables are **required** for the application to function. They configure the connection to Firebase services including Authentication, Firestore database, and Storage.

| Variable | Description | Example Value | Where to Find |
|----------|-------------|---------------|---------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key for client authentication | `AIzaSyDuR2GZkfnBqVx1FpnZDf6DM-sNxyHFUgY` | Firebase Console > Project Settings > General > Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain | `your-project.firebaseapp.com` | Firebase Console > Project Settings > General > Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier | `your-project-id` | Firebase Console > Project Settings > General > Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket URL | `your-project.appspot.com` | Firebase Console > Project Settings > General > Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | `458241327319` | Firebase Console > Project Settings > Cloud Messaging > Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase application identifier | `1:458241327319:web:8de92a0e5d4d202e1cf092` | Firebase Console > Project Settings > General > App ID |

### Application Configuration

| Variable | Description | Example Value | Required For |
|----------|-------------|---------------|--------------|
| `NEXT_PUBLIC_APP_URL` | Application base URL for SEO metadata | `https://neuranovaa.vercel.app` | SEO metadata, Open Graph tags |

## Optional Environment Variables

### Video Conferencing (Jitsi)

| Variable | Description | Default Value | Notes |
|----------|-------------|---------------|-------|
| `NEXT_PUBLIC_JITSI_DOMAIN` | Jitsi Meet server domain | `meet.jit.si` | Use custom domain for branded video calls |

### Analytics and Monitoring

| Variable | Description | Default Value | Notes |
|----------|-------------|---------------|-------|
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics tracking ID | Auto-set by Vercel | Automatically configured in Vercel deployments |

### Firebase Cloud Messaging (Future Enhancement)

| Variable | Description | Example Value | Notes |
|----------|-------------|---------------|-------|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID key for push notifications | `BKxyz...` | Required for push notifications (not yet implemented) |

## Environment Setup Instructions

### 1. Local Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your values:**
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Optional: Custom Jitsi domain
   NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
   ```

3. **Validate your configuration:**
   ```bash
   npm run validate:env
   ```

### 2. Production Deployment (Vercel)

1. **Set environment variables in Vercel Dashboard:**
   - Go to your project in Vercel Dashboard
   - Navigate to Settings > Environment Variables
   - Add each required variable with production values

2. **Use Vercel CLI (alternative):**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   vercel env add NEXT_PUBLIC_APP_URL
   ```

## Firebase Configuration

### Firebase Services Used

The NeuraNovaa platform uses the following Firebase services:

1. **Firebase Authentication**
   - Email/password authentication
   - Google OAuth integration
   - User session management

2. **Cloud Firestore**
   - User profiles and medical records
   - Appointment scheduling
   - Prescription management
   - Real-time chat and notifications

3. **Firebase Storage**
   - Profile pictures
   - Medical document uploads
   - Prescription images
   - Consultation recordings

4. **Firebase Security Rules**
   - Firestore security rules for data access control
   - Storage security rules for file access control

### Firestore Collections

The application uses these Firestore collections:

- `users` - User profiles and authentication data
- `patients` - Patient medical information
- `appointments` - Appointment scheduling data
- `prescriptions` - Prescription records
- `consultations` - Telemedicine session data
- `pharmacies` - Pharmacy information
- `pharmacy_inventory` - Medication inventory
- `chw_cases` - Community Health Worker cases
- `health_records` - Patient health records
- `notifications` - User notifications
- `audit_log` - System audit trail

## Obtaining Firebase Credentials

### Step-by-Step Guide

1. **Create or Access Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing project
   - Choose "Add app" and select "Web" (</>) icon

2. **Get Configuration Values:**
   - Navigate to **Project Settings** (gear icon)
   - Scroll to **Your apps** section
   - Click on your web app
   - Copy the configuration object values:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyDuR2GZkfnBqVx1FpnZDf6DM-sNxyHFUgY",           // NEXT_PUBLIC_FIREBASE_API_KEY
     authDomain: "your-project.firebaseapp.com",                    // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     projectId: "your-project-id",                                  // NEXT_PUBLIC_FIREBASE_PROJECT_ID
     storageBucket: "your-project.appspot.com",                     // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "458241327319",                             // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:458241327319:web:8de92a0e5d4d202e1cf092"            // NEXT_PUBLIC_FIREBASE_APP_ID
   };
   ```

3. **Enable Required Services:**
   
   **Authentication:**
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password** provider
   - Enable **Google** provider (configure OAuth consent screen)

   **Firestore Database:**
   - Go to **Firestore Database**
   - Click **Create database**
   - Choose **Start in test mode** (will be secured with rules later)
   - Select your preferred region

   **Storage:**
   - Go to **Storage**
   - Click **Get started**
   - Choose **Start in test mode**
   - Select your preferred region

4. **Deploy Security Rules:**
   ```bash
   # Deploy Firestore rules
   firebase deploy --only firestore:rules
   
   # Deploy Storage rules
   firebase deploy --only storage
   
   # Deploy Firestore indexes
   firebase deploy --only firestore:indexes
   ```

### Firebase Project Structure

```
your-firebase-project/
├── Authentication
│   ├── Email/Password (enabled)
│   └── Google OAuth (enabled)
├── Firestore Database
│   ├── Collections (see above list)
│   ├── Security Rules (firestore.rules)
│   └── Indexes (firestore.indexes.json)
├── Storage
│   ├── Buckets
│   │   ├── /profiles/{userId}/
│   │   ├── /prescriptions/{userId}/
│   │   └── /consultations/{sessionId}/
│   └── Security Rules (storage.rules)
└── Project Settings
    ├── Web App Configuration
    └── Service Accounts
```

## Vercel Deployment Configuration

### Environment Variables in Vercel

When deploying to Vercel, configure these environment variables in your project dashboard:

**Production Environment:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

### Vercel Configuration File

The `vercel.json` file references these environment variables:

```json
{
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "@firebase-storage-bucket",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "@firebase-messaging-sender-id",
    "NEXT_PUBLIC_FIREBASE_APP_ID": "@firebase-app-id"
  }
}
```

## Environment Validation

### Automatic Validation

The project includes an environment validation script:

```bash
# Validate all required environment variables
npm run validate:env
```

### Manual Validation

You can manually check if all required variables are set:

```javascript
// Check in browser console or Node.js
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missing = requiredVars.filter(varName => !process.env[varName]);
console.log('Missing variables:', missing);
```

### Firebase Connection Test

Test your Firebase configuration:

```bash
# Start development server
npm run dev

# Check browser console for Firebase initialization messages
# Look for: "Firebase app initialized in Xms"
```

## Troubleshooting

### Common Issues

#### 1. "Firebase configuration is incomplete"

**Cause:** Missing or empty environment variables

**Solution:**
- Check that all required variables are set in `.env.local`
- Verify variable names match exactly (case-sensitive)
- Ensure no trailing spaces or quotes in values

#### 2. "Firebase: Error (auth/invalid-api-key)"

**Cause:** Incorrect API key or project configuration

**Solution:**
- Verify API key in Firebase Console > Project Settings
- Ensure the API key matches your Firebase project
- Check that Web API key restrictions allow your domain

#### 3. "Firebase: Error (auth/unauthorized-domain)"

**Cause:** Domain not authorized in Firebase Authentication

**Solution:**
- Go to Firebase Console > Authentication > Settings
- Add your domain to "Authorized domains"
- For local development, add `localhost`

#### 4. "Firestore: Missing or insufficient permissions"

**Cause:** Firestore security rules blocking access

**Solution:**
- Deploy updated Firestore rules: `firebase deploy --only firestore:rules`
- Check rules in Firebase Console > Firestore > Rules
- Verify user authentication status

#### 5. Build fails with "Environment variable not found"

**Cause:** Missing environment variables during build

**Solution:**
- Ensure all variables are set in Vercel dashboard
- Check that variable names match exactly
- Redeploy after adding missing variables

### Debug Mode

Enable debug logging for Firebase:

```javascript
// Add to your firebase config for debugging
if (process.env.NODE_ENV === 'development') {
  // Enable Firestore debug logging
  firebase.firestore.setLogLevel('debug');
}
```

### Environment-Specific Configurations

#### Development
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Use Firebase emulators if needed
```

#### Staging
```bash
NEXT_PUBLIC_APP_URL=https://your-app-staging.vercel.app
# Use staging Firebase project
```

#### Production
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
# Use production Firebase project
```

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Use different Firebase projects for development/production**
3. **Regularly rotate API keys**
4. **Implement proper Firestore security rules**
5. **Monitor Firebase usage and billing**
6. **Use Firebase App Check for production (future enhancement)**

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Need Help?** If you encounter issues not covered in this guide, check the project's GitHub issues or contact the development team.
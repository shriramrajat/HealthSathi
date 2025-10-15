# Firebase Setup Guide

## Overview
This project uses Firebase for authentication and Firestore for data storage. Follow these steps to configure Firebase for your development environment.

## Prerequisites
- Firebase project created in [Firebase Console](https://console.firebase.google.com/)
- Firebase Authentication enabled with Email/Password and Google providers
- Firestore Database created in production mode

## Configuration Steps

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication with Email/Password and Google providers
4. Create Firestore Database in production mode

### 2. Get Firebase Configuration
1. In Firebase Console, go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on the web app or create a new web app
4. Copy the Firebase configuration object

### 3. Environment Variables
1. Copy the values from Firebase configuration
2. Update `.env.local` file with your actual Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

### 4. Firestore Security Rules
Apply the security rules from `lib/firebase-config.ts` to your Firestore Database:
1. Go to Firestore Database > Rules
2. Copy the rules from `FIRESTORE_RULES` constant
3. Publish the rules

## Files Created
- `lib/firebase.ts` - Firebase app initialization and service exports
- `lib/firebase-config.ts` - Configuration and security rules (already existed)
- `lib/firebase-utils.ts` - Utility functions for Firebase status checks
- `.env.local` - Environment variables template

## Usage
```typescript
import { auth, db, googleProvider } from '@/lib/firebase'
import { isFirebaseInitialized } from '@/lib/firebase-utils'

// Check if Firebase is ready
if (isFirebaseInitialized()) {
  // Use Firebase services
}
```

## Troubleshooting
- Ensure all environment variables are set correctly
- Check Firebase Console for project configuration
- Verify authentication providers are enabled
- Check browser console for Firebase initialization errors

## Next Steps
- Implement authentication service layer
- Create user profile management
- Set up protected routing
- Add form validation schemas
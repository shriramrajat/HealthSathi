# Firebase Cloud Messaging (FCM) Notification System

This document explains how to use the Firebase Cloud Messaging notification system implemented for the healthcare platform.

## Overview

The notification system provides real-time notifications for healthcare events including:
- Appointment bookings and confirmations
- Prescription updates
- Emergency alerts
- Video consultation invitations
- General system notifications

## Architecture

### Core Components

1. **NotificationService** (`lib/services/notification-service.ts`)
   - Handles FCM initialization and token management
   - Manages notification preferences and history
   - Provides methods for sending and receiving notifications

2. **useNotifications Hook** (`hooks/use-notifications.ts`)
   - React hook for managing notification state
   - Handles permission requests and user preferences
   - Provides real-time notification updates

3. **NotificationProvider** (`components/providers/notification-provider.tsx`)
   - Context provider for app-wide notification state
   - Handles toast notifications for foreground messages
   - Manages notification click navigation

4. **Service Worker** (`public/firebase-messaging-sw.js`)
   - Handles background notifications when app is not focused
   - Manages notification actions and click handling

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. Firebase Console Configuration

1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Generate a Web Push certificate (VAPID key)
3. Copy the key pair and add the public key to your environment variables

### 3. Service Worker Registration

The service worker is automatically registered when the notification service initializes. Make sure the `firebase-messaging-sw.js` file is accessible at your domain root.

### 4. Update Firebase Configuration

Update the service worker file with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-auth-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-storage-bucket",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id"
}
```

## Usage

### Basic Setup

1. Wrap your app with the NotificationProvider:

```tsx
import { NotificationProvider } from '@/components/providers/notification-provider'

export default function App({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}
```

2. Use the notification hook in your components:

```tsx
import { useNotificationContext } from '@/components/providers/notification-provider'

function MyComponent() {
  const { 
    hasPermission, 
    requestPermission, 
    notifications, 
    unreadCount 
  } = useNotificationContext()

  // Your component logic
}
```

### Permission Management

Use the NotificationPermission component to handle user permissions:

```tsx
import { NotificationPermission } from '@/components/notifications/notification-permission'

function SettingsPage() {
  return (
    <div>
      <NotificationPermission showSettings={true} compact={false} />
    </div>
  )
}
```

### Notification Preferences

Use the NotificationPreferences component for user settings:

```tsx
import { NotificationPreferences } from '@/components/notifications/notification-preferences'

function PreferencesPage() {
  return (
    <div>
      <NotificationPreferences />
    </div>
  )
}
```

### Sending Notifications

To send notifications from your backend, use the Firebase Admin SDK:

```javascript
const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'your-project-id'
})

// Send notification
const message = {
  notification: {
    title: 'New Appointment',
    body: 'You have a new appointment scheduled'
  },
  data: {
    type: 'appointment',
    appointmentId: '123',
    url: '/dashboard/patient?tab=appointments&id=123'
  },
  token: userFCMToken
}

admin.messaging().send(message)
```

## Firestore Collections

The notification system uses these Firestore collections:

### fcm_tokens
Stores FCM tokens for users:
```typescript
{
  userId: string
  token: string
  deviceType: 'web' | 'mobile'
  userAgent: string
  createdAt: Date
  lastUsed: Date
  isActive: boolean
}
```

### notifications
Stores notification history:
```typescript
{
  userId: string
  title: string
  body: string
  data?: Record<string, string>
  type: 'appointment' | 'prescription' | 'emergency' | 'consultation' | 'general'
  isRead: boolean
  createdAt: Date
  readAt?: Date
}
```

### notification_preferences
Stores user notification preferences:
```typescript
{
  userId: string
  appointments: boolean
  prescriptions: boolean
  emergencies: boolean
  consultations: boolean
  general: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
}
```

## Security Rules

The following Firestore security rules are included:

```javascript
// FCM tokens - users can manage their own tokens
match /fcm_tokens/{tokenId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}

// Notifications - users can read their own notifications
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
}

// Notification preferences - users can manage their own preferences
match /notification_preferences/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Testing

### Demo Page

Visit `/notifications-demo` to test the notification system:
- Setup guide with step-by-step instructions
- Permission management interface
- Notification preferences configuration

### Manual Testing

1. Enable notifications using the permission component
2. Send a test notification using the "Test Notification" button
3. Check browser developer tools for any console errors
4. Verify notifications appear in the browser

### Browser Compatibility

The notification system works in:
- Chrome 50+
- Firefox 44+
- Safari 16+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check browser notification permissions
   - Verify VAPID key is correct
   - Check service worker registration

2. **Permission denied**
   - User must manually enable notifications in browser settings
   - Clear site data and try again

3. **Service worker not loading**
   - Ensure `firebase-messaging-sw.js` is at domain root
   - Check for JavaScript errors in console

4. **Token generation fails**
   - Verify Firebase configuration
   - Check VAPID key is set correctly
   - Ensure user is authenticated

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'firebase-messaging')
```

## Best Practices

1. **Always request permission gracefully**
   - Explain why notifications are useful
   - Don't request permission immediately on page load
   - Provide clear opt-out options

2. **Respect user preferences**
   - Allow granular notification type control
   - Provide easy way to disable notifications
   - Honor "Do Not Disturb" settings

3. **Handle errors gracefully**
   - Provide fallback for unsupported browsers
   - Show helpful error messages
   - Don't break app functionality if notifications fail

4. **Test thoroughly**
   - Test on different browsers and devices
   - Verify background and foreground notifications
   - Test notification actions and navigation

## Future Enhancements

Potential improvements to consider:
- Push notification scheduling
- Rich notification content (images, actions)
- Notification grouping and batching
- Integration with email/SMS notifications
- Analytics and delivery tracking
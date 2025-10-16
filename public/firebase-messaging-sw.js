// Firebase Cloud Messaging Service Worker
// Handles background notifications when the app is not in focus

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'Healthcare Platform'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: payload.data?.requireInteraction === 'true',
    actions: getNotificationActions(payload.data?.type)
  }

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'appointment':
      return [
        {
          action: 'view',
          title: 'View Appointment',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ]
    case 'prescription':
      return [
        {
          action: 'view',
          title: 'View Prescription',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ]
    case 'emergency':
      return [
        {
          action: 'respond',
          title: 'Respond',
          icon: '/icons/emergency-icon.png'
        }
      ]
    default:
      return [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ]
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  if (action === 'dismiss') {
    return
  }

  // Handle different actions
  let url = '/'
  
  switch (action) {
    case 'view':
      url = getViewUrl(data.type, data)
      break
    case 'respond':
      url = getResponseUrl(data.type, data)
      break
    default:
      url = getDefaultUrl(data.type, data)
      break
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data,
            action: action,
            url: url
          })
          return
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Get view URL based on notification type
function getViewUrl(type, data) {
  switch (type) {
    case 'appointment':
      return `/dashboard/patient?tab=appointments&id=${data.appointmentId}`
    case 'prescription':
      return `/dashboard/patient?tab=prescriptions&id=${data.prescriptionId}`
    case 'consultation':
      return `/consultation/${data.consultationId}`
    case 'emergency':
      return `/dashboard/chw?tab=emergencies&id=${data.emergencyId}`
    default:
      return '/dashboard'
  }
}

// Get response URL for emergency notifications
function getResponseUrl(type, data) {
  switch (type) {
    case 'emergency':
      return `/emergency/respond/${data.emergencyId}`
    default:
      return '/dashboard'
  }
}

// Get default URL based on notification type
function getDefaultUrl(type, data) {
  switch (type) {
    case 'appointment':
      return '/dashboard/patient'
    case 'prescription':
      return '/dashboard/patient'
    case 'consultation':
      return '/dashboard'
    case 'emergency':
      return '/dashboard/chw'
    default:
      return '/dashboard'
  }
}

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
  
  // Track notification dismissal if needed
  const data = event.notification.data || {}
  
  // Send analytics or tracking data
  if (data.trackDismissal) {
    // Implementation for tracking notification dismissals
    console.log('Tracking notification dismissal:', data)
  }
})

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed')
  self.skipWaiting()
})

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated')
  event.waitUntil(self.clients.claim())
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)
  
  if (event.data && event.data.type === 'UPDATE_CONFIG') {
    // Update Firebase config if needed
    console.log('Updating Firebase config in service worker')
  }
})
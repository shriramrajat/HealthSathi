// Firebase Cloud Messaging service for real-time notifications
// Handles FCM token generation, storage, and notification management

import { getFirebaseApp } from '../firebase'
import { getFirebaseFirestore } from '../firebase'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'

// Types for notification system
export interface FCMToken {
  userId: string
  token: string
  deviceType: 'web' | 'mobile'
  userAgent: string
  createdAt: Date
  lastUsed: Date
  isActive: boolean
}

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
}

export interface NotificationPreferences {
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

export interface StoredNotification {
  id?: string
  userId: string
  title: string
  body: string
  data?: Record<string, string>
  type: 'appointment_booked' | 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 
        'consultation_started' | 'consultation_ended' | 'prescription_issued' | 'prescription_ready' | 
        'prescription_dispensed' | 'emergency_alert' | 'symptom_check_urgent' | 'qr_code_scanned' | 
        'system_maintenance' | 'general'
  isRead: boolean
  createdAt: Date
  readAt?: Date
}

class NotificationService {
  private messaging: any = null
  private db: any = null
  private isInitialized = false
  private notificationListeners: Map<string, Unsubscribe> = new Map()

  /**
   * Initialize Firebase Cloud Messaging
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('FCM can only be initialized in browser environment')
        return
      }

      // Check for service worker support
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported in this browser')
        return
      }

      // Check for notification support
      if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser')
        return
      }

      // Initialize Firebase services
      const app = getFirebaseApp()
      this.db = await getFirebaseFirestore()

      // Dynamically import Firebase messaging (client-side only)
      const { getMessaging, isSupported } = await import('firebase/messaging')
      
      // Check if messaging is supported
      const messagingSupported = await isSupported()
      if (!messagingSupported) {
        console.warn('Firebase Messaging not supported in this browser')
        return
      }

      this.messaging = getMessaging(app)
      this.isInitialized = true

      console.log('Firebase Cloud Messaging initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Firebase Cloud Messaging:', error)
      throw error
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported')
      }

      const permission = await Notification.requestPermission()
      console.log('Notification permission:', permission)
      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      throw error
    }
  }

  /**
   * Generate and store FCM token for user
   */
  async generateAndStoreToken(userId: string): Promise<string | null> {
    try {
      await this.initialize()

      if (!this.messaging) {
        console.warn('FCM not initialized, cannot generate token')
        return null
      }

      // Request permission first
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return null
      }

      // Generate FCM token
      const { getToken } = await import('firebase/messaging')
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      })

      if (!token) {
        console.warn('Failed to generate FCM token')
        return null
      }

      // Store token in Firestore
      await this.storeToken(userId, token)
      
      console.log('FCM token generated and stored successfully')
      return token
    } catch (error) {
      console.error('Failed to generate FCM token:', error)
      return null
    }
  }

  /**
   * Store FCM token in Firestore
   */
  private async storeToken(userId: string, token: string): Promise<void> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const tokenData: FCMToken = {
        userId,
        token,
        deviceType: 'web',
        userAgent: navigator.userAgent,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true
      }

      const tokenRef = doc(this.db, 'fcm_tokens', `${userId}_${token.slice(-10)}`)
      await setDoc(tokenRef, tokenData, { merge: true })

      console.log('FCM token stored in Firestore')
    } catch (error) {
      console.error('Failed to store FCM token:', error)
      throw error
    }
  }

  /**
   * Get user's notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const prefsRef = doc(this.db, 'notification_preferences', userId)
      const prefsDoc = await getDoc(prefsRef)

      if (prefsDoc.exists()) {
        return prefsDoc.data() as NotificationPreferences
      }

      // Return default preferences
      const defaultPrefs: NotificationPreferences = {
        userId,
        appointments: true,
        prescriptions: true,
        emergencies: true,
        consultations: true,
        general: true,
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false
      }

      // Store default preferences
      await setDoc(prefsRef, defaultPrefs)
      return defaultPrefs
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      throw error
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const prefsRef = doc(this.db, 'notification_preferences', userId)
      await updateDoc(prefsRef, preferences)

      console.log('Notification preferences updated')
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      throw error
    }
  }

  /**
   * Store notification in Firestore for history
   */
  async storeNotification(notification: Omit<StoredNotification, 'id'>): Promise<string> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const notificationData = {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt)
      }

      const docRef = await addDoc(collection(this.db, 'notifications'), notificationData)
      console.log('Notification stored with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Failed to store notification:', error)
      throw error
    }
  }

  /**
   * Get user's notification history
   */
  async getNotificationHistory(
    userId: string, 
    limitCount: number = 50
  ): Promise<StoredNotification[]> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const notifications: StoredNotification[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          readAt: data.readAt ? data.readAt.toDate() : undefined
        } as StoredNotification)
      })

      return notifications
    } catch (error) {
      console.error('Failed to get notification history:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      if (!this.db) {
        this.db = await getFirebaseFirestore()
      }

      const notificationRef = doc(this.db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now()
      })

      console.log('Notification marked as read:', notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * Listen to real-time notifications for a user
   */
  subscribeToNotifications(
    userId: string, 
    callback: (notifications: StoredNotification[]) => void
  ): Unsubscribe {
    try {
      if (!this.db) {
        throw new Error('Database not initialized')
      }

      const q = query(
        collection(this.db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
      )

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: StoredNotification[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            readAt: data.readAt ? data.readAt.toDate() : undefined
          } as StoredNotification)
        })

        callback(notifications)
      })

      // Store the unsubscribe function
      this.notificationListeners.set(userId, unsubscribe)
      
      return unsubscribe
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(userId: string): void {
    const unsubscribe = this.notificationListeners.get(userId)
    if (unsubscribe) {
      unsubscribe()
      this.notificationListeners.delete(userId)
      console.log('Unsubscribed from notifications for user:', userId)
    }
  }

  /**
   * Show browser notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Check permission
      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted')
        return
      }

      // Show notification
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        data: payload.data
      })

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Handle navigation based on notification data
        if (payload.data?.url) {
          window.location.href = payload.data.url
        }
        
        notification.close()
      }

      console.log('Browser notification shown')
    } catch (error) {
      console.error('Failed to show browser notification:', error)
    }
  }

  /**
   * Setup foreground message handling
   */
  async setupForegroundMessageHandling(
    onMessageReceived: (payload: NotificationPayload) => void
  ): Promise<void> {
    try {
      await this.initialize()

      if (!this.messaging) {
        console.warn('FCM not initialized, cannot setup message handling')
        return
      }

      const { onMessage } = await import('firebase/messaging')
      
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload)
        
        const notificationPayload: NotificationPayload = {
          title: payload.notification?.title || 'New Notification',
          body: payload.notification?.body || '',
          data: payload.data,
          icon: payload.notification?.icon
        }

        onMessageReceived(notificationPayload)
        
        // Show browser notification if page is not focused
        if (document.hidden) {
          this.showNotification(notificationPayload)
        }
      })

      console.log('Foreground message handling setup complete')
    } catch (error) {
      console.error('Failed to setup foreground message handling:', error)
      throw error
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    // Unsubscribe from all notification listeners
    this.notificationListeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.notificationListeners.clear()
    
    console.log('Notification service cleaned up')
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService
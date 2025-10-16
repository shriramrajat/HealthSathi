// React hook for managing Firebase Cloud Messaging notifications
// Provides notification state management and user interaction handling

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEffect as useAuthEffect, useState as useAuthState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { 
  notificationService, 
  NotificationPayload, 
  NotificationPreferences, 
  StoredNotification 
} from '@/lib/services/notification-service'

export interface UseNotificationsReturn {
  // State
  isInitialized: boolean
  hasPermission: boolean
  isLoading: boolean
  error: string | null
  notifications: StoredNotification[]
  unreadCount: number
  preferences: NotificationPreferences | null

  // Actions
  requestPermission: () => Promise<boolean>
  initializeNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>
  showTestNotification: () => Promise<void>
  clearError: () => void
}

export function useNotifications(): UseNotificationsReturn {
  // Auth state
  const [user, setUser] = useAuthState<User | null>(null)
  const [authLoading, setAuthLoading] = useAuthState(true)
  
  // Notification state
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<StoredNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)

  // Refs for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isInitializingRef = useRef(false)

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length

  /**
   * Check notification permission status
   */
  const checkPermission = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }
    
    const permission = Notification.permission === 'granted'
    setHasPermission(permission)
    return permission
  }, [])

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const permission = await notificationService.requestPermission()
      const granted = permission === 'granted'
      
      setHasPermission(granted)
      
      if (!granted) {
        setError('Notification permission denied. You can enable it in browser settings.')
      }

      return granted
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Initialize notifications for the current user
   */
  const initializeNotifications = useCallback(async (): Promise<void> => {
    if (!user || isInitializingRef.current || isInitialized) {
      return
    }

    try {
      isInitializingRef.current = true
      setIsLoading(true)
      setError(null)

      // Initialize notification service
      await notificationService.initialize()

      // Check permission
      const hasPermission = checkPermission()
      
      if (hasPermission) {
        // Generate and store FCM token
        await notificationService.generateAndStoreToken(user.uid)
      }

      // Load user preferences
      const userPreferences = await notificationService.getNotificationPreferences(user.uid)
      setPreferences(userPreferences)

      // Load notification history
      const history = await notificationService.getNotificationHistory(user.uid, 50)
      setNotifications(history)

      // Subscribe to real-time notifications
      const unsubscribe = notificationService.subscribeToNotifications(
        user.uid,
        (newNotifications) => {
          setNotifications(newNotifications)
        }
      )
      unsubscribeRef.current = unsubscribe

      // Setup foreground message handling
      await notificationService.setupForegroundMessageHandling((payload) => {
        // Handle foreground notifications
        console.log('Foreground notification received:', payload)
        
        // You can show a toast or update UI here
        // The notification will be automatically stored by the service
      })

      setIsInitialized(true)
      console.log('Notifications initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize notifications'
      setError(errorMessage)
      console.error('Failed to initialize notifications:', err)
    } finally {
      setIsLoading(false)
      isInitializingRef.current = false
    }
  }, [user, isInitialized, checkPermission])

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.markNotificationAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read'
      setError(errorMessage)
    }
  }, [])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(n => 
          n.id ? notificationService.markNotificationAsRead(n.id) : Promise.resolve()
        )
      )

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read'
      setError(errorMessage)
    }
  }, [notifications])

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (
    prefs: Partial<NotificationPreferences>
  ): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      await notificationService.updateNotificationPreferences(user.uid, prefs)
      
      // Update local state
      setPreferences(prev => prev ? { ...prev, ...prefs } : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * Show a test notification
   */
  const showTestNotification = useCallback(async (): Promise<void> => {
    try {
      const testPayload: NotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification from the healthcare platform',
        icon: '/icons/notification-icon.png',
        tag: 'test',
        data: {
          type: 'test',
          url: '/dashboard'
        }
      }

      await notificationService.showNotification(testPayload)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show test notification'
      setError(errorMessage)
    }
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Initialize notifications when user is available
  useEffect(() => {
    if (user && !authLoading && !isInitialized) {
      initializeNotifications()
    }
  }, [user, authLoading, isInitialized, initializeNotifications])

  // Check permission on mount
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Auth state listener
  useAuthEffect(() => {
    const setupAuth = async () => {
      const auth = await getFirebaseAuth()
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setAuthLoading(false)
      })

      return unsubscribe
    }

    let unsubscribe: (() => void) | undefined

    setupAuth().then((unsub) => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (user) {
        notificationService.unsubscribeFromNotifications(user.uid)
      }
      notificationService.cleanup()
    }
  }, [user])

  return {
    // State
    isInitialized,
    hasPermission,
    isLoading,
    error,
    notifications,
    unreadCount,
    preferences,

    // Actions
    requestPermission,
    initializeNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    showTestNotification,
    clearError
  }
}
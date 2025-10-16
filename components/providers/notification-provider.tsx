// Notification context provider for managing app-wide notification state
// Provides notification functionality to all components

'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useNotifications, UseNotificationsReturn } from '@/hooks/use-notifications'
import { toast } from '@/hooks/use-toast'

// Create notification context
const NotificationContext = createContext<UseNotificationsReturn | null>(null)

// Notification provider props
interface NotificationProviderProps {
  children: React.ReactNode
}

/**
 * Notification provider component
 * Wraps the app to provide notification functionality
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications()

  // Show toast notifications for new notifications
  useEffect(() => {
    if (notifications.notifications.length > 0) {
      const latestNotification = notifications.notifications[0]
      
      // Only show toast for unread notifications that are recent (within last 5 minutes)
      if (!latestNotification.isRead) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        
        if (latestNotification.createdAt > fiveMinutesAgo) {
          toast({
            title: latestNotification.title,
            description: latestNotification.body,
            action: (
              <button
                onClick={() => {
                  if (latestNotification.id) {
                    notifications.markAsRead(latestNotification.id)
                  }
                  handleNotificationClick(latestNotification)
                }}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
              >
                View
              </button>
            )
          })
        }
      }
    }
  }, [notifications.notifications, notifications.markAsRead])

  // Handle notification click navigation
  const handleNotificationClick = (notification: any) => {
    const { type, data } = notification
    
    switch (type) {
      case 'appointment':
        window.location.href = `/dashboard/patient?tab=appointments&id=${data?.appointmentId}`
        break
      case 'prescription':
        window.location.href = `/dashboard/patient?tab=prescriptions&id=${data?.prescriptionId}`
        break
      case 'consultation':
        window.location.href = `/consultation/${data?.consultationId}`
        break
      case 'emergency':
        window.location.href = `/dashboard/chw?tab=emergencies&id=${data?.emergencyId}`
        break
      default:
        window.location.href = '/dashboard'
        break
    }
  }

  // Show error toast if there's an error
  useEffect(() => {
    if (notifications.error) {
      toast({
        title: 'Notification Error',
        description: notifications.error,
        variant: 'destructive',
        action: (
          <button
            onClick={notifications.clearError}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
          >
            Dismiss
          </button>
        )
      })
    }
  }, [notifications.error, notifications.clearError])

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * Hook to use notification context
 */
export function useNotificationContext(): UseNotificationsReturn {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  
  return context
}

/**
 * Hook to get notification permission status
 */
export function useNotificationPermission() {
  const { hasPermission, requestPermission, isLoading } = useNotificationContext()
  
  return {
    hasPermission,
    requestPermission,
    isLoading
  }
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  const { unreadCount } = useNotificationContext()
  return unreadCount
}

/**
 * Hook to manage notification preferences
 */
export function useNotificationPreferences() {
  const { preferences, updatePreferences, isLoading } = useNotificationContext()
  
  return {
    preferences,
    updatePreferences,
    isLoading
  }
}
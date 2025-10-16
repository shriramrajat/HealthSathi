"use client"

import React, { useEffect } from 'react'
import { Bell, Calendar, Pill, MessageSquare, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { 
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useNotificationContext } from '@/components/providers/notification-provider'
import type { StoredNotification } from '@/lib/services/notification-service'

// Map notification types to icons and colors
const notificationConfig = {
  appointment_booked: { 
    icon: Calendar, 
    variant: 'info' as const,
    title: 'Appointment Booked'
  },
  appointment_confirmed: { 
    icon: CheckCircle, 
    variant: 'success' as const,
    title: 'Appointment Confirmed'
  },
  appointment_cancelled: { 
    icon: X, 
    variant: 'destructive' as const,
    title: 'Appointment Cancelled'
  },
  appointment_reminder: { 
    icon: Bell, 
    variant: 'warning' as const,
    title: 'Appointment Reminder'
  },
  consultation_started: { 
    icon: MessageSquare, 
    variant: 'info' as const,
    title: 'Consultation Started'
  },
  consultation_ended: { 
    icon: MessageSquare, 
    variant: 'default' as const,
    title: 'Consultation Ended'
  },
  prescription_issued: { 
    icon: Pill, 
    variant: 'info' as const,
    title: 'Prescription Issued'
  },
  prescription_ready: { 
    icon: Pill, 
    variant: 'success' as const,
    title: 'Prescription Ready'
  },
  prescription_dispensed: { 
    icon: CheckCircle, 
    variant: 'success' as const,
    title: 'Prescription Dispensed'
  },
  emergency_alert: { 
    icon: AlertTriangle, 
    variant: 'destructive' as const,
    title: 'Emergency Alert'
  },
  symptom_check_urgent: { 
    icon: AlertTriangle, 
    variant: 'warning' as const,
    title: 'Urgent Symptom Check'
  },
  qr_code_scanned: { 
    icon: Info, 
    variant: 'info' as const,
    title: 'QR Code Scanned'
  },
  system_maintenance: { 
    icon: Info, 
    variant: 'warning' as const,
    title: 'System Maintenance'
  },
  general: { 
    icon: Bell, 
    variant: 'default' as const,
    title: 'Notification'
  }
}

interface NotificationToastProps {
  notification: StoredNotification
  onMarkAsRead: (id: string) => void
  onAction?: (notification: StoredNotification) => void
}

function NotificationToast({ notification, onMarkAsRead, onAction }: NotificationToastProps) {
  const config = notificationConfig[notification.type] || notificationConfig.general
  const Icon = config.icon

  const handleAction = () => {
    if (notification.id) {
      onMarkAsRead(notification.id)
    }
    if (onAction) {
      onAction(notification)
    }
  }

  const handleClose = () => {
    if (notification.id) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <Toast variant={config.variant}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <ToastTitle>{notification.title || config.title}</ToastTitle>
          <ToastDescription>{notification.body}</ToastDescription>
        </div>
      </div>
      
      {(notification.data?.url || onAction) && (
        <ToastAction altText="View notification" onClick={handleAction}>
          View
        </ToastAction>
      )}
      
      <ToastClose onClick={handleClose} />
    </Toast>
  )
}

interface NotificationDisplayProps {
  maxToasts?: number
  autoHideDuration?: number
}

export function NotificationDisplay({ 
  maxToasts = 3, 
  autoHideDuration = 5000 
}: NotificationDisplayProps) {
  const { notifications, markAsRead } = useNotificationContext()
  
  // Get recent unread notifications for toast display
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .slice(0, maxToasts)

  const handleNotificationAction = (notification: StoredNotification) => {
    // Handle navigation based on notification data
    if (notification.data?.url) {
      window.location.href = notification.data.url
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'appointment_booked':
        case 'appointment_confirmed':
        case 'appointment_cancelled':
        case 'appointment_reminder':
          window.location.href = '/dashboard/patient?tab=appointments'
          break
        case 'prescription_issued':
        case 'prescription_ready':
        case 'prescription_dispensed':
          window.location.href = '/dashboard/patient?tab=prescriptions'
          break
        case 'consultation_started':
        case 'consultation_ended':
          if (notification.data?.consultationId) {
            window.location.href = `/consultation/${notification.data.consultationId}`
          }
          break
        case 'emergency_alert':
          window.location.href = '/dashboard/chw?tab=emergencies'
          break
        case 'symptom_check_urgent':
          window.location.href = '/dashboard/patient?tab=symptoms'
          break
        default:
          window.location.href = '/dashboard'
          break
      }
    }
  }

  // Auto-hide toasts after duration
  useEffect(() => {
    if (recentNotifications.length > 0 && autoHideDuration > 0) {
      const timers = recentNotifications.map(notification => {
        if (notification.id) {
          return setTimeout(() => {
            markAsRead(notification.id!)
          }, autoHideDuration)
        }
        return null
      }).filter(Boolean)

      return () => {
        timers.forEach(timer => {
          if (timer) clearTimeout(timer)
        })
      }
    }
  }, [recentNotifications, autoHideDuration, markAsRead])

  return (
    <ToastProvider swipeDirection="right">
      {recentNotifications.map((notification) => (
        <NotificationToast
          key={notification.id || `${notification.type}-${notification.createdAt.getTime()}`}
          notification={notification}
          onMarkAsRead={markAsRead}
          onAction={handleNotificationAction}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
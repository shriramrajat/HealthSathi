// Notification components exports
// Centralized exports for all notification-related components

export { NotificationDisplay } from './notification-display'
export { NotificationDrawer } from './notification-drawer'
export { NotificationBell } from './notification-bell'
export { NotificationPreferences } from './notification-preferences'
export { NotificationProvider, useNotificationContext } from '../providers/notification-provider'

// Re-export notification service types
export type { 
  NotificationPayload, 
  NotificationPreferences as NotificationPreferencesType,
  StoredNotification 
} from '@/lib/services/notification-service'
"use client"

import React, { useState } from 'react'
import { 
  Bell, 
  Calendar, 
  Pill, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  MoreVertical,
  Trash2,
  ExternalLink,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationContext } from '@/components/providers/notification-provider'
import { NotificationPreferences } from './notification-preferences'
import type { StoredNotification } from '@/lib/services/notification-service'

// Notification type configuration
const notificationConfig = {
  appointment_booked: { 
    icon: Calendar, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    title: 'Appointment Booked'
  },
  appointment_confirmed: { 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    title: 'Appointment Confirmed'
  },
  appointment_cancelled: { 
    icon: X, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    title: 'Appointment Cancelled'
  },
  appointment_reminder: { 
    icon: Bell, 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    title: 'Appointment Reminder'
  },
  consultation_started: { 
    icon: MessageSquare, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    title: 'Consultation Started'
  },
  consultation_ended: { 
    icon: MessageSquare, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
    title: 'Consultation Ended'
  },
  prescription_issued: { 
    icon: Pill, 
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    title: 'Prescription Issued'
  },
  prescription_ready: { 
    icon: Pill, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    title: 'Prescription Ready'
  },
  prescription_dispensed: { 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    title: 'Prescription Dispensed'
  },
  emergency_alert: { 
    icon: AlertTriangle, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    title: 'Emergency Alert'
  },
  symptom_check_urgent: { 
    icon: AlertTriangle, 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    title: 'Urgent Symptom Check'
  },
  qr_code_scanned: { 
    icon: Info, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    title: 'QR Code Scanned'
  },
  system_maintenance: { 
    icon: Info, 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    title: 'System Maintenance'
  },
  general: { 
    icon: Bell, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
    title: 'Notification'
  }
}

interface NotificationItemProps {
  notification: StoredNotification
  onMarkAsRead: (id: string) => void
  onAction: (notification: StoredNotification) => void
}

function NotificationItem({ notification, onMarkAsRead, onAction }: NotificationItemProps) {
  const config = notificationConfig[notification.type] || notificationConfig.general
  const Icon = config.icon

  const handleClick = () => {
    if (notification.id && !notification.isRead) {
      onMarkAsRead(notification.id)
    }
    onAction(notification)
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.id) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div 
      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-2 rounded-full ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {notification.title || config.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.body}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {!notification.isRead && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={handleMarkAsRead}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleClick}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NotificationDrawerProps {
  children: React.ReactNode
}

export function NotificationDrawer({ children }: NotificationDrawerProps) {
  const [showPreferences, setShowPreferences] = useState(false)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isLoading 
  } = useNotificationContext()

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

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  if (showPreferences) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>Notification Settings</DrawerTitle>
                <DrawerDescription>
                  Manage your notification preferences
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
              >
                Back to notifications
              </Button>
            </div>
          </DrawerHeader>
          
          <div className="px-4 pb-4">
            <NotificationPreferences />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </DrawerTitle>
              <DrawerDescription>
                Your recent healthcare notifications
              </DrawerDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You'll see your healthcare notifications here when you receive them.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id || `${notification.type}-${notification.createdAt.getTime()}`}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onAction={handleNotificationAction}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
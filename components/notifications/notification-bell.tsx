"use client"

import React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationDrawer } from './notification-drawer'
import { useNotificationContext } from '@/components/providers/notification-provider'

interface NotificationBellProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showBadge?: boolean
  className?: string
}

export function NotificationBell({ 
  variant = 'ghost',
  size = 'icon',
  showBadge = true,
  className = ''
}: NotificationBellProps) {
  const { unreadCount, isLoading } = useNotificationContext()

  return (
    <NotificationDrawer>
      <Button 
        variant={variant} 
        size={size} 
        className={`relative ${className}`}
        disabled={isLoading}
      >
        <Bell className="h-5 w-5" />
        {showBadge && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        <span className="sr-only">
          {unreadCount > 0 
            ? `${unreadCount} unread notifications` 
            : 'No unread notifications'
          }
        </span>
      </Button>
    </NotificationDrawer>
  )
}
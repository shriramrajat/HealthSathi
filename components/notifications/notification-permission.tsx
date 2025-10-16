// Notification permission component
// Handles requesting and managing notification permissions

'use client'

import React, { useState } from 'react'
import { Bell, BellOff, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useNotificationContext } from '@/components/providers/notification-provider'

interface NotificationPermissionProps {
  showSettings?: boolean
  compact?: boolean
}

export function NotificationPermission({ 
  showSettings = true, 
  compact = false 
}: NotificationPermissionProps) {
  const {
    hasPermission,
    isInitialized,
    isLoading,
    error,
    requestPermission,
    showTestNotification,
    clearError
  } = useNotificationContext()

  const [isRequesting, setIsRequesting] = useState(false)
  const [showTest, setShowTest] = useState(false)

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      const granted = await requestPermission()
      if (granted) {
        setShowTest(true)
        setTimeout(() => setShowTest(false), 3000)
      }
    } catch (err) {
      console.error('Failed to request permission:', err)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await showTestNotification()
    } catch (err) {
      console.error('Failed to show test notification:', err)
    }
  }

  // Compact version for header/navbar
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {hasPermission ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestPermission}
            disabled={isRequesting || isLoading}
            className="flex items-center gap-1"
          >
            <BellOff className="h-3 w-3" />
            Enable Notifications
          </Button>
        )}
      </div>
    )
  }

  // Full card version
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasPermission ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and permissions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {hasPermission ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">
                Browser Notifications
              </p>
              <p className="text-sm text-muted-foreground">
                {hasPermission 
                  ? 'Notifications are enabled' 
                  : 'Enable notifications to receive real-time updates'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasPermission ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
            ) : (
              <Badge variant="outline">
                Disabled
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!hasPermission ? (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting || isLoading}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isRequesting ? 'Requesting...' : 'Enable Notifications'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleTestNotification}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Test Notification
              </Button>
              
              {showSettings && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Navigate to notification preferences
                    window.location.href = '/settings/notifications'
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Preferences
                </Button>
              )}
            </>
          )}
        </div>

        {/* Test Notification Success */}
        {showTest && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Test notification sent! You should see it in your browser.
            </AlertDescription>
          </Alert>
        )}

        {/* Browser Support Info */}
        {typeof window !== 'undefined' && !('Notification' in window) && (
          <Alert variant="destructive">
            <AlertDescription>
              Your browser doesn't support notifications. Please use a modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        )}

        {/* Service Worker Info */}
        {typeof window !== 'undefined' && !('serviceWorker' in navigator) && (
          <Alert variant="destructive">
            <AlertDescription>
              Service Workers are not supported in your browser. Notifications may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Initialization Status */}
        {!isInitialized && (
          <div className="text-sm text-muted-foreground">
            Initializing notification service...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
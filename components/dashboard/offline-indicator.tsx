'use client'

import React from 'react'
import { Wifi, WifiOff, CloudOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useOfflineManager } from '@/lib/utils/offline-manager'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  className?: string
  variant?: 'compact' | 'full' | 'banner'
  showSyncButton?: boolean
  showPendingCount?: boolean
}

/**
 * Offline status indicator component
 */
export function OfflineIndicator({
  className,
  variant = 'compact',
  showSyncButton = true,
  showPendingCount = true
}: OfflineIndicatorProps) {
  const {
    isOnline,
    isOfflineMode,
    pendingActions,
    syncInProgress,
    lastSyncTime,
    syncNow
  } = useOfflineManager()

  const pendingCount = pendingActions.length
  const hasUnsyncedData = pendingCount > 0

  const handleSync = async () => {
    try {
      await syncNow()
    } catch (error) {
      console.error('Manual sync failed:', error)
    }
  }

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced'
    
    const now = Date.now()
    const diff = now - lastSyncTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (minutes < 1) return 'Just synced'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(lastSyncTime).toLocaleDateString()
  }

  // Compact variant - small indicator
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          
          {syncInProgress && (
            <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
          )}
        </div>

        {showPendingCount && hasUnsyncedData && (
          <Badge variant="secondary" className="text-xs">
            {pendingCount} pending
          </Badge>
        )}

        {showSyncButton && isOnline && hasUnsyncedData && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSync}
            disabled={syncInProgress}
            className="h-6 px-2 text-xs"
          >
            Sync
          </Button>
        )}
      </div>
    )
  }

  // Banner variant - full width notification
  if (variant === 'banner') {
    if (!isOfflineMode && isOnline && !hasUnsyncedData) {
      return null // Don't show banner when everything is normal
    }

    return (
      <Alert className={cn("mb-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <AlertTitle>You're offline</AlertTitle>
              </>
            ) : hasUnsyncedData ? (
              <>
                <CloudOff className="h-4 w-4" />
                <AlertTitle>Syncing data...</AlertTitle>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>All data synced</AlertTitle>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasUnsyncedData && (
              <Badge variant="outline">
                {pendingCount} pending
              </Badge>
            )}
            
            {showSyncButton && isOnline && hasUnsyncedData && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncInProgress}
              >
                {syncInProgress ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sync Now
              </Button>
            )}
          </div>
        </div>

        <AlertDescription className="mt-2">
          {!isOnline ? (
            "Changes will be saved locally and synced when you're back online."
          ) : hasUnsyncedData ? (
            `${pendingCount} changes are being synced to the server.`
          ) : (
            "All your changes have been saved to the server."
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Full variant - detailed card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-600" />
              Offline
            </>
          )}
          
          {syncInProgress && (
            <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
          )}
        </CardTitle>
        
        <CardDescription className="text-xs">
          Last sync: {getLastSyncText()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Sync Status */}
        {hasUnsyncedData && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pending changes</span>
              <span>{pendingCount}</span>
            </div>
            
            {syncInProgress && (
              <div className="space-y-1">
                <Progress value={undefined} className="h-1" />
                <p className="text-xs text-muted-foreground">Syncing...</p>
              </div>
            )}
          </div>
        )}

        {/* Offline Mode Info */}
        {isOfflineMode && (
          <Alert className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Working offline. Changes will sync automatically when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {showSyncButton && isOnline && hasUnsyncedData && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncInProgress}
              className="flex-1 h-7 text-xs"
            >
              {syncInProgress ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Sync Now
            </Button>
          )}
        </div>

        {/* Connection Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {hasUnsyncedData && (
            <div className="flex justify-between">
              <span>Pending:</span>
              <span>{pendingCount} actions</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simple connection status badge
 */
export function ConnectionStatus({ className }: { className?: string }) {
  const { isOnline, syncInProgress } = useOfflineManager()

  return (
    <Badge 
      variant={isOnline ? 'default' : 'destructive'} 
      className={cn("text-xs", className)}
    >
      <div className="flex items-center gap-1">
        {syncInProgress ? (
          <RefreshCw className="h-2 w-2 animate-spin" />
        ) : isOnline ? (
          <Wifi className="h-2 w-2" />
        ) : (
          <WifiOff className="h-2 w-2" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </div>
    </Badge>
  )
}

/**
 * Sync status indicator for specific operations
 */
export function SyncStatus({ 
  operation, 
  className 
}: { 
  operation?: string
  className?: string 
}) {
  const { syncInProgress, pendingActions } = useOfflineManager()
  
  const hasPendingOperation = operation 
    ? pendingActions.some(action => action.collection === operation)
    : pendingActions.length > 0

  if (!hasPendingOperation && !syncInProgress) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>
        {syncInProgress ? 'Syncing...' : 'Pending sync'}
      </span>
    </div>
  )
}
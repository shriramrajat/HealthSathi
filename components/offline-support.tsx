// Offline Support Component
// Provides UI for managing offline functionality and sync queue

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Trash2,
  Info
} from 'lucide-react'
import { useSyncStatus, useNetworkStatus, useDataConsistency } from '@/hooks/use-real-time-sync'
import { useToast } from '@/hooks/use-toast'

interface OfflineSupportProps {
  className?: string
  showDetailedMetrics?: boolean
}

export function OfflineSupport({ className, showDetailedMetrics = false }: OfflineSupportProps) {
  const { isOnline } = useNetworkStatus()
  const { metrics, syncErrors, forceSyncAll, clearOfflineData } = useSyncStatus()
  const { conflicts, resolveConflict } = useDataConsistency()
  const { toast } = useToast()
  const [isForceSync, setIsForceSync] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)

  const handleForceSyncAll = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "You need to be online to sync data.",
        variant: "destructive"
      })
      return
    }

    setIsForceSync(true)
    try {
      await forceSyncAll()
      toast({
        title: "Sync Complete",
        description: "All pending changes have been synchronized.",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync all data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsForceSync(false)
    }
  }

  const handleClearOfflineData = async () => {
    setIsClearingData(true)
    try {
      await clearOfflineData()
      toast({
        title: "Data Cleared",
        description: "Offline data has been cleared successfully.",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear offline data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsClearingData(false)
    }
  }

  const handleResolveConflict = async (
    collection: string,
    documentId: string,
    resolution: 'server_wins' | 'client_wins' | 'merge'
  ) => {
    try {
      await resolveConflict(collection, documentId, resolution)
      toast({
        title: "Conflict Resolved",
        description: `Data conflict resolved using ${resolution.replace('_', ' ')} strategy.`,
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve data conflict. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getSyncProgress = () => {
    if (metrics.syncQueueSize === 0) return 100
    const processed = metrics.updatesReceived || 0
    const total = processed + metrics.syncQueueSize
    return total > 0 ? (processed / total) * 100 : 0
  }

  return (
    <div className={className}>
      {/* Network Status Alert */}
      {!isOnline && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Changes will be saved locally and synced when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Queue Alert */}
      {metrics.syncQueueSize > 0 && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{metrics.syncQueueSize} changes waiting to sync</span>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceSyncAll}
                disabled={isForceSync}
                className="ml-2"
              >
                {isForceSync ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Sync Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Data Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{conflicts.length} data conflicts need resolution</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="ml-2">
                    Resolve
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Data Conflicts</DialogTitle>
                    <DialogDescription>
                      Resolve conflicts between local and server data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {conflicts.map((conflict, index) => (
                      <Card key={`${conflict.collection}_${conflict.documentId}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            {conflict.collection} / {conflict.documentId}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Expected version: {conflict.expectedVersion}, 
                            Actual version: {conflict.actualVersion}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveConflict(
                                conflict.collection,
                                conflict.documentId,
                                'server_wins'
                              )}
                            >
                              Use Server
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveConflict(
                                conflict.collection,
                                conflict.documentId,
                                'client_wins'
                              )}
                            >
                              Use Local
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Metrics Panel */}
      {showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Status
            </CardTitle>
            <CardDescription>
              Real-time synchronization and offline support status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <Separator />

            {/* Sync Progress */}
            {metrics.syncQueueSize > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Sync Progress</span>
                  <span>{Math.round(getSyncProgress())}%</span>
                </div>
                <Progress value={getSyncProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {metrics.syncQueueSize} items pending sync
                </p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Active Listeners</p>
                <p className="font-medium">{metrics.listenersActive}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Updates Received</p>
                <p className="font-medium">{metrics.updatesReceived}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Conflicts Resolved</p>
                <p className="font-medium">{metrics.conflictsResolved}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {metrics.lastSyncTime 
                    ? metrics.lastSyncTime.toLocaleTimeString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceSyncAll}
                disabled={!isOnline || isForceSync}
                className="flex-1"
              >
                {isForceSync ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-2" />
                )}
                Force Sync
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearOfflineData}
                disabled={isClearingData}
                className="flex-1"
              >
                {isClearingData ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-2" />
                )}
                Clear Cache
              </Button>
            </div>

            {/* Recent Sync Errors */}
            {syncErrors.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Recent Errors
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {syncErrors.slice(-3).map((error, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                        <p className="font-medium text-red-800">{error.type}</p>
                        <p className="text-red-600">{error.error}</p>
                        <p className="text-red-500 mt-1">
                          {error.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Compact version for headers/toolbars
export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline } = useNetworkStatus()
  const { metrics } = useSyncStatus()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className={`text-xs ${
        isOnline ? 'text-green-600' : 'text-red-600'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {metrics.syncQueueSize > 0 && (
        <Badge variant="secondary" className="text-xs px-1 py-0">
          {metrics.syncQueueSize}
        </Badge>
      )}
    </div>
  )
}
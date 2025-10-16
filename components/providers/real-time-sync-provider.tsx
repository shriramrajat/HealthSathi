// Real-time Sync Provider
// Provides real-time synchronization context and initialization across the app

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { realTimeSyncService } from '@/lib/services/real-time-sync'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface RealTimeSyncContextType {
  isInitialized: boolean
  isOnline: boolean
  syncMetrics: {
    listenersActive: number
    updatesReceived: number
    conflictsResolved: number
    syncQueueSize: number
    lastSyncTime: Date | null
    pendingConflicts: number
  }
  initializeSync: () => Promise<void>
  cleanup: () => void
}

const RealTimeSyncContext = createContext<RealTimeSyncContextType | undefined>(undefined)

interface RealTimeSyncProviderProps {
  children: ReactNode
  enableAutoInit?: boolean
  showNetworkToasts?: boolean
  showConflictToasts?: boolean
}

export function RealTimeSyncProvider({ 
  children, 
  enableAutoInit = true,
  showNetworkToasts = true,
  showConflictToasts = true
}: RealTimeSyncProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncMetrics, setSyncMetrics] = useState({
    listenersActive: 0,
    updatesReceived: 0,
    conflictsResolved: 0,
    syncQueueSize: 0,
    lastSyncTime: null as Date | null,
    pendingConflicts: 0
  })

  const { user } = useAuth()
  const { toast } = useToast()

  // Initialize sync service
  const initializeSync = async () => {
    try {
      await realTimeSyncService.initialize()
      setIsInitialized(true)
      console.log('Real-time sync service initialized')
    } catch (error) {
      console.error('Failed to initialize real-time sync service:', error)
      if (showNetworkToasts) {
        toast({
          title: "Sync Service Error",
          description: "Failed to initialize real-time synchronization. Some features may not work properly.",
          variant: "destructive"
        })
      }
    }
  }

  // Cleanup function
  const cleanup = () => {
    realTimeSyncService.unsubscribeAll()
    setIsInitialized(false)
    console.log('Real-time sync service cleaned up')
  }

  // Auto-initialize when user is authenticated
  useEffect(() => {
    if (enableAutoInit && user && !isInitialized) {
      initializeSync()
    }
  }, [user, enableAutoInit, isInitialized])

  // Set up network status monitoring
  useEffect(() => {
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online)
      
      if (showNetworkToasts) {
        if (online) {
          toast({
            title: "Connection Restored",
            description: "Real-time synchronization is now active. Syncing pending changes...",
            variant: "default"
          })
        } else {
          toast({
            title: "Connection Lost",
            description: "Working offline. Changes will sync when connection is restored.",
            variant: "destructive"
          })
        }
      }
    }

    realTimeSyncService.onNetworkStatusChange(handleNetworkChange)

    // Also listen to browser events
    const handleOnline = () => handleNetworkChange(true)
    const handleOffline = () => handleNetworkChange(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showNetworkToasts, toast])

  // Set up sync error monitoring
  useEffect(() => {
    const handleSyncError = (error: { type: string; error: string }) => {
      console.error(`Sync error in ${error.type}:`, error.error)
      
      if (showNetworkToasts) {
        toast({
          title: "Sync Error",
          description: `Failed to sync ${error.type} data. Retrying...`,
          variant: "destructive"
        })
      }
    }

    realTimeSyncService.onSyncError(handleSyncError)
  }, [showNetworkToasts, toast])

  // Set up conflict monitoring
  useEffect(() => {
    const handleConflict = (conflict: any) => {
      console.warn('Data consistency conflict detected:', conflict)
      
      if (showConflictToasts) {
        toast({
          title: "Data Conflict Detected",
          description: `Conflict in ${conflict.collection} data. Using server version.`,
          variant: "destructive"
        })
      }
    }

    realTimeSyncService.onConsistencyConflict(handleConflict)
  }, [showConflictToasts, toast])

  // Update metrics periodically
  useEffect(() => {
    if (!isInitialized) return

    const updateMetrics = () => {
      setSyncMetrics(realTimeSyncService.getMetrics())
    }

    // Update immediately
    updateMetrics()

    // Then update every 10 seconds
    const interval = setInterval(updateMetrics, 10000)

    return () => clearInterval(interval)
  }, [isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const contextValue: RealTimeSyncContextType = {
    isInitialized,
    isOnline,
    syncMetrics,
    initializeSync,
    cleanup
  }

  return (
    <RealTimeSyncContext.Provider value={contextValue}>
      {children}
    </RealTimeSyncContext.Provider>
  )
}

// Hook to use the real-time sync context
export function useRealTimeSyncContext() {
  const context = useContext(RealTimeSyncContext)
  if (context === undefined) {
    throw new Error('useRealTimeSyncContext must be used within a RealTimeSyncProvider')
  }
  return context
}

// Component to display sync status
export function SyncStatusIndicator({ className }: { className?: string }) {
  const { isOnline, syncMetrics, isInitialized } = useRealTimeSyncContext()

  if (!isInitialized) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span>Initializing sync...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      
      {syncMetrics.syncQueueSize > 0 && (
        <span className="text-amber-600 text-xs">
          ({syncMetrics.syncQueueSize} pending)
        </span>
      )}
      
      {syncMetrics.pendingConflicts > 0 && (
        <span className="text-red-600 text-xs">
          ({syncMetrics.pendingConflicts} conflicts)
        </span>
      )}
    </div>
  )
}

// Component to display detailed sync metrics
export function SyncMetricsPanel({ className }: { className?: string }) {
  const { syncMetrics, isOnline, isInitialized } = useRealTimeSyncContext()

  if (!isInitialized) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-muted-foreground">Sync service not initialized</p>
      </div>
    )
  }

  return (
    <div className={`p-4 bg-white border rounded-lg space-y-2 ${className}`}>
      <h3 className="font-medium text-sm">Sync Status</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Status:</span>
          <span className={`ml-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div>
          <span className="text-muted-foreground">Active Listeners:</span>
          <span className="ml-2">{syncMetrics.listenersActive}</span>
        </div>
        
        <div>
          <span className="text-muted-foreground">Updates Received:</span>
          <span className="ml-2">{syncMetrics.updatesReceived}</span>
        </div>
        
        <div>
          <span className="text-muted-foreground">Pending Sync:</span>
          <span className="ml-2">{syncMetrics.syncQueueSize}</span>
        </div>
        
        <div>
          <span className="text-muted-foreground">Conflicts Resolved:</span>
          <span className="ml-2">{syncMetrics.conflictsResolved}</span>
        </div>
        
        <div>
          <span className="text-muted-foreground">Last Sync:</span>
          <span className="ml-2">
            {syncMetrics.lastSyncTime 
              ? syncMetrics.lastSyncTime.toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>
      </div>
      
      {syncMetrics.pendingConflicts > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <span className="text-red-600 font-medium">
            {syncMetrics.pendingConflicts} data conflicts need resolution
          </span>
        </div>
      )}
    </div>
  )
}
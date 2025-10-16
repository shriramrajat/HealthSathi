/**
 * Offline Manager for Dashboard
 * Handles offline functionality, data synchronization, and offline indicators
 */

import { getFirebaseFirestore } from '@/lib/firebase'

export interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  documentId?: string
  data?: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface OfflineState {
  isOnline: boolean
  isOfflineMode: boolean
  pendingActions: OfflineAction[]
  lastSyncTime: number
  syncInProgress: boolean
}

export class OfflineManager {
  private state: OfflineState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOfflineMode: false,
    pendingActions: [],
    lastSyncTime: 0,
    syncInProgress: false
  }

  private listeners: Array<(state: OfflineState) => void> = []
  private syncQueue: OfflineAction[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private readonly STORAGE_KEY = 'dashboard_offline_data'
  private readonly SYNC_INTERVAL = 30000 // 30 seconds

  constructor() {
    this.initializeOfflineSupport()
    this.loadPersistedState()
    this.startSyncInterval()
  }

  /**
   * Initialize offline support with event listeners
   */
  private initializeOfflineSupport() {
    if (typeof window === 'undefined') return

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Listen for visibility changes to sync when app becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    // Listen for beforeunload to persist state
    window.addEventListener('beforeunload', this.persistState)
  }

  /**
   * Handle online event
   */
  private handleOnline = () => {
    console.log('Dashboard: Connection restored')
    this.updateState({ isOnline: true })
    this.syncPendingActions()
  }

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    console.log('Dashboard: Connection lost, switching to offline mode')
    this.updateState({ 
      isOnline: false,
      isOfflineMode: true 
    })
  }

  /**
   * Handle visibility change to sync when app becomes visible
   */
  private handleVisibilityChange = () => {
    if (!document.hidden && this.state.isOnline) {
      this.syncPendingActions()
    }
  }

  /**
   * Start sync interval for periodic synchronization
   */
  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.pendingActions.length > 0) {
        this.syncPendingActions()
      }
    }, this.SYNC_INTERVAL)
  }

  /**
   * Stop sync interval
   */
  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<OfflineState>) {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
    this.persistState()
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Add a listener for state changes
   */
  public addListener(listener: (state: OfflineState) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current offline state
   */
  public getState(): OfflineState {
    return { ...this.state }
  }

  /**
   * Check if currently online
   */
  public isOnline(): boolean {
    return this.state.isOnline
  }

  /**
   * Check if in offline mode
   */
  public isOfflineMode(): boolean {
    return this.state.isOfflineMode
  }

  /**
   * Get pending actions count
   */
  public getPendingActionsCount(): number {
    return this.state.pendingActions.length
  }

  /**
   * Add action to offline queue
   */
  public queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }

    const pendingActions = [...this.state.pendingActions, offlineAction]
    this.updateState({ pendingActions })

    console.log(`Queued offline action: ${action.type} ${action.collection}`, offlineAction)

    // Try to sync immediately if online
    if (this.state.isOnline) {
      this.syncPendingActions()
    }
  }

  /**
   * Sync all pending actions
   */
  public async syncPendingActions(): Promise<void> {
    if (this.state.syncInProgress || !this.state.isOnline || this.state.pendingActions.length === 0) {
      return
    }

    this.updateState({ syncInProgress: true })

    try {
      const db = await getFirebaseFirestore()
      const { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore')

      const successfulActions: string[] = []
      const failedActions: OfflineAction[] = []

      for (const action of this.state.pendingActions) {
        try {
          await this.executeAction(db, action, { doc, setDoc, updateDoc, deleteDoc, serverTimestamp })
          successfulActions.push(action.id)
          console.log(`Successfully synced action: ${action.type} ${action.collection}`)
        } catch (error) {
          console.error(`Failed to sync action: ${action.type} ${action.collection}`, error)
          
          // Increment retry count
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1
          }

          // Only keep actions that haven't exceeded max retries
          if (updatedAction.retryCount < updatedAction.maxRetries) {
            failedActions.push(updatedAction)
          } else {
            console.error(`Action exceeded max retries, discarding: ${action.type} ${action.collection}`)
          }
        }
      }

      // Update pending actions (remove successful, keep failed for retry)
      const pendingActions = failedActions
      this.updateState({ 
        pendingActions,
        lastSyncTime: Date.now(),
        syncInProgress: false
      })

      if (successfulActions.length > 0) {
        console.log(`Successfully synced ${successfulActions.length} actions`)
      }

      if (failedActions.length > 0) {
        console.log(`${failedActions.length} actions failed, will retry later`)
      }

    } catch (error) {
      console.error('Sync process failed:', error)
      this.updateState({ syncInProgress: false })
    }
  }

  /**
   * Execute a single offline action
   */
  private async executeAction(
    db: any, 
    action: OfflineAction, 
    firestoreUtils: any
  ): Promise<void> {
    const { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } = firestoreUtils

    switch (action.type) {
      case 'create':
        if (action.documentId && action.data) {
          const docRef = doc(db, action.collection, action.documentId)
          await setDoc(docRef, {
            ...action.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
        break

      case 'update':
        if (action.documentId && action.data) {
          const docRef = doc(db, action.collection, action.documentId)
          await updateDoc(docRef, {
            ...action.data,
            updatedAt: serverTimestamp()
          })
        }
        break

      case 'delete':
        if (action.documentId) {
          const docRef = doc(db, action.collection, action.documentId)
          await deleteDoc(docRef)
        }
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Persist state to localStorage
   */
  private persistState = () => {
    if (typeof window === 'undefined') return

    try {
      const persistData = {
        pendingActions: this.state.pendingActions,
        lastSyncTime: this.state.lastSyncTime,
        isOfflineMode: this.state.isOfflineMode
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistData))
    } catch (error) {
      console.error('Failed to persist offline state:', error)
    }
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState() {
    if (typeof window === 'undefined') return

    try {
      const persistedData = localStorage.getItem(this.STORAGE_KEY)
      if (persistedData) {
        const data = JSON.parse(persistedData)
        this.updateState({
          pendingActions: data.pendingActions || [],
          lastSyncTime: data.lastSyncTime || 0,
          isOfflineMode: data.isOfflineMode || false
        })
      }
    } catch (error) {
      console.error('Failed to load persisted offline state:', error)
    }
  }

  /**
   * Clear all offline data
   */
  public clearOfflineData() {
    this.updateState({
      pendingActions: [],
      lastSyncTime: 0,
      isOfflineMode: false
    })

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  /**
   * Force sync now
   */
  public async forcSync(): Promise<void> {
    await this.syncPendingActions()
  }

  /**
   * Enable offline mode manually
   */
  public enableOfflineMode() {
    this.updateState({ isOfflineMode: true })
  }

  /**
   * Disable offline mode manually
   */
  public disableOfflineMode() {
    this.updateState({ isOfflineMode: false })
    if (this.state.isOnline) {
      this.syncPendingActions()
    }
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    this.stopSyncInterval()
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      window.removeEventListener('beforeunload', this.persistState)
    }

    this.listeners = []
  }
}

// Global instance
export const offlineManager = new OfflineManager()

/**
 * React hook for using offline manager
 */
export function useOfflineManager() {
  const [state, setState] = React.useState<OfflineState>(offlineManager.getState())

  React.useEffect(() => {
    const unsubscribe = offlineManager.addListener(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    queueAction: offlineManager.queueAction.bind(offlineManager),
    syncNow: offlineManager.forcSync.bind(offlineManager),
    clearOfflineData: offlineManager.clearOfflineData.bind(offlineManager),
    enableOfflineMode: offlineManager.enableOfflineMode.bind(offlineManager),
    disableOfflineMode: offlineManager.disableOfflineMode.bind(offlineManager)
  }
}

// Import React for the hook
import React from 'react'
// Real-time Data Synchronization Service
// Handles real-time listeners, data consistency, and offline support across dashboards

import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  clearIndexedDbPersistence,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import type { 
  Appointment, 
  Prescription, 
  Patient, 
  SymptomResult,
  CHWLog,
  PharmacyStock,
  Consultation
} from '@/lib/types/healthcare-models'

// Types for real-time updates
export interface RealTimeUpdate<T = any> {
  type: 'added' | 'modified' | 'removed'
  id: string
  data: T
  timestamp: Date
  source: 'server' | 'local' | 'cache'
}

export interface SyncQueueItem {
  id: string
  collection: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

export interface DataConsistencyCheck {
  collection: string
  documentId: string
  expectedVersion: number
  actualVersion: number
  conflictResolved: boolean
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'manual'
}

// Event emitter for cross-dashboard communication
class RealTimeEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map()

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

class RealTimeSyncService {
  private db: any = null
  private eventEmitter = new RealTimeEventEmitter()
  private activeListeners: Map<string, Unsubscribe> = new Map()
  private syncQueue: SyncQueueItem[] = []
  private isOnline = navigator.onLine
  private syncInProgress = false
  private consistencyChecks: Map<string, DataConsistencyCheck> = new Map()

  // Performance metrics
  private metrics = {
    listenersActive: 0,
    updatesReceived: 0,
    conflictsResolved: 0,
    syncQueueSize: 0,
    lastSyncTime: null as Date | null
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await getFirebaseFirestore()
    }

    // Set up network status monitoring
    this.setupNetworkMonitoring()
    
    // Start periodic sync queue processing
    this.startSyncQueueProcessor()

    console.log('Real-time sync service initialized')
  }

  /**
   * Set up network status monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored')
      this.isOnline = true
      this.eventEmitter.emit('network:online', { timestamp: new Date() })
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      console.log('Network connection lost')
      this.isOnline = false
      this.eventEmitter.emit('network:offline', { timestamp: new Date() })
    })
  }

  /**
   * Start periodic sync queue processing
   */
  private startSyncQueueProcessor(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.syncQueue.length > 0) {
        this.processSyncQueue()
      }
    }, 5000) // Process every 5 seconds
  }

  /**
   * Subscribe to real-time updates for appointments
   */
  subscribeToAppointments(
    filters: { patientId?: string; doctorId?: string; status?: string[] } = {},
    callback: (updates: RealTimeUpdate<Appointment>[]) => void
  ): string {
    const listenerId = `appointments_${Date.now()}_${Math.random()}`
    
    this.initialize().then(() => {
      let appointmentsQuery = collection(this.db, 'appointments')
      const constraints: any[] = []

      // Apply filters
      if (filters.patientId) {
        constraints.push(where('patientId', '==', filters.patientId))
      }
      if (filters.doctorId) {
        constraints.push(where('doctorId', '==', filters.doctorId))
      }
      if (filters.status && filters.status.length > 0) {
        if (filters.status.length === 1) {
          constraints.push(where('status', '==', filters.status[0]))
        } else {
          constraints.push(where('status', 'in', filters.status))
        }
      }

      constraints.push(orderBy('scheduledAt', 'desc'))
      constraints.push(limit(50))

      const q = query(appointmentsQuery, ...constraints)

      const unsubscribe = onSnapshot(q, 
        (snapshot: QuerySnapshot) => {
          const updates: RealTimeUpdate<Appointment>[] = []
          
          snapshot.docChanges().forEach((change) => {
            const appointment: Appointment = {
              id: change.doc.id,
              ...change.doc.data()
            } as Appointment

            updates.push({
              type: change.type,
              id: change.doc.id,
              data: appointment,
              timestamp: new Date(),
              source: change.doc.metadata.fromCache ? 'cache' : 'server'
            })
          })

          if (updates.length > 0) {
            this.metrics.updatesReceived += updates.length
            callback(updates)
            this.eventEmitter.emit('appointments:updated', updates)
          }
        },
        (error) => {
          console.error('Error in appointments listener:', error)
          this.eventEmitter.emit('sync:error', { 
            type: 'appointments', 
            error: error.message 
          })
        }
      )

      this.activeListeners.set(listenerId, unsubscribe)
      this.metrics.listenersActive++
    })

    return listenerId
  }

  /**
   * Subscribe to real-time updates for prescriptions
   */
  subscribeToPrescriptions(
    filters: { patientId?: string; doctorId?: string; pharmacyId?: string; status?: string } = {},
    callback: (updates: RealTimeUpdate<Prescription>[]) => void
  ): string {
    const listenerId = `prescriptions_${Date.now()}_${Math.random()}`
    
    this.initialize().then(() => {
      let prescriptionsQuery = collection(this.db, 'prescriptions')
      const constraints: any[] = []

      // Apply filters
      if (filters.patientId) {
        constraints.push(where('patientId', '==', filters.patientId))
      }
      if (filters.doctorId) {
        constraints.push(where('doctorId', '==', filters.doctorId))
      }
      if (filters.pharmacyId) {
        constraints.push(where('pharmacyId', '==', filters.pharmacyId))
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status))
      }

      constraints.push(orderBy('createdAt', 'desc'))
      constraints.push(limit(50))

      const q = query(prescriptionsQuery, ...constraints)

      const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot) => {
          const updates: RealTimeUpdate<Prescription>[] = []
          
          snapshot.docChanges().forEach((change) => {
            const prescription: Prescription = {
              id: change.doc.id,
              ...change.doc.data()
            } as Prescription

            updates.push({
              type: change.type,
              id: change.doc.id,
              data: prescription,
              timestamp: new Date(),
              source: change.doc.metadata.fromCache ? 'cache' : 'server'
            })
          })

          if (updates.length > 0) {
            this.metrics.updatesReceived += updates.length
            callback(updates)
            this.eventEmitter.emit('prescriptions:updated', updates)
          }
        },
        (error) => {
          console.error('Error in prescriptions listener:', error)
          this.eventEmitter.emit('sync:error', { 
            type: 'prescriptions', 
            error: error.message 
          })
        }
      )

      this.activeListeners.set(listenerId, unsubscribe)
      this.metrics.listenersActive++
    })

    return listenerId
  }

  /**
   * Subscribe to real-time updates for pharmacy stock
   */
  subscribeToPharmacyStock(
    pharmacyId: string,
    callback: (updates: RealTimeUpdate<PharmacyStock>[]) => void
  ): string {
    const listenerId = `pharmacy_stock_${Date.now()}_${Math.random()}`
    
    this.initialize().then(() => {
      const q = query(
        collection(this.db, 'pharmacy-stock'),
        where('pharmacyId', '==', pharmacyId),
        orderBy('updatedAt', 'desc'),
        limit(100)
      )

      const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot) => {
          const updates: RealTimeUpdate<PharmacyStock>[] = []
          
          snapshot.docChanges().forEach((change) => {
            const stock: PharmacyStock = {
              id: change.doc.id,
              ...change.doc.data()
            } as PharmacyStock

            updates.push({
              type: change.type,
              id: change.doc.id,
              data: stock,
              timestamp: new Date(),
              source: change.doc.metadata.fromCache ? 'cache' : 'server'
            })
          })

          if (updates.length > 0) {
            this.metrics.updatesReceived += updates.length
            callback(updates)
            this.eventEmitter.emit('pharmacy-stock:updated', updates)
          }
        },
        (error) => {
          console.error('Error in pharmacy stock listener:', error)
          this.eventEmitter.emit('sync:error', { 
            type: 'pharmacy-stock', 
            error: error.message 
          })
        }
      )

      this.activeListeners.set(listenerId, unsubscribe)
      this.metrics.listenersActive++
    })

    return listenerId
  }

  /**
   * Subscribe to real-time updates for CHW logs
   */
  subscribeToCHWLogs(
    chwId: string,
    callback: (updates: RealTimeUpdate<CHWLog>[]) => void
  ): string {
    const listenerId = `chw_logs_${Date.now()}_${Math.random()}`
    
    this.initialize().then(() => {
      const q = query(
        collection(this.db, 'chw-logs'),
        where('chwId', '==', chwId),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot) => {
          const updates: RealTimeUpdate<CHWLog>[] = []
          
          snapshot.docChanges().forEach((change) => {
            const log: CHWLog = {
              id: change.doc.id,
              ...change.doc.data()
            } as CHWLog

            updates.push({
              type: change.type,
              id: change.doc.id,
              data: log,
              timestamp: new Date(),
              source: change.doc.metadata.fromCache ? 'cache' : 'server'
            })
          })

          if (updates.length > 0) {
            this.metrics.updatesReceived += updates.length
            callback(updates)
            this.eventEmitter.emit('chw-logs:updated', updates)
          }
        },
        (error) => {
          console.error('Error in CHW logs listener:', error)
          this.eventEmitter.emit('sync:error', { 
            type: 'chw-logs', 
            error: error.message 
          })
        }
      )

      this.activeListeners.set(listenerId, unsubscribe)
      this.metrics.listenersActive++
    })

    return listenerId
  }

  /**
   * Subscribe to patient record updates
   */
  subscribeToPatientRecord(
    patientId: string,
    callback: (update: RealTimeUpdate<Patient>) => void
  ): string {
    const listenerId = `patient_${patientId}_${Date.now()}`
    
    this.initialize().then(() => {
      const unsubscribe = onSnapshot(
        doc(this.db, 'patients', patientId),
        (snapshot: DocumentSnapshot) => {
          if (snapshot.exists()) {
            const patient: Patient = {
              id: snapshot.id,
              ...snapshot.data()
            } as Patient

            const update: RealTimeUpdate<Patient> = {
              type: 'modified',
              id: snapshot.id,
              data: patient,
              timestamp: new Date(),
              source: snapshot.metadata.fromCache ? 'cache' : 'server'
            }

            this.metrics.updatesReceived++
            callback(update)
            this.eventEmitter.emit('patient:updated', update)
          }
        },
        (error) => {
          console.error('Error in patient listener:', error)
          this.eventEmitter.emit('sync:error', { 
            type: 'patient', 
            error: error.message 
          })
        }
      )

      this.activeListeners.set(listenerId, unsubscribe)
      this.metrics.listenersActive++
    })

    return listenerId
  }

  /**
   * Unsubscribe from a real-time listener
   */
  unsubscribe(listenerId: string): void {
    const unsubscribe = this.activeListeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      this.activeListeners.delete(listenerId)
      this.metrics.listenersActive--
      console.log(`Unsubscribed from listener: ${listenerId}`)
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.activeListeners.forEach((unsubscribe, listenerId) => {
      unsubscribe()
      console.log(`Unsubscribed from listener: ${listenerId}`)
    })
    this.activeListeners.clear()
    this.metrics.listenersActive = 0
    this.eventEmitter.removeAllListeners()
  }

  /**
   * Add operation to sync queue for offline support
   */
  addToSyncQueue(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    documentId?: string
  ): void {
    const queueItem: SyncQueueItem = {
      id: documentId || `temp_${Date.now()}_${Math.random()}`,
      collection,
      operation,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    }

    this.syncQueue.push(queueItem)
    this.metrics.syncQueueSize = this.syncQueue.length

    // Try to process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue()
    }

    console.log(`Added ${operation} operation to sync queue for ${collection}`)
  }

  /**
   * Process sync queue for offline operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0 || !this.isOnline) {
      return
    }

    this.syncInProgress = true
    console.log(`Processing sync queue with ${this.syncQueue.length} items`)

    try {
      await this.initialize()
      
      const batch = writeBatch(this.db)
      const itemsToProcess = this.syncQueue.splice(0, 10) // Process in batches of 10
      const processedItems: string[] = []

      for (const item of itemsToProcess) {
        try {
          const docRef = doc(this.db, item.collection, item.id)

          switch (item.operation) {
            case 'create':
              batch.set(docRef, {
                ...item.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              })
              break

            case 'update':
              batch.update(docRef, {
                ...item.data,
                updatedAt: serverTimestamp()
              })
              break

            case 'delete':
              batch.delete(docRef)
              break
          }

          processedItems.push(item.id)
        } catch (error) {
          console.error(`Error processing sync queue item ${item.id}:`, error)
          
          // Retry logic
          item.retryCount++
          if (item.retryCount < item.maxRetries) {
            this.syncQueue.push(item) // Re-add for retry
          } else {
            console.error(`Max retries exceeded for sync queue item ${item.id}`)
          }
        }
      }

      // Commit batch
      if (processedItems.length > 0) {
        await batch.commit()
        console.log(`Successfully synced ${processedItems.length} items`)
        this.metrics.lastSyncTime = new Date()
      }

    } catch (error) {
      console.error('Error processing sync queue:', error)
      // Re-add items to queue for retry
      // itemsToProcess.forEach(item => this.syncQueue.unshift(item))
    } finally {
      this.syncInProgress = false
      this.metrics.syncQueueSize = this.syncQueue.length
    }
  }

  /**
   * Check data consistency and resolve conflicts
   */
  async checkDataConsistency(
    collection: string,
    documentId: string,
    expectedVersion: number
  ): Promise<DataConsistencyCheck> {
    try {
      await this.initialize()
      
      const docRef = doc(this.db, collection, documentId)
      const { getDoc } = await import('firebase/firestore')
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error(`Document ${documentId} not found in ${collection}`)
      }

      const actualVersion = docSnap.data()?.version || 0
      const conflictResolved = expectedVersion === actualVersion

      const check: DataConsistencyCheck = {
        collection,
        documentId,
        expectedVersion,
        actualVersion,
        conflictResolved,
        resolution: conflictResolved ? 'server_wins' : 'manual'
      }

      if (!conflictResolved) {
        console.warn(`Data consistency conflict detected in ${collection}/${documentId}`)
        this.consistencyChecks.set(`${collection}_${documentId}`, check)
        this.eventEmitter.emit('consistency:conflict', check)
      }

      return check
    } catch (error) {
      console.error('Error checking data consistency:', error)
      throw error
    }
  }

  /**
   * Resolve data consistency conflict
   */
  async resolveConflict(
    collection: string,
    documentId: string,
    resolution: 'server_wins' | 'client_wins' | 'merge',
    mergeData?: any
  ): Promise<void> {
    try {
      await this.initialize()
      
      const checkKey = `${collection}_${documentId}`
      const check = this.consistencyChecks.get(checkKey)

      if (!check) {
        throw new Error(`No conflict found for ${collection}/${documentId}`)
      }

      const docRef = doc(this.db, collection, documentId)

      switch (resolution) {
        case 'server_wins':
          // Do nothing, server data is already current
          break

        case 'client_wins':
          // Update server with client data
          const { updateDoc } = await import('firebase/firestore')
          await updateDoc(docRef, {
            ...mergeData,
            version: check.actualVersion + 1,
            updatedAt: serverTimestamp()
          })
          break

        case 'merge':
          // Merge client and server data
          if (!mergeData) {
            throw new Error('Merge data required for merge resolution')
          }
          const { updateDoc: updateDocMerge } = await import('firebase/firestore')
          await updateDocMerge(docRef, {
            ...mergeData,
            version: check.actualVersion + 1,
            updatedAt: serverTimestamp()
          })
          break
      }

      check.conflictResolved = true
      check.resolution = resolution
      this.metrics.conflictsResolved++

      this.eventEmitter.emit('consistency:resolved', check)
      console.log(`Conflict resolved for ${collection}/${documentId} using ${resolution}`)

    } catch (error) {
      console.error('Error resolving conflict:', error)
      throw error
    }
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncAll(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot force sync while offline')
    }

    try {
      await this.initialize()
      await waitForPendingWrites(this.db)
      await this.processSyncQueue()
      console.log('Force sync completed successfully')
    } catch (error) {
      console.error('Error during force sync:', error)
      throw error
    }
  }

  /**
   * Clear offline data and reset sync state
   */
  async clearOfflineData(): Promise<void> {
    try {
      await disableNetwork(this.db)
      await clearIndexedDbPersistence(this.db)
      await enableNetwork(this.db)
      
      this.syncQueue = []
      this.consistencyChecks.clear()
      this.metrics.syncQueueSize = 0
      
      console.log('Offline data cleared successfully')
    } catch (error) {
      console.error('Error clearing offline data:', error)
      throw error
    }
  }

  /**
   * Get sync service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isOnline: this.isOnline,
      activeListeners: this.activeListeners.size,
      pendingConflicts: this.consistencyChecks.size
    }
  }

  /**
   * Event subscription methods
   */
  onNetworkStatusChange(callback: (isOnline: boolean) => void): void {
    this.eventEmitter.on('network:online', () => callback(true))
    this.eventEmitter.on('network:offline', () => callback(false))
  }

  onSyncError(callback: (error: { type: string; error: string }) => void): void {
    this.eventEmitter.on('sync:error', callback)
  }

  onConsistencyConflict(callback: (check: DataConsistencyCheck) => void): void {
    this.eventEmitter.on('consistency:conflict', callback)
  }

  onDataUpdate(event: string, callback: (updates: RealTimeUpdate[]) => void): void {
    this.eventEmitter.on(event, callback)
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService()
export default realTimeSyncService
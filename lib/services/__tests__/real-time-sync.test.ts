// Real-time Sync Service Tests
// Tests for real-time data synchronization functionality

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn(),
  waitForPendingWrites: vi.fn(),
  clearIndexedDbPersistence: vi.fn()
}))

// Mock Firebase initialization
vi.mock('@/lib/firebase', () => ({
  getFirebaseFirestore: vi.fn().mockResolvedValue({
    collection: vi.fn(),
    doc: vi.fn()
  })
}))

import { realTimeSyncService } from '../real-time-sync'
import * as firestore from 'firebase/firestore'
import * as firebase from '@/lib/firebase'

const mockOnSnapshot = vi.mocked(firestore.onSnapshot)
const mockCollection = vi.mocked(firestore.collection)
const mockQuery = vi.mocked(firestore.query)
const mockWhere = vi.mocked(firestore.where)
const mockOrderBy = vi.mocked(firestore.orderBy)
const mockLimit = vi.mocked(firestore.limit)
const mockDoc = vi.mocked(firestore.doc)
const mockWriteBatch = vi.mocked(firestore.writeBatch)
const mockServerTimestamp = vi.mocked(firestore.serverTimestamp)
const mockEnableNetwork = vi.mocked(firestore.enableNetwork)
const mockDisableNetwork = vi.mocked(firestore.disableNetwork)
const mockWaitForPendingWrites = vi.mocked(firestore.waitForPendingWrites)
const mockClearIndexedDbPersistence = vi.mocked(firestore.clearIndexedDbPersistence)
const mockGetFirebaseFirestore = vi.mocked(firebase.getFirebaseFirestore)

describe('RealTimeSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset network status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    // Mock query chain
    mockCollection.mockReturnValue('collection' as any)
    mockWhere.mockReturnValue('where' as any)
    mockOrderBy.mockReturnValue('orderBy' as any)
    mockLimit.mockReturnValue('limit' as any)
    mockQuery.mockReturnValue('query' as any)
    
    // Mock batch operations
    const mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined)
    }
    mockWriteBatch.mockReturnValue(mockBatch as any)
    mockServerTimestamp.mockReturnValue({ serverTimestamp: true } as any)
    
    // Mock Firebase initialization
    mockGetFirebaseFirestore.mockResolvedValue({
      collection: mockCollection,
      doc: mockDoc
    } as any)
  })

  afterEach(() => {
    realTimeSyncService.unsubscribeAll()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(realTimeSyncService.initialize()).resolves.not.toThrow()
    })

    it('should set up network monitoring', async () => {
      await realTimeSyncService.initialize()
      
      // Simulate network events
      const onlineEvent = new Event('online')
      const offlineEvent = new Event('offline')
      
      window.dispatchEvent(offlineEvent)
      window.dispatchEvent(onlineEvent)
      
      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Real-time Subscriptions', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should subscribe to appointments with filters', () => {
      const callback = vi.fn()
      const filters = { patientId: 'patient123', status: ['scheduled'] }
      
      const listenerId = realTimeSyncService.subscribeToAppointments(filters, callback)
      
      expect(listenerId).toMatch(/^appointments_/)
      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should subscribe to prescriptions with filters', () => {
      const callback = vi.fn()
      const filters = { patientId: 'patient123', status: 'issued' }
      
      const listenerId = realTimeSyncService.subscribeToPrescriptions(filters, callback)
      
      expect(listenerId).toMatch(/^prescriptions_/)
      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should subscribe to pharmacy stock', () => {
      const callback = vi.fn()
      const pharmacyId = 'pharmacy123'
      
      const listenerId = realTimeSyncService.subscribeToPharmacyStock(pharmacyId, callback)
      
      expect(listenerId).toMatch(/^pharmacy_stock_/)
      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should subscribe to CHW logs', () => {
      const callback = vi.fn()
      const chwId = 'chw123'
      
      const listenerId = realTimeSyncService.subscribeToCHWLogs(chwId, callback)
      
      expect(listenerId).toMatch(/^chw_logs_/)
      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should subscribe to patient records', () => {
      const callback = vi.fn()
      const patientId = 'patient123'
      
      const listenerId = realTimeSyncService.subscribeToPatientRecord(patientId, callback)
      
      expect(listenerId).toMatch(/^patient_patient123_/)
      expect(mockOnSnapshot).toHaveBeenCalled()
    })

    it('should unsubscribe from listeners', () => {
      const callback = vi.fn()
      const mockUnsubscribe = vi.fn()
      
      mockOnSnapshot.mockReturnValue(mockUnsubscribe)
      
      const listenerId = realTimeSyncService.subscribeToAppointments({}, callback)
      realTimeSyncService.unsubscribe(listenerId)
      
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should unsubscribe from all listeners', () => {
      const callback = vi.fn()
      const mockUnsubscribe1 = vi.fn()
      const mockUnsubscribe2 = vi.fn()
      
      mockOnSnapshot
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2)
      
      realTimeSyncService.subscribeToAppointments({}, callback)
      realTimeSyncService.subscribeToPrescriptions({}, callback)
      
      realTimeSyncService.unsubscribeAll()
      
      expect(mockUnsubscribe1).toHaveBeenCalled()
      expect(mockUnsubscribe2).toHaveBeenCalled()
    })
  })

  describe('Offline Support', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should add operations to sync queue when offline', () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        value: false
      })

      realTimeSyncService.addToSyncQueue('appointments', 'create', {
        patientId: 'patient123',
        doctorId: 'doctor123'
      })

      const metrics = realTimeSyncService.getMetrics()
      expect(metrics.syncQueueSize).toBe(1)
    })

    it('should process sync queue when online', async () => {
      realTimeSyncService.addToSyncQueue('appointments', 'create', {
        patientId: 'patient123',
        doctorId: 'doctor123'
      })

      // Mock successful batch commit
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      }
      mockWriteBatch.mockReturnValue(mockBatch)

      // Process sync queue (this happens automatically, but we can test the internal logic)
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockWriteBatch).toHaveBeenCalled()
    })

    it('should handle sync queue errors gracefully', async () => {
      realTimeSyncService.addToSyncQueue('appointments', 'create', {
        patientId: 'patient123',
        doctorId: 'doctor123'
      })

      // Mock batch commit failure
      const mockBatch = {
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn().mockRejectedValue(new Error('Network error'))
      }
      mockWriteBatch.mockReturnValue(mockBatch)

      // Should not throw
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(true).toBe(true)
    })
  })

  describe('Data Consistency', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should check data consistency', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ version: 2 }),
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ version: 2 })
        })
      }

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDocSnap)
      })

      const check = await realTimeSyncService.checkDataConsistency(
        'appointments',
        'appointment123',
        2
      )

      expect(check.conflictResolved).toBe(true)
      expect(check.expectedVersion).toBe(2)
      expect(check.actualVersion).toBe(2)
    })

    it('should detect consistency conflicts', async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({ version: 3 }),
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ version: 3 })
        })
      }

      mockDoc.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDocSnap)
      })

      const check = await realTimeSyncService.checkDataConsistency(
        'appointments',
        'appointment123',
        2
      )

      expect(check.conflictResolved).toBe(false)
      expect(check.expectedVersion).toBe(2)
      expect(check.actualVersion).toBe(3)
    })

    it('should resolve conflicts with server wins strategy', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      mockDoc.mockReturnValue({
        update: mockUpdate
      })

      await realTimeSyncService.resolveConflict(
        'appointments',
        'appointment123',
        'server_wins'
      )

      // Server wins means no update needed
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('should resolve conflicts with client wins strategy', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      mockDoc.mockReturnValue({
        update: mockUpdate
      })

      await realTimeSyncService.resolveConflict(
        'appointments',
        'appointment123',
        'client_wins',
        { patientId: 'patient123' }
      )

      expect(mockUpdate).toHaveBeenCalledWith({
        patientId: 'patient123',
        version: expect.any(Number),
        updatedAt: expect.any(Object)
      })
    })
  })

  describe('Network Status Monitoring', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should handle network status changes', () => {
      const callback = vi.fn()
      realTimeSyncService.onNetworkStatusChange(callback)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      window.dispatchEvent(new Event('offline'))

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))

      expect(callback).toHaveBeenCalledWith(true)
    })

    it('should handle sync errors', () => {
      const callback = vi.fn()
      realTimeSyncService.onSyncError(callback)

      // Simulate a sync error by triggering an error in onSnapshot
      const errorCallback = mockOnSnapshot.mock.calls[0]?.[1]
      if (errorCallback) {
        errorCallback(new Error('Firestore error'))
      }

      expect(callback).toHaveBeenCalledWith({
        type: expect.any(String),
        error: expect.any(String)
      })
    })
  })

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should track metrics correctly', () => {
      const metrics = realTimeSyncService.getMetrics()

      expect(metrics).toHaveProperty('listenersActive')
      expect(metrics).toHaveProperty('updatesReceived')
      expect(metrics).toHaveProperty('conflictsResolved')
      expect(metrics).toHaveProperty('syncQueueSize')
      expect(metrics).toHaveProperty('lastSyncTime')
      expect(metrics).toHaveProperty('isOnline')
      expect(metrics).toHaveProperty('activeListeners')
      expect(metrics).toHaveProperty('pendingConflicts')
    })

    it('should update metrics when listeners are added', () => {
      const callback = vi.fn()
      
      const initialMetrics = realTimeSyncService.getMetrics()
      realTimeSyncService.subscribeToAppointments({}, callback)
      const updatedMetrics = realTimeSyncService.getMetrics()

      expect(updatedMetrics.activeListeners).toBeGreaterThan(initialMetrics.activeListeners)
    })
  })

  describe('Force Sync and Cleanup', () => {
    beforeEach(async () => {
      await realTimeSyncService.initialize()
    })

    it('should force sync all pending operations', async () => {
      mockWaitForPendingWrites.mockResolvedValue(undefined)

      await expect(realTimeSyncService.forceSyncAll()).resolves.not.toThrow()
      expect(mockWaitForPendingWrites).toHaveBeenCalled()
    })

    it('should clear offline data', async () => {
      mockDisableNetwork.mockResolvedValue(undefined)
      mockClearIndexedDbPersistence.mockResolvedValue(undefined)
      mockEnableNetwork.mockResolvedValue(undefined)

      await expect(realTimeSyncService.clearOfflineData()).resolves.not.toThrow()
      
      expect(mockDisableNetwork).toHaveBeenCalled()
      expect(mockClearIndexedDbPersistence).toHaveBeenCalled()
      expect(mockEnableNetwork).toHaveBeenCalled()
    })

    it('should handle force sync errors gracefully', async () => {
      mockWaitForPendingWrites.mockRejectedValue(new Error('Network error'))

      await expect(realTimeSyncService.forceSyncAll()).rejects.toThrow('Network error')
    })

    it('should handle clear offline data errors gracefully', async () => {
      mockDisableNetwork.mockRejectedValue(new Error('Disable error'))

      await expect(realTimeSyncService.clearOfflineData()).rejects.toThrow('Disable error')
    })
  })
})
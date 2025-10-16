/**
 * Offline Service for Dashboard Operations
 * Handles offline data operations and synchronization
 */

import { offlineManager, OfflineAction } from '@/lib/utils/offline-manager'
import { getFirebaseFirestore } from '@/lib/firebase'
import type { 
  Appointment, 
  Patient, 
  Prescription, 
  Consultation 
} from '@/lib/types/dashboard-models'

export class OfflineService {
  /**
   * Create appointment offline
   */
  static async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = this.generateId()
    const appointmentData = {
      ...appointment,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store locally immediately
    this.storeLocalData('appointments', id, appointmentData)

    // Queue for sync
    offlineManager.queueAction({
      type: 'create',
      collection: 'appointments',
      documentId: id,
      data: appointmentData
    })

    return appointmentData
  }

  /**
   * Update appointment offline
   */
  static async updateAppointment(id: string, updates: Partial<Appointment>) {
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    }

    // Update locally immediately
    this.updateLocalData('appointments', id, updatedData)

    // Queue for sync
    offlineManager.queueAction({
      type: 'update',
      collection: 'appointments',
      documentId: id,
      data: updatedData
    })

    return updatedData
  }

  /**
   * Delete appointment offline
   */
  static async deleteAppointment(id: string) {
    // Remove locally immediately
    this.removeLocalData('appointments', id)

    // Queue for sync
    offlineManager.queueAction({
      type: 'delete',
      collection: 'appointments',
      documentId: id
    })
  }

  /**
   * Create patient offline
   */
  static async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = this.generateId()
    const patientData = {
      ...patient,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.storeLocalData('patients', id, patientData)

    offlineManager.queueAction({
      type: 'create',
      collection: 'patients',
      documentId: id,
      data: patientData
    })

    return patientData
  }

  /**
   * Update patient offline
   */
  static async updatePatient(id: string, updates: Partial<Patient>) {
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    }

    this.updateLocalData('patients', id, updatedData)

    offlineManager.queueAction({
      type: 'update',
      collection: 'patients',
      documentId: id,
      data: updatedData
    })

    return updatedData
  }

  /**
   * Create prescription offline
   */
  static async createPrescription(prescription: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = this.generateId()
    const prescriptionData = {
      ...prescription,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.storeLocalData('prescriptions', id, prescriptionData)

    offlineManager.queueAction({
      type: 'create',
      collection: 'prescriptions',
      documentId: id,
      data: prescriptionData
    })

    return prescriptionData
  }

  /**
   * Update prescription offline
   */
  static async updatePrescription(id: string, updates: Partial<Prescription>) {
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    }

    this.updateLocalData('prescriptions', id, updatedData)

    offlineManager.queueAction({
      type: 'update',
      collection: 'prescriptions',
      documentId: id,
      data: updatedData
    })

    return updatedData
  }

  /**
   * Create consultation offline
   */
  static async createConsultation(consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = this.generateId()
    const consultationData = {
      ...consultation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.storeLocalData('consultations', id, consultationData)

    offlineManager.queueAction({
      type: 'create',
      collection: 'consultations',
      documentId: id,
      data: consultationData
    })

    return consultationData
  }

  /**
   * Update consultation offline
   */
  static async updateConsultation(id: string, updates: Partial<Consultation>) {
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    }

    this.updateLocalData('consultations', id, updatedData)

    offlineManager.queueAction({
      type: 'update',
      collection: 'consultations',
      documentId: id,
      data: updatedData
    })

    return updatedData
  }

  /**
   * Get local data for a collection
   */
  static getLocalData<T>(collection: string): T[] {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(`dashboard_${collection}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Failed to get local data for ${collection}:`, error)
      return []
    }
  }

  /**
   * Get single local document
   */
  static getLocalDocument<T>(collection: string, id: string): T | null {
    const data = this.getLocalData<T & { id: string }>(collection)
    return data.find(item => item.id === id) || null
  }

  /**
   * Store data locally
   */
  private static storeLocalData(collection: string, id: string, data: any) {
    if (typeof window === 'undefined') return

    try {
      const existingData = this.getLocalData(collection)
      const updatedData = [...existingData.filter((item: any) => item.id !== id), data]
      localStorage.setItem(`dashboard_${collection}`, JSON.stringify(updatedData))
    } catch (error) {
      console.error(`Failed to store local data for ${collection}:`, error)
    }
  }

  /**
   * Update local data
   */
  private static updateLocalData(collection: string, id: string, updates: any) {
    if (typeof window === 'undefined') return

    try {
      const existingData = this.getLocalData(collection)
      const updatedData = existingData.map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      )
      localStorage.setItem(`dashboard_${collection}`, JSON.stringify(updatedData))
    } catch (error) {
      console.error(`Failed to update local data for ${collection}:`, error)
    }
  }

  /**
   * Remove local data
   */
  private static removeLocalData(collection: string, id: string) {
    if (typeof window === 'undefined') return

    try {
      const existingData = this.getLocalData(collection)
      const updatedData = existingData.filter((item: any) => item.id !== id)
      localStorage.setItem(`dashboard_${collection}`, JSON.stringify(updatedData))
    } catch (error) {
      console.error(`Failed to remove local data for ${collection}:`, error)
    }
  }

  /**
   * Clear all local data
   */
  static clearAllLocalData() {
    if (typeof window === 'undefined') return

    const collections = ['appointments', 'patients', 'prescriptions', 'consultations']
    collections.forEach(collection => {
      try {
        localStorage.removeItem(`dashboard_${collection}`)
      } catch (error) {
        console.error(`Failed to clear local data for ${collection}:`, error)
      }
    })
  }

  /**
   * Sync local data with server
   */
  static async syncWithServer() {
    if (!offlineManager.isOnline()) {
      console.log('Cannot sync: offline')
      return
    }

    try {
      await offlineManager.forcSync()
      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }

  /**
   * Check if data is stale (needs refresh from server)
   */
  static isDataStale(collection: string, maxAge: number = 300000): boolean { // 5 minutes default
    if (typeof window === 'undefined') return true

    try {
      const timestamp = localStorage.getItem(`dashboard_${collection}_timestamp`)
      if (!timestamp) return true

      const age = Date.now() - parseInt(timestamp)
      return age > maxAge
    } catch (error) {
      return true
    }
  }

  /**
   * Mark data as fresh
   */
  static markDataFresh(collection: string) {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(`dashboard_${collection}_timestamp`, Date.now().toString())
    } catch (error) {
      console.error(`Failed to mark data fresh for ${collection}:`, error)
    }
  }

  /**
   * Get offline statistics
   */
  static getOfflineStats() {
    const collections = ['appointments', 'patients', 'prescriptions', 'consultations']
    const stats = {
      totalLocalRecords: 0,
      pendingActions: offlineManager.getPendingActionsCount(),
      isOnline: offlineManager.isOnline(),
      isOfflineMode: offlineManager.isOfflineMode(),
      collections: {} as Record<string, number>
    }

    collections.forEach(collection => {
      const data = this.getLocalData(collection)
      stats.collections[collection] = data.length
      stats.totalLocalRecords += data.length
    })

    return stats
  }

  /**
   * Generate unique ID for offline documents
   */
  private static generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if ID is offline-generated
   */
  static isOfflineId(id: string): boolean {
    return id.startsWith('offline_')
  }

  /**
   * Merge server data with local data
   */
  static mergeWithServerData<T extends { id: string; updatedAt: Date | any }>(
    serverData: T[],
    localData: T[]
  ): T[] {
    const merged = new Map<string, T>()

    // Add server data first
    serverData.forEach(item => {
      merged.set(item.id, item)
    })

    // Add local data, preferring newer items
    localData.forEach(localItem => {
      const serverId = localItem.id
      const serverItem = merged.get(serverId)

      if (!serverItem) {
        // Local-only item
        merged.set(serverId, localItem)
      } else {
        // Compare timestamps and keep newer
        const localTime = localItem.updatedAt instanceof Date 
          ? localItem.updatedAt.getTime()
          : new Date(localItem.updatedAt).getTime()
        
        const serverTime = serverItem.updatedAt instanceof Date
          ? serverItem.updatedAt.getTime()
          : new Date(serverItem.updatedAt).getTime()

        if (localTime > serverTime) {
          merged.set(serverId, localItem)
        }
      }
    })

    return Array.from(merged.values())
  }
}

export default OfflineService
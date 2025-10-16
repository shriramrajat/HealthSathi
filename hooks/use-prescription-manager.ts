'use client'

import { useState, useEffect, useCallback } from 'react'
import { Prescription } from '@/lib/types/dashboard-models'
import { 
  prescriptionService, 
  PrescriptionSearchOptions,
  CreatePrescriptionData,
  CreatePrescriptionWithFileData,
  UpdatePrescriptionData
} from '@/lib/services/prescription-service'

interface UsePrescriptionManagerOptions {
  doctorId: string
  patientId?: string
  autoLoad?: boolean
  realTimeUpdates?: boolean
}

interface UsePrescriptionManagerReturn {
  prescriptions: Prescription[]
  loading: boolean
  error: string | null
  statistics: {
    total: number
    active: number
    completed: number
    cancelled: number
    expired: number
    todayCount: number
  } | null
  
  // Actions
  loadPrescriptions: (options?: PrescriptionSearchOptions) => Promise<void>
  createPrescription: (data: CreatePrescriptionData) => Promise<string | null>
  createPrescriptionWithFile: (data: CreatePrescriptionWithFileData, onProgress?: (progress: number) => void) => Promise<string | null>
  updatePrescription: (prescriptionId: string, updates: UpdatePrescriptionData) => Promise<boolean>
  deletePrescription: (prescriptionId: string) => Promise<boolean>
  markAsDispensed: (prescriptionId: string, pharmacyId?: string) => Promise<boolean>
  cancelPrescription: (prescriptionId: string) => Promise<boolean>
  getPrescriptionFileUrl: (prescriptionId: string) => Promise<string | null>
  refreshStatistics: () => Promise<void>
  clearError: () => void
}

export function usePrescriptionManager({
  doctorId,
  patientId,
  autoLoad = true,
  realTimeUpdates = false
}: UsePrescriptionManagerOptions): UsePrescriptionManagerReturn {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<{
    total: number
    active: number
    completed: number
    cancelled: number
    expired: number
    todayCount: number
  } | null>(null)

  // Load prescriptions
  const loadPrescriptions = useCallback(async (options?: PrescriptionSearchOptions) => {
    try {
      setLoading(true)
      setError(null)

      let result
      if (patientId) {
        result = await prescriptionService.getPatientPrescriptions(patientId, options?.limit || 100)
      } else {
        result = await prescriptionService.getDoctorPrescriptions(doctorId, options)
      }

      if (result.success && result.data) {
        setPrescriptions(result.data)
      } else {
        setError(result.error || 'Failed to load prescriptions')
      }
    } catch (err) {
      console.error('Error loading prescriptions:', err)
      setError('Failed to load prescriptions')
    } finally {
      setLoading(false)
    }
  }, [doctorId, patientId])

  // Create prescription
  const createPrescription = useCallback(async (data: CreatePrescriptionData): Promise<string | null> => {
    try {
      setError(null)
      
      const result = await prescriptionService.createPrescription(data)
      
      if (result.success && result.data) {
        // Reload prescriptions to get the latest data
        await loadPrescriptions()
        return result.data
      } else {
        setError(result.error || 'Failed to create prescription')
        return null
      }
    } catch (err) {
      console.error('Error creating prescription:', err)
      setError('Failed to create prescription')
      return null
    }
  }, [loadPrescriptions])

  // Create prescription with file
  const createPrescriptionWithFile = useCallback(async (
    data: CreatePrescriptionWithFileData,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    try {
      setError(null)
      
      const result = await prescriptionService.createPrescriptionWithFile(data, onProgress)
      
      if (result.success && result.data) {
        // Reload prescriptions to get the latest data
        await loadPrescriptions()
        return result.data
      } else {
        setError(result.error || 'Failed to create prescription with file')
        return null
      }
    } catch (err) {
      console.error('Error creating prescription with file:', err)
      setError('Failed to create prescription with file')
      return null
    }
  }, [loadPrescriptions])

  // Update prescription
  const updatePrescription = useCallback(async (
    prescriptionId: string, 
    updates: UpdatePrescriptionData
  ): Promise<boolean> => {
    try {
      setError(null)
      
      const result = await prescriptionService.updatePrescription(prescriptionId, updates)
      
      if (result.success) {
        // Reload prescriptions to get the latest data
        await loadPrescriptions()
        return true
      } else {
        setError(result.error || 'Failed to update prescription')
        return false
      }
    } catch (err) {
      console.error('Error updating prescription:', err)
      setError('Failed to update prescription')
      return false
    }
  }, [])

  // Delete prescription
  const deletePrescription = useCallback(async (prescriptionId: string): Promise<boolean> => {
    try {
      setError(null)
      
      const result = await prescriptionService.deletePrescription(prescriptionId)
      
      if (result.success) {
        // Remove from local state
        setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId))
        return true
      } else {
        setError(result.error || 'Failed to delete prescription')
        return false
      }
    } catch (err) {
      console.error('Error deleting prescription:', err)
      setError('Failed to delete prescription')
      return false
    }
  }, [])

  // Mark prescription as dispensed
  const markAsDispensed = useCallback(async (
    prescriptionId: string, 
    pharmacyId?: string
  ): Promise<boolean> => {
    try {
      setError(null)
      
      const result = await prescriptionService.markPrescriptionAsDispensed(prescriptionId, pharmacyId)
      
      if (result.success) {
        // Reload prescriptions to get the latest data
        await loadPrescriptions()
        return true
      } else {
        setError(result.error || 'Failed to mark prescription as dispensed')
        return false
      }
    } catch (err) {
      console.error('Error marking prescription as dispensed:', err)
      setError('Failed to mark prescription as dispensed')
      return false
    }
  }, [])

  // Cancel prescription
  const cancelPrescription = useCallback(async (prescriptionId: string): Promise<boolean> => {
    try {
      setError(null)
      
      const result = await prescriptionService.cancelPrescription(prescriptionId)
      
      if (result.success) {
        // Reload prescriptions to get the latest data
        await loadPrescriptions()
        return true
      } else {
        setError(result.error || 'Failed to cancel prescription')
        return false
      }
    } catch (err) {
      console.error('Error cancelling prescription:', err)
      setError('Failed to cancel prescription')
      return false
    }
  }, [])

  // Get prescription file URL
  const getPrescriptionFileUrl = useCallback(async (prescriptionId: string): Promise<string | null> => {
    try {
      setError(null)
      
      const result = await prescriptionService.getPrescriptionFileUrl(prescriptionId)
      
      if (result.success && result.data) {
        return result.data
      } else {
        setError(result.error || 'Failed to get file URL')
        return null
      }
    } catch (err) {
      console.error('Error getting prescription file URL:', err)
      setError('Failed to get file URL')
      return null
    }
  }, [])

  // Refresh statistics
  const refreshStatistics = useCallback(async () => {
    try {
      const result = await prescriptionService.getPrescriptionStatistics(doctorId)
      
      if (result.success && result.data) {
        setStatistics(result.data)
      }
    } catch (err) {
      console.error('Error refreshing statistics:', err)
    }
  }, [doctorId])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-load prescriptions on mount
  useEffect(() => {
    if (autoLoad) {
      loadPrescriptions()
      refreshStatistics()
    }
  }, [autoLoad, loadPrescriptions, refreshStatistics])

  // Set up real-time updates
  useEffect(() => {
    if (!realTimeUpdates) return

    let unsubscribe: (() => void) | undefined

    const setupRealTimeUpdates = async () => {
      try {
        unsubscribe = await prescriptionService.subscribeToDoctorPrescriptions(
          doctorId,
          (updatedPrescriptions) => {
            setPrescriptions(updatedPrescriptions)
          }
        )
      } catch (err) {
        console.error('Error setting up real-time updates:', err)
      }
    }

    setupRealTimeUpdates()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [realTimeUpdates, doctorId])

  return {
    prescriptions,
    loading,
    error,
    statistics,
    loadPrescriptions,
    createPrescription,
    createPrescriptionWithFile,
    updatePrescription,
    deletePrescription,
    markAsDispensed,
    cancelPrescription,
    getPrescriptionFileUrl,
    refreshStatistics,
    clearError
  }
}
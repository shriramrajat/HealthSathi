// React hooks for real-time data synchronization
// Provides easy-to-use hooks for components to subscribe to real-time updates

import { useState, useEffect, useCallback, useRef } from 'react'
import { realTimeSyncService, RealTimeUpdate, DataConsistencyCheck } from '@/lib/services/real-time-sync'
import type { 
  Appointment, 
  Prescription, 
  Patient, 
  PharmacyStock, 
  CHWLog 
} from '@/lib/types/healthcare-models'

// Hook for real-time appointments
export function useRealTimeAppointments(
  filters: { patientId?: string; doctorId?: string; status?: string[] } = {}
) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listenerIdRef = useRef<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const handleUpdates = (updates: RealTimeUpdate<Appointment>[]) => {
      setAppointments(current => {
        const updatedAppointments = [...current]
        
        updates.forEach(update => {
          const existingIndex = updatedAppointments.findIndex(a => a.id === update.id)
          
          switch (update.type) {
            case 'added':
              if (existingIndex === -1) {
                updatedAppointments.push(update.data)
              }
              break
            case 'modified':
              if (existingIndex !== -1) {
                updatedAppointments[existingIndex] = update.data
              } else {
                updatedAppointments.push(update.data)
              }
              break
            case 'removed':
              if (existingIndex !== -1) {
                updatedAppointments.splice(existingIndex, 1)
              }
              break
          }
        })
        
        // Sort by scheduled date
        return updatedAppointments.sort((a, b) => 
          b.scheduledAt.toDate().getTime() - a.scheduledAt.toDate().getTime()
        )
      })
      
      setLastUpdate(new Date())
      setLoading(false)
    }

    listenerIdRef.current = realTimeSyncService.subscribeToAppointments(filters, handleUpdates)

    return () => {
      if (listenerIdRef.current) {
        realTimeSyncService.unsubscribe(listenerIdRef.current)
      }
    }
  }, [filters.patientId, filters.doctorId, JSON.stringify(filters.status)])

  const refresh = useCallback(() => {
    if (listenerIdRef.current) {
      realTimeSyncService.unsubscribe(listenerIdRef.current)
    }
    setLoading(true)
    listenerIdRef.current = realTimeSyncService.subscribeToAppointments(filters, (updates) => {
      setAppointments(updates.map(u => u.data))
      setLastUpdate(new Date())
      setLoading(false)
    })
  }, [filters])

  return {
    appointments,
    loading,
    error,
    lastUpdate,
    refresh
  }
}

// Hook for real-time prescriptions
export function useRealTimePrescriptions(
  filters: { patientId?: string; doctorId?: string; pharmacyId?: string; status?: string } = {}
) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listenerIdRef = useRef<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const handleUpdates = (updates: RealTimeUpdate<Prescription>[]) => {
      setPrescriptions(current => {
        const updatedPrescriptions = [...current]
        
        updates.forEach(update => {
          const existingIndex = updatedPrescriptions.findIndex(p => p.id === update.id)
          
          switch (update.type) {
            case 'added':
              if (existingIndex === -1) {
                updatedPrescriptions.push(update.data)
              }
              break
            case 'modified':
              if (existingIndex !== -1) {
                updatedPrescriptions[existingIndex] = update.data
              } else {
                updatedPrescriptions.push(update.data)
              }
              break
            case 'removed':
              if (existingIndex !== -1) {
                updatedPrescriptions.splice(existingIndex, 1)
              }
              break
          }
        })
        
        // Sort by creation date
        return updatedPrescriptions.sort((a, b) => 
          b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        )
      })
      
      setLastUpdate(new Date())
      setLoading(false)
    }

    listenerIdRef.current = realTimeSyncService.subscribeToPrescriptions(filters, handleUpdates)

    return () => {
      if (listenerIdRef.current) {
        realTimeSyncService.unsubscribe(listenerIdRef.current)
      }
    }
  }, [filters.patientId, filters.doctorId, filters.pharmacyId, filters.status])

  return {
    prescriptions,
    loading,
    error,
    lastUpdate
  }
}

// Hook for real-time pharmacy stock
export function useRealTimePharmacyStock(pharmacyId: string) {
  const [stock, setStock] = useState<PharmacyStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listenerIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pharmacyId) return

    setLoading(true)
    setError(null)

    const handleUpdates = (updates: RealTimeUpdate<PharmacyStock>[]) => {
      setStock(current => {
        const updatedStock = [...current]
        
        updates.forEach(update => {
          const existingIndex = updatedStock.findIndex(s => s.id === update.id)
          
          switch (update.type) {
            case 'added':
              if (existingIndex === -1) {
                updatedStock.push(update.data)
              }
              break
            case 'modified':
              if (existingIndex !== -1) {
                updatedStock[existingIndex] = update.data
              } else {
                updatedStock.push(update.data)
              }
              break
            case 'removed':
              if (existingIndex !== -1) {
                updatedStock.splice(existingIndex, 1)
              }
              break
          }
        })
        
        // Sort by medicine name
        return updatedStock.sort((a, b) => a.medicineName.localeCompare(b.medicineName))
      })
      
      setLastUpdate(new Date())
      setLoading(false)
    }

    listenerIdRef.current = realTimeSyncService.subscribeToPharmacyStock(pharmacyId, handleUpdates)

    return () => {
      if (listenerIdRef.current) {
        realTimeSyncService.unsubscribe(listenerIdRef.current)
      }
    }
  }, [pharmacyId])

  return {
    stock,
    loading,
    error,
    lastUpdate
  }
}

// Hook for real-time CHW logs
export function useRealTimeCHWLogs(chwId: string) {
  const [logs, setLogs] = useState<CHWLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listenerIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!chwId) return

    setLoading(true)
    setError(null)

    const handleUpdates = (updates: RealTimeUpdate<CHWLog>[]) => {
      setLogs(current => {
        const updatedLogs = [...current]
        
        updates.forEach(update => {
          const existingIndex = updatedLogs.findIndex(l => l.id === update.id)
          
          switch (update.type) {
            case 'added':
              if (existingIndex === -1) {
                updatedLogs.push(update.data)
              }
              break
            case 'modified':
              if (existingIndex !== -1) {
                updatedLogs[existingIndex] = update.data
              } else {
                updatedLogs.push(update.data)
              }
              break
            case 'removed':
              if (existingIndex !== -1) {
                updatedLogs.splice(existingIndex, 1)
              }
              break
          }
        })
        
        // Sort by createdAt
        return updatedLogs.sort((a, b) => 
          b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
        )
      })
      
      setLastUpdate(new Date())
      setLoading(false)
    }

    listenerIdRef.current = realTimeSyncService.subscribeToCHWLogs(chwId, handleUpdates)

    return () => {
      if (listenerIdRef.current) {
        realTimeSyncService.unsubscribe(listenerIdRef.current)
      }
    }
  }, [chwId])

  return {
    logs,
    loading,
    error,
    lastUpdate
  }
}

// Hook for real-time patient record
export function useRealTimePatient(patientId: string) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const listenerIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!patientId) return

    setLoading(true)
    setError(null)

    const handleUpdate = (update: RealTimeUpdate<Patient>) => {
      setPatient(update.data)
      setLastUpdate(new Date())
      setLoading(false)
    }

    listenerIdRef.current = realTimeSyncService.subscribeToPatientRecord(patientId, handleUpdate)

    return () => {
      if (listenerIdRef.current) {
        realTimeSyncService.unsubscribe(listenerIdRef.current)
      }
    }
  }, [patientId])

  return {
    patient,
    loading,
    error,
    lastUpdate
  }
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null)

  useEffect(() => {
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online)
      setLastStatusChange(new Date())
    }

    realTimeSyncService.onNetworkStatusChange(handleStatusChange)

    // Also listen to browser events as backup
    const handleOnline = () => handleStatusChange(true)
    const handleOffline = () => handleStatusChange(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    lastStatusChange
  }
}

// Hook for sync queue status
export function useSyncStatus() {
  const [metrics, setMetrics] = useState(realTimeSyncService.getMetrics())
  const [syncErrors, setSyncErrors] = useState<Array<{ type: string; error: string; timestamp: Date }>>([])

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(realTimeSyncService.getMetrics())
    }

    const handleSyncError = (error: { type: string; error: string }) => {
      setSyncErrors(current => [
        ...current.slice(-9), // Keep last 10 errors
        { ...error, timestamp: new Date() }
      ])
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)

    realTimeSyncService.onSyncError(handleSyncError)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const forceSyncAll = useCallback(async () => {
    try {
      await realTimeSyncService.forceSyncAll()
      setMetrics(realTimeSyncService.getMetrics())
    } catch (error) {
      console.error('Force sync failed:', error)
    }
  }, [])

  const clearOfflineData = useCallback(async () => {
    try {
      await realTimeSyncService.clearOfflineData()
      setMetrics(realTimeSyncService.getMetrics())
    } catch (error) {
      console.error('Clear offline data failed:', error)
    }
  }, [])

  return {
    metrics,
    syncErrors,
    forceSyncAll,
    clearOfflineData
  }
}

// Hook for data consistency conflicts
export function useDataConsistency() {
  const [conflicts, setConflicts] = useState<DataConsistencyCheck[]>([])

  useEffect(() => {
    const handleConflict = (conflict: DataConsistencyCheck) => {
      setConflicts(current => {
        const existingIndex = current.findIndex(
          c => c.collection === conflict.collection && c.documentId === conflict.documentId
        )
        
        if (existingIndex !== -1) {
          const updated = [...current]
          updated[existingIndex] = conflict
          return updated
        } else {
          return [...current, conflict]
        }
      })
    }

    const handleResolution = (resolved: any) => {
      setConflicts(current => 
        current.filter(c => 
          !(c.collection === resolved.collection && c.documentId === resolved.documentId)
        )
      )
    }

    realTimeSyncService.onConsistencyConflict(handleConflict)
    realTimeSyncService.onDataUpdate('consistency:resolved', handleResolution)

    return () => {
      // Cleanup would be handled by the service
    }
  }, [])

  const resolveConflict = useCallback(async (
    collection: string,
    documentId: string,
    resolution: 'server_wins' | 'client_wins' | 'merge',
    mergeData?: any
  ) => {
    try {
      await realTimeSyncService.resolveConflict(collection, documentId, resolution, mergeData)
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      throw error
    }
  }, [])

  return {
    conflicts,
    resolveConflict
  }
}

// Hook for cross-dashboard updates
export function useCrossDashboardUpdates() {
  const [updates, setUpdates] = useState<Array<{
    type: string
    data: any
    timestamp: Date
  }>>([])

  useEffect(() => {
    const handleUpdate = (type: string) => (data: any) => {
      setUpdates(current => [
        ...current.slice(-19), // Keep last 20 updates
        {
          type,
          data,
          timestamp: new Date()
        }
      ])
    }

    // Subscribe to all update types
    const updateTypes = [
      'appointments:updated',
      'prescriptions:updated',
      'pharmacy-stock:updated',
      'chw-logs:updated',
      'patient:updated'
    ]

    updateTypes.forEach(type => {
      realTimeSyncService.onDataUpdate(type, handleUpdate(type))
    })

    return () => {
      // Cleanup handled by service
    }
  }, [])

  const clearUpdates = useCallback(() => {
    setUpdates([])
  }, [])

  return {
    updates,
    clearUpdates
  }
}
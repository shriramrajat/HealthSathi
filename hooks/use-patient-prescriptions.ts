'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { onSnapshot, Unsubscribe } from 'firebase/firestore'
import { Prescription } from '@/lib/types/dashboard-models'
import { dashboardQueries } from '@/lib/firebase/dashboard-collections'

interface UsePatientPrescriptionsProps {
  patientId: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UsePatientPrescriptionsReturn {
  prescriptions: Prescription[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  isConnected: boolean
  // Computed values
  activePrescriptions: Prescription[]
  recentPrescriptions: Prescription[]
  prescriptionsByStatus: Record<string, Prescription[]>
}

export function usePatientPrescriptions({
  patientId,
  autoRefresh = true,
  refreshInterval = 45000 // 45 seconds
}: UsePatientPrescriptionsProps): UsePatientPrescriptionsReturn {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Subscribe to patient prescriptions
  const subscribeToPatientPrescriptions = useCallback(async () => {
    if (!patientId) {
      setError('Patient ID is required')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Clean up existing subscription
      cleanup()

      // Create new subscription
      const prescriptionsQuery = await dashboardQueries.queryPatientPrescriptions(patientId)
      
      const unsubscribe = onSnapshot(
        prescriptionsQuery,
        (snapshot) => {
          const newPrescriptions: Prescription[] = []
          snapshot.forEach((doc) => {
            newPrescriptions.push({ id: doc.id, ...doc.data() } as Prescription)
          })
          
          setPrescriptions(newPrescriptions)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              subscribeToPatientPrescriptions()
            }, refreshInterval)
          }
        },
        (err) => {
          console.error('Error subscribing to patient prescriptions:', err)
          setError(err instanceof Error ? err.message : 'Failed to load prescriptions')
          setIsLoading(false)
          setIsConnected(false)
        }
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to patient prescriptions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [patientId, autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToPatientPrescriptions()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToPatientPrescriptions, cleanup])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToPatientPrescriptions()
  }, [subscribeToPatientPrescriptions])

  // Computed values
  const activePrescriptions = prescriptions.filter(prescription => 
    prescription.status === 'active'
  )

  const recentPrescriptions = prescriptions
    .filter(prescription => {
      const prescriptionDate = prescription.createdAt.toDate()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return prescriptionDate >= sevenDaysAgo
    })
    .slice(0, 10) // Limit to 10 most recent

  const prescriptionsByStatus = prescriptions.reduce((acc, prescription) => {
    const status = prescription.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(prescription)
    return acc
  }, {} as Record<string, Prescription[]>)

  return {
    prescriptions,
    isLoading,
    error,
    refresh,
    isConnected,
    activePrescriptions,
    recentPrescriptions,
    prescriptionsByStatus
  }
}
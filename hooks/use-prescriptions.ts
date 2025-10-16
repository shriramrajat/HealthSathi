'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Unsubscribe } from 'firebase/firestore'
import { Prescription, PrescriptionFilters } from '@/lib/types/dashboard-models'
import { dashboardSubscriptions } from '@/lib/firebase/dashboard-collections'

interface UsePrescriptionsProps {
  doctorId: string
  filters?: PrescriptionFilters
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UsePrescriptionsReturn {
  prescriptions: Prescription[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  updateFilters: (newFilters: PrescriptionFilters) => void
  currentFilters: PrescriptionFilters
  isConnected: boolean
  // Computed values
  activePrescriptions: Prescription[]
  recentPrescriptions: Prescription[]
  prescriptionsByStatus: Record<string, Prescription[]>
}

export function usePrescriptions({
  doctorId,
  filters,
  autoRefresh = true,
  refreshInterval = 45000 // 45 seconds
}: UsePrescriptionsProps): UsePrescriptionsReturn {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<PrescriptionFilters>(filters || {})
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

  // Subscribe to prescriptions
  const subscribeToPrescriptions = useCallback(async () => {
    if (!doctorId) {
      setError('Doctor ID is required')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Clean up existing subscription
      cleanup()

      // Create new subscription
      const unsubscribe = await dashboardSubscriptions.subscribeToPrescriptions(
        doctorId,
        (newPrescriptions: Prescription[]) => {
          setPrescriptions(newPrescriptions)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              subscribeToPrescriptions()
            }, refreshInterval)
          }
        },
        currentFilters
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to prescriptions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [doctorId, currentFilters, autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToPrescriptions()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToPrescriptions, cleanup])

  // Update filters
  const updateFilters = useCallback((newFilters: PrescriptionFilters) => {
    setCurrentFilters(newFilters)
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToPrescriptions()
  }, [subscribeToPrescriptions])

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
    updateFilters,
    currentFilters,
    isConnected,
    activePrescriptions,
    recentPrescriptions,
    prescriptionsByStatus
  }
}
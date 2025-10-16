'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Unsubscribe } from 'firebase/firestore'
import { Consultation, ConsultationFilters } from '@/lib/types/dashboard-models'
import { dashboardSubscriptions } from '@/lib/firebase/dashboard-collections'

interface UseConsultationsProps {
  doctorId: string
  filters?: ConsultationFilters
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseConsultationsReturn {
  consultations: Consultation[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  updateFilters: (newFilters: ConsultationFilters) => void
  currentFilters: ConsultationFilters
  isConnected: boolean
  // Computed values
  activeConsultations: Consultation[]
  completedConsultations: Consultation[]
  scheduledConsultations: Consultation[]
  consultationsByStatus: Record<string, Consultation[]>
  averageConsultationTime: number
}

export function useConsultations({
  doctorId,
  filters,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseConsultationsProps): UseConsultationsReturn {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ConsultationFilters>(filters || {})
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

  // Subscribe to consultations
  const subscribeToConsultations = useCallback(async () => {
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
      const unsubscribe = await dashboardSubscriptions.subscribeToConsultations(
        doctorId,
        (newConsultations: Consultation[]) => {
          setConsultations(newConsultations)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              subscribeToConsultations()
            }, refreshInterval)
          }
        },
        currentFilters
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to consultations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load consultations')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [doctorId, currentFilters, autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToConsultations()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToConsultations, cleanup])

  // Update filters
  const updateFilters = useCallback((newFilters: ConsultationFilters) => {
    setCurrentFilters(newFilters)
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToConsultations()
  }, [subscribeToConsultations])

  // Computed values
  const activeConsultations = consultations.filter(consultation => 
    consultation.status === 'active'
  )

  const completedConsultations = consultations.filter(consultation => 
    consultation.status === 'completed'
  )

  const scheduledConsultations = consultations.filter(consultation => 
    consultation.status === 'scheduled'
  )

  const consultationsByStatus = consultations.reduce((acc, consultation) => {
    const status = consultation.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(consultation)
    return acc
  }, {} as Record<string, Consultation[]>)

  // Calculate average consultation time
  const averageConsultationTime = (() => {
    const completedWithDuration = completedConsultations.filter(consultation => 
      consultation.duration && consultation.duration > 0
    )
    
    if (completedWithDuration.length === 0) return 0
    
    const totalTime = completedWithDuration.reduce((sum, consultation) => 
      sum + (consultation.duration || 0), 0
    )
    
    return Math.round(totalTime / completedWithDuration.length)
  })()

  return {
    consultations,
    isLoading,
    error,
    refresh,
    updateFilters,
    currentFilters,
    isConnected,
    activeConsultations,
    completedConsultations,
    scheduledConsultations,
    consultationsByStatus,
    averageConsultationTime
  }
}
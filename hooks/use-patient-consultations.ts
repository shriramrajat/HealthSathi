'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { onSnapshot, Unsubscribe } from 'firebase/firestore'
import { Consultation } from '@/lib/types/dashboard-models'
import { dashboardQueries } from '@/lib/firebase/dashboard-collections'

interface UsePatientConsultationsProps {
  patientId: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UsePatientConsultationsReturn {
  consultations: Consultation[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  isConnected: boolean
  // Computed values
  activeConsultations: Consultation[]
  completedConsultations: Consultation[]
  scheduledConsultations: Consultation[]
  consultationsByStatus: Record<string, Consultation[]>
  averageConsultationTime: number
}

export function usePatientConsultations({
  patientId,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UsePatientConsultationsProps): UsePatientConsultationsReturn {
  const [consultations, setConsultations] = useState<Consultation[]>([])
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

  // Subscribe to patient consultations
  const subscribeToPatientConsultations = useCallback(async () => {
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
      const consultationsQuery = await dashboardQueries.queryPatientConsultations(patientId)
      
      const unsubscribe = onSnapshot(
        consultationsQuery,
        (snapshot) => {
          const newConsultations: Consultation[] = []
          snapshot.forEach((doc) => {
            newConsultations.push({ id: doc.id, ...doc.data() } as Consultation)
          })
          
          setConsultations(newConsultations)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              subscribeToPatientConsultations()
            }, refreshInterval)
          }
        },
        (err) => {
          console.error('Error subscribing to patient consultations:', err)
          setError(err instanceof Error ? err.message : 'Failed to load consultations')
          setIsLoading(false)
          setIsConnected(false)
        }
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to patient consultations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load consultations')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [patientId, autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToPatientConsultations()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToPatientConsultations, cleanup])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToPatientConsultations()
  }, [subscribeToPatientConsultations])

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
    isConnected,
    activeConsultations,
    completedConsultations,
    scheduledConsultations,
    consultationsByStatus,
    averageConsultationTime
  }
}
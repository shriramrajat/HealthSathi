'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Unsubscribe } from 'firebase/firestore'
import { Appointment, AppointmentFilters } from '@/lib/types/dashboard-models'
import { dashboardSubscriptions } from '@/lib/firebase/dashboard-collections'

interface UseAppointmentsProps {
  doctorId: string
  filters?: AppointmentFilters
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseAppointmentsReturn {
  appointments: Appointment[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  updateFilters: (newFilters: AppointmentFilters) => void
  todayAppointments: Appointment[]
  upcomingAppointments: Appointment[]
  isConnected: boolean
}

export function useAppointments({
  doctorId,
  filters,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseAppointmentsProps): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<AppointmentFilters>(filters || {})
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

  // Subscribe to appointments
  const subscribeToAppointments = useCallback(async () => {
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
      const unsubscribe = await dashboardSubscriptions.subscribeToAppointments(
        doctorId,
        (newAppointments: Appointment[]) => {
          setAppointments(newAppointments)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              // Trigger a refresh by updating the subscription
              subscribeToAppointments()
            }, refreshInterval)
          }
        },
        currentFilters
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to appointments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [doctorId, currentFilters, autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToAppointments()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToAppointments, cleanup])

  // Update filters
  const updateFilters = useCallback((newFilters: AppointmentFilters) => {
    setCurrentFilters(newFilters)
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToAppointments()
  }, [subscribeToAppointments])

  // Computed values for today's and upcoming appointments
  const todayAppointments = appointments.filter(appointment => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const appointmentDate = appointment.scheduledAt.toDate()
    
    return appointmentDate >= today && appointmentDate < tomorrow
  })

  const upcomingAppointments = appointments.filter(appointment => {
    const now = new Date()
    const next15Minutes = new Date(now.getTime() + 15 * 60 * 1000)
    const appointmentDate = appointment.scheduledAt.toDate()
    
    return appointmentDate >= now && 
           appointmentDate <= next15Minutes && 
           ['scheduled', 'confirmed'].includes(appointment.status)
  })

  return {
    appointments,
    isLoading,
    error,
    refresh,
    updateFilters,
    todayAppointments,
    upcomingAppointments,
    isConnected
  }
}
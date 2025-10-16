'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Unsubscribe } from 'firebase/firestore'
import { Patient } from '@/lib/types/dashboard-models'
import { dashboardSubscriptions } from '@/lib/firebase/dashboard-collections'

interface UsePatientsProps {
  searchTerm?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  limit?: number
}

interface UsePatientsReturn {
  patients: Patient[]
  filteredPatients: Patient[]
  isLoading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  refresh: () => void
  totalCount: number
  isConnected: boolean
}

export function usePatients({
  searchTerm: initialSearchTerm = '',
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds (patients change less frequently)
  limit = 100
}: UsePatientsProps = {}): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [isConnected, setIsConnected] = useState(false)

  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Subscribe to patients
  const subscribeToPatients = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Clean up existing subscription
      cleanup()

      // Create new subscription
      const unsubscribe = await dashboardSubscriptions.subscribeToPatients(
        (newPatients: Patient[]) => {
          setPatients(newPatients)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)

          // Set up auto-refresh if enabled
          if (autoRefresh && refreshInterval > 0) {
            refreshTimeoutRef.current = setTimeout(() => {
              subscribeToPatients()
            }, refreshInterval)
          }
        }
      )

      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Error subscribing to patients:', err)
      setError(err instanceof Error ? err.message : 'Failed to load patients')
      setIsLoading(false)
      setIsConnected(false)
    }
  }, [autoRefresh, refreshInterval, cleanup])

  // Initialize subscription
  useEffect(() => {
    subscribeToPatients()

    // Cleanup on unmount
    return cleanup
  }, [subscribeToPatients, cleanup])

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) {
      return patients.slice(0, limit)
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return patients
      .filter(patient => {
        // Search in name
        if (patient.name.toLowerCase().includes(searchLower)) {
          return true
        }

        // Search in email
        if (patient.email.toLowerCase().includes(searchLower)) {
          return true
        }

        // Search in phone (remove non-digits for comparison)
        const patientPhone = patient.phone.replace(/\D/g, '')
        const searchPhone = searchLower.replace(/\D/g, '')
        if (patientPhone.includes(searchPhone)) {
          return true
        }

        // Search in patient ID
        if (patient.id.toLowerCase().includes(searchLower)) {
          return true
        }

        // Search in chronic conditions
        if (patient.chronicConditions?.some(condition => 
          condition.toLowerCase().includes(searchLower)
        )) {
          return true
        }

        // Search in allergies
        if (patient.allergies?.some(allergy => 
          allergy.toLowerCase().includes(searchLower)
        )) {
          return true
        }

        return false
      })
      .slice(0, limit)
  }, [patients, searchTerm, limit])

  // Debounced search term update
  const debouncedSetSearchTerm = useCallback((term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(term)
    }, 300) // 300ms debounce
  }, [])

  // Manual refresh
  const refresh = useCallback(() => {
    subscribeToPatients()
  }, [subscribeToPatients])

  // Get total count
  const totalCount = patients.length

  return {
    patients,
    filteredPatients,
    isLoading,
    error,
    searchTerm,
    setSearchTerm: debouncedSetSearchTerm,
    refresh,
    totalCount,
    isConnected
  }
}
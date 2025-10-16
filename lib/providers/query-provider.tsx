'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Query client configuration for optimal performance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Show error notifications for failed mutations
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create query client instance (stable across re-renders)
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// Hook to get query client instance
export function useQueryClient() {
  const { QueryClient } = require('@tanstack/react-query')
  return QueryClient
}

// Query keys factory for consistent cache management
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    statistics: (doctorId: string) => ['dashboard', 'statistics', doctorId] as const,
    appointments: (doctorId: string, filters?: any) => ['dashboard', 'appointments', doctorId, filters] as const,
    patients: (filters?: any) => ['dashboard', 'patients', filters] as const,
    prescriptions: (doctorId: string, filters?: any) => ['dashboard', 'prescriptions', doctorId, filters] as const,
    consultations: (doctorId: string, filters?: any) => ['dashboard', 'consultations', doctorId, filters] as const,
    analytics: (doctorId: string, dateRange?: any) => ['dashboard', 'analytics', doctorId, dateRange] as const,
  },
  
  // Patient queries
  patient: {
    all: ['patient'] as const,
    detail: (patientId: string) => ['patient', 'detail', patientId] as const,
    consultations: (patientId: string) => ['patient', 'consultations', patientId] as const,
    prescriptions: (patientId: string) => ['patient', 'prescriptions', patientId] as const,
  },
  
  // Consultation queries
  consultation: {
    all: ['consultation'] as const,
    detail: (consultationId: string) => ['consultation', 'detail', consultationId] as const,
    notes: (consultationId: string) => ['consultation', 'notes', consultationId] as const,
  },
} as const

// Cache invalidation helpers
export const cacheUtils = {
  // Invalidate all dashboard data
  invalidateDashboard: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
  },
  
  // Invalidate specific dashboard section
  invalidateDashboardSection: (queryClient: any, section: keyof typeof queryKeys.dashboard) => {
    if (section !== 'all') {
      queryClient.invalidateQueries({ queryKey: [queryKeys.dashboard.all[0], section] })
    }
  },
  
  // Invalidate patient data
  invalidatePatient: (queryClient: any, patientId?: string) => {
    if (patientId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.detail(patientId) })
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.patient.all })
    }
  },
  
  // Prefetch data for better UX
  prefetchPatientData: async (queryClient: any, patientId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.patient.detail(patientId),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.patient.consultations(patientId),
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.patient.prescriptions(patientId),
        staleTime: 2 * 60 * 1000,
      }),
    ])
  },
}

// Performance monitoring for queries
export const queryPerformance = {
  // Log slow queries
  onQuerySuccess: (data: any, query: any) => {
    const duration = Date.now() - query.state.dataUpdatedAt
    if (duration > 1000) { // Log queries taking more than 1 second
      console.warn(`Slow query detected: ${query.queryKey.join('.')} took ${duration}ms`)
    }
  },
  
  // Log failed queries
  onQueryError: (error: any, query: any) => {
    console.error(`Query failed: ${query.queryKey.join('.')}`, error)
  },
}
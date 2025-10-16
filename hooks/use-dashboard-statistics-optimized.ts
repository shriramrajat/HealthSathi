'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DashboardStatistics, Appointment, Consultation, Prescription } from '@/lib/types/dashboard-models'
import { queryKeys } from '@/lib/providers/query-provider'

interface UseDashboardStatisticsProps {
  doctorId: string
  appointments: Appointment[]
  consultations: Consultation[]
  prescriptions: Prescription[]
  totalPatients: number
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseDashboardStatisticsReturn {
  statistics: DashboardStatistics
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  isAutoRefreshing: boolean
  refresh: () => Promise<void>
}

// Memoized statistics calculation function
const calculateStatistics = (
  appointments: Appointment[],
  consultations: Consultation[],
  prescriptions: Prescription[],
  totalPatients: number
): DashboardStatistics => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Filter today's appointments
  const todayAppointments = appointments.filter(apt => {
    const aptDate = apt.scheduledAt.toDate()
    return aptDate >= today && aptDate < tomorrow
  })

  // Filter completed consultations
  const completedConsultations = consultations.filter(
    consultation => consultation.status === 'completed'
  )

  // Filter today's prescriptions
  const todayPrescriptions = prescriptions.filter(prescription => {
    const prescDate = prescription.createdAt.toDate()
    return prescDate >= today && prescDate < tomorrow
  })

  // Calculate average consultation time
  const consultationsWithDuration = completedConsultations.filter(
    consultation => consultation.endTime && consultation.startTime
  )
  
  const totalDuration = consultationsWithDuration.reduce((sum, consultation) => {
    if (consultation.endTime && consultation.startTime) {
      return sum + (consultation.endTime.toDate().getTime() - consultation.startTime.toDate().getTime())
    }
    return sum
  }, 0)

  const averageConsultationTime = consultationsWithDuration.length > 0 
    ? Math.round(totalDuration / consultationsWithDuration.length / (1000 * 60)) // Convert to minutes
    : 0

  // Count appointment statuses
  const upcomingAppointments = todayAppointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  ).length

  const cancelledAppointments = todayAppointments.filter(apt => 
    apt.status === 'cancelled'
  ).length

  const noShowAppointments = todayAppointments.filter(apt => 
    apt.status === 'no-show'
  ).length

  return {
    todayAppointments: todayAppointments.length,
    totalPatients,
    completedConsultations: completedConsultations.length,
    prescriptionsIssued: todayPrescriptions.length,
    averageConsultationTime,
    patientSatisfactionScore: 4.5, // This would come from actual patient feedback
    upcomingAppointments,
    cancelledAppointments,
    noShowAppointments
  }
}

export function useDashboardStatisticsOptimized({
  doctorId,
  appointments,
  consultations,
  prescriptions,
  totalPatients,
  autoRefresh = false,
  refreshInterval = 30000
}: UseDashboardStatisticsProps): UseDashboardStatisticsReturn {
  const queryClient = useQueryClient()

  // Memoize the statistics calculation to prevent unnecessary recalculations
  const statistics = useMemo(() => 
    calculateStatistics(appointments, consultations, prescriptions, totalPatients),
    [appointments, consultations, prescriptions, totalPatients]
  )

  // Use React Query for caching and background updates
  const {
    data: cachedStatistics,
    isLoading,
    error,
    dataUpdatedAt,
    refetch
  } = useQuery({
    queryKey: queryKeys.dashboard.statistics(doctorId),
    queryFn: () => Promise.resolve(statistics),
    staleTime: refreshInterval,
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled: !!doctorId,
    initialData: statistics,
  })

  const refresh = async () => {
    await refetch()
  }

  return {
    statistics: cachedStatistics || statistics,
    isLoading,
    error: error as Error | null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    isAutoRefreshing: autoRefresh,
    refresh
  }
}
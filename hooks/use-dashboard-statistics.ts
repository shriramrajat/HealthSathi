'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timestamp } from 'firebase/firestore'
import { DashboardStatistics, Appointment, Consultation, Prescription } from '@/lib/types/dashboard-models'

interface UseDashboardStatisticsProps {
  doctorId: string
  appointments: Appointment[]
  consultations: Consultation[]
  prescriptions: Prescription[]
  totalPatients: number
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

interface UseDashboardStatisticsReturn {
  statistics: DashboardStatistics
  isLoading: boolean
  error: string | null
  refreshStatistics: () => void
  lastUpdated: Date | null
  isAutoRefreshing: boolean
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
}

export function useDashboardStatistics({
  doctorId,
  appointments,
  consultations,
  prescriptions,
  totalPatients,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds default
}: UseDashboardStatisticsProps): UseDashboardStatisticsReturn {
  const [statistics, setStatistics] = useState<DashboardStatistics>({
    todayAppointments: 0,
    totalPatients: 0,
    completedConsultations: 0,
    prescriptionsIssued: 0,
    averageConsultationTime: 0,
    patientSatisfactionScore: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(autoRefresh)
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const calculateStatistics = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const next15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

      // Today's appointments
      const todayAppointments = appointments.filter(apt => {
        const aptDate = apt.scheduledAt.toDate()
        return aptDate >= today && aptDate < tomorrow
      }).length

      // Upcoming appointments (next 15 minutes)
      const upcomingAppointments = appointments.filter(apt => {
        const aptDate = apt.scheduledAt.toDate()
        return aptDate >= now && aptDate <= next15Minutes && 
               ['scheduled', 'confirmed'].includes(apt.status)
      }).length

      // Completed consultations this month
      const completedConsultations = consultations.filter(consultation => {
        const consultationDate = consultation.startTime.toDate()
        return consultationDate >= thisMonth && consultation.status === 'completed'
      }).length

      // Average consultation time
      const completedConsultationsWithDuration = consultations.filter(consultation => 
        consultation.status === 'completed' && consultation.duration && consultation.duration > 0
      )
      
      const averageConsultationTime = completedConsultationsWithDuration.length > 0
        ? Math.round(
            completedConsultationsWithDuration.reduce((sum, consultation) => 
              sum + (consultation.duration || 0), 0
            ) / completedConsultationsWithDuration.length
          )
        : 0

      // Prescriptions issued this month
      const prescriptionsIssued = prescriptions.filter(prescription => {
        const prescriptionDate = prescription.createdAt.toDate()
        return prescriptionDate >= thisMonth
      }).length

      // Cancelled appointments this month
      const cancelledAppointments = appointments.filter(apt => {
        const aptDate = apt.scheduledAt.toDate()
        return aptDate >= thisMonth && apt.status === 'cancelled'
      }).length

      // No-show appointments this month
      const noShowAppointments = appointments.filter(apt => {
        const aptDate = apt.scheduledAt.toDate()
        return aptDate >= thisMonth && apt.status === 'no-show'
      }).length

      // Patient satisfaction score (mock calculation - in real app, this would come from feedback data)
      // For now, we'll calculate based on completion rate and other factors
      const totalScheduledAppointments = appointments.filter(apt => {
        const aptDate = apt.scheduledAt.toDate()
        return aptDate >= thisMonth
      }).length

      const completionRate = totalScheduledAppointments > 0 
        ? (completedConsultations / totalScheduledAppointments) * 100 
        : 0

      const patientSatisfactionScore = Math.min(
        4.0 + (completionRate / 100) * 1.0, // Base score of 4.0, up to 5.0 based on completion rate
        5.0
      )

      const newStatistics: DashboardStatistics = {
        todayAppointments,
        totalPatients,
        completedConsultations,
        prescriptionsIssued,
        averageConsultationTime,
        patientSatisfactionScore: Math.round(patientSatisfactionScore * 10) / 10, // Round to 1 decimal
        upcomingAppointments,
        cancelledAppointments,
        noShowAppointments
      }

      setStatistics(newStatistics)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error calculating dashboard statistics:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate statistics')
    } finally {
      setIsLoading(false)
    }
  }, [doctorId, appointments, consultations, prescriptions, totalPatients])

  // Recalculate statistics when data changes
  useEffect(() => {
    calculateStatistics()
  }, [calculateStatistics])

  // Auto-refresh functionality
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    
    setIsAutoRefreshing(true)
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        calculateStatistics()
      }
    }, refreshInterval)
  }, [calculateStatistics, refreshInterval])

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
    setIsAutoRefreshing(false)
  }, [])

  const refreshStatistics = useCallback(() => {
    calculateStatistics()
  }, [calculateStatistics])

  // Start auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
    lastUpdated,
    isAutoRefreshing,
    startAutoRefresh,
    stopAutoRefresh
  }
}
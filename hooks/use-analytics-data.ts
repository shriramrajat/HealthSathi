'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import type {
  AnalyticsData,
  ConsultationTrendData,
  PatientDemographicsData,
  PrescriptionPatternData,
  AppointmentStatusData,
  Appointment,
  Patient,
  Prescription,
  Consultation,
  DateRange
} from '@/lib/types/dashboard-models'

interface UseAnalyticsDataProps {
  appointments: Appointment[]
  patients: Patient[]
  prescriptions: Prescription[]
  consultations: Consultation[]
  timeRange?: DateRange
}

interface UseAnalyticsDataReturn {
  analyticsData: AnalyticsData
  isLoading: boolean
  error: string | null
  refreshAnalytics: () => void
}

export function useAnalyticsData({
  appointments,
  patients,
  prescriptions,
  consultations,
  timeRange
}: UseAnalyticsDataProps): UseAnalyticsDataReturn {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default time range: last 30 days
  const defaultTimeRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    return {
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end)
    }
  }, [])

  const effectiveTimeRange = timeRange || defaultTimeRange

  // Generate consultation trends data
  const consultationTrends = useMemo((): ConsultationTrendData[] => {
    const trends: { [key: string]: ConsultationTrendData } = {}
    const startDate = effectiveTimeRange.start.toDate()
    const endDate = effectiveTimeRange.end.toDate()

    // Initialize all dates in range with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      trends[dateKey] = {
        date: dateKey,
        value: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0
      }
    }

    // Count consultations by date and status
    consultations.forEach(consultation => {
      const consultationDate = consultation.startTime.toDate()
      const dateKey = consultationDate.toISOString().split('T')[0]
      
      if (trends[dateKey]) {
        trends[dateKey].value++
        
        if (consultation.status === 'completed') {
          trends[dateKey].completed++
        }
      }
    })

    // Count appointments that were cancelled or no-show
    appointments.forEach(appointment => {
      const appointmentDate = appointment.scheduledAt.toDate()
      const dateKey = appointmentDate.toISOString().split('T')[0]
      
      if (trends[dateKey]) {
        if (appointment.status === 'cancelled') {
          trends[dateKey].cancelled++
          trends[dateKey].value++
        } else if (appointment.status === 'no-show') {
          trends[dateKey].noShow++
          trends[dateKey].value++
        }
      }
    })

    return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
  }, [consultations, appointments, effectiveTimeRange])

  // Generate patient demographics data
  const patientDemographics = useMemo((): PatientDemographicsData[] => {
    const ageGroups: { [key: string]: number } = {
      '0-17': 0,
      '18-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61-75': 0,
      '75+': 0
    }

    const now = new Date()
    
    patients.forEach(patient => {
      const birthDate = patient.dateOfBirth.toDate()
      const age = now.getFullYear() - birthDate.getFullYear()
      
      if (age <= 17) {
        ageGroups['0-17']++
      } else if (age <= 30) {
        ageGroups['18-30']++
      } else if (age <= 45) {
        ageGroups['31-45']++
      } else if (age <= 60) {
        ageGroups['46-60']++
      } else if (age <= 75) {
        ageGroups['61-75']++
      } else {
        ageGroups['75+']++
      }
    })

    const total = patients.length
    
    return Object.entries(ageGroups)
      .map(([ageGroup, count]) => ({
        ageGroup,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .filter(group => group.count > 0)
  }, [patients])

  // Generate prescription patterns data
  const prescriptionPatterns = useMemo((): PrescriptionPatternData[] => {
    const medicationTypes: { [key: string]: number } = {}
    
    prescriptions.forEach(prescription => {
      prescription.medications.forEach(medication => {
        // Categorize medications by common types
        const medicationName = medication.name.toLowerCase()
        let category = 'Other'
        
        if (medicationName.includes('antibiotic') || 
            medicationName.includes('amoxicillin') || 
            medicationName.includes('azithromycin')) {
          category = 'Antibiotics'
        } else if (medicationName.includes('pain') || 
                   medicationName.includes('ibuprofen') || 
                   medicationName.includes('paracetamol') ||
                   medicationName.includes('acetaminophen')) {
          category = 'Pain Relief'
        } else if (medicationName.includes('blood pressure') || 
                   medicationName.includes('lisinopril') || 
                   medicationName.includes('amlodipine')) {
          category = 'Cardiovascular'
        } else if (medicationName.includes('diabetes') || 
                   medicationName.includes('metformin') || 
                   medicationName.includes('insulin')) {
          category = 'Diabetes'
        } else if (medicationName.includes('allergy') || 
                   medicationName.includes('antihistamine') || 
                   medicationName.includes('cetirizine')) {
          category = 'Allergy'
        } else if (medicationName.includes('vitamin') || 
                   medicationName.includes('supplement')) {
          category = 'Vitamins/Supplements'
        }
        
        medicationTypes[category] = (medicationTypes[category] || 0) + 1
      })
    })

    return Object.entries(medicationTypes)
      .map(([medicationType, count]) => ({
        date: '', // Not used for this chart
        value: count,
        medicationType,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 medication types
  }, [prescriptions])

  // Generate appointment status distribution
  const appointmentStatusDistribution = useMemo((): AppointmentStatusData[] => {
    const statusCounts: { [key: string]: number } = {}
    const statusColors: { [key: string]: string } = {
      'scheduled': '#3b82f6',
      'confirmed': '#22c55e',
      'in-progress': '#f59e0b',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'no-show': '#f97316'
    }

    appointments.forEach(appointment => {
      statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1
    })

    const total = appointments.length

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status: status as any,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: statusColors[status] || '#6b7280'
      }))
      .sort((a, b) => b.count - a.count)
  }, [appointments])

  // Combine all analytics data
  const analyticsData = useMemo((): AnalyticsData => ({
    consultationTrends,
    patientDemographics,
    prescriptionPatterns,
    appointmentStatusDistribution,
    timeRange: effectiveTimeRange
  }), [consultationTrends, patientDemographics, prescriptionPatterns, appointmentStatusDistribution, effectiveTimeRange])

  // Calculate analytics data
  const calculateAnalytics = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Analytics data is calculated via useMemo hooks above
      // This function mainly handles loading states
      
    } catch (err) {
      console.error('Error calculating analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate analytics')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Recalculate when data changes
  useEffect(() => {
    calculateAnalytics()
  }, [calculateAnalytics])

  const refreshAnalytics = useCallback(() => {
    calculateAnalytics()
  }, [calculateAnalytics])

  return {
    analyticsData,
    isLoading,
    error,
    refreshAnalytics
  }
}
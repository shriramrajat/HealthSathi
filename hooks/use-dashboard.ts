'use client'

import { useCallback } from 'react'
import { useAppointments } from './use-appointments'
import { usePatients } from './use-patients'
import { usePrescriptions } from './use-prescriptions'
import { useConsultations } from './use-consultations'
import { useDashboardStatistics } from './use-dashboard-statistics'
import { AppointmentFilters, PrescriptionFilters, ConsultationFilters } from '@/lib/types/dashboard-models'

interface UseDashboardProps {
  doctorId: string
  appointmentFilters?: AppointmentFilters
  prescriptionFilters?: PrescriptionFilters
  consultationFilters?: ConsultationFilters
  patientSearchTerm?: string
  autoRefresh?: boolean
}

interface UseDashboardReturn {
  // Appointments
  appointments: ReturnType<typeof useAppointments>
  
  // Patients
  patients: ReturnType<typeof usePatients>
  
  // Prescriptions
  prescriptions: ReturnType<typeof usePrescriptions>
  
  // Consultations
  consultations: ReturnType<typeof useConsultations>
  
  // Statistics
  statistics: ReturnType<typeof useDashboardStatistics>
  
  // Global actions
  refreshAll: () => void
  isAnyLoading: boolean
  hasAnyError: boolean
  allErrors: string[]
  connectionStatus: {
    appointments: boolean
    patients: boolean
    prescriptions: boolean
    consultations: boolean
    overall: boolean
  }
}

export function useDashboard({
  doctorId,
  appointmentFilters,
  prescriptionFilters,
  consultationFilters,
  patientSearchTerm,
  autoRefresh = true
}: UseDashboardProps): UseDashboardReturn {
  // Initialize individual hooks
  const appointments = useAppointments({
    doctorId,
    filters: appointmentFilters,
    autoRefresh
  })

  const patients = usePatients({
    searchTerm: patientSearchTerm,
    autoRefresh
  })

  const prescriptions = usePrescriptions({
    doctorId,
    filters: prescriptionFilters,
    autoRefresh
  })

  const consultations = useConsultations({
    doctorId,
    filters: consultationFilters,
    autoRefresh
  })

  const statistics = useDashboardStatistics({
    doctorId,
    appointments: appointments.appointments,
    consultations: consultations.consultations,
    prescriptions: prescriptions.prescriptions,
    totalPatients: patients.totalCount
  })

  // Global refresh function
  const refreshAll = useCallback(() => {
    appointments.refresh()
    patients.refresh()
    prescriptions.refresh()
    consultations.refresh()
    statistics.refreshStatistics()
  }, [appointments, patients, prescriptions, consultations, statistics])

  // Computed loading states
  const isAnyLoading = 
    appointments.isLoading || 
    patients.isLoading || 
    prescriptions.isLoading || 
    consultations.isLoading ||
    statistics.isLoading

  // Computed error states
  const hasAnyError = !!(
    appointments.error || 
    patients.error || 
    prescriptions.error || 
    consultations.error ||
    statistics.error
  )

  const allErrors = [
    appointments.error,
    patients.error,
    prescriptions.error,
    consultations.error,
    statistics.error
  ].filter(Boolean) as string[]

  // Connection status
  const connectionStatus = {
    appointments: appointments.isConnected,
    patients: patients.isConnected,
    prescriptions: prescriptions.isConnected,
    consultations: consultations.isConnected,
    overall: appointments.isConnected && patients.isConnected && prescriptions.isConnected && consultations.isConnected
  }

  return {
    appointments,
    patients,
    prescriptions,
    consultations,
    statistics,
    refreshAll,
    isAnyLoading,
    hasAnyError,
    allErrors,
    connectionStatus
  }
}
'use client'

import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import { Appointment } from '@/lib/types/dashboard-models'
import { queryKeys, cacheUtils } from '@/lib/providers/query-provider'

interface UseAppointmentsOptions {
  doctorId: string
  autoRefresh?: boolean
  refreshInterval?: number
  filters?: {
    status?: string[]
    dateRange?: { start: Date; end: Date }
    patientId?: string
  }
}

interface UseAppointmentsReturn {
  appointments: Appointment[]
  todayAppointments: Appointment[]
  upcomingAppointments: Appointment[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateAppointmentStatus: (appointmentId: string, status: string) => Promise<void>
  isUpdatingStatus: boolean
}

// Fetch appointments from Firestore
const fetchAppointments = async (doctorId: string, filters?: any): Promise<Appointment[]> => {
  const db = await getFirebaseFirestore()
  const appointmentsRef = collection(db, 'appointments')
  let appointmentQuery = query(
    appointmentsRef,
    where('doctorId', '==', doctorId),
    orderBy('scheduledAt', 'desc')
  )

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    appointmentQuery = query(appointmentQuery, where('status', 'in', filters.status))
  }

  if (filters?.patientId) {
    appointmentQuery = query(appointmentQuery, where('patientId', '==', filters.patientId))
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      appointmentQuery,
      (snapshot) => {
        const appointments: Appointment[] = []
        snapshot.forEach((doc) => {
          appointments.push({ id: doc.id, ...doc.data() } as Appointment)
        })
        resolve(appointments)
        unsubscribe() // Unsubscribe after first fetch for query
      },
      reject
    )
  })
}

export function useAppointmentsOptimized({
  doctorId,
  autoRefresh = true,
  refreshInterval = 30000,
  filters
}: UseAppointmentsOptions): UseAppointmentsReturn {
  const queryClient = useQueryClient()

  // Main appointments query with React Query
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.dashboard.appointments(doctorId, filters),
    queryFn: () => fetchAppointments(doctorId, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled: !!doctorId,
  })

  // Memoized filtered appointments for better performance
  const { todayAppointments, upcomingAppointments } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAppts = appointments.filter(apt => {
      const aptDate = apt.scheduledAt.toDate()
      return aptDate >= today && aptDate < tomorrow
    })

    const upcomingAppts = appointments.filter(apt => {
      const aptDate = apt.scheduledAt.toDate()
      const now = new Date()
      return aptDate > now && (apt.status === 'scheduled' || apt.status === 'confirmed')
    }).slice(0, 5) // Limit to next 5 appointments

    return { todayAppointments: todayAppts, upcomingAppointments: upcomingAppts }
  }, [appointments])

  // Mutation for updating appointment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const db = await getFirebaseFirestore()
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, { 
        status,
        updatedAt: Timestamp.now()
      })
    },
    onSuccess: () => {
      // Invalidate and refetch appointments
      cacheUtils.invalidateDashboardSection(queryClient, 'appointments')
    },
    onError: (error) => {
      console.error('Failed to update appointment status:', error)
    }
  })

  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    await updateStatusMutation.mutateAsync({ appointmentId, status })
  }, [updateStatusMutation])

  const refresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    appointments,
    todayAppointments,
    upcomingAppointments,
    isLoading,
    error: error as Error | null,
    refresh,
    updateAppointmentStatus,
    isUpdatingStatus: updateStatusMutation.isPending
  }
}
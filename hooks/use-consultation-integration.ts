'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { consultationService } from '@/lib/services/consultation-service'
import { Consultation } from '@/lib/types/dashboard-models'

interface UseConsultationIntegrationProps {
  doctorId: string
  onError?: (error: string) => void
  onSuccess?: (message: string) => void
}

interface UseConsultationIntegrationReturn {
  isStartingConsultation: boolean
  activeConsultation: Consultation | null
  startConsultation: (appointmentId: string, patientId: string, patientName?: string) => Promise<void>
  joinConsultation: (consultationId: string) => Promise<void>
  endConsultation: (consultationId: string, notes?: string, duration?: number) => Promise<void>
  getConsultationUrl: (roomId: string) => string
  error: string | null
  clearError: () => void
}

export function useConsultationIntegration({
  doctorId,
  onError,
  onSuccess
}: UseConsultationIntegrationProps): UseConsultationIntegrationReturn {
  const [isStartingConsultation, setIsStartingConsultation] = useState(false)
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    onError?.(errorMessage)
  }, [onError])

  const handleSuccess = useCallback((message: string) => {
    onSuccess?.(message)
  }, [onSuccess])

  // Start a consultation from an appointment
  const startConsultation = useCallback(async (
    appointmentId: string,
    patientId: string,
    patientName?: string
  ) => {
    if (!doctorId) {
      handleError('Doctor ID is required to start consultation')
      return
    }

    setIsStartingConsultation(true)
    clearError()

    try {
      // Start the consultation and get room details
      const { consultationId, roomId } = await consultationService.startConsultation(
        appointmentId,
        patientId,
        doctorId
      )

      // Get the full consultation details
      const consultation = await consultationService.getConsultation(consultationId)
      
      if (consultation) {
        setActiveConsultation(consultation)
        handleSuccess(`Consultation started with ${patientName || 'patient'}`)
        
        // Navigate to the video consultation page
        const consultationUrl = `/consultation/room/${roomId}?consultationId=${consultationId}&role=doctor`
        router.push(consultationUrl)
      } else {
        throw new Error('Failed to retrieve consultation details')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start consultation'
      handleError(errorMessage)
    } finally {
      setIsStartingConsultation(false)
    }
  }, [doctorId, router, handleError, handleSuccess, clearError])

  // Join an existing consultation
  const joinConsultation = useCallback(async (consultationId: string) => {
    if (!doctorId) {
      handleError('Doctor ID is required to join consultation')
      return
    }

    clearError()

    try {
      // Join the consultation
      await consultationService.joinConsultation(consultationId, 'doctor')
      
      // Get consultation details
      const consultation = await consultationService.getConsultation(consultationId)
      
      if (consultation) {
        setActiveConsultation(consultation)
        handleSuccess('Joined consultation successfully')
        
        // Navigate to the video consultation page
        const consultationUrl = `/consultation/room/${consultation.roomId}?consultationId=${consultationId}&role=doctor`
        router.push(consultationUrl)
      } else {
        throw new Error('Consultation not found')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join consultation'
      handleError(errorMessage)
    }
  }, [doctorId, router, handleError, handleSuccess, clearError])

  // End a consultation
  const endConsultation = useCallback(async (
    consultationId: string,
    notes?: string,
    duration?: number
  ) => {
    clearError()

    try {
      await consultationService.endConsultation(consultationId, notes, duration)
      setActiveConsultation(null)
      handleSuccess('Consultation ended successfully')
      
      // Navigate back to dashboard
      router.push('/dashboard/doctor')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end consultation'
      handleError(errorMessage)
    }
  }, [router, handleError, handleSuccess, clearError])

  // Get consultation room URL
  const getConsultationUrl = useCallback((roomId: string) => {
    return consultationService.getConsultationRoomUrl(roomId)
  }, [])

  return {
    isStartingConsultation,
    activeConsultation,
    startConsultation,
    joinConsultation,
    endConsultation,
    getConsultationUrl,
    error,
    clearError
  }
}
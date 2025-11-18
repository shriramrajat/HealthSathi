'use client'

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import VideoConsultation from '@/components/video-consultation'
import { consultationService } from '@/lib/services/consultation-service'
import { Consultation, Patient } from '@/lib/types/dashboard-models'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { dashboardSubscriptions } from '@/lib/firebase/dashboard-collections'

interface ConsultationRoomPageProps {}

export default function ConsultationRoomPage({}: ConsultationRoomPageProps) {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const roomId = params.roomId as string
  const consultationId = searchParams.get('consultationId')
  const userRole = searchParams.get('role') as 'patient' | 'doctor'

  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasJoined, setHasJoined] = useState(false)

  // Load consultation and patient data
  useEffect(() => {
    const loadConsultationData = async () => {
      if (!consultationId || !roomId) {
        setError('Invalid consultation parameters')
        setIsLoading(false)
        return
      }

      try {
        // Get consultation details
        const consultationData = await consultationService.getConsultation(consultationId)
        
        if (!consultationData) {
          setError('Consultation not found')
          setIsLoading(false)
          return
        }

        // Verify room ID matches
        if (consultationData.roomId !== roomId) {
          setError('Invalid room ID')
          setIsLoading(false)
          return
        }

        // Verify user has access to this consultation
        if (userRole === 'doctor' && consultationData.doctorId !== user?.uid) {
          setError('Access denied: You are not the assigned doctor for this consultation')
          setIsLoading(false)
          return
        }

        if (userRole === 'patient' && consultationData.patientId !== user?.uid) {
          setError('Access denied: This consultation is not assigned to you')
          setIsLoading(false)
          return
        }

        setConsultation(consultationData)

        // Load patient data for doctor view
        if (userRole === 'doctor') {
          try {
            const patientData = await dashboardSubscriptions.getPatientById(consultationData.patientId)
            setPatient(patientData)
          } catch (patientError) {
            console.warn('Could not load patient data:', patientError)
            // Continue without patient data - consultation can still work
          }
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error loading consultation:', err)
        setError(err instanceof Error ? err.message : 'Failed to load consultation')
        setIsLoading(false)
      }
    }

    if (user?.uid) {
      loadConsultationData()
    }
  }, [consultationId, roomId, userRole, user?.uid])

  // Subscribe to consultation updates
  useEffect(() => {
    if (!consultationId || !consultation) return

    const unsubscribe = consultationService.subscribeToConsultation(
      consultationId,
      (updatedConsultation) => {
        if (updatedConsultation) {
          setConsultation(updatedConsultation)
        }
      }
    )

    return unsubscribe
  }, [consultationId, consultation])

  // Auto-join consultation when component mounts
  useEffect(() => {
    const autoJoinConsultation = async () => {
      if (!consultationId || !userRole || !user?.uid || hasJoined) return

      try {
        await consultationService.joinConsultation(consultationId, userRole)
        setHasJoined(true)
      } catch (err) {
        console.error('Error auto-joining consultation:', err)
        // Don't show error for auto-join failure - user can manually join
      }
    }

    if (consultation && !hasJoined) {
      autoJoinConsultation()
    }
  }, [consultation, consultationId, userRole, user?.uid, hasJoined])

  // Handle ending consultation
  const handleEndCall = useCallback(async () => {
    if (!consultationId) return

    try {
      // Calculate duration if consultation has started
      let duration: number | undefined
      if (consultation?.startTime) {
        const startTime = consultation.startTime.toDate()
        const endTime = new Date()
        duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60) // duration in minutes
      }

      await consultationService.endConsultation(consultationId, consultation?.notes, duration)
      
      // Navigate back to appropriate dashboard
      if (userRole === 'doctor') {
        router.push('/dashboard/doctor')
      } else {
        router.push('/dashboard/patient')
      }
    } catch (err) {
      console.error('Error ending consultation:', err)
      // Still navigate back even if ending fails
      router.back()
    }
  }, [consultationId, consultation, userRole, router])

  // Handle going back
  const handleGoBack = useCallback(() => {
    if (userRole === 'doctor') {
      router.push('/dashboard/doctor')
    } else {
      router.push('/dashboard/patient')
    }
  }, [userRole, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Consultation</h3>
            <p className="text-muted-foreground text-center">
              Please wait while we prepare your consultation room...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">
              Consultation Unavailable
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {error || 'This consultation could not be loaded.'}
            </p>
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get display names
  const patientName = patient?.name || consultation.patientName || 'Patient'
  const doctorName = userRole === 'doctor' ? (user?.name || 'Doctor') : 'Doctor'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        {/* Header */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {userRole === 'doctor' 
                  ? `Consultation with ${patientName}`
                  : `Consultation with ${doctorName}`
                }
              </h1>
              <p className="text-muted-foreground">
                Room ID: {roomId} • Status: {consultation.status}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Video Consultation Component */}
        <VideoConsultation
          roomId={roomId}
          patientName={patientName}
          doctorName={doctorName}
          userRole={userRole}
          onEndCall={handleEndCall}
          consultation={consultation}
          patient={patient || undefined}
          onConsultationUpdate={(updatedConsultation) => {
            setConsultation(updatedConsultation)
          }}
        />
      </div>
    </div>
  )
}
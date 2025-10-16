'use client'

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Consultation, Appointment } from '@/lib/types/dashboard-models'

// Generate a unique room ID for video consultations
export const generateRoomId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `room_${timestamp}_${randomStr}`
}

// Create a new consultation session
export const createConsultation = async (
  appointmentId: string,
  patientId: string,
  doctorId: string
): Promise<string> => {
  try {
    const roomId = generateRoomId()
    
    const consultationData: Omit<Consultation, 'id'> = {
      appointmentId,
      patientId,
      doctorId,
      roomId,
      startTime: serverTimestamp() as Timestamp,
      notes: '',
      status: 'scheduled',
      participants: {
        patientJoined: false,
        doctorJoined: false
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }

    const docRef = await addDoc(collection(db, 'consultations'), consultationData)
    
    // Update appointment status to in-progress
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status: 'in-progress',
      consultationId: docRef.id,
      updatedAt: serverTimestamp()
    })

    return docRef.id
  } catch (error) {
    console.error('Error creating consultation:', error)
    throw new Error('Failed to create consultation session')
  }
}

// Start a consultation (when doctor clicks "Start Consultation")
export const startConsultation = async (
  appointmentId: string,
  patientId: string,
  doctorId: string
): Promise<{ consultationId: string; roomId: string }> => {
  try {
    // Check if consultation already exists for this appointment
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId))
    
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found')
    }

    const appointmentData = appointmentDoc.data() as Appointment
    
    // If consultation already exists, return existing consultation
    if (appointmentData.consultationId) {
      const consultationDoc = await getDoc(doc(db, 'consultations', appointmentData.consultationId))
      
      if (consultationDoc.exists()) {
        const consultationData = consultationDoc.data() as Consultation
        
        // Update consultation status to active if it's scheduled
        if (consultationData.status === 'scheduled') {
          await updateDoc(doc(db, 'consultations', appointmentData.consultationId), {
            status: 'active',
            'participants.doctorJoined': true,
            'participants.doctorJoinedAt': serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
        
        return {
          consultationId: appointmentData.consultationId,
          roomId: consultationData.roomId
        }
      }
    }

    // Create new consultation
    const consultationId = await createConsultation(appointmentId, patientId, doctorId)
    const consultationDoc = await getDoc(doc(db, 'consultations', consultationId))
    const consultationData = consultationDoc.data() as Consultation

    return {
      consultationId,
      roomId: consultationData.roomId
    }
  } catch (error) {
    console.error('Error starting consultation:', error)
    throw new Error('Failed to start consultation')
  }
}

// Join a consultation (when patient or doctor joins the video call)
export const joinConsultation = async (
  consultationId: string,
  userRole: 'patient' | 'doctor'
): Promise<void> => {
  try {
    const updateData: any = {
      updatedAt: serverTimestamp()
    }

    if (userRole === 'patient') {
      updateData['participants.patientJoined'] = true
      updateData['participants.patientJoinedAt'] = serverTimestamp()
    } else {
      updateData['participants.doctorJoined'] = true
      updateData['participants.doctorJoinedAt'] = serverTimestamp()
    }

    // If both participants have joined, set status to active
    const consultationDoc = await getDoc(doc(db, 'consultations', consultationId))
    if (consultationDoc.exists()) {
      const consultationData = consultationDoc.data() as Consultation
      const otherParticipantJoined = userRole === 'patient' 
        ? consultationData.participants.doctorJoined 
        : consultationData.participants.patientJoined

      if (otherParticipantJoined) {
        updateData.status = 'active'
      }
    }

    await updateDoc(doc(db, 'consultations', consultationId), updateData)
  } catch (error) {
    console.error('Error joining consultation:', error)
    throw new Error('Failed to join consultation')
  }
}

// End a consultation
export const endConsultation = async (
  consultationId: string,
  notes?: string,
  duration?: number
): Promise<void> => {
  try {
    const updateData: any = {
      status: 'completed',
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    if (notes) {
      updateData.notes = notes
    }

    if (duration) {
      updateData.duration = duration
    }

    await updateDoc(doc(db, 'consultations', consultationId), updateData)

    // Update appointment status to completed
    const consultationDoc = await getDoc(doc(db, 'consultations', consultationId))
    if (consultationDoc.exists()) {
      const consultationData = consultationDoc.data() as Consultation
      
      await updateDoc(doc(db, 'appointments', consultationData.appointmentId), {
        status: 'completed',
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error ending consultation:', error)
    throw new Error('Failed to end consultation')
  }
}

// Get consultation by ID
export const getConsultation = async (consultationId: string): Promise<Consultation | null> => {
  try {
    const consultationDoc = await getDoc(doc(db, 'consultations', consultationId))
    
    if (consultationDoc.exists()) {
      return {
        id: consultationDoc.id,
        ...consultationDoc.data()
      } as Consultation
    }
    
    return null
  } catch (error) {
    console.error('Error getting consultation:', error)
    throw new Error('Failed to get consultation')
  }
}

// Subscribe to consultation updates
export const subscribeToConsultation = (
  consultationId: string,
  callback: (consultation: Consultation | null) => void
): (() => void) => {
  const consultationRef = doc(db, 'consultations', consultationId)
  
  return onSnapshot(
    consultationRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data()
        } as Consultation)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error subscribing to consultation:', error)
      callback(null)
    }
  )
}

// Get active consultations for a doctor
export const getActiveConsultations = async (doctorId: string): Promise<Consultation[]> => {
  try {
    const consultationsRef = collection(db, 'consultations')
    const q = query(
      consultationsRef,
      where('doctorId', '==', doctorId),
      where('status', 'in', ['scheduled', 'active'])
    )

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const consultations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Consultation[]
          
          resolve(consultations)
          unsubscribe()
        },
        (error) => {
          console.error('Error getting active consultations:', error)
          reject(error)
        }
      )
    })
  } catch (error) {
    console.error('Error getting active consultations:', error)
    throw new Error('Failed to get active consultations')
  }
}

// Update consultation notes
export const updateConsultationNotes = async (
  consultationId: string,
  notes: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'consultations', consultationId), {
      notes,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating consultation notes:', error)
    throw new Error('Failed to update consultation notes')
  }
}

// Check if patient can join consultation
export const canPatientJoinConsultation = async (
  consultationId: string,
  patientId: string
): Promise<boolean> => {
  try {
    const consultation = await getConsultation(consultationId)
    
    if (!consultation) {
      return false
    }

    // Patient can join if:
    // 1. The consultation belongs to them
    // 2. The consultation is scheduled or active
    // 3. The consultation hasn't ended
    return (
      consultation.patientId === patientId &&
      ['scheduled', 'active'].includes(consultation.status) &&
      !consultation.endTime
    )
  } catch (error) {
    console.error('Error checking patient consultation access:', error)
    return false
  }
}

// Get consultation room URL (for integration with video service)
export const getConsultationRoomUrl = (roomId: string): string => {
  // This would integrate with your video service (Jitsi, Agora, etc.)
  // For now, returning a placeholder URL
  return `/consultation/room/${roomId}`
}

// Search consultation notes
export const searchConsultationNotes = async (
  doctorId: string,
  searchQuery: string,
  patientId?: string
): Promise<Consultation[]> => {
  try {
    const consultationsRef = collection(db, 'consultations')
    let q = query(
      consultationsRef,
      where('doctorId', '==', doctorId)
    )

    if (patientId) {
      q = query(q, where('patientId', '==', patientId))
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const consultations = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }) as Consultation)
            .filter(consultation => {
              const query = searchQuery.toLowerCase()
              return (
                consultation.notes.toLowerCase().includes(query) ||
                consultation.patientName?.toLowerCase().includes(query) ||
                consultation.roomId.toLowerCase().includes(query)
              )
            })
            .sort((a, b) => b.startTime.toDate().getTime() - a.startTime.toDate().getTime())
          
          resolve(consultations)
          unsubscribe()
        },
        (error) => {
          console.error('Error searching consultation notes:', error)
          reject(error)
        }
      )
    })
  } catch (error) {
    console.error('Error searching consultation notes:', error)
    throw new Error('Failed to search consultation notes')
  }
}

// Start recording a consultation
export const startConsultationRecording = async (
  consultationId: string,
  recordingUrl?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'consultations', consultationId), {
      'recording.isRecording': true,
      'recording.startTime': serverTimestamp(),
      'recording.url': recordingUrl || null,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error starting consultation recording:', error)
    throw new Error('Failed to start consultation recording')
  }
}

// Stop recording a consultation
export const stopConsultationRecording = async (
  consultationId: string,
  recordingUrl?: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'consultations', consultationId), {
      'recording.isRecording': false,
      'recording.endTime': serverTimestamp(),
      'recording.url': recordingUrl || null,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error stopping consultation recording:', error)
    throw new Error('Failed to stop consultation recording')
  }
}

// Update consultation duration (called periodically during consultation)
export const updateConsultationDuration = async (
  consultationId: string,
  durationInSeconds: number
): Promise<void> => {
  try {
    const durationInMinutes = Math.floor(durationInSeconds / 60)
    await updateDoc(doc(db, 'consultations', consultationId), {
      duration: durationInMinutes,
      'timing.lastDurationUpdate': serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating consultation duration:', error)
    // Don't throw error for duration updates as they're not critical
  }
}

// Generate consultation summary
export const generateConsultationSummary = async (
  consultationId: string
): Promise<string> => {
  try {
    const consultation = await getConsultation(consultationId)
    
    if (!consultation) {
      throw new Error('Consultation not found')
    }

    // Get patient and doctor names (you might need to fetch these from users collection)
    const patientName = consultation.patientName || 'Unknown Patient'
    const doctorName = consultation.doctorName || 'Unknown Doctor'
    
    const startTime = consultation.startTime.toDate()
    const endTime = consultation.endTime?.toDate() || new Date()
    const duration = consultation.duration || Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    
    const summary = `CONSULTATION SUMMARY
====================

BASIC INFORMATION
-----------------
Patient: ${patientName}
Doctor: ${doctorName}
Date: ${startTime.toLocaleDateString()}
Start Time: ${startTime.toLocaleTimeString()}
End Time: ${endTime.toLocaleTimeString()}
Duration: ${duration} minutes
Room ID: ${consultation.roomId}
Status: ${consultation.status}

CONSULTATION DETAILS
-------------------
${consultation.notes ? `Notes:\n${consultation.notes}\n` : 'No notes recorded\n'}

TECHNICAL DETAILS
----------------
Consultation ID: ${consultation.id}
${consultation.recording?.isRecording ? 'Recording: Yes' : 'Recording: No'}
${consultation.recording?.url ? `Recording URL: ${consultation.recording.url}` : ''}

PARTICIPANTS
-----------
Doctor Joined: ${consultation.participants.doctorJoined ? 'Yes' : 'No'}
Patient Joined: ${consultation.participants.patientJoined ? 'Yes' : 'No'}
${consultation.participants.doctorJoinedAt ? `Doctor Join Time: ${consultation.participants.doctorJoinedAt.toDate().toLocaleTimeString()}` : ''}
${consultation.participants.patientJoinedAt ? `Patient Join Time: ${consultation.participants.patientJoinedAt.toDate().toLocaleTimeString()}` : ''}

Generated on: ${new Date().toLocaleString()}
`

    return summary
  } catch (error) {
    console.error('Error generating consultation summary:', error)
    throw new Error('Failed to generate consultation summary')
  }
}

// Get consultation statistics for a doctor
export const getConsultationStatistics = async (
  doctorId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalConsultations: number
  completedConsultations: number
  averageDuration: number
  totalDuration: number
  recordedConsultations: number
}> => {
  try {
    const consultationsRef = collection(db, 'consultations')
    let q = query(
      consultationsRef,
      where('doctorId', '==', doctorId)
    )

    if (dateRange) {
      q = query(
        q,
        where('startTime', '>=', Timestamp.fromDate(dateRange.start)),
        where('startTime', '<=', Timestamp.fromDate(dateRange.end))
      )
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const consultations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Consultation[]

          const completed = consultations.filter(c => c.status === 'completed')
          const withDuration = completed.filter(c => c.duration && c.duration > 0)
          const recorded = consultations.filter(c => c.recording?.url)

          const totalDuration = withDuration.reduce((sum, c) => sum + (c.duration || 0), 0)
          const averageDuration = withDuration.length > 0 ? Math.round(totalDuration / withDuration.length) : 0

          resolve({
            totalConsultations: consultations.length,
            completedConsultations: completed.length,
            averageDuration,
            totalDuration,
            recordedConsultations: recorded.length
          })
          
          unsubscribe()
        },
        (error) => {
          console.error('Error getting consultation statistics:', error)
          reject(error)
        }
      )
    })
  } catch (error) {
    console.error('Error getting consultation statistics:', error)
    throw new Error('Failed to get consultation statistics')
  }
}

// Export consultation notes for a patient
export const exportPatientConsultationNotes = async (
  doctorId: string,
  patientId: string
): Promise<string> => {
  try {
    const consultationsRef = collection(db, 'consultations')
    const q = query(
      consultationsRef,
      where('doctorId', '==', doctorId),
      where('patientId', '==', patientId)
    )

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const consultations = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }) as Consultation)
            .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime())

          let exportContent = `Consultation Notes Export\n`
          exportContent += `================================\n\n`
          exportContent += `Patient ID: ${patientId}\n`
          exportContent += `Doctor ID: ${doctorId}\n`
          exportContent += `Export Date: ${new Date().toLocaleString()}\n`
          exportContent += `Total Consultations: ${consultations.length}\n\n`

          consultations.forEach((consultation, index) => {
            exportContent += `Consultation ${index + 1}\n`
            exportContent += `----------------\n`
            exportContent += `Date: ${consultation.startTime.toDate().toLocaleDateString()}\n`
            exportContent += `Time: ${consultation.startTime.toDate().toLocaleTimeString()}\n`
            exportContent += `Duration: ${consultation.duration ? `${consultation.duration} minutes` : 'N/A'}\n`
            exportContent += `Status: ${consultation.status}\n`
            exportContent += `Room ID: ${consultation.roomId}\n`
            exportContent += `Recording: ${consultation.recording?.url ? 'Available' : 'Not recorded'}\n\n`
            exportContent += `Notes:\n${consultation.notes || 'No notes recorded'}\n\n`
            exportContent += `${'='.repeat(50)}\n\n`
          })

          resolve(exportContent)
          unsubscribe()
        },
        (error) => {
          console.error('Error exporting consultation notes:', error)
          reject(error)
        }
      )
    })
  } catch (error) {
    console.error('Error exporting consultation notes:', error)
    throw new Error('Failed to export consultation notes')
  }
}

// Consultation service interface for easy mocking in tests
export interface ConsultationService {
  generateRoomId: () => string
  createConsultation: (appointmentId: string, patientId: string, doctorId: string) => Promise<string>
  startConsultation: (appointmentId: string, patientId: string, doctorId: string) => Promise<{ consultationId: string; roomId: string }>
  joinConsultation: (consultationId: string, userRole: 'patient' | 'doctor') => Promise<void>
  endConsultation: (consultationId: string, notes?: string, duration?: number) => Promise<void>
  getConsultation: (consultationId: string) => Promise<Consultation | null>
  subscribeToConsultation: (consultationId: string, callback: (consultation: Consultation | null) => void) => (() => void)
  getActiveConsultations: (doctorId: string) => Promise<Consultation[]>
  updateConsultationNotes: (consultationId: string, notes: string) => Promise<void>
  canPatientJoinConsultation: (consultationId: string, patientId: string) => Promise<boolean>
  getConsultationRoomUrl: (roomId: string) => string
  searchConsultationNotes: (doctorId: string, searchQuery: string, patientId?: string) => Promise<Consultation[]>
  exportPatientConsultationNotes: (doctorId: string, patientId: string) => Promise<string>
  // Enhanced features for task 9.2
  startConsultationRecording: (consultationId: string, recordingUrl?: string) => Promise<void>
  stopConsultationRecording: (consultationId: string, recordingUrl?: string) => Promise<void>
  updateConsultationDuration: (consultationId: string, durationInSeconds: number) => Promise<void>
  generateConsultationSummary: (consultationId: string) => Promise<string>
  getConsultationStatistics: (doctorId: string, dateRange?: { start: Date; end: Date }) => Promise<{
    totalConsultations: number
    completedConsultations: number
    averageDuration: number
    totalDuration: number
    recordedConsultations: number
  }>
}

// Default export for the service
export const consultationService: ConsultationService = {
  generateRoomId,
  createConsultation,
  startConsultation,
  joinConsultation,
  endConsultation,
  getConsultation,
  subscribeToConsultation,
  getActiveConsultations,
  updateConsultationNotes,
  canPatientJoinConsultation,
  getConsultationRoomUrl,
  searchConsultationNotes,
  exportPatientConsultationNotes,
  startConsultationRecording,
  stopConsultationRecording,
  updateConsultationDuration,
  generateConsultationSummary,
  getConsultationStatistics
}
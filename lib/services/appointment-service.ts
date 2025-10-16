// Appointment Service
// Handles appointment management and notification triggers

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import { notificationTriggersService } from './notification-triggers'
import type { 
  Appointment, 
  AppointmentFilters 
} from '@/lib/types/healthcare-models'

export interface CreateAppointmentData {
  patientId: string
  doctorId: string
  scheduledAt: Date
  duration?: number
  type: Appointment['type']
  symptoms: string[]
  notes?: string
  priority: Appointment['priority']
}

export interface UpdateAppointmentData {
  scheduledAt?: Date
  duration?: number
  type?: Appointment['type']
  symptoms?: string[]
  notes?: string
  priority?: Appointment['priority']
  status?: Appointment['status']
}

class AppointmentService {
  private db: any = null

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await getFirebaseFirestore()
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      await this.initialize()

      // Get patient and doctor details for denormalized fields
      const [patientDoc, doctorDoc] = await Promise.all([
        getDoc(doc(this.db, 'patients', data.patientId)),
        getDoc(doc(this.db, 'users', data.doctorId)) // Assuming doctors are in users collection
      ])

      const patientName = patientDoc.exists() ? patientDoc.data().name : 'Unknown Patient'
      const patientPhone = patientDoc.exists() ? patientDoc.data().phone : undefined
      const doctorName = doctorDoc.exists() ? doctorDoc.data().name : 'Unknown Doctor'

      // Create appointment object
      const appointmentData = {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: Timestamp.fromDate(data.scheduledAt),
        duration: data.duration || 30,
        type: data.type,
        status: 'scheduled' as const,
        symptoms: data.symptoms,
        notes: data.notes,
        priority: data.priority,
        reminderSent: false,
        // Denormalized fields
        patientName,
        patientPhone,
        doctorName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Save to Firestore
      const docRef = await addDoc(collection(this.db, 'appointments'), appointmentData)

      const newAppointment: Appointment = {
        id: docRef.id,
        ...appointmentData
      }

      // Trigger appointment booking notifications
      try {
        await notificationTriggersService.triggerAppointmentBooked(newAppointment)
        await notificationTriggersService.scheduleAppointmentReminders(newAppointment)
      } catch (notificationError) {
        console.warn('Failed to send appointment booking notifications:', notificationError)
        // Don't fail appointment creation if notifications fail
      }

      console.log('Appointment created successfully:', docRef.id)
      return newAppointment

    } catch (error) {
      console.error('Error creating appointment:', error)
      throw new Error('Failed to create appointment')
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId: string, data: UpdateAppointmentData): Promise<void> {
    try {
      await this.initialize()

      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      }

      if (data.scheduledAt) {
        updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt)
      }

      await updateDoc(doc(this.db, 'appointments', appointmentId), updateData)

      console.log('Appointment updated successfully')
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw new Error('Failed to update appointment')
    }
  }

  /**
   * Update appointment status with notifications
   */
  async updateAppointmentStatus(
    appointmentId: string, 
    status: Appointment['status'],
    updatedBy: 'patient' | 'doctor' | 'system' = 'system',
    reason?: string
  ): Promise<void> {
    try {
      await this.initialize()

      // Get current appointment data
      const appointmentDoc = await getDoc(doc(this.db, 'appointments', appointmentId))
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found')
      }

      const appointment = { id: appointmentDoc.id, ...appointmentDoc.data() } as Appointment
      const previousStatus = appointment.status

      // Update appointment status
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      }

      if (reason) {
        updateData.statusChangeReason = reason
      }

      await updateDoc(doc(this.db, 'appointments', appointmentId), updateData)

      // Trigger appropriate notifications based on status change
      const updatedAppointment = { ...appointment, status }

      try {
        switch (status) {
          case 'confirmed':
            if (previousStatus === 'scheduled') {
              await notificationTriggersService.triggerAppointmentConfirmed(updatedAppointment)
            }
            break

          case 'cancelled':
            if (previousStatus !== 'cancelled') {
              const cancelledBy = updatedBy === 'patient' ? 'patient' : 'doctor'
              await notificationTriggersService.triggerAppointmentCancelled(updatedAppointment, cancelledBy, reason)
            }
            break

          case 'completed':
            // Could trigger a completion notification if needed
            console.log('Appointment completed, no notification triggered')
            break

          case 'in-progress':
            // Could trigger a "consultation started" notification
            console.log('Appointment in progress, no notification triggered')
            break

          default:
            console.log(`No notification trigger for status: ${status}`)
        }
      } catch (notificationError) {
        console.warn('Failed to send appointment status change notifications:', notificationError)
        // Don't fail the status update if notifications fail
      }

      console.log('Appointment status updated successfully')
    } catch (error) {
      console.error('Error updating appointment status:', error)
      throw new Error('Failed to update appointment status')
    }
  }

  /**
   * Get appointments with filters
   */
  async getAppointments(filters: AppointmentFilters = {}, limitCount: number = 50): Promise<Appointment[]> {
    try {
      await this.initialize()

      let appointmentsQuery = collection(this.db, 'appointments')
      const constraints: any[] = []

      // Apply filters
      if (filters.patientSearch) {
        // Note: This is a simple implementation. For better search, consider using Algolia or similar
        constraints.push(where('patientName', '>=', filters.patientSearch))
        constraints.push(where('patientName', '<=', filters.patientSearch + '\uf8ff'))
      }

      if (filters.doctorSearch) {
        constraints.push(where('doctorName', '>=', filters.doctorSearch))
        constraints.push(where('doctorName', '<=', filters.doctorSearch + '\uf8ff'))
      }

      if (filters.status && filters.status.length > 0) {
        if (filters.status.length === 1) {
          constraints.push(where('status', '==', filters.status[0]))
        } else {
          constraints.push(where('status', 'in', filters.status))
        }
      }

      if (filters.type && filters.type.length > 0) {
        if (filters.type.length === 1) {
          constraints.push(where('type', '==', filters.type[0]))
        } else {
          constraints.push(where('type', 'in', filters.type))
        }
      }

      if (filters.priority && filters.priority.length > 0) {
        if (filters.priority.length === 1) {
          constraints.push(where('priority', '==', filters.priority[0]))
        } else {
          constraints.push(where('priority', 'in', filters.priority))
        }
      }

      // Add ordering and limit
      constraints.push(orderBy('scheduledAt', 'desc'))
      constraints.push(limit(limitCount))

      const q = query(appointmentsQuery, ...constraints)
      const querySnapshot = await getDocs(q)

      const appointments: Appointment[] = []
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        } as Appointment)
      })

      // Apply date range filter (client-side for now)
      if (filters.dateRange) {
        return appointments.filter(appointment => {
          const scheduledAt = appointment.scheduledAt.toDate()
          const startDate = filters.dateRange!.start.toDate()
          const endDate = filters.dateRange!.end.toDate()
          return scheduledAt >= startDate && scheduledAt <= endDate
        })
      }

      return appointments
    } catch (error) {
      console.error('Error getting appointments:', error)
      throw new Error('Failed to get appointments')
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      await this.initialize()

      const appointmentDoc = await getDoc(doc(this.db, 'appointments', appointmentId))
      
      if (!appointmentDoc.exists()) {
        return null
      }

      return {
        id: appointmentDoc.id,
        ...appointmentDoc.data()
      } as Appointment
    } catch (error) {
      console.error('Error getting appointment by ID:', error)
      throw new Error('Failed to get appointment')
    }
  }

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(patientId: string, limitCount: number = 20): Promise<Appointment[]> {
    try {
      await this.initialize()

      const q = query(
        collection(this.db, 'appointments'),
        where('patientId', '==', patientId),
        orderBy('scheduledAt', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const appointments: Appointment[] = []

      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        } as Appointment)
      })

      return appointments
    } catch (error) {
      console.error('Error getting patient appointments:', error)
      throw new Error('Failed to get patient appointments')
    }
  }

  /**
   * Get doctor's appointments
   */
  async getDoctorAppointments(doctorId: string, limitCount: number = 50): Promise<Appointment[]> {
    try {
      await this.initialize()

      const q = query(
        collection(this.db, 'appointments'),
        where('doctorId', '==', doctorId),
        orderBy('scheduledAt', 'desc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const appointments: Appointment[] = []

      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        } as Appointment)
      })

      return appointments
    } catch (error) {
      console.error('Error getting doctor appointments:', error)
      throw new Error('Failed to get doctor appointments')
    }
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limitCount: number = 20): Promise<Appointment[]> {
    try {
      await this.initialize()

      const now = Timestamp.now()
      const q = query(
        collection(this.db, 'appointments'),
        where('scheduledAt', '>=', now),
        where('status', 'in', ['scheduled', 'confirmed']),
        orderBy('scheduledAt', 'asc'),
        limit(limitCount)
      )

      const querySnapshot = await getDocs(q)
      const appointments: Appointment[] = []

      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        } as Appointment)
      })

      return appointments
    } catch (error) {
      console.error('Error getting upcoming appointments:', error)
      throw new Error('Failed to get upcoming appointments')
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string, 
    cancelledBy: 'patient' | 'doctor',
    reason?: string
  ): Promise<void> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', cancelledBy, reason)
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(appointmentId: string): Promise<void> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed', 'doctor')
  }

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string, notes?: string): Promise<void> {
    try {
      await this.initialize()

      const updateData: any = {
        status: 'completed' as const,
        updatedAt: Timestamp.now()
      }

      if (notes) {
        updateData.completionNotes = notes
      }

      await updateDoc(doc(this.db, 'appointments', appointmentId), updateData)

      console.log('Appointment completed successfully')
    } catch (error) {
      console.error('Error completing appointment:', error)
      throw new Error('Failed to complete appointment')
    }
  }

  /**
   * Send appointment reminders for upcoming appointments
   */
  async sendAppointmentReminders(): Promise<number> {
    try {
      await this.initialize()

      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

      // Get appointments for 24-hour reminders
      const appointments24h = await this.getUpcomingAppointments(100)
      const appointments1h = await this.getUpcomingAppointments(100)

      let remindersSent = 0

      // Send 24-hour reminders
      for (const appointment of appointments24h) {
        const appointmentTime = appointment.scheduledAt.toDate()
        const timeDiff = appointmentTime.getTime() - now.getTime()
        const hoursUntil = timeDiff / (1000 * 60 * 60)

        if (hoursUntil >= 23 && hoursUntil <= 25 && !appointment.reminderSent) {
          try {
            await notificationTriggersService.triggerAppointmentReminder(appointment, '24h')
            remindersSent++
          } catch (error) {
            console.warn(`Failed to send 24h reminder for appointment ${appointment.id}:`, error)
          }
        }
      }

      // Send 1-hour reminders
      for (const appointment of appointments1h) {
        const appointmentTime = appointment.scheduledAt.toDate()
        const timeDiff = appointmentTime.getTime() - now.getTime()
        const minutesUntil = timeDiff / (1000 * 60)

        if (minutesUntil >= 50 && minutesUntil <= 70) {
          try {
            await notificationTriggersService.triggerAppointmentReminder(appointment, '1h')
            remindersSent++
          } catch (error) {
            console.warn(`Failed to send 1h reminder for appointment ${appointment.id}:`, error)
          }
        }
      }

      console.log(`Sent ${remindersSent} appointment reminders`)
      return remindersSent
    } catch (error) {
      console.error('Error sending appointment reminders:', error)
      throw new Error('Failed to send appointment reminders')
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(filters: AppointmentFilters = {}): Promise<{
    total: number
    scheduled: number
    confirmed: number
    completed: number
    cancelled: number
    inProgress: number
    noShow: number
  }> {
    try {
      const appointments = await this.getAppointments(filters, 1000) // Get more for stats

      const stats = {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        inProgress: appointments.filter(a => a.status === 'in-progress').length,
        noShow: appointments.filter(a => a.status === 'no-show').length
      }

      return stats
    } catch (error) {
      console.error('Error getting appointment stats:', error)
      throw new Error('Failed to get appointment statistics')
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService()
export default appointmentService
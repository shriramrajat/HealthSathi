// Notification Triggers Service
// Handles automatic notification sending for healthcare platform events
// Implements triggers for appointments, prescriptions, and other healthcare events

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore'
import { getFirebaseFirestore } from '@/lib/firebase'
import { notificationService, NotificationPayload, StoredNotification } from './notification-service'
import type { 
  Appointment, 
  Prescription, 
  Consultation, 
  NotificationType,
  UserRole 
} from '@/lib/types/healthcare-models'

// Notification trigger configuration
interface NotificationTriggerConfig {
  type: NotificationType
  title: string
  body: string
  targetRoles: UserRole[]
  priority: 'low' | 'normal' | 'high'
  actionUrl?: string
  requiresUserPreference?: boolean
}

// User notification preferences interface
interface UserNotificationPrefs {
  userId: string
  appointments: boolean
  prescriptions: boolean
  consultations: boolean
  emergencies: boolean
  general: boolean
  pushNotifications: boolean
  emailNotifications: boolean
}

class NotificationTriggersService {
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
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<UserNotificationPrefs> {
    try {
      await this.initialize()
      
      const prefsDoc = await getDoc(doc(this.db, 'notification_preferences', userId))
      
      if (prefsDoc.exists()) {
        return prefsDoc.data() as UserNotificationPrefs
      }

      // Return default preferences if none exist
      return {
        userId,
        appointments: true,
        prescriptions: true,
        consultations: true,
        emergencies: true,
        general: true,
        pushNotifications: true,
        emailNotifications: false
      }
    } catch (error) {
      console.error('Error getting user preferences:', error)
      // Return default preferences on error
      return {
        userId,
        appointments: true,
        prescriptions: true,
        consultations: true,
        emergencies: true,
        general: true,
        pushNotifications: true,
        emailNotifications: false
      }
    }
  }

  /**
   * Get user details for notification personalization
   */
  private async getUserDetails(userId: string): Promise<{ name?: string; role?: UserRole }> {
    try {
      await this.initialize()
      
      // Try to get user from patients collection first
      const patientDoc = await getDoc(doc(this.db, 'patients', userId))
      if (patientDoc.exists()) {
        return { name: patientDoc.data().name, role: 'patient' }
      }

      // Try CHW collection
      const chwDoc = await getDoc(doc(this.db, 'chws', userId))
      if (chwDoc.exists()) {
        return { name: chwDoc.data().name, role: 'chw' }
      }

      // Try pharmacy collection
      const pharmacyDoc = await getDoc(doc(this.db, 'pharmacies', userId))
      if (pharmacyDoc.exists()) {
        return { name: pharmacyDoc.data().name, role: 'pharmacy' }
      }

      // Default fallback
      return { name: 'User', role: 'patient' }
    } catch (error) {
      console.error('Error getting user details:', error)
      return { name: 'User', role: 'patient' }
    }
  }

  /**
   * Send notification to specific users
   */
  private async sendNotificationToUsers(
    userIds: string[],
    config: NotificationTriggerConfig,
    data: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.initialize()

      for (const userId of userIds) {
        // Get user preferences
        const preferences = await getUserPreferences(userId)
        
        // Check if user wants this type of notification
        const prefKey = this.getPreferenceKey(config.type)
        if (prefKey && !preferences[prefKey]) {
          console.log(`User ${userId} has disabled ${prefKey} notifications`)
          continue
        }

        // Check if push notifications are enabled
        if (!preferences.pushNotifications) {
          console.log(`User ${userId} has disabled push notifications`)
          continue
        }

        // Get user details for personalization
        const userDetails = await this.getUserDetails(userId)

        // Create personalized notification
        const notification: Omit<StoredNotification, 'id'> = {
          userId,
          title: config.title,
          body: config.body,
          type: config.type,
          isRead: false,
          createdAt: new Date(),
          data: {
            ...data,
            actionUrl: config.actionUrl || '/dashboard',
            priority: config.priority
          }
        }

        // Store notification in database
        await notificationService.storeNotification(notification)

        // Send push notification if supported
        try {
          const payload: NotificationPayload = {
            title: config.title,
            body: config.body,
            data: {
              ...data,
              type: config.type,
              url: config.actionUrl || '/dashboard'
            },
            icon: '/icons/notification-icon.png',
            tag: config.type,
            requireInteraction: config.priority === 'high'
          }

          await notificationService.showNotification(payload)
        } catch (pushError) {
          console.warn('Failed to send push notification:', pushError)
          // Continue even if push notification fails
        }
      }
    } catch (error) {
      console.error('Error sending notifications to users:', error)
      throw error
    }
  }

  /**
   * Get preference key for notification type
   */
  private getPreferenceKey(type: NotificationType): keyof Omit<UserNotificationPrefs, 'userId' | 'pushNotifications' | 'emailNotifications'> | null {
    if (type.startsWith('appointment')) return 'appointments'
    if (type.startsWith('prescription')) return 'prescriptions'
    if (type.startsWith('consultation')) return 'consultations'
    if (type.includes('emergency')) return 'emergencies'
    return 'general'
  }

  // ============================================================================
  // APPOINTMENT NOTIFICATION TRIGGERS
  // ============================================================================

  /**
   * Trigger notification when appointment is booked
   */
  async triggerAppointmentBooked(appointment: Appointment): Promise<void> {
    try {
      const patientDetails = await this.getUserDetails(appointment.patientId)
      const doctorDetails = await this.getUserDetails(appointment.doctorId)

      // Notify doctor about new appointment booking
      const doctorConfig: NotificationTriggerConfig = {
        type: 'appointment_booked',
        title: 'New Appointment Booked',
        body: `${patientDetails.name || 'A patient'} has booked an appointment with you for ${appointment.scheduledAt.toDate().toLocaleDateString()}`,
        targetRoles: ['doctor'],
        priority: appointment.priority === 'urgent' ? 'high' : 'normal',
        actionUrl: `/dashboard/doctor?tab=appointments&id=${appointment.id}`
      }

      await this.sendNotificationToUsers(
        [appointment.doctorId], 
        doctorConfig,
        {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          patientName: patientDetails.name || 'Unknown Patient',
          scheduledAt: appointment.scheduledAt.toDate().toISOString()
        }
      )

      // Notify patient about successful booking
      const patientConfig: NotificationTriggerConfig = {
        type: 'appointment_booked',
        title: 'Appointment Booked Successfully',
        body: `Your appointment with Dr. ${doctorDetails.name || 'Unknown Doctor'} has been scheduled for ${appointment.scheduledAt.toDate().toLocaleDateString()}`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=appointments&id=${appointment.id}`
      }

      await this.sendNotificationToUsers(
        [appointment.patientId], 
        patientConfig,
        {
          appointmentId: appointment.id,
          doctorId: appointment.doctorId,
          doctorName: doctorDetails.name || 'Unknown Doctor',
          scheduledAt: appointment.scheduledAt.toDate().toISOString()
        }
      )

      console.log('Appointment booking notifications sent successfully')
    } catch (error) {
      console.error('Error triggering appointment booked notifications:', error)
      throw error
    }
  }

  /**
   * Trigger notification when appointment is confirmed by doctor
   */
  async triggerAppointmentConfirmed(appointment: Appointment): Promise<void> {
    try {
      const doctorDetails = await this.getUserDetails(appointment.doctorId)

      const config: NotificationTriggerConfig = {
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        body: `Dr. ${doctorDetails.name || 'Unknown Doctor'} has confirmed your appointment for ${appointment.scheduledAt.toDate().toLocaleDateString()}`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=appointments&id=${appointment.id}`
      }

      await this.sendNotificationToUsers(
        [appointment.patientId], 
        config,
        {
          appointmentId: appointment.id,
          doctorId: appointment.doctorId,
          doctorName: doctorDetails.name || 'Unknown Doctor',
          scheduledAt: appointment.scheduledAt.toDate().toISOString()
        }
      )

      console.log('Appointment confirmation notification sent successfully')
    } catch (error) {
      console.error('Error triggering appointment confirmed notification:', error)
      throw error
    }
  }

  /**
   * Trigger notification when appointment is cancelled
   */
  async triggerAppointmentCancelled(appointment: Appointment, cancelledBy: 'patient' | 'doctor', reason?: string): Promise<void> {
    try {
      const patientDetails = await this.getUserDetails(appointment.patientId)
      const doctorDetails = await this.getUserDetails(appointment.doctorId)

      if (cancelledBy === 'patient') {
        // Notify doctor about patient cancellation
        const config: NotificationTriggerConfig = {
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          body: `${patientDetails.name || 'A patient'} has cancelled their appointment scheduled for ${appointment.scheduledAt.toDate().toLocaleDateString()}${reason ? `. Reason: ${reason}` : ''}`,
          targetRoles: ['doctor'],
          priority: 'normal',
          actionUrl: `/dashboard/doctor?tab=appointments`
        }

        await this.sendNotificationToUsers([appointment.doctorId], config, {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          patientName: patientDetails.name || 'Unknown Patient',
          reason: reason || 'No reason provided'
        })
      } else {
        // Notify patient about doctor cancellation
        const config: NotificationTriggerConfig = {
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          body: `Dr. ${doctorDetails.name || 'Unknown Doctor'} has cancelled your appointment scheduled for ${appointment.scheduledAt.toDate().toLocaleDateString()}${reason ? `. Reason: ${reason}` : ''}`,
          targetRoles: ['patient'],
          priority: 'high',
          actionUrl: `/dashboard/patient?tab=appointments`
        }

        await this.sendNotificationToUsers([appointment.patientId], config, {
          appointmentId: appointment.id,
          doctorId: appointment.doctorId,
          doctorName: doctorDetails.name || 'Unknown Doctor',
          reason: reason || 'No reason provided'
        })
      }

      console.log('Appointment cancellation notification sent successfully')
    } catch (error) {
      console.error('Error triggering appointment cancelled notification:', error)
      throw error
    }
  }

  /**
   * Trigger appointment reminder notifications
   */
  async triggerAppointmentReminder(appointment: Appointment, reminderType: '24h' | '1h'): Promise<void> {
    try {
      const doctorDetails = await this.getUserDetails(appointment.doctorId)
      const timeText = reminderType === '24h' ? 'tomorrow' : 'in 1 hour'

      const config: NotificationTriggerConfig = {
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        body: `Reminder: You have an appointment with Dr. ${doctorDetails.name || 'Unknown Doctor'} ${timeText}`,
        targetRoles: ['patient'],
        priority: reminderType === '1h' ? 'high' : 'normal',
        actionUrl: `/dashboard/patient?tab=appointments&id=${appointment.id}`
      }

      await this.sendNotificationToUsers([appointment.patientId], config, {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        doctorName: doctorDetails.name || 'Unknown Doctor',
        scheduledAt: appointment.scheduledAt.toDate().toISOString(),
        reminderType
      })

      // Mark reminder as sent
      await updateDoc(doc(this.db, 'appointments', appointment.id), {
        reminderSent: true,
        updatedAt: Timestamp.now()
      })

      console.log(`Appointment ${reminderType} reminder sent successfully`)
    } catch (error) {
      console.error('Error triggering appointment reminder:', error)
      throw error
    }
  }

  // ============================================================================
  // PRESCRIPTION NOTIFICATION TRIGGERS
  // ============================================================================

  /**
   * Trigger notification when prescription is issued
   */
  async triggerPrescriptionIssued(prescription: Prescription): Promise<void> {
    try {
      const patientDetails = await this.getUserDetails(prescription.patientId)
      const doctorDetails = await this.getUserDetails(prescription.doctorId)

      // Notify patient about new prescription
      const patientConfig: NotificationTriggerConfig = {
        type: 'prescription_issued',
        title: 'New Prescription Issued',
        body: `Dr. ${doctorDetails.name || 'Unknown Doctor'} has issued a new prescription for you with ${prescription.medicines.length} medicine(s)`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=prescriptions&id=${prescription.id}`
      }

      await this.sendNotificationToUsers([prescription.patientId], patientConfig, {
        prescriptionId: prescription.id,
        doctorId: prescription.doctorId,
        doctorName: doctorDetails.name || 'Unknown Doctor',
        medicineCount: prescription.medicines.length.toString(),
        diagnosis: prescription.diagnosis
      })

      // Notify assigned pharmacy if specified
      if (prescription.pharmacyId) {
        const pharmacyDetails = await this.getUserDetails(prescription.pharmacyId)
        
        const pharmacyConfig: NotificationTriggerConfig = {
          type: 'prescription_issued',
          title: 'New Prescription Received',
          body: `New prescription for ${patientDetails.name || 'a patient'} with ${prescription.medicines.length} medicine(s) needs processing`,
          targetRoles: ['pharmacy'],
          priority: 'normal',
          actionUrl: `/dashboard/pharmacy?tab=prescriptions&id=${prescription.id}`
        }

        await this.sendNotificationToUsers([prescription.pharmacyId], pharmacyConfig, {
          prescriptionId: prescription.id,
          patientId: prescription.patientId,
          patientName: patientDetails.name || 'Unknown Patient',
          doctorId: prescription.doctorId,
          doctorName: doctorDetails.name || 'Unknown Doctor',
          medicineCount: prescription.medicines.length.toString()
        })
      } else {
        // Notify all active pharmacies about new prescription
        await this.notifyAllPharmacies(prescription, patientDetails.name || 'Unknown Patient')
      }

      console.log('Prescription issued notifications sent successfully')
    } catch (error) {
      console.error('Error triggering prescription issued notifications:', error)
      throw error
    }
  }

  /**
   * Notify all active pharmacies about a new prescription
   */
  private async notifyAllPharmacies(prescription: Prescription, patientName: string): Promise<void> {
    try {
      await this.initialize()

      // Get all active pharmacies
      const pharmaciesQuery = query(
        collection(this.db, 'pharmacies'),
        where('isActive', '==', true)
      )
      
      const pharmaciesSnapshot = await getDocs(pharmaciesQuery)
      const pharmacyIds: string[] = []

      pharmaciesSnapshot.forEach((doc) => {
        pharmacyIds.push(doc.id)
      })

      if (pharmacyIds.length === 0) {
        console.warn('No active pharmacies found to notify')
        return
      }

      const config: NotificationTriggerConfig = {
        type: 'prescription_issued',
        title: 'New Prescription Available',
        body: `New prescription for ${patientName} with ${prescription.medicines.length} medicine(s) is available for processing`,
        targetRoles: ['pharmacy'],
        priority: 'normal',
        actionUrl: `/dashboard/pharmacy?tab=prescriptions&id=${prescription.id}`
      }

      await this.sendNotificationToUsers(pharmacyIds, config, {
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        patientName,
        medicineCount: prescription.medicines.length.toString(),
        diagnosis: prescription.diagnosis
      })

      console.log(`Notified ${pharmacyIds.length} pharmacies about new prescription`)
    } catch (error) {
      console.error('Error notifying pharmacies:', error)
      throw error
    }
  }

  /**
   * Trigger notification when prescription is ready for pickup
   */
  async triggerPrescriptionReady(prescription: Prescription, pharmacyId: string): Promise<void> {
    try {
      const pharmacyDetails = await this.getUserDetails(pharmacyId)

      const config: NotificationTriggerConfig = {
        type: 'prescription_ready',
        title: 'Prescription Ready for Pickup',
        body: `Your prescription with ${prescription.medicines.length} medicine(s) is ready for pickup at ${pharmacyDetails.name || 'the pharmacy'}`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=prescriptions&id=${prescription.id}`
      }

      await this.sendNotificationToUsers([prescription.patientId], config, {
        prescriptionId: prescription.id,
        pharmacyId,
        pharmacyName: pharmacyDetails.name || 'Unknown Pharmacy',
        medicineCount: prescription.medicines.length.toString()
      })

      console.log('Prescription ready notification sent successfully')
    } catch (error) {
      console.error('Error triggering prescription ready notification:', error)
      throw error
    }
  }

  /**
   * Trigger notification when prescription is dispensed
   */
  async triggerPrescriptionDispensed(prescription: Prescription, pharmacyId: string): Promise<void> {
    try {
      const pharmacyDetails = await this.getUserDetails(pharmacyId)

      const config: NotificationTriggerConfig = {
        type: 'prescription_dispensed',
        title: 'Prescription Dispensed',
        body: `Your prescription has been successfully dispensed by ${pharmacyDetails.name || 'the pharmacy'}. Please follow the medication instructions.`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=prescriptions&id=${prescription.id}`
      }

      await this.sendNotificationToUsers([prescription.patientId], config, {
        prescriptionId: prescription.id,
        pharmacyId,
        pharmacyName: pharmacyDetails.name || 'Unknown Pharmacy',
        medicineCount: prescription.medicines.length.toString(),
        dispensedAt: new Date().toISOString()
      })

      console.log('Prescription dispensed notification sent successfully')
    } catch (error) {
      console.error('Error triggering prescription dispensed notification:', error)
      throw error
    }
  }

  // ============================================================================
  // CONSULTATION NOTIFICATION TRIGGERS
  // ============================================================================

  /**
   * Trigger notification when consultation starts
   */
  async triggerConsultationStarted(consultation: Consultation): Promise<void> {
    try {
      const patientDetails = await this.getUserDetails(consultation.patientId)
      const doctorDetails = await this.getUserDetails(consultation.doctorId)

      // Notify patient
      const patientConfig: NotificationTriggerConfig = {
        type: 'consultation_started',
        title: 'Consultation Started',
        body: `Dr. ${doctorDetails.name || 'Unknown Doctor'} has started your video consultation. Please join the call.`,
        targetRoles: ['patient'],
        priority: 'high',
        actionUrl: `/consultation/${consultation.id}`
      }

      // Notify doctor
      const doctorConfig: NotificationTriggerConfig = {
        type: 'consultation_started',
        title: 'Consultation Started',
        body: `Video consultation with ${patientDetails.name || 'patient'} has started. Please join the call.`,
        targetRoles: ['doctor'],
        priority: 'high',
        actionUrl: `/consultation/${consultation.id}`
      }

      await Promise.all([
        this.sendNotificationToUsers([consultation.patientId], patientConfig, {
          consultationId: consultation.id,
          appointmentId: consultation.appointmentId,
          doctorId: consultation.doctorId,
          doctorName: doctorDetails.name || 'Unknown Doctor',
          roomId: consultation.roomId
        }),
        this.sendNotificationToUsers([consultation.doctorId], doctorConfig, {
          consultationId: consultation.id,
          appointmentId: consultation.appointmentId,
          patientId: consultation.patientId,
          patientName: patientDetails.name || 'Unknown Patient',
          roomId: consultation.roomId
        })
      ])

      console.log('Consultation started notifications sent successfully')
    } catch (error) {
      console.error('Error triggering consultation started notifications:', error)
      throw error
    }
  }

  /**
   * Trigger notification when consultation ends
   */
  async triggerConsultationEnded(consultation: Consultation): Promise<void> {
    try {
      const doctorDetails = await this.getUserDetails(consultation.doctorId)

      const config: NotificationTriggerConfig = {
        type: 'consultation_ended',
        title: 'Consultation Completed',
        body: `Your video consultation with Dr. ${doctorDetails.name || 'Unknown Doctor'} has ended. ${consultation.notes ? 'Consultation notes are available.' : ''}`,
        targetRoles: ['patient'],
        priority: 'normal',
        actionUrl: `/dashboard/patient?tab=consultations&id=${consultation.id}`
      }

      await this.sendNotificationToUsers([consultation.patientId], config, {
        consultationId: consultation.id,
        appointmentId: consultation.appointmentId,
        doctorId: consultation.doctorId,
        doctorName: doctorDetails.name || 'Unknown Doctor',
        duration: consultation.duration?.toString() || '0',
        hasNotes: consultation.notes ? 'true' : 'false'
      })

      console.log('Consultation ended notification sent successfully')
    } catch (error) {
      console.error('Error triggering consultation ended notification:', error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Schedule appointment reminders
   */
  async scheduleAppointmentReminders(appointment: Appointment): Promise<void> {
    try {
      const appointmentTime = appointment.scheduledAt.toDate()
      const now = new Date()

      // Schedule 24-hour reminder
      const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000)
      if (reminder24h > now) {
        // In a real implementation, you would use a job scheduler like Cloud Functions
        // For now, we'll just log that a reminder should be scheduled
        console.log(`24-hour reminder should be scheduled for appointment ${appointment.id} at ${reminder24h}`)
      }

      // Schedule 1-hour reminder
      const reminder1h = new Date(appointmentTime.getTime() - 60 * 60 * 1000)
      if (reminder1h > now) {
        console.log(`1-hour reminder should be scheduled for appointment ${appointment.id} at ${reminder1h}`)
      }
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error)
    }
  }

  /**
   * Test notification system
   */
  async sendTestNotification(userId: string, userRole: UserRole): Promise<void> {
    try {
      const config: NotificationTriggerConfig = {
        type: 'general',
        title: 'Test Notification',
        body: 'This is a test notification from the healthcare platform notification system.',
        targetRoles: [userRole],
        priority: 'normal',
        actionUrl: '/dashboard'
      }

      await this.sendNotificationToUsers([userId], config, {
        test: 'true',
        timestamp: new Date().toISOString()
      })

      console.log('Test notification sent successfully')
    } catch (error) {
      console.error('Error sending test notification:', error)
      throw error
    }
  }
}

// Export singleton instance
export const notificationTriggersService = new NotificationTriggersService()
export default notificationTriggersService

// Helper function to get user preferences (used by the service)
async function getUserPreferences(userId: string): Promise<UserNotificationPrefs> {
  try {
    const db = await getFirebaseFirestore()
    const prefsDoc = await getDoc(doc(db, 'notification_preferences', userId))
    
    if (prefsDoc.exists()) {
      return prefsDoc.data() as UserNotificationPrefs
    }

    // Return default preferences
    return {
      userId,
      appointments: true,
      prescriptions: true,
      consultations: true,
      emergencies: true,
      general: true,
      pushNotifications: true,
      emailNotifications: false
    }
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return {
      userId,
      appointments: true,
      prescriptions: true,
      consultations: true,
      emergencies: true,
      general: true,
      pushNotifications: true,
      emailNotifications: false
    }
  }
}
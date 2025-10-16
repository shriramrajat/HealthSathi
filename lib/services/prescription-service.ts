// Prescription Service
// Handles prescription creation, management, and notification triggers

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
  Prescription, 
  Medicine, 
  Appointment 
} from '@/lib/types/healthcare-models'

export interface CreatePrescriptionData {
  patientId: string
  doctorId: string
  appointmentId?: string
  medicines: Medicine[]
  diagnosis: string
  notes: string
  pharmacyId?: string
  expiryDays?: number
}

export interface PrescriptionFilters {
  patientId?: string
  doctorId?: string
  pharmacyId?: string
  status?: Prescription['status']
  dateRange?: {
    start: Date
    end: Date
  }
}

class PrescriptionService {
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
   * Create a new prescription
   */
  async createPrescription(data: CreatePrescriptionData): Promise<Prescription> {
    try {
      await this.initialize()

      // Get patient and doctor details for denormalized fields
      const [patientDoc, doctorDoc] = await Promise.all([
        getDoc(doc(this.db, 'patients', data.patientId)),
        getDoc(doc(this.db, 'users', data.doctorId)) // Assuming doctors are in users collection
      ])

      const patientName = patientDoc.exists() ? patientDoc.data().name : 'Unknown Patient'
      const doctorName = doctorDoc.exists() ? doctorDoc.data().name : 'Unknown Doctor'

      // Get pharmacy name if specified
      let pharmacyName: string | undefined
      if (data.pharmacyId) {
        const pharmacyDoc = await getDoc(doc(this.db, 'pharmacies', data.pharmacyId))
        pharmacyName = pharmacyDoc.exists() ? pharmacyDoc.data().name : 'Unknown Pharmacy'
      }

      // Calculate expiry date (default 30 days)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + (data.expiryDays || 30))

      // Create prescription object
      const prescriptionData = {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentId: data.appointmentId,
        medicines: data.medicines,
        diagnosis: data.diagnosis,
        notes: data.notes,
        status: 'issued' as const,
        expiryDate: Timestamp.fromDate(expiryDate),
        pharmacyId: data.pharmacyId,
        // Denormalized fields
        patientName,
        doctorName,
        pharmacyName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Save to Firestore
      const docRef = await addDoc(collection(this.db, 'prescriptions'), prescriptionData)

      const newPrescription: Prescription = {
        id: docRef.id,
        ...prescriptionData
      }

      // Trigger prescription issued notifications
      try {
        await notificationTriggersService.triggerPrescriptionIssued(newPrescription)
      } catch (notificationError) {
        console.warn('Failed to send prescription issued notifications:', notificationError)
        // Don't fail prescription creation if notifications fail
      }

      console.log('Prescription created successfully:', docRef.id)
      return newPrescription

    } catch (error) {
      console.error('Error creating prescription:', error)
      throw new Error('Failed to create prescription')
    }
  }

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(
    prescriptionId: string, 
    status: Prescription['status'],
    pharmacyId?: string,
    notes?: string
  ): Promise<void> {
    try {
      await this.initialize()

      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      }

      if (status === 'dispensed') {
        updateData.dispensedAt = Timestamp.now()
        updateData.pharmacyId = pharmacyId
      }

      if (notes) {
        updateData.dispensingNotes = notes
      }

      await updateDoc(doc(this.db, 'prescriptions', prescriptionId), updateData)

      // Trigger notifications based on status change
      if (status === 'dispensed' && pharmacyId) {
        try {
          const prescriptionDoc = await getDoc(doc(this.db, 'prescriptions', prescriptionId))
          if (prescriptionDoc.exists()) {
            const prescription = { id: prescriptionDoc.id, ...prescriptionDoc.data() } as Prescription
            await notificationTriggersService.triggerPrescriptionDispensed(prescription, pharmacyId)
          }
        } catch (notificationError) {
          console.warn('Failed to send prescription dispensed notification:', notificationError)
        }
      }

      console.log('Prescription status updated successfully')
    } catch (error) {
      console.error('Error updating prescription status:', error)
      throw new Error('Failed to update prescription status')
    }
  }

  /**
   * Get prescriptions with filters
   */
  async getPrescriptions(filters: PrescriptionFilters = {}, limitCount: number = 50): Promise<Prescription[]> {
    try {
      await this.initialize()

      let prescriptionsQuery = collection(this.db, 'prescriptions')
      const constraints: any[] = []

      // Apply filters
      if (filters.patientId) {
        constraints.push(where('patientId', '==', filters.patientId))
      }

      if (filters.doctorId) {
        constraints.push(where('doctorId', '==', filters.doctorId))
      }

      if (filters.pharmacyId) {
        constraints.push(where('pharmacyId', '==', filters.pharmacyId))
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status))
      }

      // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'))
      constraints.push(limit(limitCount))

      const q = query(prescriptionsQuery, ...constraints)
      const querySnapshot = await getDocs(q)

      const prescriptions: Prescription[] = []
      querySnapshot.forEach((doc) => {
        prescriptions.push({
          id: doc.id,
          ...doc.data()
        } as Prescription)
      })

      // Apply date range filter (client-side for now)
      if (filters.dateRange) {
        return prescriptions.filter(prescription => {
          const createdAt = prescription.createdAt.toDate()
          return createdAt >= filters.dateRange!.start && createdAt <= filters.dateRange!.end
        })
      }

      return prescriptions
    } catch (error) {
      console.error('Error getting prescriptions:', error)
      throw new Error('Failed to get prescriptions')
    }
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
    try {
      await this.initialize()

      const prescriptionDoc = await getDoc(doc(this.db, 'prescriptions', prescriptionId))
      
      if (!prescriptionDoc.exists()) {
        return null
      }

      return {
        id: prescriptionDoc.id,
        ...prescriptionDoc.data()
      } as Prescription
    } catch (error) {
      console.error('Error getting prescription by ID:', error)
      throw new Error('Failed to get prescription')
    }
  }

  /**
   * Get patient's prescription history
   */
  async getPatientPrescriptions(patientId: string, limitCount: number = 20): Promise<Prescription[]> {
    return this.getPrescriptions({ patientId }, limitCount)
  }

  /**
   * Get doctor's issued prescriptions
   */
  async getDoctorPrescriptions(doctorId: string, limitCount: number = 50): Promise<Prescription[]> {
    return this.getPrescriptions({ doctorId }, limitCount)
  }

  /**
   * Get pharmacy's assigned prescriptions
   */
  async getPharmacyPrescriptions(pharmacyId: string, limitCount: number = 50): Promise<Prescription[]> {
    return this.getPrescriptions({ pharmacyId }, limitCount)
  }

  /**
   * Get active (issued) prescriptions
   */
  async getActivePrescriptions(limitCount: number = 100): Promise<Prescription[]> {
    return this.getPrescriptions({ status: 'issued' }, limitCount)
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(prescriptionId: string, reason?: string): Promise<void> {
    try {
      await this.initialize()

      const updateData: any = {
        status: 'cancelled' as const,
        updatedAt: Timestamp.now()
      }

      if (reason) {
        updateData.cancellationReason = reason
      }

      await updateDoc(doc(this.db, 'prescriptions', prescriptionId), updateData)

      console.log('Prescription cancelled successfully')
    } catch (error) {
      console.error('Error cancelling prescription:', error)
      throw new Error('Failed to cancel prescription')
    }
  }

  /**
   * Check for expired prescriptions and update their status
   */
  async updateExpiredPrescriptions(): Promise<number> {
    try {
      await this.initialize()

      // Get all issued prescriptions
      const activePrescriptions = await this.getActivePrescriptions()
      const now = new Date()
      let updatedCount = 0

      for (const prescription of activePrescriptions) {
        if (prescription.expiryDate && prescription.expiryDate.toDate() < now) {
          await this.updatePrescriptionStatus(prescription.id, 'expired')
          updatedCount++
        }
      }

      console.log(`Updated ${updatedCount} expired prescriptions`)
      return updatedCount
    } catch (error) {
      console.error('Error updating expired prescriptions:', error)
      throw new Error('Failed to update expired prescriptions')
    }
  }

  /**
   * Get prescription statistics
   */
  async getPrescriptionStats(filters: PrescriptionFilters = {}): Promise<{
    total: number
    issued: number
    dispensed: number
    cancelled: number
    expired: number
  }> {
    try {
      const prescriptions = await this.getPrescriptions(filters, 1000) // Get more for stats

      const stats = {
        total: prescriptions.length,
        issued: prescriptions.filter(p => p.status === 'issued').length,
        dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
        cancelled: prescriptions.filter(p => p.status === 'cancelled').length,
        expired: prescriptions.filter(p => p.status === 'expired').length
      }

      return stats
    } catch (error) {
      console.error('Error getting prescription stats:', error)
      throw new Error('Failed to get prescription statistics')
    }
  }

  /**
   * Assign prescription to pharmacy
   */
  async assignPrescriptionToPharmacy(prescriptionId: string, pharmacyId: string): Promise<void> {
    try {
      await this.initialize()

      // Get pharmacy name
      const pharmacyDoc = await getDoc(doc(this.db, 'pharmacies', pharmacyId))
      const pharmacyName = pharmacyDoc.exists() ? pharmacyDoc.data().name : 'Unknown Pharmacy'

      await updateDoc(doc(this.db, 'prescriptions', prescriptionId), {
        pharmacyId,
        pharmacyName,
        updatedAt: Timestamp.now()
      })

      // Trigger notification to pharmacy
      try {
        const prescriptionDoc = await getDoc(doc(this.db, 'prescriptions', prescriptionId))
        if (prescriptionDoc.exists()) {
          const prescription = { id: prescriptionDoc.id, ...prescriptionDoc.data() } as Prescription
          await notificationTriggersService.triggerPrescriptionIssued(prescription)
        }
      } catch (notificationError) {
        console.warn('Failed to send prescription assignment notification:', notificationError)
      }

      console.log('Prescription assigned to pharmacy successfully')
    } catch (error) {
      console.error('Error assigning prescription to pharmacy:', error)
      throw new Error('Failed to assign prescription to pharmacy')
    }
  }
}

// Export singleton instance
export const prescriptionService = new PrescriptionService()
export default prescriptionService
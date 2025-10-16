// Firebase Firestore collection utilities for Doctor Dashboard
// Provides type-safe collection references and helper functions

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore'

import { getFirebaseFirestore } from '../firebase'
import {
  Patient,
  Appointment,
  Prescription,
  Consultation,
  AppointmentFilters,
  PrescriptionFilters,
  ConsultationFilters,
  DateRange
} from '../types/dashboard-models'

// Collection names
export const COLLECTIONS = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  PRESCRIPTIONS: 'prescriptions',
  CONSULTATIONS: 'consultations'
} as const

// Type-safe collection references
export class DashboardCollections {
  private db: any

  constructor() {
    this.initializeDb()
  }

  private async initializeDb() {
    this.db = await getFirebaseFirestore()
  }

  // Get collection references
  async getPatientsCollection(): Promise<CollectionReference> {
    if (!this.db) await this.initializeDb()
    return collection(this.db, COLLECTIONS.PATIENTS)
  }

  async getAppointmentsCollection(): Promise<CollectionReference> {
    if (!this.db) await this.initializeDb()
    return collection(this.db, COLLECTIONS.APPOINTMENTS)
  }

  async getPrescriptionsCollection(): Promise<CollectionReference> {
    if (!this.db) await this.initializeDb()
    return collection(this.db, COLLECTIONS.PRESCRIPTIONS)
  }

  async getConsultationsCollection(): Promise<CollectionReference> {
    if (!this.db) await this.initializeDb()
    return collection(this.db, COLLECTIONS.CONSULTATIONS)
  }

  // Document references
  async getPatientDoc(patientId: string): Promise<DocumentReference> {
    const patientsCol = await this.getPatientsCollection()
    return doc(patientsCol, patientId)
  }

  async getAppointmentDoc(appointmentId: string): Promise<DocumentReference> {
    const appointmentsCol = await this.getAppointmentsCollection()
    return doc(appointmentsCol, appointmentId)
  }

  async getPrescriptionDoc(prescriptionId: string): Promise<DocumentReference> {
    const prescriptionsCol = await this.getPrescriptionsCollection()
    return doc(prescriptionsCol, prescriptionId)
  }

  async getConsultationDoc(consultationId: string): Promise<DocumentReference> {
    const consultationsCol = await this.getConsultationsCollection()
    return doc(consultationsCol, consultationId)
  }
}

// Query builder utilities
export class DashboardQueries {
  private collections: DashboardCollections

  constructor() {
    this.collections = new DashboardCollections()
  }

  // Patient queries
  async queryPatients(searchTerm?: string, limitCount: number = 50) {
    const patientsCol = await this.collections.getPatientsCollection()
    const constraints: QueryConstraint[] = [
      orderBy('name'),
      limit(limitCount)
    ]

    // Note: For full-text search, we'll need to implement client-side filtering
    // or use a search service like Algolia for production
    return query(patientsCol, ...constraints)
  }

  // Appointment queries
  async queryDoctorAppointments(
    doctorId: string,
    filters?: AppointmentFilters,
    limitCount: number = 100
  ) {
    const appointmentsCol = await this.collections.getAppointmentsCollection()
    const constraints: QueryConstraint[] = [
      where('doctorId', '==', doctorId),
      orderBy('scheduledAt', 'asc'),
      limit(limitCount)
    ]

    // Add status filter
    if (filters?.status && filters.status.length > 0) {
      constraints.splice(1, 0, where('status', 'in', filters.status))
    }

    // Add type filter
    if (filters?.type && filters.type.length > 0) {
      constraints.splice(1, 0, where('type', 'in', filters.type))
    }

    // Add date range filter
    if (filters?.dateRange) {
      constraints.splice(-2, 0, 
        where('scheduledAt', '>=', filters.dateRange.start),
        where('scheduledAt', '<=', filters.dateRange.end)
      )
    }

    return query(appointmentsCol, ...constraints)
  }

  // Today's appointments query
  async queryTodayAppointments(doctorId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const appointmentsCol = await this.collections.getAppointmentsCollection()
    return query(
      appointmentsCol,
      where('doctorId', '==', doctorId),
      where('scheduledAt', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledAt', '<', Timestamp.fromDate(endOfDay)),
      orderBy('scheduledAt', 'asc')
    )
  }

  // Upcoming appointments (next 15 minutes)
  async queryUpcomingAppointments(doctorId: string) {
    const now = new Date()
    const next15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

    const appointmentsCol = await this.collections.getAppointmentsCollection()
    return query(
      appointmentsCol,
      where('doctorId', '==', doctorId),
      where('status', 'in', ['scheduled', 'confirmed']),
      where('scheduledAt', '>=', Timestamp.fromDate(now)),
      where('scheduledAt', '<=', Timestamp.fromDate(next15Minutes)),
      orderBy('scheduledAt', 'asc')
    )
  }

  // Prescription queries
  async queryDoctorPrescriptions(
    doctorId: string,
    filters?: PrescriptionFilters,
    limitCount: number = 100
  ) {
    const prescriptionsCol = await this.collections.getPrescriptionsCollection()
    const constraints: QueryConstraint[] = [
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]

    // Add status filter
    if (filters?.status && filters.status.length > 0) {
      constraints.splice(1, 0, where('status', 'in', filters.status))
    }

    // Add date range filter
    if (filters?.dateRange) {
      constraints.splice(-2, 0,
        where('createdAt', '>=', filters.dateRange.start),
        where('createdAt', '<=', filters.dateRange.end)
      )
    }

    return query(prescriptionsCol, ...constraints)
  }

  // Patient prescriptions query
  async queryPatientPrescriptions(patientId: string, limitCount: number = 50) {
    const prescriptionsCol = await this.collections.getPrescriptionsCollection()
    return query(
      prescriptionsCol,
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
  }

  // Consultation queries
  async queryDoctorConsultations(
    doctorId: string,
    filters?: ConsultationFilters,
    limitCount: number = 100
  ) {
    const consultationsCol = await this.collections.getConsultationsCollection()
    const constraints: QueryConstraint[] = [
      where('doctorId', '==', doctorId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    ]

    // Add status filter
    if (filters?.status && filters.status.length > 0) {
      constraints.splice(1, 0, where('status', 'in', filters.status))
    }

    // Add date range filter
    if (filters?.dateRange) {
      constraints.splice(-2, 0,
        where('startTime', '>=', filters.dateRange.start),
        where('startTime', '<=', filters.dateRange.end)
      )
    }

    return query(consultationsCol, ...constraints)
  }

  // Patient consultations query
  async queryPatientConsultations(patientId: string, limitCount: number = 50) {
    const consultationsCol = await this.collections.getConsultationsCollection()
    return query(
      consultationsCol,
      where('patientId', '==', patientId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    )
  }
}

// Real-time subscription utilities
export class DashboardSubscriptions {
  private queries: DashboardQueries

  constructor() {
    this.queries = new DashboardQueries()
  }

  // Subscribe to doctor's appointments
  subscribeToAppointments(
    doctorId: string,
    callback: (appointments: Appointment[]) => void,
    filters?: AppointmentFilters
  ): Promise<Unsubscribe> {
    return new Promise(async (resolve, reject) => {
      try {
        const appointmentsQuery = await this.queries.queryDoctorAppointments(doctorId, filters)
        
        const unsubscribe = onSnapshot(
          appointmentsQuery,
          (snapshot: QuerySnapshot) => {
            const appointments: Appointment[] = []
            snapshot.forEach((doc: DocumentSnapshot) => {
              appointments.push({ id: doc.id, ...doc.data() } as Appointment)
            })
            callback(appointments)
          },
          (error) => {
            console.error('Error in appointments subscription:', error)
            reject(error)
          }
        )
        
        resolve(unsubscribe)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Subscribe to patients
  subscribeToPatients(
    callback: (patients: Patient[]) => void,
    searchTerm?: string
  ): Promise<Unsubscribe> {
    return new Promise(async (resolve, reject) => {
      try {
        const patientsQuery = await this.queries.queryPatients(searchTerm)
        
        const unsubscribe = onSnapshot(
          patientsQuery,
          (snapshot: QuerySnapshot) => {
            const patients: Patient[] = []
            snapshot.forEach((doc: DocumentSnapshot) => {
              patients.push({ id: doc.id, ...doc.data() } as Patient)
            })
            callback(patients)
          },
          (error) => {
            console.error('Error in patients subscription:', error)
            reject(error)
          }
        )
        
        resolve(unsubscribe)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Subscribe to doctor's prescriptions
  subscribeToPrescriptions(
    doctorId: string,
    callback: (prescriptions: Prescription[]) => void,
    filters?: PrescriptionFilters
  ): Promise<Unsubscribe> {
    return new Promise(async (resolve, reject) => {
      try {
        const prescriptionsQuery = await this.queries.queryDoctorPrescriptions(doctorId, filters)
        
        const unsubscribe = onSnapshot(
          prescriptionsQuery,
          (snapshot: QuerySnapshot) => {
            const prescriptions: Prescription[] = []
            snapshot.forEach((doc: DocumentSnapshot) => {
              prescriptions.push({ id: doc.id, ...doc.data() } as Prescription)
            })
            callback(prescriptions)
          },
          (error) => {
            console.error('Error in prescriptions subscription:', error)
            reject(error)
          }
        )
        
        resolve(unsubscribe)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Subscribe to doctor's consultations
  subscribeToConsultations(
    doctorId: string,
    callback: (consultations: Consultation[]) => void,
    filters?: ConsultationFilters
  ): Promise<Unsubscribe> {
    return new Promise(async (resolve, reject) => {
      try {
        const consultationsQuery = await this.queries.queryDoctorConsultations(doctorId, filters)
        
        const unsubscribe = onSnapshot(
          consultationsQuery,
          (snapshot: QuerySnapshot) => {
            const consultations: Consultation[] = []
            snapshot.forEach((doc: DocumentSnapshot) => {
              consultations.push({ id: doc.id, ...doc.data() } as Consultation)
            })
            callback(consultations)
          },
          (error) => {
            console.error('Error in consultations subscription:', error)
            reject(error)
          }
        )
        
        resolve(unsubscribe)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Get patient by ID (for consultation integration)
  async getPatientById(patientId: string): Promise<Patient | null> {
    const operations = new DashboardOperations()
    return await operations.getPatient(patientId)
  }
}

// CRUD operations utilities
export class DashboardOperations {
  private collections: DashboardCollections

  constructor() {
    this.collections = new DashboardCollections()
  }

  // Patient operations
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const patientsCol = await this.collections.getPatientsCollection()
    const now = Timestamp.now()
    
    const docRef = await addDoc(patientsCol, {
      ...patientData,
      createdAt: now,
      updatedAt: now
    })
    
    return docRef.id
  }

  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<void> {
    const patientDoc = await this.collections.getPatientDoc(patientId)
    await updateDoc(patientDoc, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  async getPatient(patientId: string): Promise<Patient | null> {
    const patientDoc = await this.collections.getPatientDoc(patientId)
    const snapshot = await getDoc(patientDoc)
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Patient
    }
    
    return null
  }

  // Appointment operations
  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const appointmentsCol = await this.collections.getAppointmentsCollection()
    const now = Timestamp.now()
    
    const docRef = await addDoc(appointmentsCol, {
      ...appointmentData,
      createdAt: now,
      updatedAt: now
    })
    
    return docRef.id
  }

  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
    const appointmentDoc = await this.collections.getAppointmentDoc(appointmentId)
    await updateDoc(appointmentDoc, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    const appointmentDoc = await this.collections.getAppointmentDoc(appointmentId)
    const snapshot = await getDoc(appointmentDoc)
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Appointment
    }
    
    return null
  }

  // Prescription operations
  async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const prescriptionsCol = await this.collections.getPrescriptionsCollection()
    const now = Timestamp.now()
    
    const docRef = await addDoc(prescriptionsCol, {
      ...prescriptionData,
      createdAt: now,
      updatedAt: now
    })
    
    return docRef.id
  }

  async updatePrescription(prescriptionId: string, updates: Partial<Prescription>): Promise<void> {
    const prescriptionDoc = await this.collections.getPrescriptionDoc(prescriptionId)
    await updateDoc(prescriptionDoc, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  async getPrescription(prescriptionId: string): Promise<Prescription | null> {
    const prescriptionDoc = await this.collections.getPrescriptionDoc(prescriptionId)
    const snapshot = await getDoc(prescriptionDoc)
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Prescription
    }
    
    return null
  }

  // Consultation operations
  async createConsultation(consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const consultationsCol = await this.collections.getConsultationsCollection()
    const now = Timestamp.now()
    
    const docRef = await addDoc(consultationsCol, {
      ...consultationData,
      createdAt: now,
      updatedAt: now
    })
    
    return docRef.id
  }

  async updateConsultation(consultationId: string, updates: Partial<Consultation>): Promise<void> {
    const consultationDoc = await this.collections.getConsultationDoc(consultationId)
    await updateDoc(consultationDoc, {
      ...updates,
      updatedAt: Timestamp.now()
    })
  }

  async getConsultation(consultationId: string): Promise<Consultation | null> {
    const consultationDoc = await this.collections.getConsultationDoc(consultationId)
    const snapshot = await getDoc(consultationDoc)
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Consultation
    }
    
    return null
  }

  // Delete operations
  async deletePatient(patientId: string): Promise<void> {
    const patientDoc = await this.collections.getPatientDoc(patientId)
    await deleteDoc(patientDoc)
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const appointmentDoc = await this.collections.getAppointmentDoc(appointmentId)
    await deleteDoc(appointmentDoc)
  }

  async deletePrescription(prescriptionId: string): Promise<void> {
    const prescriptionDoc = await this.collections.getPrescriptionDoc(prescriptionId)
    await deleteDoc(prescriptionDoc)
  }

  async deleteConsultation(consultationId: string): Promise<void> {
    const consultationDoc = await this.collections.getConsultationDoc(consultationId)
    await deleteDoc(consultationDoc)
  }
}

// Export singleton instances
export const dashboardCollections = new DashboardCollections()
export const dashboardQueries = new DashboardQueries()
export const dashboardSubscriptions = new DashboardSubscriptions()
export const dashboardOperations = new DashboardOperations()
// Patient Service
// Handles all patient-related data operations for the healthcare platform

import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  Timestamp,
  GeoPoint
} from "firebase/firestore"
import { getFirebaseFirestore } from "@/lib/firebase"
import type { 
  Patient, 
  Prescription, 
  Appointment, 
  SymptomResult, 
  Consultation,
  QRScanLog 
} from "@/lib/types/healthcare-models"

export interface PatientRecordData {
  patient: Patient | null
  prescriptions: Prescription[]
  appointments: Appointment[]
  consultations: Consultation[]
  symptomResults: SymptomResult[]
}

export interface QRScanResult {
  success: boolean
  patient?: Patient
  error?: string
  qrId?: string
}

/**
 * Fetch complete patient record by patient ID
 */
export async function fetchPatientRecord(patientId: string): Promise<PatientRecordData> {
  try {
    const db = await getFirebaseFirestore()

    // Fetch patient data
    const patientDoc = await getDoc(doc(db, 'patients', patientId))
    
    if (!patientDoc.exists()) {
      return {
        patient: null,
        prescriptions: [],
        appointments: [],
        consultations: [],
        symptomResults: []
      }
    }

    const patient: Patient = {
      id: patientDoc.id,
      ...patientDoc.data()
    } as Patient

    // Fetch related data in parallel
    const [
      prescriptionsSnapshot, 
      appointmentsSnapshot, 
      consultationsSnapshot, 
      symptomResultsSnapshot
    ] = await Promise.all([
      // Prescriptions
      getDocs(query(
        collection(db, 'prescriptions'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(10)
      )),
      
      // Appointments
      getDocs(query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId),
        orderBy('scheduledAt', 'desc'),
        limit(10)
      )),
      
      // Consultations
      getDocs(query(
        collection(db, 'consultations'),
        where('patientId', '==', patientId),
        orderBy('startTime', 'desc'),
        limit(5)
      )),
      
      // Symptom Results
      getDocs(query(
        collection(db, 'symptom-results'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(5)
      ))
    ])

    // Process the data
    const prescriptions: Prescription[] = prescriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prescription))

    const appointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Appointment))

    const consultations: Consultation[] = consultationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Consultation))

    const symptomResults: SymptomResult[] = symptomResultsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SymptomResult))

    return {
      patient,
      prescriptions,
      appointments,
      consultations,
      symptomResults
    }

  } catch (error) {
    console.error('Error fetching patient record:', error)
    throw new Error('Failed to fetch patient record')
  }
}

/**
 * Find patient by QR code
 */
export async function findPatientByQRCode(qrId: string): Promise<QRScanResult> {
  try {
    const db = await getFirebaseFirestore()
    
    // Search for patient with this QR ID
    const patientsQuery = query(
      collection(db, 'patients'),
      where('qrId', '==', qrId.trim()),
      where('isActive', '==', true)
    )

    const patientsSnapshot = await getDocs(patientsQuery)
    
    if (patientsSnapshot.empty) {
      return {
        success: false,
        error: "No patient found with this QR code. Please verify the QR code is valid.",
        qrId: qrId.trim()
      }
    }

    // Get patient data
    const patientDoc = patientsSnapshot.docs[0]
    const patient: Patient = {
      id: patientDoc.id,
      ...patientDoc.data()
    } as Patient

    return {
      success: true,
      patient: patient,
      qrId: qrId.trim()
    }

  } catch (error) {
    console.error('Error finding patient by QR code:', error)
    return {
      success: false,
      error: "Error retrieving patient data. Please try again.",
      qrId: qrId.trim()
    }
  }
}

/**
 * Log QR code scan
 */
export async function logQRScan(
  qrId: string,
  patientId: string,
  scannedBy: string,
  scannerRole: 'patient' | 'doctor' | 'pharmacy' | 'chw' | 'admin',
  purpose: 'consultation' | 'emergency' | 'prescription' | 'general' = 'general',
  location?: GeolocationCoordinates
): Promise<void> {
  try {
    const db = await getFirebaseFirestore()

    await addDoc(collection(db, 'qr-scan-logs'), {
      qrId: qrId,
      patientId: patientId,
      scannedBy: scannedBy,
      scannerRole: scannerRole,
      location: location ? new GeoPoint(location.latitude, location.longitude) : undefined,
      purpose: purpose,
      accessGranted: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

  } catch (error) {
    console.error('Error logging QR scan:', error)
    // Don't throw error for logging failures
  }
}

/**
 * Get patient's recent activity summary
 */
export async function getPatientActivitySummary(patientId: string) {
  try {
    const db = await getFirebaseFirestore()

    const [
      recentAppointments,
      activePrescriptions,
      recentSymptomChecks
    ] = await Promise.all([
      getDocs(query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId),
        where('status', 'in', ['scheduled', 'confirmed', 'in-progress']),
        orderBy('scheduledAt', 'asc'),
        limit(3)
      )),
      
      getDocs(query(
        collection(db, 'prescriptions'),
        where('patientId', '==', patientId),
        where('status', '==', 'issued'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )),
      
      getDocs(query(
        collection(db, 'symptom-results'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(3)
      ))
    ])

    return {
      upcomingAppointments: recentAppointments.size,
      activePrescriptions: activePrescriptions.size,
      recentSymptomChecks: recentSymptomChecks.size,
      lastActivity: new Date() // This would be calculated from the most recent activity
    }

  } catch (error) {
    console.error('Error fetching patient activity summary:', error)
    return {
      upcomingAppointments: 0,
      activePrescriptions: 0,
      recentSymptomChecks: 0,
      lastActivity: null
    }
  }
}

/**
 * Update patient's last accessed timestamp
 */
export async function updatePatientLastAccessed(patientId: string): Promise<void> {
  try {
    const db = await getFirebaseFirestore()
    
    await updateDoc(doc(db, 'patients', patientId), {
      lastAccessedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

  } catch (error) {
    console.error('Error updating patient last accessed:', error)
    // Don't throw error for this non-critical operation
  }
}

/**
 * Validate patient access permissions
 */
export function validatePatientAccess(
  patient: Patient,
  accessorRole: 'patient' | 'doctor' | 'pharmacy' | 'chw' | 'admin',
  accessorId: string
): { hasAccess: boolean; accessLevel: 'full' | 'limited' | 'emergency_only' } {
  // Basic access validation logic
  // In a real implementation, this would check more complex permission rules
  
  if (!patient.isActive) {
    return { hasAccess: false, accessLevel: 'emergency_only' }
  }

  switch (accessorRole) {
    case 'patient':
      // Patients can only access their own records
      return { 
        hasAccess: patient.id === accessorId, 
        accessLevel: 'full' 
      }
    
    case 'doctor':
    case 'chw':
      // Healthcare providers have limited access to patient records
      return { 
        hasAccess: true, 
        accessLevel: 'limited' 
      }
    
    case 'pharmacy':
      // Pharmacies have limited access for prescription purposes
      return { 
        hasAccess: true, 
        accessLevel: 'limited' 
      }
    
    case 'admin':
      // Admins have full access
      return { 
        hasAccess: true, 
        accessLevel: 'full' 
      }
    
    default:
      return { hasAccess: false, accessLevel: 'emergency_only' }
  }
}

/**
 * Format patient data for display based on access level
 */
export function formatPatientDataForDisplay(
  patient: Patient,
  accessLevel: 'full' | 'limited' | 'emergency_only',
  showSensitive: boolean = false
): Partial<Patient> {
  const baseData = {
    id: patient.id,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    qrId: patient.qrId
  }

  if (accessLevel === 'emergency_only') {
    return {
      ...baseData,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      emergencyContact: patient.emergencyContact
    }
  }

  if (accessLevel === 'limited' && !showSensitive) {
    return {
      ...baseData,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      address: {
        ...patient.address,
        street: '••• ••••••• Street'
      },
      email: '••••••@••••.com',
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      emergencyContact: {
        ...patient.emergencyContact,
        phone: '•••-•••-••••'
      }
    }
  }

  // Full access or sensitive data requested
  return patient
}
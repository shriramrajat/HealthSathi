// Firestore Collection Schemas and Validation Rules
// Defines the structure and validation for all healthcare platform collections

import { z } from 'zod'
import { Timestamp, GeoPoint } from 'firebase/firestore'

// ============================================================================
// BASE SCHEMAS
// ============================================================================

const BaseDocumentSchema = z.object({
  id: z.string(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp)
})

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1)
})

const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional()
})

// ============================================================================
// PATIENT COLLECTION SCHEMA
// ============================================================================

const MedicalRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['diagnosis', 'allergy', 'medication', 'procedure', 'vaccination', 'lab_result']),
  title: z.string().min(1),
  description: z.string(),
  date: z.instanceof(Timestamp),
  provider: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'resolved', 'chronic'])
})

export const PatientSchema = BaseDocumentSchema.extend({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  dateOfBirth: z.instanceof(Timestamp),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  address: AddressSchema,
  medicalHistory: z.array(MedicalRecordSchema),
  emergencyContact: EmergencyContactSchema,
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  insuranceInfo: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional()
  }).optional(),
  qrId: z.string().min(1),
  isActive: z.boolean()
})

// ============================================================================
// APPOINTMENT COLLECTION SCHEMA
// ============================================================================

export const AppointmentSchema = BaseDocumentSchema.extend({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.instanceof(Timestamp),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  type: z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup']),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  symptoms: z.array(z.string()),
  notes: z.string().optional(),
  consultationId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  reminderSent: z.boolean().optional(),
  roomId: z.string().optional(),
  // Denormalized fields
  patientName: z.string().optional(),
  patientPhone: z.string().optional(),
  doctorName: z.string().optional()
})

// ============================================================================
// PRESCRIPTION COLLECTION SCHEMA
// ============================================================================

const MedicineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string(),
  quantity: z.number().min(1).optional(),
  refills: z.number().min(0).optional(),
  genericAllowed: z.boolean().optional()
})

export const PrescriptionSchema = BaseDocumentSchema.extend({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  medicines: z.array(MedicineSchema).min(1),
  diagnosis: z.string().min(1),
  notes: z.string(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.enum(['pdf', 'jpg', 'png']).optional(),
  status: z.enum(['issued', 'dispensed', 'cancelled', 'expired']),
  expiryDate: z.instanceof(Timestamp).optional(),
  pharmacyId: z.string().optional(),
  dispensedAt: z.instanceof(Timestamp).optional(),
  // Denormalized fields
  patientName: z.string().optional(),
  doctorName: z.string().optional(),
  pharmacyName: z.string().optional()
})

// ============================================================================
// PHARMACY COLLECTION SCHEMAS
// ============================================================================

export const PharmacySchema = BaseDocumentSchema.extend({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  address: AddressSchema,
  licenseNumber: z.string().min(1),
  operatingHours: z.record(z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isOpen: z.boolean()
  })),
  services: z.array(z.string()),
  isActive: z.boolean()
})

export const PharmacyStockSchema = BaseDocumentSchema.extend({
  pharmacyId: z.string().min(1),
  medicineId: z.string().min(1),
  medicineName: z.string().min(1),
  quantity: z.number().min(0),
  expiryDate: z.instanceof(Timestamp),
  batchNumber: z.string().min(1),
  price: z.number().min(0),
  manufacturer: z.string().min(1),
  category: z.string().min(1),
  minStockLevel: z.number().min(0),
  maxStockLevel: z.number().min(1),
  isActive: z.boolean()
})

export const PrescriptionQueueSchema = BaseDocumentSchema.extend({
  prescriptionId: z.string().min(1),
  pharmacyId: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  doctorName: z.string().min(1),
  medicines: z.array(MedicineSchema).min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['pending', 'in-progress', 'ready', 'dispensed']),
  estimatedTime: z.number().min(0).optional(),
  queuePosition: z.number().min(1).optional()
})

// ============================================================================
// CHW COLLECTION SCHEMAS
// ============================================================================

export const CHWSchema = BaseDocumentSchema.extend({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  employeeId: z.string().min(1),
  region: z.string().min(1),
  address: AddressSchema,
  certifications: z.array(z.string()),
  isActive: z.boolean()
})

export const CHWLogSchema = BaseDocumentSchema.extend({
  chwId: z.string().min(1),
  patientId: z.string().optional(),
  action: z.enum(['registration', 'consultation', 'emergency', 'qr_scan', 'health_check']),
  location: z.instanceof(GeoPoint),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  followUpRequired: z.boolean(),
  attachments: z.array(z.string().url()).optional()
})

export const EmergencyLogSchema = BaseDocumentSchema.extend({
  chwId: z.string().min(1),
  patientId: z.string().optional(),
  location: z.instanceof(GeoPoint),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['reported', 'acknowledged', 'in-progress', 'resolved']),
  responseTime: z.number().min(0).optional(),
  responders: z.array(z.string()).optional()
})

// ============================================================================
// SYMPTOM CHECKER SCHEMAS
// ============================================================================

export const SymptomRuleSchema = z.object({
  id: z.string(),
  symptoms: z.array(z.string()).min(1),
  advice: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  recommendedAction: z.string().min(1),
  specialistReferral: z.string().optional(),
  isActive: z.boolean()
})

export const SymptomResultSchema = BaseDocumentSchema.extend({
  patientId: z.string().min(1),
  selectedSymptoms: z.array(z.string()).min(1),
  matchedRules: z.array(z.string()),
  advice: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  recommendedAction: z.string().min(1),
  specialistReferral: z.string().optional(),
  followUpScheduled: z.boolean().optional(),
  appointmentId: z.string().optional()
})

export const SymptomCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  symptoms: z.array(z.string()).min(1),
  icon: z.string().optional(),
  color: z.string().optional()
})

// ============================================================================
// QR CODE SYSTEM SCHEMAS
// ============================================================================

export const QRHealthRecordSchema = BaseDocumentSchema.extend({
  patientId: z.string().min(1),
  qrCode: z.string().min(1),
  qrCodeUrl: z.string().url().optional(),
  generatedAt: z.instanceof(Timestamp),
  expiresAt: z.instanceof(Timestamp).optional(),
  isActive: z.boolean(),
  accessCount: z.number().min(0),
  lastAccessedAt: z.instanceof(Timestamp).optional(),
  lastAccessedBy: z.string().optional()
})

export const QRScanLogSchema = BaseDocumentSchema.extend({
  qrId: z.string().min(1),
  patientId: z.string().min(1),
  scannedBy: z.string().min(1),
  scannerRole: z.enum(['patient', 'doctor', 'pharmacy', 'chw', 'admin']),
  location: z.instanceof(GeoPoint).optional(),
  purpose: z.enum(['consultation', 'emergency', 'prescription', 'general']),
  accessGranted: z.boolean(),
  denialReason: z.string().optional()
})

// ============================================================================
// VIDEO CONSULTATION SCHEMAS
// ============================================================================

export const ConsultationSchema = BaseDocumentSchema.extend({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  roomId: z.string().min(1),
  jitsiRoomName: z.string().min(1),
  startTime: z.instanceof(Timestamp),
  endTime: z.instanceof(Timestamp).optional(),
  duration: z.number().min(0).optional(),
  notes: z.string(),
  recordingUrl: z.string().url().optional(),
  recordingDuration: z.number().min(0).optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']),
  participants: z.object({
    patientJoined: z.boolean().optional(),
    doctorJoined: z.boolean().optional(),
    patientJoinedAt: z.instanceof(Timestamp).optional(),
    doctorJoinedAt: z.instanceof(Timestamp).optional()
  }),
  recording: z.object({
    isRecording: z.boolean(),
    startTime: z.instanceof(Timestamp).optional(),
    endTime: z.instanceof(Timestamp).optional(),
    url: z.string().url().optional(),
    duration: z.number().min(0).optional()
  }).optional(),
  timing: z.object({
    lastDurationUpdate: z.instanceof(Timestamp).optional(),
    totalPausedTime: z.number().min(0).optional(),
    sessionStartTime: z.instanceof(Timestamp).optional()
  }).optional(),
  technicalIssues: z.array(z.string()).optional(),
  followUpRequired: z.boolean().optional(),
  prescriptionCreated: z.boolean().optional(),
  // Denormalized fields
  patientName: z.string().optional(),
  doctorName: z.string().optional()
})

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationConfigSchema = BaseDocumentSchema.extend({
  userId: z.string().min(1),
  userRole: z.enum(['patient', 'doctor', 'pharmacy', 'chw', 'admin']),
  fcmToken: z.string().min(1),
  preferences: z.object({
    appointments: z.boolean(),
    prescriptions: z.boolean(),
    emergencies: z.boolean(),
    consultations: z.boolean(),
    general: z.boolean()
  }),
  deviceInfo: z.object({
    platform: z.string(),
    version: z.string(),
    model: z.string().optional()
  }).optional(),
  isActive: z.boolean()
})

export const NotificationSchema = BaseDocumentSchema.extend({
  userId: z.string().min(1),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  type: z.enum([
    'appointment_booked',
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_reminder',
    'consultation_started',
    'consultation_ended',
    'prescription_issued',
    'prescription_ready',
    'prescription_dispensed',
    'emergency_alert',
    'symptom_check_urgent',
    'qr_code_scanned',
    'system_maintenance',
    'general'
  ]),
  priority: z.enum(['low', 'normal', 'high']),
  isRead: z.boolean(),
  actionUrl: z.string().url().optional(),
  actionData: z.record(z.any()).optional(),
  expiresAt: z.instanceof(Timestamp).optional(),
  sentAt: z.instanceof(Timestamp)
})

// ============================================================================
// FIRESTORE COLLECTION PATHS
// ============================================================================

export const COLLECTION_PATHS = {
  // Core entities
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  PRESCRIPTIONS: 'prescriptions',
  CONSULTATIONS: 'consultations',
  
  // Pharmacy
  PHARMACIES: 'pharmacies',
  PHARMACY_STOCK: 'pharmacy-stock',
  PRESCRIPTION_QUEUE: 'prescription-queue',
  
  // Community Health Workers
  CHWS: 'chws',
  CHW_LOGS: 'chw-logs',
  EMERGENCY_LOGS: 'emergency-logs',
  
  // Symptom Checker
  SYMPTOM_RULES: 'symptom-rules',
  SYMPTOM_RESULTS: 'symptom-results',
  SYMPTOM_CATEGORIES: 'symptom-categories',
  
  // QR Code System
  QR_HEALTH_RECORDS: 'qr-health-records',
  QR_SCAN_LOGS: 'qr-scan-logs',
  
  // Notifications
  NOTIFICATION_CONFIGS: 'notification-configs',
  NOTIFICATIONS: 'notifications',
  
  // System
  USERS: 'users',
  AUDIT_LOGS: 'audit-logs',
  SYSTEM_SETTINGS: 'system-settings'
} as const

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validatePatient(data: unknown) {
  return PatientSchema.parse(data)
}

export function validateAppointment(data: unknown) {
  return AppointmentSchema.parse(data)
}

export function validatePrescription(data: unknown) {
  return PrescriptionSchema.parse(data)
}

export function validatePharmacyStock(data: unknown) {
  return PharmacyStockSchema.parse(data)
}

export function validateCHWLog(data: unknown) {
  return CHWLogSchema.parse(data)
}

export function validateSymptomResult(data: unknown) {
  return SymptomResultSchema.parse(data)
}

export function validateQRHealthRecord(data: unknown) {
  return QRHealthRecordSchema.parse(data)
}

export function validateConsultation(data: unknown) {
  return ConsultationSchema.parse(data)
}

export function validateNotification(data: unknown) {
  return NotificationSchema.parse(data)
}

// ============================================================================
// FIRESTORE INDEXES CONFIGURATION
// ============================================================================

export const FIRESTORE_INDEXES = {
  // Patient indexes
  patients: [
    { fields: [{ fieldPath: 'qrId', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'email', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'isActive', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] }
  ],
  
  // Appointment indexes
  appointments: [
    { fields: [{ fieldPath: 'patientId', order: 'ASCENDING' }, { fieldPath: 'scheduledAt', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'doctorId', order: 'ASCENDING' }, { fieldPath: 'scheduledAt', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'scheduledAt', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'priority', order: 'ASCENDING' }, { fieldPath: 'scheduledAt', order: 'ASCENDING' }] }
  ],
  
  // Prescription indexes
  prescriptions: [
    { fields: [{ fieldPath: 'patientId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'doctorId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'pharmacyId', order: 'ASCENDING' }, { fieldPath: 'status', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'status', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] }
  ],
  
  // Pharmacy stock indexes
  'pharmacy-stock': [
    { fields: [{ fieldPath: 'pharmacyId', order: 'ASCENDING' }, { fieldPath: 'medicineName', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'pharmacyId', order: 'ASCENDING' }, { fieldPath: 'expiryDate', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'pharmacyId', order: 'ASCENDING' }, { fieldPath: 'quantity', order: 'ASCENDING' }] }
  ],
  
  // CHW logs indexes
  'chw-logs': [
    { fields: [{ fieldPath: 'chwId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'action', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'severity', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] }
  ],
  
  // Symptom results indexes
  'symptom-results': [
    { fields: [{ fieldPath: 'patientId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'urgency', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] }
  ],
  
  // QR scan logs indexes
  'qr-scan-logs': [
    { fields: [{ fieldPath: 'patientId', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'scannedBy', order: 'ASCENDING' }, { fieldPath: 'createdAt', order: 'DESCENDING' }] }
  ],
  
  // Notification indexes
  notifications: [
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'sentAt', order: 'DESCENDING' }] },
    { fields: [{ fieldPath: 'userId', order: 'ASCENDING' }, { fieldPath: 'isRead', order: 'ASCENDING' }] },
    { fields: [{ fieldPath: 'type', order: 'ASCENDING' }, { fieldPath: 'sentAt', order: 'DESCENDING' }] }
  ]
}
// Comprehensive TypeScript interfaces for Healthcare Platform
// Core data models for all healthcare entities and systems

import { Timestamp, GeoPoint } from 'firebase/firestore'

// Base interface for all Firestore documents
interface BaseDocument {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User role types
export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'chw' | 'admin'

// ============================================================================
// PATIENT MODELS
// ============================================================================

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface MedicalRecord {
  id: string
  type: 'diagnosis' | 'allergy' | 'medication' | 'procedure' | 'vaccination' | 'lab_result'
  title: string
  description: string
  date: Timestamp
  provider?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'chronic'
}

export interface Patient extends BaseDocument {
  name: string
  email: string
  phone: string
  dateOfBirth: Timestamp
  age: number
  gender: 'male' | 'female' | 'other'
  address: Address
  medicalHistory: MedicalRecord[]
  emergencyContact: EmergencyContact
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
  insuranceInfo?: {
    provider: string
    policyNumber: string
    groupNumber?: string
  }
  qrId: string // Unique QR identifier for digital health records
  isActive: boolean
}

// ============================================================================
// APPOINTMENT MODELS
// ============================================================================

export interface Appointment extends BaseDocument {
  patientId: string
  doctorId: string
  scheduledAt: Timestamp
  duration: number // in minutes
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine-checkup'
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  symptoms: string[]
  notes?: string
  consultationId?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  reminderSent?: boolean
  roomId?: string // Jitsi room ID for video consultations
  // Denormalized fields for quick display
  patientName?: string
  patientPhone?: string
  doctorName?: string
}

// ============================================================================
// PRESCRIPTION MODELS
// ============================================================================

export interface Medicine {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  quantity?: number
  refills?: number
  genericAllowed?: boolean
}

export interface Prescription extends BaseDocument {
  patientId: string
  doctorId: string
  appointmentId?: string
  medicines: Medicine[]
  diagnosis: string
  notes: string
  fileUrl?: string
  fileName?: string
  fileType?: 'pdf' | 'jpg' | 'png'
  status: 'issued' | 'dispensed' | 'cancelled' | 'expired'
  expiryDate?: Timestamp
  pharmacyId?: string
  dispensedAt?: Timestamp
  // Denormalized fields
  patientName?: string
  doctorName?: string
  pharmacyName?: string
}

// ============================================================================
// PHARMACY MODELS
// ============================================================================

export interface Pharmacy extends BaseDocument {
  name: string
  email: string
  phone: string
  address: Address
  licenseNumber: string
  operatingHours: {
    [key: string]: { // day of week
      open: string
      close: string
      isOpen: boolean
    }
  }
  services: string[]
  isActive: boolean
}

export interface PharmacyStock extends BaseDocument {
  pharmacyId: string
  medicineId: string
  medicineName: string
  quantity: number
  expiryDate: Timestamp
  batchNumber: string
  price: number
  manufacturer: string
  category: string
  minStockLevel: number
  maxStockLevel: number
  isActive: boolean
}

export interface PrescriptionQueue extends BaseDocument {
  prescriptionId: string
  pharmacyId: string
  patientId: string
  patientName: string
  doctorName: string
  medicines: Medicine[]
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'ready' | 'dispensed'
  estimatedTime?: number // minutes
  queuePosition?: number
}

// ============================================================================
// COMMUNITY HEALTH WORKER MODELS
// ============================================================================

export interface CHW extends BaseDocument {
  name: string
  email: string
  phone: string
  employeeId: string
  region: string
  address: Address
  certifications: string[]
  isActive: boolean
}

export interface CHWLog extends BaseDocument {
  chwId: string
  patientId?: string
  action: 'registration' | 'consultation' | 'emergency' | 'qr_scan' | 'health_check'
  location: GeoPoint
  description: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  followUpRequired: boolean
  attachments?: string[] // URLs to uploaded files
}

export interface EmergencyLog extends BaseDocument {
  chwId: string
  patientId?: string
  location: GeoPoint
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'acknowledged' | 'in-progress' | 'resolved'
  responseTime?: number // minutes
  responders?: string[] // IDs of responding personnel
}

// ============================================================================
// SYMPTOM CHECKER MODELS
// ============================================================================

export interface SymptomRule {
  id: string
  symptoms: string[]
  advice: string
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  recommendedAction: string
  specialistReferral?: string
  isActive: boolean
}

export interface SymptomResult extends BaseDocument {
  patientId: string
  selectedSymptoms: string[]
  matchedRules: string[] // Rule IDs that matched
  advice: string
  urgency: 'low' | 'medium' | 'high' | 'emergency'
  recommendedAction: string
  specialistReferral?: string
  followUpScheduled?: boolean
  appointmentId?: string
}

export interface SymptomCategory {
  id: string
  name: string
  symptoms: string[]
  icon?: string
  color?: string
}

// ============================================================================
// QR CODE SYSTEM MODELS
// ============================================================================

export interface QRHealthRecord extends BaseDocument {
  patientId: string
  qrCode: string
  qrCodeUrl?: string // URL to QR code image
  generatedAt: Timestamp
  expiresAt?: Timestamp
  isActive: boolean
  accessCount: number
  lastAccessedAt?: Timestamp
  lastAccessedBy?: string
}

export interface QRScanLog extends BaseDocument {
  qrId: string
  patientId: string
  scannedBy: string
  scannerRole: UserRole
  location?: GeoPoint
  purpose: 'consultation' | 'emergency' | 'prescription' | 'general'
  accessGranted: boolean
  denialReason?: string
}

// ============================================================================
// VIDEO CONSULTATION MODELS
// ============================================================================

export interface Consultation extends BaseDocument {
  appointmentId: string
  patientId: string
  doctorId: string
  roomId: string
  jitsiRoomName: string
  startTime: Timestamp
  endTime?: Timestamp
  duration?: number // in minutes
  notes: string
  recordingUrl?: string
  recordingDuration?: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  participants: {
    patientJoined?: boolean
    doctorJoined?: boolean
    patientJoinedAt?: Timestamp
    doctorJoinedAt?: Timestamp
  }
  recording?: {
    isRecording: boolean
    startTime?: Timestamp
    endTime?: Timestamp
    url?: string
    duration?: number
  }
  timing?: {
    lastDurationUpdate?: Timestamp
    totalPausedTime?: number
    sessionStartTime?: Timestamp
  }
  technicalIssues?: string[]
  followUpRequired?: boolean
  prescriptionCreated?: boolean
  // Denormalized fields
  patientName?: string
  doctorName?: string
}

export interface JitsiConfig {
  roomName: string
  width: string
  height: string
  parentNode?: HTMLElement
  configOverwrite: {
    startWithAudioMuted: boolean
    startWithVideoMuted: boolean
    enableWelcomePage: boolean
    prejoinPageEnabled: boolean
    disableModeratorIndicator: boolean
  }
  interfaceConfigOverwrite: {
    TOOLBAR_BUTTONS: string[]
    SHOW_JITSI_WATERMARK: boolean
    SHOW_WATERMARK_FOR_GUESTS: boolean
  }
}

// ============================================================================
// NOTIFICATION MODELS
// ============================================================================

export interface NotificationConfig extends BaseDocument {
  userId: string
  userRole: UserRole
  fcmToken: string
  preferences: {
    appointments: boolean
    prescriptions: boolean
    emergencies: boolean
    consultations: boolean
    general: boolean
  }
  deviceInfo?: {
    platform: string
    version: string
    model?: string
  }
  isActive: boolean
}

export interface NotificationPayload {
  title: string
  body: string
  data: Record<string, string>
  targetUsers: string[]
  targetRoles?: UserRole[]
  type: NotificationType
  priority: 'low' | 'normal' | 'high'
  scheduledAt?: Timestamp
  expiresAt?: Timestamp
}

export interface Notification extends BaseDocument {
  userId: string
  title: string
  body: string
  type: NotificationType
  priority: 'low' | 'normal' | 'high'
  isRead: boolean
  actionUrl?: string
  actionData?: Record<string, any>
  expiresAt?: Timestamp
  sentAt: Timestamp
}

export type NotificationType = 
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'consultation_started'
  | 'consultation_ended'
  | 'prescription_issued'
  | 'prescription_ready'
  | 'prescription_dispensed'
  | 'emergency_alert'
  | 'symptom_check_urgent'
  | 'qr_code_scanned'
  | 'system_maintenance'
  | 'general'

// ============================================================================
// DASHBOARD AND ANALYTICS MODELS
// ============================================================================

export interface DashboardStatistics {
  // Patient Dashboard Stats
  upcomingAppointments?: number
  activePrescriptions?: number
  symptomChecksThisMonth?: number
  lastConsultationDate?: Timestamp
  
  // Pharmacy Dashboard Stats
  pendingPrescriptions?: number
  lowStockItems?: number
  expiringSoonItems?: number
  dailyDispensedCount?: number
  
  // CHW Dashboard Stats
  patientsRegisteredToday?: number
  emergencyLogsToday?: number
  qrScansToday?: number
  followUpsRequired?: number
  
  // Doctor Dashboard Stats
  todayAppointments?: number
  totalPatients?: number
  completedConsultations?: number
  prescriptionsIssued?: number
  averageConsultationTime?: number
  patientSatisfactionScore?: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface AnalyticsData {
  consultationTrends: ChartDataPoint[]
  prescriptionPatterns: ChartDataPoint[]
  symptomCheckerUsage: ChartDataPoint[]
  emergencyAlerts: ChartDataPoint[]
  qrCodeScans: ChartDataPoint[]
  timeRange: {
    start: Timestamp
    end: Timestamp
  }
}

// ============================================================================
// FILTER AND QUERY INTERFACES
// ============================================================================

export interface DateRange {
  start: Timestamp
  end: Timestamp
}

export interface AppointmentFilters {
  status?: Appointment['status'][]
  type?: Appointment['type'][]
  dateRange?: DateRange
  priority?: Appointment['priority'][]
  patientSearch?: string
  doctorSearch?: string
}

export interface PrescriptionFilters {
  status?: Prescription['status'][]
  dateRange?: DateRange
  patientSearch?: string
  medicationSearch?: string
  pharmacySearch?: string
}

export interface SymptomResultFilters {
  urgency?: SymptomResult['urgency'][]
  dateRange?: DateRange
  patientSearch?: string
  followUpRequired?: boolean
}

export interface CHWLogFilters {
  action?: CHWLog['action'][]
  severity?: CHWLog['severity'][]
  dateRange?: DateRange
  region?: string
  followUpRequired?: boolean
}

// ============================================================================
// FORM AND VALIDATION INTERFACES
// ============================================================================

export interface PatientRegistrationForm {
  name: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address: Address
  emergencyContact: EmergencyContact
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
}

export interface AppointmentBookingForm {
  doctorId: string
  scheduledAt: string
  type: Appointment['type']
  symptoms: string[]
  notes?: string
  priority: Appointment['priority']
}

export interface PrescriptionForm {
  patientId: string
  medicines: Medicine[]
  diagnosis: string
  notes: string
  pharmacyId?: string
}

export interface EmergencyLogForm {
  patientId?: string
  description: string
  severity: EmergencyLog['severity']
  location?: {
    latitude: number
    longitude: number
  }
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Timestamp
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================================
// REAL-TIME SUBSCRIPTION INTERFACES
// ============================================================================

export interface SubscriptionStatus {
  appointments: boolean
  prescriptions: boolean
  consultations: boolean
  notifications: boolean
  emergencyAlerts: boolean
}

export interface RealtimeUpdate<T> {
  type: 'added' | 'modified' | 'removed'
  data: T
  timestamp: Timestamp
}

// ============================================================================
// UTILITY TYPE UNIONS
// ============================================================================

export type DocumentType = 
  | 'patient' 
  | 'appointment' 
  | 'prescription' 
  | 'consultation'
  | 'pharmacy'
  | 'chw'
  | 'symptom_result'
  | 'qr_record'
  | 'notification'

export type AppointmentStatus = Appointment['status']
export type AppointmentType = Appointment['type']
export type PrescriptionStatus = Prescription['status']
export type ConsultationStatus = Consultation['status']
export type SymptomUrgency = SymptomResult['urgency']
export type EmergencyLogSeverity = EmergencyLog['severity']
export type NotificationPriority = Notification['priority']
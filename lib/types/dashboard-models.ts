// TypeScript interfaces for Doctor Dashboard data models
// Based on the design document specifications

import { Timestamp } from 'firebase/firestore'

// Base interface for all documents
interface BaseDocument {
  id: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Address interface for patient information
export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

// Emergency contact interface
export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

// Medical record interface for patient history
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

// Patient interface
export interface Patient extends BaseDocument {
  name: string
  email: string
  phone: string
  dateOfBirth: Timestamp
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
}

// Appointment interface
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
  patientName?: string // Denormalized for quick display
  patientPhone?: string // Denormalized for quick access
}

// Medication interface for prescriptions
export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  quantity?: number
  refills?: number
  genericAllowed?: boolean
}

// Prescription interface
export interface Prescription extends BaseDocument {
  patientId: string
  doctorId: string
  appointmentId?: string
  medications: Medication[]
  diagnosis: string
  notes: string
  fileUrl?: string
  fileName?: string
  fileType?: 'pdf' | 'jpg' | 'png'
  status: 'active' | 'completed' | 'cancelled' | 'expired'
  expiryDate?: Timestamp
  pharmacyId?: string
  dispensedAt?: Timestamp
  patientName?: string // Denormalized for quick display
  doctorName?: string // Denormalized for quick display
}

// Consultation interface
export interface Consultation extends BaseDocument {
  appointmentId: string
  patientId: string
  doctorId: string
  roomId: string
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
  // Enhanced fields for task 9.2
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
  patientName?: string // Denormalized for quick display
  doctorName?: string // Denormalized for quick display
}

// Dashboard statistics interface
export interface DashboardStatistics {
  todayAppointments: number
  totalPatients: number
  completedConsultations: number
  prescriptionsIssued: number
  averageConsultationTime: number
  patientSatisfactionScore?: number
  upcomingAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
}

// Filter interfaces for dashboard queries
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
}

export interface PrescriptionFilters {
  status?: Prescription['status'][]
  dateRange?: DateRange
  patientSearch?: string
  medicationSearch?: string
}

export interface ConsultationFilters {
  status?: Consultation['status'][]
  dateRange?: DateRange
  patientSearch?: string
  hasRecording?: boolean
}

// Dashboard state interface for state management
export interface DashboardState {
  appointments: Appointment[]
  patients: Patient[]
  prescriptions: Prescription[]
  consultations: Consultation[]
  statistics: DashboardStatistics
  loading: {
    appointments: boolean
    patients: boolean
    prescriptions: boolean
    consultations: boolean
    statistics: boolean
  }
  error: {
    appointments?: string
    patients?: string
    prescriptions?: string
    consultations?: string
    statistics?: string
  }
  filters: {
    appointments: AppointmentFilters
    prescriptions: PrescriptionFilters
    consultations: ConsultationFilters
  }
  lastUpdated: {
    appointments?: Timestamp
    patients?: Timestamp
    prescriptions?: Timestamp
    consultations?: Timestamp
    statistics?: Timestamp
  }
}

// Real-time subscription status
export interface SubscriptionStatus {
  appointments: boolean
  patients: boolean
  prescriptions: boolean
  consultations: boolean
}

// Chart data interfaces for analytics
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface ConsultationTrendData extends ChartDataPoint {
  completed: number
  cancelled: number
  noShow: number
}

export interface PatientDemographicsData {
  ageGroup: string
  count: number
  percentage: number
}

export interface PrescriptionPatternData extends ChartDataPoint {
  medicationType: string
  count: number
}

export interface AppointmentStatusData {
  status: Appointment['status']
  count: number
  percentage: number
  color: string
}

// Analytics data interface
export interface AnalyticsData {
  consultationTrends: ConsultationTrendData[]
  patientDemographics: PatientDemographicsData[]
  prescriptionPatterns: PrescriptionPatternData[]
  appointmentStatusDistribution: AppointmentStatusData[]
  timeRange: DateRange
}

// File upload interface for prescriptions
export interface PrescriptionFile {
  file: File
  preview?: string
  uploadProgress?: number
  error?: string
}

// Notification interface for real-time updates
export interface DashboardNotification {
  id: string
  type: 'appointment' | 'consultation' | 'prescription' | 'patient'
  title: string
  message: string
  timestamp: Timestamp
  read: boolean
  actionUrl?: string
  priority: 'low' | 'normal' | 'high'
}

// Export type unions for convenience
export type DocumentType = 'appointment' | 'patient' | 'prescription' | 'consultation'
export type AppointmentStatus = Appointment['status']
export type AppointmentType = Appointment['type']
export type PrescriptionStatus = Prescription['status']
export type ConsultationStatus = Consultation['status']
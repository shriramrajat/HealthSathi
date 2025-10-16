// Validation schemas for Doctor Dashboard data models
// Using Zod for runtime type validation

import { z } from 'zod'

// Base schema for timestamps
const timestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number()
})

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required')
})

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional()
})

// Medical record schema
export const medicalRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['diagnosis', 'allergy', 'medication', 'procedure', 'vaccination', 'lab_result']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: timestampSchema,
  provider: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'resolved', 'chronic'])
})

// Patient schema
export const patientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Patient name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  dateOfBirth: timestampSchema,
  gender: z.enum(['male', 'female', 'other']),
  address: addressSchema,
  medicalHistory: z.array(medicalRecordSchema).default([]),
  emergencyContact: emergencyContactSchema,
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  insuranceInfo: z.object({
    provider: z.string(),
    policyNumber: z.string(),
    groupNumber: z.string().optional()
  }).optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional()
})

// Appointment schema
export const appointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: timestampSchema,
  duration: z.number().min(15, 'Minimum appointment duration is 15 minutes').max(480, 'Maximum appointment duration is 8 hours'),
  type: z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup']),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  notes: z.string().optional(),
  consultationId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  reminderSent: z.boolean().optional(),
  patientName: z.string().optional(),
  patientPhone: z.string().optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional()
})

// Medication schema
export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  quantity: z.number().positive().optional(),
  refills: z.number().min(0).optional(),
  genericAllowed: z.boolean().optional()
})

// Prescription schema
export const prescriptionSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentId: z.string().optional(),
  medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().min(1, 'Prescription notes are required'),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.enum(['pdf', 'jpg', 'png']).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'expired']),
  expiryDate: timestampSchema.optional(),
  pharmacyId: z.string().optional(),
  dispensedAt: timestampSchema.optional(),
  patientName: z.string().optional(),
  doctorName: z.string().optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional()
})

// Consultation schema
export const consultationSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  startTime: timestampSchema,
  endTime: timestampSchema.optional(),
  duration: z.number().positive().optional(),
  notes: z.string().min(1, 'Consultation notes are required'),
  recordingUrl: z.string().url().optional(),
  recordingDuration: z.number().positive().optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']),
  participants: z.object({
    patientJoined: z.boolean().optional(),
    doctorJoined: z.boolean().optional(),
    patientJoinedAt: timestampSchema.optional(),
    doctorJoinedAt: timestampSchema.optional()
  }),
  technicalIssues: z.array(z.string()).optional(),
  followUpRequired: z.boolean().optional(),
  prescriptionCreated: z.boolean().optional(),
  patientName: z.string().optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional()
})

// Dashboard statistics schema
export const dashboardStatisticsSchema = z.object({
  todayAppointments: z.number().min(0),
  totalPatients: z.number().min(0),
  completedConsultations: z.number().min(0),
  prescriptionsIssued: z.number().min(0),
  averageConsultationTime: z.number().min(0),
  patientSatisfactionScore: z.number().min(0).max(5).optional(),
  upcomingAppointments: z.number().min(0),
  cancelledAppointments: z.number().min(0),
  noShowAppointments: z.number().min(0)
})

// Filter schemas
export const dateRangeSchema = z.object({
  start: timestampSchema,
  end: timestampSchema
})

export const appointmentFiltersSchema = z.object({
  status: z.array(z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])).optional(),
  type: z.array(z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup'])).optional(),
  dateRange: dateRangeSchema.optional(),
  priority: z.array(z.enum(['low', 'normal', 'high', 'urgent'])).optional(),
  patientSearch: z.string().optional()
})

export const prescriptionFiltersSchema = z.object({
  status: z.array(z.enum(['active', 'completed', 'cancelled', 'expired'])).optional(),
  dateRange: dateRangeSchema.optional(),
  patientSearch: z.string().optional(),
  medicationSearch: z.string().optional()
})

export const consultationFiltersSchema = z.object({
  status: z.array(z.enum(['scheduled', 'active', 'completed', 'cancelled'])).optional(),
  dateRange: dateRangeSchema.optional(),
  patientSearch: z.string().optional(),
  hasRecording: z.boolean().optional()
})

// File upload schemas
export const prescriptionFileSchema = z.object({
  file: z.instanceof(File),
  preview: z.string().optional(),
  uploadProgress: z.number().min(0).max(100).optional(),
  error: z.string().optional()
})

// Validation functions
export function validatePatient(data: unknown) {
  return patientSchema.safeParse(data)
}

export function validateAppointment(data: unknown) {
  return appointmentSchema.safeParse(data)
}

export function validatePrescription(data: unknown) {
  return prescriptionSchema.safeParse(data)
}

export function validateConsultation(data: unknown) {
  return consultationSchema.safeParse(data)
}

export function validateMedication(data: unknown) {
  return medicationSchema.safeParse(data)
}

export function validateDashboardStatistics(data: unknown) {
  return dashboardStatisticsSchema.safeParse(data)
}

export function validateAppointmentFilters(data: unknown) {
  return appointmentFiltersSchema.safeParse(data)
}

export function validatePrescriptionFilters(data: unknown) {
  return prescriptionFiltersSchema.safeParse(data)
}

export function validateConsultationFilters(data: unknown) {
  return consultationFiltersSchema.safeParse(data)
}

// Partial validation for updates
export const patientUpdateSchema = patientSchema.partial()
export const appointmentUpdateSchema = appointmentSchema.partial()
export const prescriptionUpdateSchema = prescriptionSchema.partial()
export const consultationUpdateSchema = consultationSchema.partial()

export function validatePatientUpdate(data: unknown) {
  return patientUpdateSchema.safeParse(data)
}

export function validateAppointmentUpdate(data: unknown) {
  return appointmentUpdateSchema.safeParse(data)
}

export function validatePrescriptionUpdate(data: unknown) {
  return prescriptionUpdateSchema.safeParse(data)
}

export function validateConsultationUpdate(data: unknown) {
  return consultationUpdateSchema.safeParse(data)
}

// All schemas are already exported above
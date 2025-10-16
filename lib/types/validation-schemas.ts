// Healthcare Platform Validation Schemas
// Zod validation schemas for all healthcare-related forms and data

import { z } from 'zod'

// ============================================================================
// BASE VALIDATION SCHEMAS
// ============================================================================

const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits")
  .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")

const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required")
})

const emergencyContactSchema = z.object({
  name: nameSchema,
  relationship: z.string().min(1, "Relationship is required"),
  phone: phoneSchema,
  email: emailSchema.optional()
})

// ============================================================================
// PATIENT VALIDATION SCHEMAS
// ============================================================================

export const patientRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: "Please select a gender" })
  }),
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional()
})

export const patientUpdateSchema = patientRegistrationSchema.partial().extend({
  id: z.string().min(1, "Patient ID is required")
})

// ============================================================================
// APPOINTMENT VALIDATION SCHEMAS
// ============================================================================

export const appointmentBookingSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  type: z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup'], {
    errorMap: () => ({ message: "Please select an appointment type" })
  }),
  symptoms: z.array(z.string()).min(1, "Please describe at least one symptom"),
  notes: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent'], {
    errorMap: () => ({ message: "Please select a priority level" })
  })
})

export const appointmentUpdateSchema = z.object({
  id: z.string().min(1, "Appointment ID is required"),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  notes: z.string().optional(),
  duration: z.number().min(15).max(480).optional()
})

// ============================================================================
// PRESCRIPTION VALIDATION SCHEMAS
// ============================================================================

const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  instructions: z.string().min(1, "Instructions are required"),
  quantity: z.number().min(1, "Quantity must be at least 1").optional(),
  refills: z.number().min(0, "Refills cannot be negative").optional(),
  genericAllowed: z.boolean().optional()
})

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  medicines: z.array(medicineSchema).min(1, "At least one medicine is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().min(1, "Notes are required"),
  pharmacyId: z.string().optional()
})

export const prescriptionUpdateSchema = z.object({
  id: z.string().min(1, "Prescription ID is required"),
  status: z.enum(['issued', 'dispensed', 'cancelled', 'expired']).optional(),
  pharmacyId: z.string().optional(),
  notes: z.string().optional()
})

// ============================================================================
// PHARMACY VALIDATION SCHEMAS
// ============================================================================

export const pharmacyRegistrationSchema = z.object({
  name: z.string().min(1, "Pharmacy name is required").max(100),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  licenseNumber: z.string().min(1, "License number is required"),
  operatingHours: z.record(z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    isOpen: z.boolean()
  })),
  services: z.array(z.string())
})

export const pharmacyStockSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  medicineName: z.string().min(1, "Medicine name is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  batchNumber: z.string().min(1, "Batch number is required"),
  price: z.number().min(0, "Price cannot be negative"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  category: z.string().min(1, "Category is required"),
  minStockLevel: z.number().min(0, "Minimum stock level cannot be negative"),
  maxStockLevel: z.number().min(1, "Maximum stock level must be at least 1")
})

export const pharmacyStockUpdateSchema = pharmacyStockSchema.partial().extend({
  id: z.string().min(1, "Stock ID is required")
})

// ============================================================================
// CHW VALIDATION SCHEMAS
// ============================================================================

export const chwRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  employeeId: z.string().min(1, "Employee ID is required"),
  region: z.string().min(1, "Region is required"),
  address: addressSchema,
  certifications: z.array(z.string())
})

export const chwLogSchema = z.object({
  patientId: z.string().optional(),
  action: z.enum(['registration', 'consultation', 'emergency', 'qr_scan', 'health_check'], {
    errorMap: () => ({ message: "Please select an action type" })
  }),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  followUpRequired: z.boolean(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
})

export const emergencyLogSchema = z.object({
  patientId: z.string().optional(),
  description: z.string().min(1, "Emergency description is required"),
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: "Please select severity level" })
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
})

// ============================================================================
// SYMPTOM CHECKER VALIDATION SCHEMAS
// ============================================================================

export const symptomSelectionSchema = z.object({
  selectedSymptoms: z.array(z.string()).min(1, "Please select at least one symptom"),
  additionalInfo: z.object({
    age: z.number().min(1).max(150).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional()
  }).optional()
})

export const symptomRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
  advice: z.string().min(1, "Advice is required"),
  urgency: z.enum(['low', 'medium', 'high', 'emergency'], {
    errorMap: () => ({ message: "Please select urgency level" })
  }),
  recommendedAction: z.string().min(1, "Recommended action is required"),
  specialistReferral: z.string().optional()
})

// ============================================================================
// QR CODE VALIDATION SCHEMAS
// ============================================================================

export const qrGenerationSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  type: z.enum(['patient_record', 'appointment', 'prescription', 'emergency', 'temporary'], {
    errorMap: () => ({ message: "Please select QR code type" })
  }),
  accessLevel: z.enum(['full', 'limited', 'emergency_only', 'view_only'], {
    errorMap: () => ({ message: "Please select access level" })
  }),
  expiresAt: z.string().optional(),
  emergencyOnly: z.boolean().optional()
})

export const qrScanSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  purpose: z.enum(['emergency', 'consultation', 'prescription', 'admission', 'discharge', 'routine_check', 'referral', 'insurance', 'research', 'audit', 'other'], {
    errorMap: () => ({ message: "Please select scan purpose" })
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
})

// ============================================================================
// CONSULTATION VALIDATION SCHEMAS
// ============================================================================

export const consultationNotesSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  notes: z.string().min(1, "Consultation notes are required"),
  diagnosis: z.string().optional(),
  followUpRequired: z.boolean(),
  prescriptionCreated: z.boolean(),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional()
})

export const consultationUpdateSchema = z.object({
  id: z.string().min(1, "Consultation ID is required"),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  endTime: z.string().optional(),
  followUpRequired: z.boolean().optional()
})

// ============================================================================
// NOTIFICATION VALIDATION SCHEMAS
// ============================================================================

export const notificationConfigSchema = z.object({
  preferences: z.object({
    appointments: z.boolean(),
    prescriptions: z.boolean(),
    emergencies: z.boolean(),
    consultations: z.boolean(),
    general: z.boolean()
  }),
  fcmToken: z.string().optional()
})

export const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  body: z.string().min(1, "Message is required").max(500),
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
  targetUsers: z.array(z.string()).min(1, "At least one target user is required"),
  actionUrl: z.string().url().optional(),
  expiresAt: z.string().optional()
})

// ============================================================================
// SEARCH AND FILTER VALIDATION SCHEMAS
// ============================================================================

export const dateRangeSchema = z.object({
  start: z.string().min(1, "Start date is required"),
  end: z.string().min(1, "End date is required")
}).refine((data) => new Date(data.start) <= new Date(data.end), {
  message: "Start date must be before or equal to end date",
  path: ["end"]
})

export const appointmentFilterSchema = z.object({
  status: z.array(z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])).optional(),
  type: z.array(z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup'])).optional(),
  dateRange: dateRangeSchema.optional(),
  priority: z.array(z.enum(['low', 'normal', 'high', 'urgent'])).optional(),
  patientSearch: z.string().optional(),
  doctorSearch: z.string().optional()
})

export const prescriptionFilterSchema = z.object({
  status: z.array(z.enum(['issued', 'dispensed', 'cancelled', 'expired'])).optional(),
  dateRange: dateRangeSchema.optional(),
  patientSearch: z.string().optional(),
  medicationSearch: z.string().optional(),
  pharmacySearch: z.string().optional()
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PatientRegistrationData = z.infer<typeof patientRegistrationSchema>
export type PatientUpdateData = z.infer<typeof patientUpdateSchema>
export type AppointmentBookingData = z.infer<typeof appointmentBookingSchema>
export type AppointmentUpdateData = z.infer<typeof appointmentUpdateSchema>
export type PrescriptionData = z.infer<typeof prescriptionSchema>
export type PrescriptionUpdateData = z.infer<typeof prescriptionUpdateSchema>
export type PharmacyRegistrationData = z.infer<typeof pharmacyRegistrationSchema>
export type PharmacyStockData = z.infer<typeof pharmacyStockSchema>
export type PharmacyStockUpdateData = z.infer<typeof pharmacyStockUpdateSchema>
export type CHWRegistrationData = z.infer<typeof chwRegistrationSchema>
export type CHWLogData = z.infer<typeof chwLogSchema>
export type EmergencyLogData = z.infer<typeof emergencyLogSchema>
export type SymptomSelectionData = z.infer<typeof symptomSelectionSchema>
export type SymptomRuleData = z.infer<typeof symptomRuleSchema>
export type QRGenerationData = z.infer<typeof qrGenerationSchema>
export type QRScanData = z.infer<typeof qrScanSchema>
export type ConsultationNotesData = z.infer<typeof consultationNotesSchema>
export type ConsultationUpdateData = z.infer<typeof consultationUpdateSchema>
export type NotificationConfigData = z.infer<typeof notificationConfigSchema>
export type NotificationData = z.infer<typeof notificationSchema>
export type AppointmentFilterData = z.infer<typeof appointmentFilterSchema>
export type PrescriptionFilterData = z.infer<typeof prescriptionFilterSchema>

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export const validatePatientRegistration = (data: unknown) => {
  return patientRegistrationSchema.safeParse(data)
}

export const validateAppointmentBooking = (data: unknown) => {
  return appointmentBookingSchema.safeParse(data)
}

export const validatePrescription = (data: unknown) => {
  return prescriptionSchema.safeParse(data)
}

export const validatePharmacyStock = (data: unknown) => {
  return pharmacyStockSchema.safeParse(data)
}

export const validateCHWLog = (data: unknown) => {
  return chwLogSchema.safeParse(data)
}

export const validateSymptomSelection = (data: unknown) => {
  return symptomSelectionSchema.safeParse(data)
}

export const validateQRGeneration = (data: unknown) => {
  return qrGenerationSchema.safeParse(data)
}

export const validateConsultationNotes = (data: unknown) => {
  return consultationNotesSchema.safeParse(data)
}

export const validateNotificationConfig = (data: unknown) => {
  return notificationConfigSchema.safeParse(data)
}
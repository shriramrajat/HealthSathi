// Test file for dashboard collections setup
import { describe, it, expect, vi } from 'vitest'
import { COLLECTIONS } from '../firebase-config'
import { 
  validatePatient, 
  validateAppointment, 
  validatePrescription, 
  validateConsultation 
} from '../validation/dashboard-schemas'

// Mock Firebase
vi.mock('../firebase', () => ({
  getFirebaseFirestore: vi.fn(() => Promise.resolve({}))
}))

describe('Dashboard Collections Setup', () => {
  it('should have all required collection names defined', () => {
    expect(COLLECTIONS.PATIENTS).toBe('patients')
    expect(COLLECTIONS.APPOINTMENTS).toBe('appointments')
    expect(COLLECTIONS.PRESCRIPTIONS).toBe('prescriptions')
    expect(COLLECTIONS.CONSULTATIONS).toBe('consultations')
  })

  it('should validate patient data correctly', () => {
    const validPatient = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      dateOfBirth: { seconds: 946684800, nanoseconds: 0 }, // 2000-01-01
      gender: 'male' as const,
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      medicalHistory: [],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'spouse',
        phone: '0987654321'
      }
    }

    const result = validatePatient(validPatient)
    expect(result.success).toBe(true)
  })

  it('should validate appointment data correctly', () => {
    const validAppointment = {
      patientId: 'patient123',
      doctorId: 'doctor123',
      scheduledAt: { seconds: 1640995200, nanoseconds: 0 }, // 2022-01-01
      duration: 30,
      type: 'consultation' as const,
      status: 'scheduled' as const,
      symptoms: ['headache', 'fever'],
      priority: 'normal' as const
    }

    const result = validateAppointment(validAppointment)
    expect(result.success).toBe(true)
  })

  it('should validate prescription data correctly', () => {
    const validPrescription = {
      patientId: 'patient123',
      doctorId: 'doctor123',
      medications: [{
        name: 'Aspirin',
        dosage: '100mg',
        frequency: 'twice daily',
        duration: '7 days',
        instructions: 'Take with food'
      }],
      diagnosis: 'Headache',
      notes: 'Patient reports mild headache',
      status: 'active' as const
    }

    const result = validatePrescription(validPrescription)
    expect(result.success).toBe(true)
  })

  it('should validate consultation data correctly', () => {
    const validConsultation = {
      appointmentId: 'appointment123',
      patientId: 'patient123',
      doctorId: 'doctor123',
      roomId: 'room123',
      startTime: { seconds: 1640995200, nanoseconds: 0 },
      notes: 'Patient consultation completed successfully',
      status: 'completed' as const,
      participants: {}
    }

    const result = validateConsultation(validConsultation)
    expect(result.success).toBe(true)
  })

  it('should reject invalid patient data', () => {
    const invalidPatient = {
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: not a valid email
      phone: '123', // Invalid: too short
      gender: 'invalid' // Invalid: not in enum
    }

    const result = validatePatient(invalidPatient)
    expect(result.success).toBe(false)
    expect(result.error?.issues).toBeDefined()
  })
})
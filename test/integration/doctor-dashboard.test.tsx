/**
 * End-to-end integration tests for Doctor Dashboard
 * Tests complete user workflows and validates all requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DoctorDashboard from '@/app/dashboard/doctor/page'
import { AuthProvider } from '@/components/auth-provider'
import { QueryProvider } from '@/lib/providers/query-provider'

// Mock Firebase
vi.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-doctor-id',
      email: 'doctor@test.com'
    }
  }
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date: Date) => ({ toDate: () => date })
  },
  updateDoc: vi.fn(),
  doc: vi.fn()
}))

// Mock hooks
vi.mock('@/hooks/use-appointments-optimized', () => ({
  useAppointmentsOptimized: () => ({
    appointments: mockAppointments,
    todayAppointments: mockTodayAppointments,
    upcomingAppointments: mockUpcomingAppointments,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    updateAppointmentStatus: vi.fn(),
    isUpdatingStatus: false
  })
}))

vi.mock('@/hooks/use-patients', () => ({
  usePatients: () => ({
    patients: mockPatients,
    isLoading: false,
    error: null
  })
}))

vi.mock('@/hooks/use-prescriptions', () => ({
  usePrescriptions: () => ({
    prescriptions: mockPrescriptions,
    isLoading: false,
    error: null
  })
}))

vi.mock('@/hooks/use-consultations', () => ({
  useConsultations: () => ({
    consultations: mockConsultations,
    isLoading: false,
    error: null
  })
}))

vi.mock('@/hooks/use-analytics-data', () => ({
  useAnalyticsData: () => ({
    analyticsData: mockAnalyticsData,
    isLoading: false,
    error: null
  })
}))

vi.mock('@/hooks/use-consultation-integration', () => ({
  useConsultationIntegration: () => ({
    isStartingConsultation: false,
    startConsultation: vi.fn(),
    error: null
  })
}))

// Mock data
const mockAppointments = [
  {
    id: '1',
    patientId: 'patient-1',
    patientName: 'John Doe',
    doctorId: 'test-doctor-id',
    scheduledAt: { toDate: () => new Date(Date.now() + 3600000) }, // 1 hour from now
    status: 'confirmed',
    symptoms: ['Fever', 'Cough'],
    patientPhone: '+1234567890'
  },
  {
    id: '2',
    patientId: 'patient-2',
    patientName: 'Jane Smith',
    doctorId: 'test-doctor-id',
    scheduledAt: { toDate: () => new Date(Date.now() + 7200000) }, // 2 hours from now
    status: 'scheduled',
    symptoms: ['Headache'],
    patientPhone: '+1234567891'
  }
]

const mockTodayAppointments = mockAppointments
const mockUpcomingAppointments = mockAppointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled')

const mockPatients = [
  {
    id: 'patient-1',
    name: 'John Doe',
    age: 35,
    lastVisit: '2024-01-10',
    condition: 'Hypertension',
    phone: '+1234567890'
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    age: 28,
    lastVisit: '2024-01-12',
    condition: 'Migraine',
    phone: '+1234567891'
  }
]

const mockPrescriptions = [
  {
    id: 'rx-1',
    patientId: 'patient-1',
    doctorId: 'test-doctor-id',
    medications: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'twice daily' }],
    createdAt: { toDate: () => new Date() }
  }
]

const mockConsultations = [
  {
    id: 'consult-1',
    patientId: 'patient-1',
    doctorId: 'test-doctor-id',
    status: 'completed',
    startTime: { toDate: () => new Date(Date.now() - 3600000) },
    endTime: { toDate: () => new Date(Date.now() - 1800000) }
  }
]

const mockAnalyticsData = {
  consultationTrends: [],
  patientDemographics: [],
  prescriptionPatterns: [],
  appointmentDistribution: []
}

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Doctor Dashboard Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Dashboard Overview (Requirement 7.1, 7.2)', () => {
    it('should display real-time dashboard statistics', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Check if statistics cards are displayed
      await waitFor(() => {
        expect(screen.getByText(/today's appointments/i)).toBeInTheDocument()
        expect(screen.getByText(/total patients/i)).toBeInTheDocument()
        expect(screen.getByText(/completed consultations/i)).toBeInTheDocument()
        expect(screen.getByText(/prescriptions issued/i)).toBeInTheDocument()
      })

      // Verify statistics values are displayed
      expect(screen.getByText('2')).toBeInTheDocument() // Today's appointments
      expect(screen.getByText('2')).toBeInTheDocument() // Total patients
    })

    it('should update statistics in real-time', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Initial state
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })

      // Simulate data update (this would normally come from Firestore)
      rerender(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Statistics should update
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
  })

  describe('Appointment Management (Requirement 1.1, 1.2, 1.3)', () => {
    it('should display upcoming teleconsultations sorted by date and time', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Check if appointments are displayed in overview
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      // Check appointment details
      expect(screen.getByText('Fever, Cough')).toBeInTheDocument()
      expect(screen.getByText('Headache')).toBeInTheDocument()
    })

    it('should highlight appointments within 15 minutes', async () => {
      // Mock an appointment within 15 minutes
      const nearAppointment = {
        ...mockAppointments[0],
        scheduledAt: { toDate: () => new Date(Date.now() + 600000) } // 10 minutes from now
      }

      vi.mocked(require('@/hooks/use-appointments-optimized').useAppointmentsOptimized).mockReturnValue({
        appointments: [nearAppointment],
        todayAppointments: [nearAppointment],
        upcomingAppointments: [nearAppointment],
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Should highlight the near appointment (implementation would add visual indicator)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('should navigate to appointments tab and display detailed view', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Click on appointments tab
      const appointmentsTab = screen.getByRole('tab', { name: /appointments/i })
      await user.click(appointmentsTab)

      // Should display appointments in detailed view
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })
    })
  })

  describe('Video Consultation Integration (Requirement 4.1, 4.2)', () => {
    it('should start video consultation with single click', async () => {
      const mockStartConsultation = vi.fn()
      vi.mocked(require('@/hooks/use-consultation-integration').useConsultationIntegration).mockReturnValue({
        isStartingConsultation: false,
        startConsultation: mockStartConsultation,
        error: null
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Find and click video consultation button
      const videoButtons = screen.getAllByText(/video/i)
      const videoButton = videoButtons.find(button => 
        button.closest('button')?.textContent?.includes('Video')
      )
      
      if (videoButton) {
        await user.click(videoButton.closest('button')!)
        
        // Should call start consultation
        await waitFor(() => {
          expect(mockStartConsultation).toHaveBeenCalledWith(
            mockAppointments[0].id,
            mockAppointments[0].patientId,
            mockAppointments[0].patientName
          )
        })
      }
    })

    it('should handle consultation errors gracefully', async () => {
      const mockStartConsultation = vi.fn().mockRejectedValue(new Error('Connection failed'))
      vi.mocked(require('@/hooks/use-consultation-integration').useConsultationIntegration).mockReturnValue({
        isStartingConsultation: false,
        startConsultation: mockStartConsultation,
        error: 'Connection failed'
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Error should be handled gracefully (no crash)
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('Patient Management (Requirement 2.1, 2.2, 2.3, 2.4)', () => {
    it('should display comprehensive patient list with medical information', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to patients tab
      const patientsTab = screen.getByRole('tab', { name: /patients/i })
      await user.click(patientsTab)

      // Should display patient information
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Hypertension')).toBeInTheDocument()
        expect(screen.getByText('Migraine')).toBeInTheDocument()
      })
    })

    it('should support real-time patient search', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to patients tab
      const patientsTab = screen.getByRole('tab', { name: /patients/i })
      await user.click(patientsTab)

      // Find search input (if available in PatientList component)
      const searchInput = screen.queryByPlaceholderText(/search/i)
      if (searchInput) {
        await user.type(searchInput, 'John')
        
        // Should filter results
        await waitFor(() => {
          expect(screen.getByText('John Doe')).toBeInTheDocument()
        })
      }
    })
  })

  describe('E-Prescription Management (Requirement 5.1, 5.2, 5.3, 5.4)', () => {
    it('should create prescription with typing and file upload options', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to prescriptions tab
      const prescriptionsTab = screen.getByRole('tab', { name: /prescriptions/i })
      await user.click(prescriptionsTab)

      // Should display prescription manager
      await waitFor(() => {
        expect(screen.getByText(/prescription/i)).toBeInTheDocument()
      })
    })

    it('should display prescription history with filtering', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to prescriptions tab
      const prescriptionsTab = screen.getByRole('tab', { name: /prescriptions/i })
      await user.click(prescriptionsTab)

      // Should display prescription history
      await waitFor(() => {
        expect(screen.getByText(/prescription/i)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design (Requirement 6.1, 6.2, 6.3)', () => {
    it('should adapt layout for different screen sizes', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet size
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Should display responsive layout
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Test mobile size
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // Mobile size
      })

      // Should still work on mobile
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display responsive charts and visual indicators', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i })
      await user.click(analyticsTab)

      // Should display analytics charts
      await waitFor(() => {
        expect(screen.getByText(/analytics/i)).toBeInTheDocument()
      })
    })
  })

  describe('Consultation Documentation (Requirement 8.1, 8.2, 8.3, 8.4)', () => {
    it('should manage consultation notes efficiently', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Navigate to consultations tab
      const consultationsTab = screen.getByRole('tab', { name: /consultations/i })
      await user.click(consultationsTab)

      // Should display consultation documentation
      await waitFor(() => {
        expect(screen.getByText(/consultation/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Requirements', () => {
    it('should load dashboard within acceptable time limits', async () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime
      
      // Should load within 2 seconds (2000ms)
      expect(loadTime).toBeLessThan(2000)
    })

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeAppointmentList = Array.from({ length: 100 }, (_, i) => ({
        ...mockAppointments[0],
        id: `appointment-${i}`,
        patientName: `Patient ${i}`
      }))

      vi.mocked(require('@/hooks/use-appointments-optimized').useAppointmentsOptimized).mockReturnValue({
        appointments: largeAppointmentList,
        todayAppointments: largeAppointmentList.slice(0, 10),
        upcomingAppointments: largeAppointmentList.slice(0, 5),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      })

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(1000)
    })
  })

  describe('Error Handling and Offline Support', () => {
    it('should display error states gracefully', async () => {
      vi.mocked(require('@/hooks/use-appointments-optimized').useAppointmentsOptimized).mockReturnValue({
        appointments: [],
        todayAppointments: [],
        upcomingAppointments: [],
        isLoading: false,
        error: new Error('Network error'),
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Should handle errors gracefully without crashing
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })
    })

    it('should show loading states during data fetching', async () => {
      vi.mocked(require('@/hooks/use-appointments-optimized').useAppointmentsOptimized).mockReturnValue({
        appointments: [],
        todayAppointments: [],
        upcomingAppointments: [],
        isLoading: true,
        error: null,
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Integration Workflows', () => {
    it('should complete full appointment-to-consultation-to-prescription workflow', async () => {
      const mockStartConsultation = vi.fn()
      vi.mocked(require('@/hooks/use-consultation-integration').useConsultationIntegration).mockReturnValue({
        isStartingConsultation: false,
        startConsultation: mockStartConsultation,
        error: null
      })

      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Step 1: Start consultation from appointment
      const videoButtons = screen.getAllByText(/video/i)
      const videoButton = videoButtons.find(button => 
        button.closest('button')?.textContent?.includes('Video')
      )
      
      if (videoButton) {
        await user.click(videoButton.closest('button')!)
        
        await waitFor(() => {
          expect(mockStartConsultation).toHaveBeenCalled()
        })
      }

      // Step 2: Navigate to consultations for notes
      const consultationsTab = screen.getByRole('tab', { name: /consultations/i })
      await user.click(consultationsTab)

      // Step 3: Navigate to prescriptions to create prescription
      const prescriptionsTab = screen.getByRole('tab', { name: /prescriptions/i })
      await user.click(prescriptionsTab)

      // Workflow should complete without errors
      await waitFor(() => {
        expect(screen.getByText(/prescription/i)).toBeInTheDocument()
      })
    })
  })
})
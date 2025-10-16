/**
 * Performance benchmark tests for Doctor Dashboard
 * Tests performance metrics and validates performance requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DoctorDashboard from '@/app/dashboard/doctor/page'
import { AuthProvider } from '@/components/auth-provider'
import { performanceMonitor } from '@/lib/utils/performance-monitor'

// Mock Firebase and hooks (same as integration tests)
vi.mock('@/lib/firebase/config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-doctor-id',
      email: 'doctor@test.com'
    }
  }
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date: Date) => ({ toDate: () => date })
  }
}))

// Performance test data generators
const generateLargeDataset = (size: number) => ({
  appointments: Array.from({ length: size }, (_, i) => ({
    id: `appointment-${i}`,
    patientId: `patient-${i}`,
    patientName: `Patient ${i}`,
    doctorId: 'test-doctor-id',
    scheduledAt: { toDate: () => new Date(Date.now() + i * 3600000) },
    status: i % 3 === 0 ? 'completed' : 'scheduled',
    symptoms: [`Symptom ${i}`, `Condition ${i}`],
    patientPhone: `+123456789${i}`
  })),
  patients: Array.from({ length: size }, (_, i) => ({
    id: `patient-${i}`,
    name: `Patient ${i}`,
    age: 20 + (i % 60),
    lastVisit: `2024-01-${(i % 28) + 1}`,
    condition: `Condition ${i}`,
    phone: `+123456789${i}`
  })),
  prescriptions: Array.from({ length: size }, (_, i) => ({
    id: `prescription-${i}`,
    patientId: `patient-${i}`,
    doctorId: 'test-doctor-id',
    medications: [{ name: `Medicine ${i}`, dosage: '500mg', frequency: 'daily' }],
    createdAt: { toDate: () => new Date(Date.now() - i * 86400000) }
  })),
  consultations: Array.from({ length: size }, (_, i) => ({
    id: `consultation-${i}`,
    patientId: `patient-${i}`,
    doctorId: 'test-doctor-id',
    status: 'completed',
    startTime: { toDate: () => new Date(Date.now() - i * 3600000) },
    endTime: { toDate: () => new Date(Date.now() - i * 3600000 + 1800000) }
  }))
})

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

describe('Dashboard Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Initial Load Performance', () => {
    it('should load dashboard within 2 seconds with small dataset', async () => {
      const smallDataset = generateLargeDataset(10)
      
      // Mock hooks with small dataset
      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: () => ({
          appointments: smallDataset.appointments,
          todayAppointments: smallDataset.appointments.slice(0, 5),
          upcomingAppointments: smallDataset.appointments.slice(0, 3),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          updateAppointmentStatus: vi.fn(),
          isUpdatingStatus: false
        })
      }))

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(2000) // 2 seconds
    })

    it('should load dashboard within 3 seconds with medium dataset', async () => {
      const mediumDataset = generateLargeDataset(100)
      
      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: () => ({
          appointments: mediumDataset.appointments,
          todayAppointments: mediumDataset.appointments.slice(0, 20),
          upcomingAppointments: mediumDataset.appointments.slice(0, 10),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          updateAppointmentStatus: vi.fn(),
          isUpdatingStatus: false
        })
      }))

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(3000) // 3 seconds
    })

    it('should handle large dataset efficiently', async () => {
      const largeDataset = generateLargeDataset(1000)
      
      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: () => ({
          appointments: largeDataset.appointments,
          todayAppointments: largeDataset.appointments.slice(0, 50),
          upcomingAppointments: largeDataset.appointments.slice(0, 20),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          updateAppointmentStatus: vi.fn(),
          isUpdatingStatus: false
        })
      }))

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime
      expect(loadTime).toBeLessThan(5000) // 5 seconds for large dataset
    })
  })

  describe('Component Render Performance', () => {
    it('should render statistics cards within 100ms', async () => {
      const dataset = generateLargeDataset(50)
      
      vi.doMock('@/hooks/use-dashboard-statistics-optimized', () => ({
        useDashboardStatisticsOptimized: () => ({
          statistics: {
            todayAppointments: 10,
            totalPatients: 50,
            completedConsultations: 8,
            prescriptionsIssued: 5,
            averageConsultationTime: 25,
            patientSatisfactionScore: 4.5,
            upcomingAppointments: 5,
            cancelledAppointments: 1,
            noShowAppointments: 0
          },
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          isAutoRefreshing: true,
          refresh: vi.fn()
        })
      }))

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/today's appointments/i)).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(100) // 100ms for statistics cards
    })

    it('should render appointment list within 200ms', async () => {
      const dataset = generateLargeDataset(20)
      
      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: () => ({
          appointments: dataset.appointments,
          todayAppointments: dataset.appointments.slice(0, 10),
          upcomingAppointments: dataset.appointments.slice(0, 5),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          updateAppointmentStatus: vi.fn(),
          isUpdatingStatus: false
        })
      }))

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
      expect(renderTime).toBeLessThan(200) // 200ms for appointment list
    })
  })

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage with large datasets', async () => {
      const largeDataset = generateLargeDataset(500)
      
      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: () => ({
          appointments: largeDataset.appointments,
          todayAppointments: largeDataset.appointments.slice(0, 25),
          upcomingAppointments: largeDataset.appointments.slice(0, 10),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          updateAppointmentStatus: vi.fn(),
          isUpdatingStatus: false
        })
      }))

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Interaction Performance', () => {
    it('should respond to tab switching within 50ms', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /appointments/i })).toBeInTheDocument()
      })

      const appointmentsTab = screen.getByRole('tab', { name: /appointments/i })
      
      const startTime = performance.now()
      appointmentsTab.click()
      
      await waitFor(() => {
        expect(appointmentsTab).toHaveAttribute('aria-selected', 'true')
      })

      const interactionTime = performance.now() - startTime
      expect(interactionTime).toBeLessThan(50) // 50ms for tab switching
    })

    it('should handle rapid tab switching efficiently', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      const tabs = [
        screen.getByRole('tab', { name: /overview/i }),
        screen.getByRole('tab', { name: /appointments/i }),
        screen.getByRole('tab', { name: /patients/i }),
        screen.getByRole('tab', { name: /prescriptions/i }),
        screen.getByRole('tab', { name: /consultations/i }),
        screen.getByRole('tab', { name: /analytics/i })
      ]

      const startTime = performance.now()

      // Rapidly switch between tabs
      for (let i = 0; i < 3; i++) {
        for (const tab of tabs) {
          tab.click()
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      const totalTime = performance.now() - startTime
      expect(totalTime).toBeLessThan(1000) // 1 second for rapid switching
    })
  })

  describe('Data Update Performance', () => {
    it('should handle real-time data updates efficiently', async () => {
      let dataset = generateLargeDataset(20)
      
      const mockHook = vi.fn(() => ({
        appointments: dataset.appointments,
        todayAppointments: dataset.appointments.slice(0, 10),
        upcomingAppointments: dataset.appointments.slice(0, 5),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      }))

      vi.doMock('@/hooks/use-appointments-optimized', () => ({
        useAppointmentsOptimized: mockHook
      }))

      const { rerender } = render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      // Simulate data update
      dataset = generateLargeDataset(25)
      mockHook.mockReturnValue({
        appointments: dataset.appointments,
        todayAppointments: dataset.appointments.slice(0, 12),
        upcomingAppointments: dataset.appointments.slice(0, 6),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        updateAppointmentStatus: vi.fn(),
        isUpdatingStatus: false
      })

      const startTime = performance.now()
      
      rerender(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Patient 0')).toBeInTheDocument()
      })

      const updateTime = performance.now() - startTime
      expect(updateTime).toBeLessThan(100) // 100ms for data updates
    })
  })

  describe('Lazy Loading Performance', () => {
    it('should load heavy components on demand', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      // Initially, heavy components should not be loaded
      expect(screen.queryByText(/analytics/i)).not.toBeInTheDocument()

      // Navigate to analytics tab to trigger lazy loading
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i })
      
      const startTime = performance.now()
      analyticsTab.click()

      await waitFor(() => {
        expect(screen.getByText(/analytics/i)).toBeInTheDocument()
      })

      const lazyLoadTime = performance.now() - startTime
      expect(lazyLoadTime).toBeLessThan(500) // 500ms for lazy loading
    })
  })

  describe('Performance Monitoring', () => {
    it('should track component performance metrics', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })

      // Check if performance metrics are being tracked
      const metrics = performanceMonitor.getAllMetrics()
      expect(metrics.length).toBeGreaterThan(0)

      // Check if dashboard component is being monitored
      const dashboardMetrics = performanceMonitor.getMetrics('DoctorDashboard')
      expect(dashboardMetrics).toBeDefined()
      expect(dashboardMetrics?.renderTime).toBeGreaterThan(0)
    })

    it('should generate performance summary', async () => {
      render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })

      const summary = performanceMonitor.getSummary()
      expect(summary).toBeDefined()
      expect(summary?.totalComponents).toBeGreaterThan(0)
      expect(summary?.avgRenderTime).toBeGreaterThan(0)
      expect(summary?.slowestComponent).toBeDefined()
    })
  })

  describe('Caching Performance', () => {
    it('should benefit from React Query caching', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
      })

      // First render time
      const firstRenderStart = performance.now()
      rerender(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )
      const firstRenderTime = performance.now() - firstRenderStart

      // Second render should be faster due to caching
      const secondRenderStart = performance.now()
      rerender(
        <TestWrapper>
          <DoctorDashboard />
        </TestWrapper>
      )
      const secondRenderTime = performance.now() - secondRenderStart

      // Second render should be significantly faster
      expect(secondRenderTime).toBeLessThan(firstRenderTime * 0.5)
    })
  })
})
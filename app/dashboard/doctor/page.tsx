"use client"

import type React from "react"

import { useState, lazy, Suspense } from "react"
import { useAuth } from "@/components/auth-provider"
import { 
  DashboardErrorBoundary, 
  OfflineIndicator,
  StatisticsCards, 
  AppointmentsDisplay, 
  PatientList 
} from "@/components/dashboard"
import { useConsultationIntegration } from "@/hooks/use-consultation-integration"
import { useAppointmentsOptimized } from "@/hooks/use-appointments-optimized"
import { useDashboardStatisticsOptimized } from "@/hooks/use-dashboard-statistics-optimized"
import { usePatients } from "@/hooks/use-patients"
import { usePrescriptions } from "@/hooks/use-prescriptions"
import { useConsultations } from "@/hooks/use-consultations"
import { useAnalyticsData } from "@/hooks/use-analytics-data"
import { usePerformanceMonitor, usePerformanceAlerts } from "@/lib/utils/performance-monitor"
import { useMemoizedProps, usePerformanceMemo } from "@/lib/utils/memoization"

// Lazy load heavy components for better performance
const AnalyticsCharts = lazy(() => import("@/components/dashboard/analytics-charts").then(m => ({ default: m.AnalyticsCharts })))
const PrescriptionManager = lazy(() => import("@/components/dashboard").then(m => ({ default: m.PrescriptionManager })))
const ConsultationDocumentation = lazy(() => import("@/components/dashboard").then(m => ({ default: m.ConsultationDocumentation })))
const VideoConsultation = lazy(() => import("@/components/video-consultation"))
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TouchButton, PullToRefresh, SwipeableCard, MobileDialog, TouchInput } from "@/components/ui/mobile-optimized"
import {
  Calendar,
  Clock,
  FileText,
  Heart,
  Phone,
  Stethoscope,
  Upload,
  User,
  Video,
  Users,
  Activity,
} from "lucide-react"

// Mock data
const mockAppointments = [
  {
    id: "1",
    patientName: "John Doe",
    patientId: "P001",
    age: 35,
    date: "2024-01-15",
    time: "10:00 AM",
    status: "confirmed",
    type: "consultation",
    symptoms: "Fever, cough",
  },
  {
    id: "2",
    patientName: "Mary Smith",
    patientId: "P002",
    age: 42,
    date: "2024-01-15",
    time: "11:30 AM",
    status: "pending",
    type: "follow-up",
    symptoms: "Hypertension check",
  },
  {
    id: "3",
    patientName: "Robert Johnson",
    patientId: "P003",
    age: 28,
    date: "2024-01-15",
    time: "2:00 PM",
    status: "completed",
    type: "consultation",
    symptoms: "Headache, fatigue",
  },
]

const mockPatients = [
  {
    id: "P001",
    name: "John Doe",
    age: 35,
    lastVisit: "2024-01-10",
    condition: "Hypertension",
    phone: "+1234567890",
  },
  {
    id: "P002",
    name: "Mary Smith",
    age: 42,
    lastVisit: "2024-01-08",
    condition: "Diabetes",
    phone: "+1234567891",
  },
  {
    id: "P003",
    name: "Robert Johnson",
    age: 28,
    lastVisit: "2024-01-12",
    condition: "Migraine",
    phone: "+1234567892",
  },
]

// Loading component for lazy-loaded components
const ComponentLoader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
)

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [prescriptionText, setPrescriptionText] = useState("")
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [consultationNotes, setConsultationNotes] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeConsultationId, setActiveConsultationId] = useState<string>("")

  // Performance monitoring
  usePerformanceMonitor('DoctorDashboard')
  usePerformanceAlerts({
    renderTime: 100, // Alert if render takes more than 100ms
    memoryUsage: 50 * 1024 * 1024 // Alert if memory usage exceeds 50MB
  })

  // Real-time data hooks with React Query optimization
  const { 
    appointments, 
    isLoading: isLoadingAppointments, 
    error: appointmentsError,
    todayAppointments,
    upcomingAppointments,
    updateAppointmentStatus,
    isUpdatingStatus
  } = useAppointmentsOptimized({ 
    doctorId: user?.uid || '',
    autoRefresh: true 
  })

  const {
    patients,
    isLoading: isLoadingPatients,
    error: patientsError
  } = usePatients({
    autoRefresh: true
  })

  const {
    prescriptions,
    isLoading: isLoadingPrescriptions,
    error: prescriptionsError
  } = usePrescriptions({
    doctorId: user?.uid || 'default-doctor-id',
    autoRefresh: true
  })

  const {
    consultations,
    isLoading: isLoadingConsultations,
    error: consultationsError
  } = useConsultations({
    doctorId: user?.uid || 'default-doctor-id',
    autoRefresh: true
  })

  const { 
    statistics, 
    isLoading: isLoadingStatistics, 
    error: statisticsError,
    lastUpdated,
    isAutoRefreshing
  } = useDashboardStatisticsOptimized({ 
    doctorId: user?.uid || 'default-doctor-id',
    appointments,
    consultations,
    prescriptions,
    totalPatients: patients.length,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  })

  const {
    analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useAnalyticsData({
    appointments,
    patients,
    prescriptions,
    consultations
  })

  // Consultation integration
  const {
    isStartingConsultation,
    startConsultation,
    error: consultationError
  } = useConsultationIntegration({
    doctorId: user?.uid || '',
    onError: (error) => {
      console.error('Consultation error:', error)
      // You could show a toast notification here
    },
    onSuccess: (message) => {
      console.log('Consultation success:', message)
      // You could show a success toast here
    }
  })

  // Memoize expensive computations
  const completedAppointments = usePerformanceMemo(
    () => todayAppointments.filter((apt) => apt.status === "completed"),
    [todayAppointments],
    'completedAppointments'
  )

  // Memoize patient data for prescription manager
  const memoizedPatients = usePerformanceMemo(
    () => patients.map(p => ({ id: p.id, name: p.name })),
    [patients],
    'patientsList'
  )

  // Handlers
  const handleStartConsultation = async (appointmentId: string, patientId: string, patientName?: string) => {
    try {
      await startConsultation(appointmentId, patientId, patientName)
    } catch (error) {
      console.error('Failed to start consultation:', error)
    }
  }

  const handleCallPatient = (appointmentId: string, phone: string) => {
    // Open phone dialer or integrate with calling service
    window.open(`tel:${phone}`)
  }

  const handlePrescriptionUpload = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement prescription upload to Firebase Storage
    console.log("Uploading prescription:", { selectedPatient, prescriptionText, prescriptionFile })
    // Reset form
    setSelectedPatient("")
    setPrescriptionText("")
    setPrescriptionFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0])
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // In a real app, you would trigger data refetch here
      console.log('Dashboard refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <DashboardErrorBoundary context="dashboard">
      <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        {/* Mobile-first responsive container */}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Offline indicator banner */}
        <OfflineIndicator variant="banner" className="mb-4" />

        {/* Responsive header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Good morning, {user?.email?.split('@')[0] || 'Doctor'}
            </h2>
            <OfflineIndicator variant="compact" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            You have {upcomingAppointments.length} appointments scheduled for today
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          {/* Responsive tab navigation */}
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full min-w-fit grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
              <TabsTrigger 
                value="overview" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Appointments</span>
                <span className="sm:hidden">Appts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="patients" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                Patients
              </TabsTrigger>
              <TabsTrigger 
                value="prescriptions" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Prescriptions</span>
                <span className="sm:hidden">Rx</span>
              </TabsTrigger>
              <TabsTrigger 
                value="consultations" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Consultations</span>
                <span className="sm:hidden">Consult</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5 whitespace-nowrap"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Responsive statistics header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Dashboard Statistics</h3>
                {lastUpdated && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                    {isAutoRefreshing && (
                      <span className="ml-2 inline-flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                        <span className="hidden sm:inline">Auto-refreshing</span>
                        <span className="sm:hidden">Live</span>
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            <StatisticsCards 
              statistics={statistics}
              isLoading={isLoadingStatistics}
              error={statisticsError?.message}
            />

            {/* Responsive grid layout: 1 col mobile, 2 cols tablet+ */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card className="h-fit">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Next Appointments</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Upcoming consultations for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <SwipeableCard
                      key={appointment.id}
                      onSwipeLeft={() => console.log('Swiped left on appointment:', appointment.id)}
                      onSwipeRight={() => console.log('Swiped right on appointment:', appointment.id)}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{appointment.patientName || 'Unknown Patient'}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {appointment.symptoms.join(', ') || 'No symptoms listed'}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                          {appointment.scheduledAt.toDate().toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                      <div className="flex space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                        <TouchButton 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStartConsultation(
                            appointment.id, 
                            appointment.patientId, 
                            appointment.patientName
                          )}
                          disabled={isStartingConsultation}
                          className="flex-1 sm:flex-none"
                        >
                          <Video className="h-4 w-4 sm:mr-0 lg:mr-2" />
                          <span className="sm:hidden lg:inline ml-2">Video</span>
                        </TouchButton>
                        {appointment.patientPhone && (
                          <TouchButton 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCallPatient(appointment.id, appointment.patientPhone!)}
                            className="flex-1 sm:flex-none"
                          >
                            <Phone className="h-4 w-4 sm:mr-0 lg:mr-2" />
                            <span className="sm:hidden lg:inline ml-2">Call</span>
                          </TouchButton>
                        )}
                      </div>
                    </SwipeableCard>
                  ))}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Common tasks and tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <TouchButton className="w-full justify-start bg-transparent text-sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                        Create Prescription
                      </TouchButton>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md mx-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Create Prescription</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">Upload or write a prescription for a patient</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePrescriptionUpload} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient" className="text-sm">Select Patient</Label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Choose a patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockPatients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id} className="text-sm">
                                  {patient.name} (ID: {patient.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prescription" className="text-sm">Prescription Details</Label>
                          <Textarea
                            id="prescription"
                            placeholder="Enter prescription details..."
                            value={prescriptionText}
                            onChange={(e) => setPrescriptionText(e.target.value)}
                            rows={4}
                            className="text-sm resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="file" className="text-sm">Upload Prescription File (Optional)</Label>
                          <Input 
                            id="file" 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            onChange={handleFileChange}
                            className="text-sm"
                          />
                        </div>

                        <Button type="submit" className="w-full text-sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Create Prescription
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <TouchButton className="w-full justify-start bg-transparent text-sm" variant="outline">
                    <Video className="h-4 w-4 mr-2 flex-shrink-0" />
                    Start Video Consultation
                  </TouchButton>
                  <TouchButton className="w-full justify-start bg-transparent text-sm" variant="outline">
                    <Activity className="h-4 w-4 mr-2 flex-shrink-0" />
                    View Patient Records
                  </TouchButton>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <AppointmentsDisplay
              appointments={appointments}
              isLoading={isLoadingAppointments}
              error={appointmentsError?.message}
              onStartConsultation={handleStartConsultation}
              onCallPatient={handleCallPatient}
              isStartingConsultation={isStartingConsultation}
            />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <PatientList
              onPatientSelect={(patient) => {
                console.log('Selected patient:', patient)
                // Handle patient selection
              }}
              onStartConsultation={handleStartConsultation}
              onCallPatient={(phone, patientName) => {
                console.log('Calling patient:', patientName, phone)
                window.open(`tel:${phone}`)
              }}
            />
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader>Loading Prescription Manager...</ComponentLoader>}>
              <PrescriptionManager
                doctorId={user?.uid || 'default-doctor-id'}
                patients={memoizedPatients}
                onPrescriptionCreated={(prescriptionId) => {
                  console.log('Prescription created:', prescriptionId)
                  // Optionally refresh prescriptions data
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ComponentLoader>Loading Consultation Documentation...</ComponentLoader>}>
              <ConsultationDocumentation
                doctorId={user?.uid || 'default-doctor-id'}
                activeConsultationId={activeConsultationId}
                onConsultationSelect={(consultation) => {
                  setActiveConsultationId(consultation.id)
                  console.log('Selected consultation:', consultation)
                }}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Practice Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Insights and trends from your practice data
                </p>
              </div>
              {lastUpdated && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Data as of: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            <Suspense fallback={<ComponentLoader>Loading Analytics...</ComponentLoader>}>
              <AnalyticsCharts
                data={analyticsData}
                isLoading={isLoadingAnalytics}
                error={analyticsError}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
        </div>
      </PullToRefresh>
    </div>
    </DashboardErrorBoundary>
  )
}

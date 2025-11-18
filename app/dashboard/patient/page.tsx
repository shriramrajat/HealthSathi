"use client"

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AppointmentBookingWithSuspense,
  PrescriptionDisplayWithSuspense,
  PharmacyFinderWithSuspense,
  AISymptomCheckerWithSuspense
} from "@/components/lazy/lazy-dashboard-components"
import SymptomHistory from "@/components/symptom-history"
import { SkipLink, useAnnouncement } from "@/components/accessibility/accessibility-provider"
import { useDashboardPerformance } from "@/hooks/use-performance-monitor"
import {
  Calendar,
  FileText,
  Heart,
  MapPin,
  Stethoscope,
  Thermometer,
  Video,
  QrCode,
  Clock,
  Plus,
  WifiOff,
  RefreshCw
} from "lucide-react"
import type { Appointment } from "@/lib/types/healthcare-models"
import { useRealTimeAppointments, useRealTimePrescriptions, useNetworkStatus } from "@/hooks/use-real-time-sync"
import { SyncStatusIndicator } from "@/components/providers/real-time-sync-provider"
import { useTranslations } from "next-intl"

export default function PatientDashboard() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const t = useTranslations('dashboard.patient')
  const tCommon = useTranslations('common')
  
  // Dashboard section navigation
  const dashboardSections = [
    {
      id: "symptoms",
      title: t('sections.checkSymptoms'),
      description: t('sections.checkSymptomsDesc'),
      icon: Thermometer,
      color: "bg-red-50 text-red-600 border-red-200",
    },
    {
      id: "appointments",
      title: t('sections.bookAppointment'),
      description: t('sections.bookAppointmentDesc'),
      icon: Calendar,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      id: "prescriptions",
      title: t('sections.myPrescriptions'),
      description: t('sections.myPrescriptionsDesc'),
      icon: FileText,
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      id: "pharmacy",
      title: t('sections.nearbyPharmacies'),
      description: t('sections.nearbyPharmaciesDesc'),
      icon: MapPin,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ]
  
  // Performance monitoring
  const {
    dashboardMetrics,
    trackSectionLoad,
    setTotalSections,
    markCriticalDataLoaded,
    getHealthcarePerformanceStatus
  } = useDashboardPerformance('patient')
  
  // Accessibility announcements
  const { announce } = useAnnouncement()

  // Initialize dashboard sections count
  useEffect(() => {
    setTotalSections(4) // symptoms, appointments, prescriptions, pharmacy
  }, [setTotalSections])

  // Real-time data hooks
  const { 
    appointments, 
    loading: isLoadingAppointments, 
    lastUpdate: appointmentsLastUpdate,
    refresh: refreshAppointments
  } = useRealTimeAppointments(
    user?.uid ? { patientId: user.uid } : {}
  )
  
  const { 
    prescriptions,
    lastUpdate: prescriptionsLastUpdate
  } = useRealTimePrescriptions(
    user?.uid ? { patientId: user.uid, status: 'issued' } : {}
  )

  const { isOnline } = useNetworkStatus()

  // Calculate prescription count from real-time data
  const prescriptionCount = prescriptions.length

  const handleBookingComplete = () => {
    // Real-time sync will automatically update the appointments list
    setShowBookingForm(false)
    setActiveSection(null)
    announce(t('accessibility.appointmentBooked'), 'polite')
  }

  // Handle section activation with accessibility
  const handleSectionActivation = (sectionId: string) => {
    const newActiveSection = activeSection === sectionId ? null : sectionId
    setActiveSection(newActiveSection)
    
    if (newActiveSection) {
      const sectionTitle = dashboardSections.find(s => s.id === sectionId)?.title
      announce(`${sectionTitle} ${t('accessibility.sectionOpened')}`, 'polite')
      trackSectionLoad(sectionId, true)
    } else {
      announce(t('accessibility.sectionClosed'), 'polite')
    }
  }

  // Get next upcoming appointment
  const nextAppointment = appointments.find(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  )

  // Format date for display
  const formatAppointmentDate = (appointment: Appointment) => {
    const date = appointment.scheduledAt.toDate()
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">{t('skipLinks.mainContent')}</SkipLink>
      <SkipLink href="#quick-actions">{t('skipLinks.quickActions')}</SkipLink>
      <SkipLink href="#dashboard-sections">{t('skipLinks.dashboardSections')}</SkipLink>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" id="main-content">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('welcome')}, {user?.name?.split(' ')[0] || t('title')}
            </h1>
            <p className="text-muted-foreground">
              {t('welcomeMessage')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SyncStatusIndicator />
            {!isOnline && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                {t('offlineMode')}
              </Badge>
            )}
            {(appointmentsLastUpdate || prescriptionsLastUpdate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAppointments}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {tCommon('buttons.refresh')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.nextAppointment')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <>
                <div className="text-2xl font-bold">
                  {formatAppointmentDate(nextAppointment).date}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextAppointment.doctorName} {t('stats.at')} {formatAppointmentDate(nextAppointment).time}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{t('stats.none')}</div>
                <p className="text-xs text-muted-foreground">{t('stats.noUpcoming')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activePrescriptions')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptionCount}</div>
            <p className="text-xs text-muted-foreground">{t('stats.currentMedications')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.healthScore')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('stats.good')}</div>
            <p className="text-xs text-muted-foreground">{t('stats.basedOnCheckups')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.qrId')}</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono">{user?.qrId || 'QR-DEMO123'}</div>
            <p className="text-xs text-muted-foreground">{t('stats.yourIdentifier')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8" id="dashboard-sections" role="region" aria-label={t('accessibility.dashboardSections')}>
        {dashboardSections.map((section) => {
          const IconComponent = section.icon
          return (
            <Card 
              key={section.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                activeSection === section.id ? section.color : 'hover:border-primary/20'
              }`}
              onClick={() => handleSectionActivation(section.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSectionActivation(section.id)
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={activeSection === section.id}
              aria-describedby={`${section.id}-description`}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription className="text-sm" id={`${section.id}-description`}>
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSection(section.id)
                  }}
                >
                  {activeSection === section.id ? t('sections.close') : t('sections.open')} {section.title}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Section Content */}
      {activeSection && (
        <div className="mb-8">
          {activeSection === 'appointments' ? (
            <div className="space-y-6">
              {/* Appointment Booking Form */}
              {showBookingForm && (
                <AppointmentBookingWithSuspense 
                  onBookingComplete={handleBookingComplete}
                  onClose={() => setShowBookingForm(false)}
                />
              )}
              
              {/* Appointments List */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{t('appointmentsList.title')}</CardTitle>
                      <CardDescription>
                        {t('appointmentsList.description')}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowBookingForm(!showBookingForm)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('appointmentsList.bookNew')}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingAppointments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">{t('appointmentsList.loading')}</p>
                    </div>
                  ) : appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments.map((appointment) => {
                        const { date, time } = formatAppointmentDate(appointment)
                        return (
                          <Card key={appointment.id} className="border-l-4 border-l-primary">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold">{appointment.doctorName}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {appointment.type?.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {date}
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {time}
                                    </div>
                                  </div>
                                  {appointment.symptoms && appointment.symptoms.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {appointment.symptoms.slice(0, 3).map((symptom) => (
                                        <Badge key={symptom} variant="secondary" className="text-xs">
                                          {symptom.replace('_', ' ')}
                                        </Badge>
                                      ))}
                                      {appointment.symptoms.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{appointment.symptoms.length - 3} {t('appointmentsList.more')}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      appointment.status === 'confirmed' ? 'default' :
                                      appointment.status === 'scheduled' ? 'secondary' :
                                      appointment.status === 'completed' ? 'outline' : 'destructive'
                                    }
                                  >
                                    {appointment.status}
                                  </Badge>
                                  {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                                    <Button size="sm" variant="outline">
                                      <Video className="h-4 w-4 mr-2" />
                                      {t('appointmentsList.joinCall')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">{t('appointmentsList.noAppointments')}</p>
                      <p className="text-sm mb-4">{t('appointmentsList.noAppointmentsDesc')}</p>
                      <Button onClick={() => setShowBookingForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('bookAppointment')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeSection === 'prescriptions' ? (
            <PrescriptionDisplayWithSuspense onClose={() => setActiveSection(null)} />
          ) : activeSection === 'pharmacy' ? (
            <PharmacyFinderWithSuspense onClose={() => setActiveSection(null)} />
          ) : activeSection === 'symptoms' ? (
            <AISymptomCheckerWithSuspense
              patientId={user?.uid || ''}
              onComplete={(result) => {
                console.log('Symptom check completed:', result)
                announce(t('accessibility.symptomCheckCompleted'), 'polite')
                setActiveSection(null)
              }}
              onCancel={() => setActiveSection(null)}
              mode="full"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {dashboardSections.find(s => s.id === activeSection)?.title}
                </CardTitle>
                <CardDescription>
                  {t('sections.comingSoonDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">
                    {dashboardSections.find(s => s.id === activeSection)?.icon && (
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        {(() => {
                          const IconComponent = dashboardSections.find(s => s.id === activeSection)?.icon!
                          return <IconComponent className="h-8 w-8" />
                        })()}
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">{t('sections.comingSoon')}</p>
                  <p className="text-sm">
                    {t('sections.comingSoonDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2" id="quick-actions" role="region" aria-label={t('accessibility.quickActionsRegion')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActionsSection.title')}</CardTitle>
            <CardDescription>{t('quickActionsSection.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setActiveSection('appointments')}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              {t('quickActionsSection.bookAppointment')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Video className="h-4 w-4 mr-2" />
              {t('quickActionsSection.startVideo')}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setActiveSection('symptoms')}
            >
              <Thermometer className="h-4 w-4 mr-2" />
              {t('quickActionsSection.checkSymptoms')}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setActiveSection('prescriptions')}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('quickActionsSection.viewPrescriptions')}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => setActiveSection('pharmacy')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t('quickActionsSection.findPharmacies')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('symptomHistory.title')}</CardTitle>
            <CardDescription>{t('symptomHistory.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SymptomHistory
              patientId={user?.uid || ''}
              showTrends={false}
              showFilters={false}
              maxResults={5}
              onResultClick={(result) => {
                console.log('Clicked symptom result:', result)
                // Could open a detailed view modal here
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}

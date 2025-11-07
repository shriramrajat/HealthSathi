"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkipLink, useAnnouncement } from "@/components/accessibility/accessibility-provider"
import { useDashboardPerformance } from "@/hooks/use-performance-monitor"
import {
  UserPlus,
  QrCode,
  AlertTriangle,
  Video,
  MapPin,
  Users,
  Clock,
  Activity,
  FileText,
  Calendar
} from "lucide-react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CHWLog, EmergencyLog, Patient } from "@/lib/types/healthcare-models"
import { 
  PatientRegistrationWithSuspense,
  QRScannerWithSuspense,
  EmergencyLoggerWithSuspense
} from "@/components/lazy/lazy-dashboard-components"
import { useTranslations } from "next-intl"

export default function CHWDashboard() {
  const { user } = useAuth()
  const t = useTranslations('dashboard.chw')
  const tCommon = useTranslations('common')
  
  // Dashboard section navigation for CHW quick actions
  const quickActions = [
    {
      id: "register",
      title: t('quickActions.registerPatient'),
      description: t('quickActions.registerPatientDesc'),
      icon: UserPlus,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      priority: "high",
    },
    {
      id: "scan",
      title: t('quickActions.scanQR'),
      description: t('quickActions.scanQRDesc'),
      icon: QrCode,
      color: "bg-green-50 text-green-600 border-green-200",
      priority: "high",
    },
    {
      id: "emergency",
      title: t('quickActions.emergencyAlert'),
      description: t('quickActions.emergencyAlertDesc'),
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600 border-red-200",
      priority: "critical",
    },
    {
      id: "consultation",
      title: t('quickActions.bookTeleconsultation'),
      description: t('quickActions.bookTeleconsultationDesc'),
      icon: Video,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      priority: "medium",
    },
  ]

  // Secondary actions for CHW workflow
  const secondaryActions = [
    {
      id: "patients",
      title: t('secondaryActions.myPatients'),
      description: t('secondaryActions.myPatientsDesc'),
      icon: Users,
      action: "view_patients",
    },
    {
      id: "logs",
      title: t('secondaryActions.activityLogs'),
      description: t('secondaryActions.activityLogsDesc'),
      icon: FileText,
      action: "view_logs",
    },
    {
      id: "location",
      title: t('secondaryActions.updateLocation'),
      description: t('secondaryActions.updateLocationDesc'),
      icon: MapPin,
      action: "update_location",
    },
    {
      id: "schedule",
      title: t('secondaryActions.todaySchedule'),
      description: t('secondaryActions.todayScheduleDesc'),
      icon: Calendar,
      action: "view_schedule",
    },
  ]
  const [activeSection, setActiveSection] = useState<string | null>(null)
  
  // Performance monitoring
  const {
    dashboardMetrics,
    trackSectionLoad,
    setTotalSections,
    markCriticalDataLoaded
  } = useDashboardPerformance('chw')
  
  // Accessibility announcements
  const { announce } = useAnnouncement()

  // Initialize dashboard sections count
  useEffect(() => {
    setTotalSections(4) // register, scan, emergency, consultation
  }, [setTotalSections])
  const [recentLogs, setRecentLogs] = useState<CHWLog[]>([])
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLog[]>([])
  const [registeredPatients, setRegisteredPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    patientsRegisteredToday: 0,
    emergencyLogsToday: 0,
    qrScansToday: 0,
    followUpsRequired: 0,
    totalPatients: 0,
  })

  // Mock CHW ID - in real implementation, this would come from user auth
  const chwId = (user as any)?.chwId || user?.uid || "chw-demo-001"

  // Fetch CHW dashboard data
  useEffect(() => {
    const fetchCHWData = async () => {
      if (!chwId) return
      
      setIsLoading(true)
      try {
        // Fetch recent CHW logs
        const logsQuery = query(
          collection(db, 'chw-logs'),
          where('chwId', '==', chwId),
          orderBy('timestamp', 'desc'),
          limit(10)
        )
        
        const logsSnapshot = await getDocs(logsQuery)
        const logsList: CHWLog[] = []
        
        logsSnapshot.forEach((doc) => {
          logsList.push({
            id: doc.id,
            ...doc.data()
          } as CHWLog)
        })
        
        setRecentLogs(logsList)

        // Fetch emergency logs
        const emergencyQuery = query(
          collection(db, 'emergency-logs'),
          where('chwId', '==', chwId),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        
        const emergencySnapshot = await getDocs(emergencyQuery)
        const emergencyList: EmergencyLog[] = []
        
        emergencySnapshot.forEach((doc) => {
          emergencyList.push({
            id: doc.id,
            ...doc.data()
          } as EmergencyLog)
        })
        
        setEmergencyLogs(emergencyList)

        // Fetch patients registered by this CHW
        const patientsQuery = query(
          collection(db, 'patients'),
          where('registeredBy', '==', chwId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        
        const patientsSnapshot = await getDocs(patientsQuery)
        const patientsList: Patient[] = []
        
        patientsSnapshot.forEach((doc) => {
          patientsList.push({
            id: doc.id,
            ...doc.data()
          } as Patient)
        })
        
        setRegisteredPatients(patientsList)

        // Calculate today's stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const patientsToday = logsList.filter(log => 
          log.action === 'registration' && 
          log.createdAt.toDate() >= today
        ).length

        const emergenciesToday = emergencyList.filter(log => 
          log.createdAt.toDate() >= today
        ).length

        const qrScansToday = logsList.filter(log => 
          log.action === 'qr_scan' && 
          log.createdAt.toDate() >= today
        ).length

        const followUpsRequired = logsList.filter(log => 
          log.followUpRequired === true
        ).length

        setStats({
          patientsRegisteredToday: patientsToday,
          emergencyLogsToday: emergenciesToday,
          qrScansToday: qrScansToday,
          followUpsRequired: followUpsRequired,
          totalPatients: patientsList.length,
        })
        
      } catch (error) {
        console.error('Error fetching CHW data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCHWData()
  }, [chwId])

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  // Get action badge color
  const getActionColor = (action: string) => {
    switch (action) {
      case 'emergency': return 'destructive'
      case 'registration': return 'default'
      case 'consultation': return 'secondary'
      case 'qr_scan': return 'outline'
      default: return 'secondary'
    }
  }

  // Handle quick action clicks
  const handleQuickAction = (actionId: string) => {
    setActiveSection(actionId)
    const actionTitle = quickActions.find(a => a.id === actionId)?.title
    announce(`${actionTitle} opened`, 'polite')
    trackSectionLoad(actionId, true)
    console.log(`CHW Action: ${actionId}`)
  }

  // Handle patient registration completion
  const handleRegistrationComplete = (newPatient: Patient) => {
    // Add the new patient to the registered patients list
    setRegisteredPatients(prev => [newPatient, ...prev])
    
    // Update stats
    setStats(prev => ({
      ...prev,
      patientsRegisteredToday: prev.patientsRegisteredToday + 1,
      totalPatients: prev.totalPatients + 1,
    }))
    
    // Close the registration form
    setActiveSection(null)
  }

  // Handle QR scan completion
  const handleQRScanComplete = (patient: Patient | null) => {
    if (patient) {
      // Update QR scan stats
      setStats(prev => ({
        ...prev,
        qrScansToday: prev.qrScansToday + 1,
      }))
      
      console.log('QR Scan completed for patient:', patient.name)
      // In a real implementation, this might navigate to patient records
      // or open a patient details modal
    }
    
    // Close the scanner
    setActiveSection(null)
  }

  // Handle emergency log completion
  const handleEmergencyLogComplete = (emergencyLog: EmergencyLog) => {
    // Add the new emergency log to the list
    setEmergencyLogs(prev => [emergencyLog, ...prev])
    
    // Update stats
    setStats(prev => ({
      ...prev,
      emergencyLogsToday: prev.emergencyLogsToday + 1,
      followUpsRequired: emergencyLog.severity === 'critical' || emergencyLog.severity === 'high' 
        ? prev.followUpsRequired + 1 
        : prev.followUpsRequired,
    }))
    
    console.log('Emergency logged:', emergencyLog.severity, emergencyLog.description)
    
    // Close the emergency logger
    setActiveSection(null)
  }

  // Handle secondary action clicks
  const handleSecondaryAction = (actionType: string) => {
    console.log(`CHW Secondary Action: ${actionType}`)
    // These will be implemented in future tasks or as separate features
  }

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#chw-stats">Skip to CHW statistics</SkipLink>
      <SkipLink href="#quick-actions">Skip to quick actions</SkipLink>
      <SkipLink href="#recent-activity">Skip to recent activity</SkipLink>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" id="main-content">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          CHW Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'Community Health Worker'}. 
          Manage patient care and community health services.
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8" id="chw-stats" role="region" aria-label="CHW statistics overview">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.patientsRegisteredToday}</div>
            <p className="text-xs text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.qrScansToday}</div>
            <p className="text-xs text-muted-foreground">Records accessed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.emergencyLogsToday}</div>
            <p className="text-xs text-muted-foreground">Alerts logged today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.followUpsRequired}</div>
            <p className="text-xs text-muted-foreground">Pending actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Primary CHW Functions */}
      <div className="mb-8" id="quick-actions" role="region" aria-label="Quick actions for CHW tasks">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Card 
                key={action.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  activeSection === action.id ? action.color : 'hover:border-primary/20'
                } ${action.priority === 'critical' ? 'ring-2 ring-red-200' : ''}`}
                onClick={() => handleQuickAction(action.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {action.title}
                        {action.priority === 'critical' && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant={action.priority === 'critical' ? 'destructive' : 'outline'} 
                    className="w-full"
                    size="sm"
                  >
                    {activeSection === action.id ? 'Close' : 'Start'} {action.title}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Active Section Content */}
      {activeSection && (
        <div className="mb-8" role="region" aria-label="Active CHW tool">
          {activeSection === 'register' ? (
            <PatientRegistrationWithSuspense
              chwId={chwId}
              onRegistrationComplete={handleRegistrationComplete}
              onClose={() => setActiveSection(null)}
            />
          ) : activeSection === 'scan' ? (
            <QRScannerWithSuspense
              chwId={chwId}
              onScanComplete={handleQRScanComplete}
              onClose={() => setActiveSection(null)}
            />
          ) : activeSection === 'emergency' ? (
            <EmergencyLoggerWithSuspense
              chwId={chwId}
              onLogComplete={handleEmergencyLogComplete}
              onClose={() => setActiveSection(null)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {quickActions.find(a => a.id === activeSection)?.title}
                </CardTitle>
                <CardDescription>
                  This functionality will be implemented in the upcoming subtasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">
                    {quickActions.find(a => a.id === activeSection)?.icon && (
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        {(() => {
                          const IconComponent = quickActions.find(a => a.id === activeSection)?.icon!
                          return <IconComponent className="h-8 w-8" />
                        })()}
                      </div>
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">Coming Soon</p>
                  <p className="text-sm mb-4">
                    This feature will be implemented in future tasks.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Secondary Actions and Information */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-8" id="recent-activity" role="region" aria-label="Additional tools and recent activity">
        {/* Secondary Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Tools</CardTitle>
            <CardDescription>Other CHW functions and utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {secondaryActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button 
                  key={action.id}
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleSecondaryAction(action.action)}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest CHW actions and logs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading activity...</p>
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getActionColor(log.action)} className="text-xs">
                        {log.action}
                      </Badge>
                      {log.severity && (
                        <Badge variant={getSeverityColor(log.severity)} className="text-xs">
                          {log.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Start using CHW tools to see your activity here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Alerts and Patient Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Emergency Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Emergency Alerts</span>
            </CardTitle>
            <CardDescription>Recent emergency situations logged</CardDescription>
          </CardHeader>
          <CardContent>
            {emergencyLogs.length > 0 ? (
              <div className="space-y-3">
                {emergencyLogs.slice(0, 3).map((emergency) => (
                  <div key={emergency.id} className="p-3 border-l-4 border-l-red-500 bg-red-50 rounded-r-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getSeverityColor(emergency.severity)} className="text-xs">
                        {emergency.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(emergency.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{emergency.description}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>GPS Location Recorded</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emergency alerts</p>
                <p className="text-xs">Emergency situations will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Recent Patients</span>
            </CardTitle>
            <CardDescription>Patients you've recently registered</CardDescription>
          </CardHeader>
          <CardContent>
            {registeredPatients.length > 0 ? (
              <div className="space-y-3">
                {registeredPatients.slice(0, 4).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{patient.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Age {patient.age} • {patient.gender}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No patients registered yet</p>
                <p className="text-xs">Use "Register Patient" to add new patients</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
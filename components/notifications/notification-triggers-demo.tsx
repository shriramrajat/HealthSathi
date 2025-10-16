"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  Calendar, 
  Pill, 
  Video, 
  TestTube, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Stethoscope,
  Building2
} from "lucide-react"
import { notificationTriggersService } from "@/lib/services/notification-triggers"
import { appointmentService } from "@/lib/services/appointment-service"
import { prescriptionService } from "@/lib/services/prescription-service"
import { toast } from "sonner"
import type { 
  Appointment, 
  Prescription, 
  Consultation, 
  UserRole,
  NotificationType 
} from "@/lib/types/healthcare-models"
import { Timestamp } from "firebase/firestore"

interface NotificationTriggersDemo {
  onNotificationSent?: (type: NotificationType, success: boolean) => void
}

export default function NotificationTriggersDemo({ onNotificationSent }: NotificationTriggersDemo) {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Array<{
    type: string
    success: boolean
    message: string
    timestamp: Date
  }>>([])

  // Test data
  const [testUserId, setTestUserId] = useState("")
  const [testUserRole, setTestUserRole] = useState<UserRole>("patient")
  const [testPatientId, setTestPatientId] = useState("")
  const [testDoctorId, setTestDoctorId] = useState("")
  const [testPharmacyId, setTestPharmacyId] = useState("")

  const addTestResult = (type: string, success: boolean, message: string) => {
    const result = {
      type,
      success,
      message,
      timestamp: new Date()
    }
    setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
    onNotificationSent?.(type as NotificationType, success)
  }

  // Test appointment notifications
  const testAppointmentNotifications = async () => {
    if (!testPatientId || !testDoctorId) {
      toast.error("Please provide Patient ID and Doctor ID")
      return
    }

    setIsLoading(true)
    try {
      // Create mock appointment
      const mockAppointment: Appointment = {
        id: `test-appointment-${Date.now()}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        scheduledAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Tomorrow
        duration: 30,
        type: 'consultation',
        status: 'scheduled',
        symptoms: ['headache', 'fever'],
        priority: 'normal',
        reminderSent: false,
        patientName: 'Test Patient',
        doctorName: 'Dr. Test Doctor',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Test appointment booked notification
      await notificationTriggersService.triggerAppointmentBooked(mockAppointment)
      addTestResult('appointment_booked', true, 'Appointment booking notifications sent successfully')

      // Test appointment confirmed notification
      await notificationTriggersService.triggerAppointmentConfirmed(mockAppointment)
      addTestResult('appointment_confirmed', true, 'Appointment confirmation notification sent successfully')

      // Test appointment reminder
      await notificationTriggersService.triggerAppointmentReminder(mockAppointment, '24h')
      addTestResult('appointment_reminder', true, '24-hour appointment reminder sent successfully')

      // Test appointment cancellation
      await notificationTriggersService.triggerAppointmentCancelled(mockAppointment, 'patient', 'Schedule conflict')
      addTestResult('appointment_cancelled', true, 'Appointment cancellation notification sent successfully')

      toast.success('All appointment notifications tested successfully')
    } catch (error) {
      console.error('Error testing appointment notifications:', error)
      addTestResult('appointment_test', false, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to test appointment notifications')
    } finally {
      setIsLoading(false)
    }
  }

  // Test prescription notifications
  const testPrescriptionNotifications = async () => {
    if (!testPatientId || !testDoctorId) {
      toast.error("Please provide Patient ID and Doctor ID")
      return
    }

    setIsLoading(true)
    try {
      // Create mock prescription
      const mockPrescription: Prescription = {
        id: `test-prescription-${Date.now()}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        medicines: [
          {
            id: 'med1',
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '7 days',
            instructions: 'Take with food'
          },
          {
            id: 'med2',
            name: 'Ibuprofen',
            dosage: '200mg',
            frequency: 'As needed',
            duration: '5 days',
            instructions: 'Take for pain relief'
          }
        ],
        diagnosis: 'Upper respiratory infection',
        notes: 'Patient should rest and stay hydrated',
        status: 'issued',
        pharmacyId: testPharmacyId || undefined,
        patientName: 'Test Patient',
        doctorName: 'Dr. Test Doctor',
        pharmacyName: testPharmacyId ? 'Test Pharmacy' : undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Test prescription issued notification
      await notificationTriggersService.triggerPrescriptionIssued(mockPrescription)
      addTestResult('prescription_issued', true, 'Prescription issued notifications sent successfully')

      // Test prescription ready notification (if pharmacy provided)
      if (testPharmacyId) {
        await notificationTriggersService.triggerPrescriptionReady(mockPrescription, testPharmacyId)
        addTestResult('prescription_ready', true, 'Prescription ready notification sent successfully')

        // Test prescription dispensed notification
        await notificationTriggersService.triggerPrescriptionDispensed(mockPrescription, testPharmacyId)
        addTestResult('prescription_dispensed', true, 'Prescription dispensed notification sent successfully')
      }

      toast.success('All prescription notifications tested successfully')
    } catch (error) {
      console.error('Error testing prescription notifications:', error)
      addTestResult('prescription_test', false, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to test prescription notifications')
    } finally {
      setIsLoading(false)
    }
  }

  // Test consultation notifications
  const testConsultationNotifications = async () => {
    if (!testPatientId || !testDoctorId) {
      toast.error("Please provide Patient ID and Doctor ID")
      return
    }

    setIsLoading(true)
    try {
      // Create mock consultation
      const mockConsultation: Consultation = {
        id: `test-consultation-${Date.now()}`,
        appointmentId: `test-appointment-${Date.now()}`,
        patientId: testPatientId,
        doctorId: testDoctorId,
        roomId: `room-${Date.now()}`,
        jitsiRoomName: `test-room-${Date.now()}`,
        startTime: Timestamp.now(),
        notes: 'Test consultation notes',
        status: 'active',
        participants: {
          patientJoined: true,
          doctorJoined: true
        },
        patientName: 'Test Patient',
        doctorName: 'Dr. Test Doctor',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Test consultation started notification
      await notificationTriggersService.triggerConsultationStarted(mockConsultation)
      addTestResult('consultation_started', true, 'Consultation started notifications sent successfully')

      // Test consultation ended notification
      const endedConsultation = {
        ...mockConsultation,
        endTime: Timestamp.now(),
        duration: 1800, // 30 minutes
        status: 'completed' as const
      }
      await notificationTriggersService.triggerConsultationEnded(endedConsultation)
      addTestResult('consultation_ended', true, 'Consultation ended notification sent successfully')

      toast.success('All consultation notifications tested successfully')
    } catch (error) {
      console.error('Error testing consultation notifications:', error)
      addTestResult('consultation_test', false, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to test consultation notifications')
    } finally {
      setIsLoading(false)
    }
  }

  // Test individual notification
  const testSingleNotification = async () => {
    if (!testUserId) {
      toast.error("Please provide a User ID")
      return
    }

    setIsLoading(true)
    try {
      await notificationTriggersService.sendTestNotification(testUserId, testUserRole)
      addTestResult('test_notification', true, `Test notification sent to ${testUserRole} user successfully`)
      toast.success('Test notification sent successfully')
    } catch (error) {
      console.error('Error sending test notification:', error)
      addTestResult('test_notification', false, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast.error('Failed to send test notification')
    } finally {
      setIsLoading(false)
    }
  }

  // Clear test results
  const clearResults = () => {
    setTestResults([])
    toast.success('Test results cleared')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Triggers Demo</span>
          </CardTitle>
          <CardDescription>
            Test all notification triggers for the healthcare platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testUserId">Test User ID</Label>
              <Input
                id="testUserId"
                placeholder="Enter user ID for testing"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testUserRole">User Role</Label>
              <Select value={testUserRole} onValueChange={(value) => setTestUserRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="chw">Community Health Worker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testPatientId">Patient ID</Label>
              <Input
                id="testPatientId"
                placeholder="Patient ID for appointment/prescription tests"
                value={testPatientId}
                onChange={(e) => setTestPatientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testDoctorId">Doctor ID</Label>
              <Input
                id="testDoctorId"
                placeholder="Doctor ID for appointment/prescription tests"
                value={testDoctorId}
                onChange={(e) => setTestDoctorId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testPharmacyId">Pharmacy ID (Optional)</Label>
              <Input
                id="testPharmacyId"
                placeholder="Pharmacy ID for prescription tests"
                value={testPharmacyId}
                onChange={(e) => setTestPharmacyId(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={testSingleNotification}
              disabled={isLoading || !testUserId}
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>Test Single</span>
            </Button>

            <Button
              onClick={testAppointmentNotifications}
              disabled={isLoading || !testPatientId || !testDoctorId}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Test Appointments</span>
            </Button>

            <Button
              onClick={testPrescriptionNotifications}
              disabled={isLoading || !testPatientId || !testDoctorId}
              className="flex items-center space-x-2"
            >
              <Pill className="h-4 w-4" />
              <span>Test Prescriptions</span>
            </Button>

            <Button
              onClick={testConsultationNotifications}
              disabled={isLoading || !testPatientId || !testDoctorId}
              className="flex items-center space-x-2"
            >
              <Video className="h-4 w-4" />
              <span>Test Consultations</span>
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Testing notifications...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Recent notification trigger test results</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearResults}>
              Clear Results
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={result.success ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {result.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Types Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Notification Types</CardTitle>
          <CardDescription>
            All notification types that can be triggered by the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Appointments</span>
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• appointment_booked</div>
                <div>• appointment_confirmed</div>
                <div>• appointment_cancelled</div>
                <div>• appointment_reminder</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Pill className="h-4 w-4" />
                <span>Prescriptions</span>
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• prescription_issued</div>
                <div>• prescription_ready</div>
                <div>• prescription_dispensed</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Consultations</span>
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• consultation_started</div>
                <div>• consultation_ended</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Emergency</span>
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• emergency_alert</div>
                <div>• symptom_check_urgent</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>System</span>
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• qr_code_scanned</div>
                <div>• system_maintenance</div>
                <div>• general</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
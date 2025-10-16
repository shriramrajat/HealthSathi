"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  AlertTriangle,
  Pill,
  FileText,
  Clock,
  ArrowLeft,
  Shield,
  Activity,
  Stethoscope,
  QrCode,
  Eye,
  EyeOff,
} from "lucide-react"
import { fetchPatientRecord, updatePatientLastAccessed, type PatientRecordData } from "@/lib/services/patient-service"
import type { Patient, Prescription, Appointment, SymptomResult, Consultation } from "@/lib/types/healthcare-models"

interface ExtendedPatientRecordData extends PatientRecordData {
  loading: boolean
  error: string | null
}

export default function PatientRecordPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [recordData, setRecordData] = useState<ExtendedPatientRecordData>({
    patient: null,
    prescriptions: [],
    appointments: [],
    consultations: [],
    symptomResults: [],
    loading: true,
    error: null
  })

  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited' | 'emergency_only'>('limited')

  useEffect(() => {
    if (patientId) {
      loadPatientRecord(patientId)
    }
  }, [patientId])

  const loadPatientRecord = async (id: string) => {
    try {
      setRecordData(prev => ({ ...prev, loading: true, error: null }))
      
      const data = await fetchPatientRecord(id)
      
      if (!data.patient) {
        setRecordData(prev => ({
          ...prev,
          loading: false,
          error: "Patient record not found. Please verify the QR code is valid."
        }))
        return
      }

      // Update last accessed timestamp
      await updatePatientLastAccessed(id)

      setRecordData({
        ...data,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Error fetching patient record:', error)
      setRecordData(prev => ({
        ...prev,
        loading: false,
        error: "Error loading patient record. Please try again."
      }))
    }
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }

  // Format date and time
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate age
  const calculateAge = (dateOfBirth: any) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'dispensed':
        return 'default'
      case 'pending':
      case 'scheduled':
      case 'issued':
        return 'secondary'
      case 'cancelled':
      case 'expired':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get urgency badge variant
  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (recordData.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading patient record...</p>
        </div>
      </div>
    )
  }

  if (recordData.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Access Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{recordData.error}</p>
            <div className="flex space-x-2">
              <Button onClick={() => loadPatientRecord(patientId)} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!recordData.patient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Patient Not Found</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              No patient record found with this ID. Please verify the QR code is valid.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { patient, prescriptions, appointments, consultations, symptomResults } = recordData

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Digital Health Record</h1>
                <p className="text-muted-foreground">Secure patient information access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono">
                <QrCode className="h-3 w-3 mr-1" />
                {patient.qrId}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
              >
                {showSensitiveData ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Sensitive
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Sensitive
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Patient Information</span>
            </CardTitle>
            <CardDescription>Basic patient details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{patient.name}</h3>
                  <p className="text-muted-foreground">
                    {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Born: {formatDate(patient.dateOfBirth)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{showSensitiveData ? patient.email : '••••••@••••.com'}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{showSensitiveData ? patient.address.street : '••• ••••••• Street'}</p>
                  <p>{patient.address.city}, {patient.address.state}</p>
                  <p>{showSensitiveData ? patient.address.zipCode : '•••••'}</p>
                  <p>{patient.address.country}</p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Emergency Contact</span>
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">{patient.emergencyContact.name}</p>
                  <p>{patient.emergencyContact.relationship}</p>
                  <p>{showSensitiveData ? patient.emergencyContact.phone : '•••-•••-••••'}</p>
                  {patient.emergencyContact.email && (
                    <p>{showSensitiveData ? patient.emergencyContact.email : '••••••@••••.com'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Medical Information</span>
            </CardTitle>
            <CardDescription>Critical medical details and health conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Blood Type */}
              {patient.bloodType && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Blood Type</h4>
                  <p className="text-2xl font-bold text-red-900">{patient.bloodType}</p>
                </div>
              )}

              {/* Allergies */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Allergies</span>
                  </h4>
                  <div className="space-y-1">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="mr-1 mb-1">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Conditions */}
              {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Chronic Conditions</h4>
                  <div className="space-y-1">
                    {patient.chronicConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="mr-1 mb-1">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medical History */}
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-4">Medical History</h4>
                <div className="space-y-3">
                  {patient.medicalHistory.slice(0, 5).map((record, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{record.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                          {record.provider && (
                            <p className="text-xs text-muted-foreground mt-2">Provider: {record.provider}</p>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={getStatusVariant(record.status)}>
                            {record.status}
                          </Badge>
                          {record.severity && (
                            <Badge variant={getUrgencyVariant(record.severity)}>
                              {record.severity}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        {prescriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5" />
                <span>Recent Prescriptions</span>
              </CardTitle>
              <CardDescription>Latest prescribed medications and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prescriptions.slice(0, 5).map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium">{prescription.diagnosis}</h5>
                        <p className="text-sm text-muted-foreground">
                          Dr. {prescription.doctorName || 'Unknown'} • {formatDate(prescription.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {prescription.medicines.map((medicine, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{medicine.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                              </p>
                              {medicine.instructions && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {medicine.instructions}
                                </p>
                              )}
                            </div>
                            {medicine.quantity && (
                              <Badge variant="outline">
                                Qty: {medicine.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Appointments */}
        {appointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Appointments</span>
              </CardTitle>
              <CardDescription>Latest medical appointments and consultations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <h5 className="font-medium capitalize">{appointment.type.replace('-', ' ')}</h5>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          Dr. {appointment.doctorName || 'Unknown'} • {formatDateTime(appointment.scheduledAt)}
                        </p>
                        
                        {appointment.symptoms && appointment.symptoms.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Symptoms:</p>
                            <div className="flex flex-wrap gap-1">
                              {appointment.symptoms.map((symptom, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={appointment.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {appointment.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Symptom Checks */}
        {symptomResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Symptom Checks</span>
              </CardTitle>
              <CardDescription>AI-powered symptom analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {symptomResults.slice(0, 3).map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(result.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getUrgencyVariant(result.urgency)}>
                        {result.urgency} urgency
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Symptoms:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.selectedSymptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm"><strong>Advice:</strong> {result.advice}</p>
                        {result.recommendedAction && (
                          <p className="text-sm mt-2">
                            <strong>Recommended Action:</strong> {result.recommendedAction}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Consultations */}
        {consultations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Consultations</span>
              </CardTitle>
              <CardDescription>Video consultation records and notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultations.slice(0, 3).map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium">
                          Consultation with Dr. {consultation.doctorName || 'Unknown'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(consultation.startTime)}
                          {consultation.duration && ` • ${consultation.duration} minutes`}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                    
                    {consultation.notes && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{consultation.notes}</p>
                      </div>
                    )}
                    
                    {consultation.followUpRequired && (
                      <div className="mt-3">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Follow-up Required
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This patient record is accessed securely through QR code authentication. 
            All access is logged for security and compliance purposes. 
            Sensitive information is protected and only shown when explicitly requested.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
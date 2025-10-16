'use client'

import React, { useState, useEffect } from 'react'
import { Patient, Prescription, Consultation } from '@/lib/types/dashboard-models'
import { usePatientPrescriptions } from '@/hooks/use-patient-prescriptions'
import { usePatientConsultations } from '@/hooks/use-patient-consultations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Video,
  AlertCircle,
  Heart,
  Activity,
  Clock,
  Pill,
  Stethoscope,
  Download,
  Eye,
  MapPin,
  Shield,
  Users,
  Search,
  Filter
} from 'lucide-react'

interface PatientDetailsProps {
  patient: Patient
  isOpen: boolean
  onClose: () => void
  onStartConsultation?: (patientId: string, patientName: string) => void
  onCallPatient?: (phone: string, patientName: string) => void
  onCreatePrescription?: (patientId: string) => void
}

interface PrescriptionHistoryProps {
  patientId: string
}

interface ConsultationHistoryProps {
  patientId: string
}

const PrescriptionHistory: React.FC<PrescriptionHistoryProps> = ({ patientId }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const {
    prescriptions,
    isLoading,
    error
  } = usePatientPrescriptions({
    patientId,
    autoRefresh: true
  })

  // Filter prescriptions based on search term and status
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = searchTerm === '' || 
      prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.notes.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load prescription history: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions, medications, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {prescriptions.length === 0 ? 'No prescriptions found' : 'No matching prescriptions'}
              </h3>
              <p className="text-muted-foreground">
                {prescriptions.length === 0 
                  ? 'No prescription history available for this patient.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredPrescriptions.map((prescription) => (
        <Card key={prescription.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">Prescription #{prescription.id.slice(-8)}</h4>
                    <Badge className={getStatusColor(prescription.status)}>
                      {prescription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Issued: {formatDate(prescription.createdAt)}
                  </p>
                  {prescription.doctorName && (
                    <p className="text-sm text-muted-foreground">
                      Doctor: {prescription.doctorName}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {prescription.fileUrl && (
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {prescription.diagnosis && (
                <div className="space-y-1">
                  <h5 className="font-medium text-sm">Diagnosis</h5>
                  <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Medications</h5>
                <div className="space-y-2">
                  {prescription.medications.map((medication, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-medium">{medication.name}</h6>
                        <Badge variant="outline" className="text-xs">
                          {medication.dosage}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Frequency:</span> {medication.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {medication.duration}
                        </div>
                      </div>
                      {medication.instructions && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Instructions:</span> {medication.instructions}
                        </div>
                      )}
                      {medication.quantity && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Quantity: {medication.quantity}
                          {medication.refills && ` | Refills: ${medication.refills}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {prescription.notes && (
                <div className="space-y-1">
                  <h5 className="font-medium text-sm">Notes</h5>
                  <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                </div>
              )}

              {prescription.expiryDate && (
                <div className="text-xs text-muted-foreground">
                  Expires: {formatDate(prescription.expiryDate)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        ))
      )}
    </div>
  )
}

const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({ patientId }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const {
    consultations,
    isLoading,
    error
  } = usePatientConsultations({
    patientId,
    autoRefresh: true
  })

  // Filter consultations based on search term and status
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = searchTerm === '' || 
      consultation.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.roomId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || consultation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return 'N/A'
    }
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load consultation history: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search consultation notes or room ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredConsultations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {consultations.length === 0 ? 'No consultations found' : 'No matching consultations'}
              </h3>
              <p className="text-muted-foreground">
                {consultations.length === 0 
                  ? 'No consultation history available for this patient.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredConsultations.map((consultation) => (
        <Card key={consultation.id}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">
                      Consultation #{consultation.id.slice(-8)}
                    </h4>
                    <Badge className={getStatusColor(consultation.status)}>
                      {consultation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(consultation.startTime)}
                  </p>
                  {consultation.duration && (
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatDuration(consultation.duration)}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {consultation.recordingUrl && (
                    <Button size="sm" variant="outline">
                      <Video className="h-4 w-4 mr-1" />
                      Recording
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Notes
                  </Button>
                </div>
              </div>

              {consultation.notes && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Consultation Notes</h5>
                  <ScrollArea className="h-32 w-full rounded border p-3 bg-gray-50">
                    <p className="text-sm whitespace-pre-wrap">{consultation.notes}</p>
                  </ScrollArea>
                </div>
              )}

              {consultation.participants && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="font-medium">Patient Joined:</span>
                    <p className="text-muted-foreground">
                      {consultation.participants.patientJoined ? 'Yes' : 'No'}
                      {consultation.participants.patientJoinedAt && 
                        ` at ${formatDate(consultation.participants.patientJoinedAt)}`
                      }
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium">Doctor Joined:</span>
                    <p className="text-muted-foreground">
                      {consultation.participants.doctorJoined ? 'Yes' : 'No'}
                      {consultation.participants.doctorJoinedAt && 
                        ` at ${formatDate(consultation.participants.doctorJoinedAt)}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {consultation.technicalIssues && consultation.technicalIssues.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-orange-600">Technical Issues</h5>
                  <ul className="text-sm text-orange-600 space-y-1">
                    {consultation.technicalIssues.map((issue, index) => (
                      <li key={index} className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-2" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center space-x-4">
                  {consultation.followUpRequired && (
                    <div className="flex items-center text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Follow-up required
                    </div>
                  )}
                  {consultation.prescriptionCreated && (
                    <div className="flex items-center text-green-600">
                      <Pill className="h-3 w-3 mr-1" />
                      Prescription created
                    </div>
                  )}
                </div>
                <span>Room ID: {consultation.roomId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        ))
      )}
    </div>
  )
}

export const PatientDetails: React.FC<PatientDetailsProps> = ({
  patient,
  isOpen,
  onClose,
  onStartConsultation,
  onCallPatient,
  onCreatePrescription
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const calculateAge = (dateOfBirth: any) => {
    if (!dateOfBirth) return 'N/A'
    try {
      const birthDate = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1
      }
      return age
    } catch {
      return 'N/A'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Patient Details - {patient.name}</span>
          </DialogTitle>
          <DialogDescription>
            Complete medical information, prescription history, and consultation records
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medical">Medical History</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full overflow-y-auto">
                <div className="space-y-6 pr-2">
                  {/* Quick Actions */}
                  <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span>Quick Actions</span>
                      </CardTitle>
                      <CardDescription>
                        Perform common actions for this patient
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button 
                          onClick={() => onStartConsultation?.(patient.id, patient.name)}
                          className="flex items-center justify-center space-x-2 h-12"
                          size="lg"
                        >
                          <Video className="h-5 w-5" />
                          <span>Start Consultation</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => onCallPatient?.(patient.phone, patient.name)}
                          className="flex items-center justify-center space-x-2 h-12"
                          size="lg"
                        >
                          <Phone className="h-5 w-5" />
                          <span>Call Patient</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => onCreatePrescription?.(patient.id)}
                          className="flex items-center justify-center space-x-2 h-12"
                          size="lg"
                        >
                          <Pill className="h-5 w-5" />
                          <span>Create Prescription</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>Basic Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                            <p className="font-medium">{patient.name}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Patient ID</span>
                            <p className="font-medium">{patient.id}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Age</span>
                            <p className="font-medium">{calculateAge(patient.dateOfBirth)} years</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Gender</span>
                            <p className="font-medium capitalize">{patient.gender}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Date of Birth</span>
                            <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Blood Type</span>
                            <p className="font-medium">{patient.bloodType || 'Not specified'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Mail className="h-5 w-5" />
                          <span>Contact Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Email</span>
                            <p className="font-medium">{patient.email}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Phone</span>
                            <p className="font-medium">{patient.phone}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Address</span>
                            <div className="text-sm space-y-1">
                              <p>{patient.address.street}</p>
                              <p>{patient.address.city}, {patient.address.state} {patient.address.zipCode}</p>
                              <p>{patient.address.country}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Emergency Contact */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Emergency Contact</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Name</span>
                          <p className="font-medium">{patient.emergencyContact.name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Relationship</span>
                          <p className="font-medium">{patient.emergencyContact.relationship}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Phone</span>
                          <p className="font-medium">{patient.emergencyContact.phone}</p>
                        </div>
                        {patient.emergencyContact.email && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Email</span>
                            <p className="font-medium">{patient.emergencyContact.email}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chronic Conditions */}
                    {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Heart className="h-5 w-5" />
                            <span>Chronic Conditions</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {patient.chronicConditions.map((condition, index) => (
                              <Badge key={index} variant="outline">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Allergies */}
                    {patient.allergies && patient.allergies.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-orange-600">
                            <AlertCircle className="h-5 w-5" />
                            <span>Allergies</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {patient.allergies.map((allergy, index) => (
                              <Badge key={index} variant="destructive" className="bg-orange-100 text-orange-800">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Insurance Information */}
                  {patient.insuranceInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="h-5 w-5" />
                          <span>Insurance Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Provider</span>
                            <p className="font-medium">{patient.insuranceInfo.provider}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Policy Number</span>
                            <p className="font-medium">{patient.insuranceInfo.policyNumber}</p>
                          </div>
                          {patient.insuranceInfo.groupNumber && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Group Number</span>
                              <p className="font-medium">{patient.insuranceInfo.groupNumber}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="medical" className="h-full overflow-y-auto">
                <div className="space-y-4 pr-2">
                  {/* Medical History Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="text-sm font-medium">Chronic Conditions</p>
                            <p className="text-2xl font-bold">
                              {patient.chronicConditions?.length || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium">Allergies</p>
                            <p className="text-2xl font-bold">
                              {patient.allergies?.length || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Medical Records</p>
                            <p className="text-2xl font-bold">
                              {patient.medicalHistory?.length || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Medical History Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Medical History Timeline</span>
                      </CardTitle>
                      <CardDescription>
                        Chronological view of all medical records and events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                        <div className="space-y-4">
                          {patient.medicalHistory
                            .sort((a, b) => {
                              try {
                                const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date as any)
                                const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date as any)
                                return dateB.getTime() - dateA.getTime()
                              } catch {
                                return 0
                              }
                            })
                            .map((record, index) => (
                              <div key={index} className="flex space-x-4 pb-4 border-b last:border-b-0">
                                <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-lg">{record.title}</h4>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {record.type.replace('_', ' ')}
                                        </Badge>
                                        <Badge 
                                          variant={record.status === 'active' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {record.status}
                                        </Badge>
                                        {record.severity && (
                                          <Badge 
                                            variant={record.severity === 'critical' || record.severity === 'high' ? 'destructive' : 'outline'}
                                            className="text-xs"
                                          >
                                            {record.severity}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">
                                        {formatDate(record.date)}
                                      </p>
                                      {record.provider && (
                                        <p className="text-xs text-muted-foreground">
                                          {record.provider}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {record.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No medical history</h3>
                          <p className="text-muted-foreground">
                            No medical history records available for this patient.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="prescriptions" className="h-full overflow-y-auto">
                <div className="space-y-4 pr-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Pill className="h-5 w-5" />
                        <span>Prescription History</span>
                      </CardTitle>
                      <CardDescription>
                        Complete prescription history and medication records for {patient.name}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <PrescriptionHistory patientId={patient.id} />
                </div>
              </TabsContent>

              <TabsContent value="consultations" className="h-full overflow-y-auto">
                <div className="space-y-4 pr-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Video className="h-5 w-5" />
                        <span>Consultation History</span>
                      </CardTitle>
                      <CardDescription>
                        Complete consultation history and notes for {patient.name}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <ConsultationHistory patientId={patient.id} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PatientDetails
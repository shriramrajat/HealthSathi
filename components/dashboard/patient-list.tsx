'use client'

import React, { useState, useMemo } from 'react'
import { usePatients } from '@/hooks/use-patients'
import { Patient } from '@/lib/types/dashboard-models'
import { PatientDetails } from './patient-details'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Video,
  AlertCircle,
  Filter,
  RefreshCw,
  Users,
  Heart,
  Activity
} from 'lucide-react'

interface PatientListProps {
  onPatientSelect?: (patient: Patient) => void
  onStartConsultation?: (patientId: string, patientName: string) => void
  onCallPatient?: (phone: string, patientName: string) => void
  className?: string
}

interface PatientCardProps {
  patient: Patient
  onSelect?: (patient: Patient) => void
  onStartConsultation?: (patientId: string, patientName: string) => void
  onCallPatient?: (phone: string, patientName: string) => void
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelect,
  onStartConsultation,
  onCallPatient
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

  const getLastVisit = () => {
    // This would typically come from the latest appointment or consultation
    // For now, we'll use a placeholder
    return 'Recent'
  }

  const getPrimaryCondition = () => {
    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
      return patient.chronicConditions[0]
    }
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      const activeConditions = patient.medicalHistory.filter(record => 
        record.status === 'active' && record.type === 'diagnosis'
      )
      if (activeConditions.length > 0) {
        return activeConditions[0].title
      }
    }
    return 'No active conditions'
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="font-semibold text-lg">{patient.name}</h4>
              <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <Badge variant="outline">Age: {calculateAge(patient.dateOfBirth)}</Badge>
              <Badge variant="secondary" className="text-xs">
                {patient.gender}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Last Visit:
              </span>
              <span>{getLastVisit()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                Condition:
              </span>
              <span className="text-right">{getPrimaryCondition()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                Phone:
              </span>
              <span>{patient.phone}</span>
            </div>
          </div>

          {/* Chronic Conditions & Allergies */}
          {((patient.chronicConditions && patient.chronicConditions.length > 0) || 
            (patient.allergies && patient.allergies.length > 0)) && (
            <div className="space-y-2">
              {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.slice(0, 2).map((condition, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                  {patient.chronicConditions.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{patient.chronicConditions.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Allergies: {patient.allergies.slice(0, 2).join(', ')}
                  {patient.allergies.length > 2 && ` +${patient.allergies.length - 2} more`}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setIsDetailsOpen(true)
                onSelect?.(patient)
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Details
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStartConsultation?.(patient.id, patient.name)}
            >
              <Video className="h-4 w-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onCallPatient?.(patient.phone, patient.name)}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>

          <PatientDetails
            patient={patient}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onStartConsultation={onStartConsultation}
            onCallPatient={onCallPatient}
          />
        </div>
      </CardContent>
    </Card>
  )
}

const PatientDetailsModal: React.FC<{ patient: Patient }> = ({ patient }) => {
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
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-medium">{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient ID:</span>
              <span className="font-medium">{patient.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span className="font-medium">{calculateAge(patient.dateOfBirth)} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium capitalize">{patient.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Type:</span>
              <span className="font-medium">{patient.bloodType || 'Not specified'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{patient.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{patient.phone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Address:</span>
              <div className="text-sm">
                <p>{patient.address.street}</p>
                <p>{patient.address.city}, {patient.address.state} {patient.address.zipCode}</p>
                <p>{patient.address.country}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{patient.emergencyContact.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Relationship:</span>
            <span className="font-medium">{patient.emergencyContact.relationship}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{patient.emergencyContact.phone}</span>
          </div>
          {patient.emergencyContact.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{patient.emergencyContact.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Medical Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Medical Information</h3>
        
        {/* Chronic Conditions */}
        {patient.chronicConditions && patient.chronicConditions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Chronic Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map((condition, index) => (
                <Badge key={index} variant="outline">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Allergies */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-orange-600">Allergies</h4>
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="bg-orange-100 text-orange-800">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Insurance Information */}
        {patient.insuranceInfo && (
          <div className="space-y-2">
            <h4 className="font-medium">Insurance Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">{patient.insuranceInfo.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Policy Number:</span>
                <span className="font-medium">{patient.insuranceInfo.policyNumber}</span>
              </div>
              {patient.insuranceInfo.groupNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Group Number:</span>
                  <span className="font-medium">{patient.insuranceInfo.groupNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Medical History */}
      {patient.medicalHistory && patient.medicalHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Medical History</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
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
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{record.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {record.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={record.status === 'active' ? 'default' : 'secondary'}
                        className="mb-1"
                      >
                        {record.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(record.date)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{record.description}</p>
                  {record.provider && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Provider: {record.provider}
                    </p>
                  )}
                  {record.severity && (
                    <Badge 
                      variant={record.severity === 'critical' || record.severity === 'high' ? 'destructive' : 'outline'}
                      className="mt-2"
                    >
                      {record.severity}
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const PatientList: React.FC<PatientListProps> = ({
  onPatientSelect,
  onStartConsultation,
  onCallPatient,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [conditionFilter, setConditionFilter] = useState<string>('all')

  const {
    filteredPatients,
    isLoading,
    error,
    refresh,
    totalCount,
    isConnected
  } = usePatients({
    searchTerm,
    autoRefresh: true,
    limit: 100
  })

  // Additional client-side filtering for gender and conditions
  const finalFilteredPatients = useMemo(() => {
    let filtered = filteredPatients

    if (genderFilter !== 'all') {
      filtered = filtered.filter(patient => patient.gender === genderFilter)
    }

    if (conditionFilter !== 'all') {
      filtered = filtered.filter(patient => {
        if (conditionFilter === 'chronic') {
          return patient.chronicConditions && patient.chronicConditions.length > 0
        }
        if (conditionFilter === 'allergies') {
          return patient.allergies && patient.allergies.length > 0
        }
        return true
      })
    }

    return filtered
  }, [filteredPatients, genderFilter, conditionFilter])

  // Get unique conditions for filter dropdown
  const availableConditions = useMemo(() => {
    const conditions = new Set<string>()
    filteredPatients.forEach(patient => {
      patient.chronicConditions?.forEach(condition => conditions.add(condition))
    })
    return Array.from(conditions).sort()
  }, [filteredPatients])

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect?.(patient)
  }

  const handleStartConsultation = (patientId: string, patientName: string) => {
    onStartConsultation?.(patientId, patientName)
  }

  const handleCallPatient = (phone: string, patientName: string) => {
    onCallPatient?.(phone, patientName)
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load patients: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Patient Records</h3>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{totalCount} total</span>
          </Badge>
          {!isConnected && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Offline</span>
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="chronic">With Chronic Conditions</SelectItem>
              <SelectItem value="allergies">With Allergies</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {finalFilteredPatients.length} of {totalCount} patients
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
        {isLoading && (
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Patient Grid */}
      {isLoading && finalFilteredPatients.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : finalFilteredPatients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No patients match your search "${searchTerm}"`
                  : 'No patients available'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {finalFilteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onSelect={handlePatientSelect}
              onStartConsultation={handleStartConsultation}
              onCallPatient={handleCallPatient}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientList
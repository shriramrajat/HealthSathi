"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle,
  Loader2,
  Navigation,
  Zap,
} from "lucide-react"
import { collection, addDoc, query, where, getDocs, Timestamp, GeoPoint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { EmergencyLog, Patient } from "@/lib/types/healthcare-models"

// Validation schema for emergency logging
const emergencyLogSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  patientPhone: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["low", "medium", "high", "critical"], {
    required_error: "Please select emergency severity",
  }),
  emergencyType: z.enum([
    "medical_emergency",
    "accident",
    "natural_disaster",
    "violence",
    "mental_health",
    "infectious_disease",
    "other"
  ], {
    required_error: "Please select emergency type",
  }),
  immediateAction: z.string().min(5, "Please describe immediate action taken"),
  additionalNotes: z.string().optional(),
})

type EmergencyLogData = z.infer<typeof emergencyLogSchema>

interface EmergencyLoggerProps {
  chwId: string
  onLogComplete: (emergencyLog: EmergencyLog) => void
  onClose: () => void
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  address?: string
}

export default function EmergencyLogger({ chwId, onLogComplete, onClose }: EmergencyLoggerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)
  const [createdLog, setCreatedLog] = useState<EmergencyLog | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EmergencyLogData>({
    resolver: zodResolver(emergencyLogSchema),
  })

  const watchedSeverity = watch("severity")

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  // Get current GPS location
  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      setIsGettingLocation(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }

        // Try to get address from coordinates (reverse geocoding)
        try {
          // In a real implementation, you would use a geocoding service
          // For now, we'll just store the coordinates
          locationData.address = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        } catch (error) {
          console.error("Error getting address:", error)
        }

        setLocationData(locationData)
        setIsGettingLocation(false)
      },
      (error) => {
        let errorMessage = "Unable to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        setLocationError(errorMessage)
        setIsGettingLocation(false)
      },
      options
    )
  }

  // Search for patients
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search by name or phone
      const nameQuery = query(
        collection(db, 'patients'),
        where('isActive', '==', true)
      )

      const snapshot = await getDocs(nameQuery)
      const patients: Patient[] = []

      snapshot.forEach((doc) => {
        const patient = { id: doc.id, ...doc.data() } as Patient
        // Simple client-side filtering (in production, use server-side search)
        if (
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm) ||
          patient.qrId.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          patients.push(patient)
        }
      })

      setSearchResults(patients.slice(0, 5)) // Limit to 5 results
    } catch (error) {
      console.error("Error searching patients:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle patient selection
  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setValue("patientId", patient.id)
    setValue("patientName", patient.name)
    setValue("patientPhone", patient.phone)
    setPatientSearch(patient.name)
    setSearchResults([])
  }

  // Clear patient selection
  const clearPatientSelection = () => {
    setSelectedPatient(null)
    setValue("patientId", "")
    setValue("patientName", "")
    setValue("patientPhone", "")
    setPatientSearch("")
    setSearchResults([])
  }

  // Handle form submission
  const onSubmit = async (data: EmergencyLogData) => {
    if (!locationData) {
      alert("Location is required for emergency logging. Please enable location access.")
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare emergency log data
      const emergencyLogData: any = {
        chwId: chwId,
        patientId: data.patientId || undefined,
        location: new GeoPoint(locationData.latitude, locationData.longitude),
        description: data.description,
        severity: data.severity,
        status: 'reported',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Additional fields
        emergencyType: data.emergencyType,
        immediateAction: data.immediateAction,
        additionalNotes: data.additionalNotes || '',
        patientName: data.patientName || '',
        patientPhone: data.patientPhone || '',
        locationAccuracy: locationData.accuracy,
        locationAddress: locationData.address || '',
      }

      // Save emergency log to Firestore
      const emergencyRef = await addDoc(collection(db, 'emergency-logs'), emergencyLogData)

      const newEmergencyLog: EmergencyLog = {
        id: emergencyRef.id,
        ...emergencyLogData,
      }

      // Log CHW activity
      await addDoc(collection(db, 'chw-logs'), {
        chwId: chwId,
        patientId: data.patientId || undefined,
        action: 'emergency',
        location: new GeoPoint(locationData.latitude, locationData.longitude),
        description: `Emergency logged: ${data.severity} - ${data.description.substring(0, 50)}...`,
        severity: data.severity,
        followUpRequired: data.severity === 'critical' || data.severity === 'high',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Set success state
      setCreatedLog(newEmergencyLog)
      setLogSuccess(true)

      // Call completion callback
      onLogComplete(newEmergencyLog)

    } catch (error) {
      console.error('Error logging emergency:', error)
      alert('Failed to log emergency. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  // Get emergency type display name
  const getEmergencyTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      medical_emergency: "Medical Emergency",
      accident: "Accident",
      natural_disaster: "Natural Disaster",
      violence: "Violence",
      mental_health: "Mental Health Crisis",
      infectious_disease: "Infectious Disease",
      other: "Other"
    }
    return types[type] || type
  }

  // Start new emergency log
  const startNewLog = () => {
    setLogSuccess(false)
    setCreatedLog(null)
    setSelectedPatient(null)
    setPatientSearch("")
    setSearchResults([])
    reset()
    getCurrentLocation()
  }

  if (logSuccess && createdLog) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Emergency Logged Successfully</CardTitle>
          <CardDescription>
            Emergency has been recorded and authorities will be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emergency Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-800">Emergency Details</h3>
              <Badge variant={getSeverityColor(createdLog.severity)} className="text-xs">
                {createdLog.severity.toUpperCase()}
              </Badge>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Type:</span>
                <p>{getEmergencyTypeDisplay((createdLog as any).emergencyType)}</p>
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <p>{createdLog.description}</p>
              </div>
              <div>
                <span className="font-medium">Immediate Action:</span>
                <p>{(createdLog as any).immediateAction}</p>
              </div>
              {(createdLog as any).patientName && (
                <div>
                  <span className="font-medium">Patient:</span>
                  <p>{(createdLog as any).patientName} - {(createdLog as any).patientPhone}</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="font-medium">Location:</span>
                <span className="font-mono text-xs">{(createdLog as any).locationAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="font-medium">Time:</span>
                <span>{createdLog.createdAt.toDate().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {createdLog.severity === 'critical' ? (
                "Critical emergency logged. Emergency services should be contacted immediately."
              ) : createdLog.severity === 'high' ? (
                "High priority emergency logged. Follow up with local health authorities."
              ) : (
                "Emergency logged successfully. Monitor the situation and provide updates as needed."
              )}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 pt-4">
            <Button onClick={startNewLog} variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Log Another Emergency
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span>Log Emergency Situation</span>
        </CardTitle>
        <CardDescription>
          Record emergency situations with GPS location for immediate response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Location Status */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location Status</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {isGettingLocation ? "Getting..." : "Refresh"}
              </Button>
            </div>
            
            {isGettingLocation && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Getting your current location...</span>
              </div>
            )}
            
            {locationError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">{locationError}</AlertDescription>
              </Alert>
            )}
            
            {locationData && (
              <div className="text-sm space-y-1">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Location captured successfully</span>
                </div>
                <p className="text-muted-foreground font-mono">
                  {locationData.address}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accuracy: ±{Math.round(locationData.accuracy)}m
                </p>
              </div>
            )}
          </div>

          {/* Patient Search (Optional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient Information (Optional)</h3>
            
            {!selectedPatient ? (
              <div className="space-y-2">
                <Label htmlFor="patientSearch">Search for Patient</Label>
                <div className="relative">
                  <Input
                    id="patientSearch"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      searchPatients(e.target.value)
                    }}
                    placeholder="Search by name, phone, or QR code..."
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => selectPatient(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {patient.qrId}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearPatientSelection}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level *</Label>
                <Select onValueChange={(value) => setValue("severity", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Low - Minor issue</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Medium - Moderate concern</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>High - Urgent attention needed</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Critical - Life threatening</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.severity && (
                  <p className="text-sm text-red-600">{errors.severity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyType">Emergency Type *</Label>
                <Select onValueChange={(value) => setValue("emergencyType", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical_emergency">Medical Emergency</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                    <SelectItem value="violence">Violence</SelectItem>
                    <SelectItem value="mental_health">Mental Health Crisis</SelectItem>
                    <SelectItem value="infectious_disease">Infectious Disease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.emergencyType && (
                  <p className="text-sm text-red-600">{errors.emergencyType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the emergency situation in detail..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateAction">Immediate Action Taken *</Label>
              <Textarea
                id="immediateAction"
                {...register("immediateAction")}
                placeholder="Describe what immediate action was taken..."
                rows={3}
              />
              {errors.immediateAction && (
                <p className="text-sm text-red-600">{errors.immediateAction.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                {...register("additionalNotes")}
                placeholder="Any additional information or observations..."
                rows={2}
              />
            </div>
          </div>

          {/* Severity Warning */}
          {watchedSeverity === 'critical' && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-red-600 font-medium">
                CRITICAL EMERGENCY: Ensure emergency services have been contacted immediately!
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !locationData}
              variant={watchedSeverity === 'critical' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Logging Emergency...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Log Emergency
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
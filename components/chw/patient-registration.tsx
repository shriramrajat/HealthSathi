"use client"

import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  UserPlus,
  QrCode,
  CheckCircle,
  AlertCircle,
  Download,
  Copy,
  X,
} from "lucide-react"
import { collection, addDoc, Timestamp, GeoPoint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import QRCode from "react-qr-code"
import type { Patient, PatientRegistrationForm } from "@/lib/types/healthcare-models"

// Validation schema for patient registration
const patientRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().default("Kenya"),
  }),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(10, "Emergency contact phone is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
  }),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
})

type PatientRegistrationData = z.infer<typeof patientRegistrationSchema>

interface PatientRegistrationProps {
  chwId: string
  onRegistrationComplete: (patient: Patient) => void
  onClose: () => void
}

export default function PatientRegistration({
  chwId,
  onRegistrationComplete,
  onClose,
}: PatientRegistrationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null)
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PatientRegistrationData>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      address: {
        country: "Kenya",
      },
    },
  })

  // Get current location for registration
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position.coords)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  // Generate unique QR ID
  const generateQRId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `QR-${timestamp}-${random}`.toUpperCase()
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Handle form submission
  const onSubmit = async (data: PatientRegistrationData) => {
    setIsSubmitting(true)
    
    try {
      // Get current location if not already obtained
      if (!currentLocation) {
        getCurrentLocation()
      }

      // Generate unique QR ID
      const qrId = generateQRId()
      
      // Calculate age
      const age = calculateAge(data.dateOfBirth)
      
      // Prepare patient data
      const patientData: any = {
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        dateOfBirth: Timestamp.fromDate(new Date(data.dateOfBirth)),
        age: age,
        gender: data.gender,
        address: data.address,
        medicalHistory: [],
        emergencyContact: data.emergencyContact,
        bloodType: data.bloodType || '',
        allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
        chronicConditions: data.chronicConditions ? data.chronicConditions.split(',').map(c => c.trim()) : [],
        qrId: qrId,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // CHW specific fields
        registeredBy: chwId,
        registrationLocation: currentLocation ? new GeoPoint(currentLocation.latitude, currentLocation.longitude) : undefined,
      }

      // Save patient to Firestore
      const patientRef = await addDoc(collection(db, 'patients'), patientData)
      
      const newPatient: Patient = {
        id: patientRef.id,
        ...patientData,
      }

      // Log CHW activity
      await addDoc(collection(db, 'chw-logs'), {
        chwId: chwId,
        patientId: patientRef.id,
        action: 'registration',
        location: currentLocation ? new GeoPoint(currentLocation.latitude, currentLocation.longitude) : new GeoPoint(0, 0),
        description: `Registered new patient: ${data.name}`,
        followUpRequired: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Set success state
      setRegisteredPatient(newPatient)
      setRegistrationSuccess(true)
      setQrCodeGenerated(true)
      
      // Call completion callback
      onRegistrationComplete(newPatient)
      
    } catch (error) {
      console.error('Error registering patient:', error)
      alert('Failed to register patient. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle QR code download
  const downloadQRCode = () => {
    if (!registeredPatient) return
    
    const svg = document.getElementById('patient-qr-code')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `${registeredPatient.name}-QR-${registeredPatient.qrId}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  // Copy QR ID to clipboard
  const copyQRId = async () => {
    if (registeredPatient?.qrId) {
      try {
        await navigator.clipboard.writeText(registeredPatient.qrId)
        alert('QR ID copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy QR ID:', error)
      }
    }
  }

  // Reset form and start new registration
  const startNewRegistration = () => {
    setRegistrationSuccess(false)
    setRegisteredPatient(null)
    setQrCodeGenerated(false)
    reset()
  }

  if (registrationSuccess && registeredPatient) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
          <CardDescription>
            Patient has been registered and QR code generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{registeredPatient.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Age:</span>
                <p className="font-medium">{registeredPatient.age} years</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{registeredPatient.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Gender:</span>
                <p className="font-medium capitalize">{registeredPatient.gender}</p>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="text-center space-y-4">
            <h3 className="font-semibold">Patient QR Code</h3>
            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-muted-foreground/20 inline-block">
              <QRCode
                id="patient-qr-code"
                value={registeredPatient.qrId}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 200 200`}
              />
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline" className="font-mono text-sm">
                {registeredPatient.qrId}
              </Badge>
              <Button size="sm" variant="outline" onClick={copyQRId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center space-x-3">
              <Button onClick={downloadQRCode} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3 pt-4">
            <Button onClick={startNewRegistration} variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Register Another Patient
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
          <UserPlus className="h-5 w-5" />
          <span>Register New Patient</span>
        </CardTitle>
        <CardDescription>
          Add a new patient to the system and generate their QR code for digital health records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter patient's full name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+254 700 000 000"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="patient@example.com (optional)"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select onValueChange={(value) => setValue("bloodType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address.street">Street Address *</Label>
                <Input
                  id="address.street"
                  {...register("address.street")}
                  placeholder="Enter street address"
                />
                {errors.address?.street && (
                  <p className="text-sm text-red-600">{errors.address.street.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.city">City *</Label>
                <Input
                  id="address.city"
                  {...register("address.city")}
                  placeholder="Enter city"
                />
                {errors.address?.city && (
                  <p className="text-sm text-red-600">{errors.address.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.state">State/County *</Label>
                <Input
                  id="address.state"
                  {...register("address.state")}
                  placeholder="Enter state or county"
                />
                {errors.address?.state && (
                  <p className="text-sm text-red-600">{errors.address.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.zipCode">ZIP/Postal Code *</Label>
                <Input
                  id="address.zipCode"
                  {...register("address.zipCode")}
                  placeholder="Enter ZIP code"
                />
                {errors.address?.zipCode && (
                  <p className="text-sm text-red-600">{errors.address.zipCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.country">Country</Label>
                <Input
                  id="address.country"
                  {...register("address.country")}
                  defaultValue="Kenya"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact.name">Contact Name *</Label>
                <Input
                  id="emergencyContact.name"
                  {...register("emergencyContact.name")}
                  placeholder="Emergency contact name"
                />
                {errors.emergencyContact?.name && (
                  <p className="text-sm text-red-600">{errors.emergencyContact.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact.relationship">Relationship *</Label>
                <Input
                  id="emergencyContact.relationship"
                  {...register("emergencyContact.relationship")}
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
                {errors.emergencyContact?.relationship && (
                  <p className="text-sm text-red-600">{errors.emergencyContact.relationship.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact.phone">Contact Phone *</Label>
                <Input
                  id="emergencyContact.phone"
                  {...register("emergencyContact.phone")}
                  placeholder="+254 700 000 000"
                />
                {errors.emergencyContact?.phone && (
                  <p className="text-sm text-red-600">{errors.emergencyContact.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact.email">Contact Email</Label>
                <Input
                  id="emergencyContact.email"
                  type="email"
                  {...register("emergencyContact.email")}
                  placeholder="contact@example.com (optional)"
                />
                {errors.emergencyContact?.email && (
                  <p className="text-sm text-red-600">{errors.emergencyContact.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Information (Optional)</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies</Label>
                <Textarea
                  id="allergies"
                  {...register("allergies")}
                  placeholder="List any known allergies, separated by commas"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                <Textarea
                  id="chronicConditions"
                  {...register("chronicConditions")}
                  placeholder="List any chronic conditions, separated by commas"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Location Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your current location will be recorded with this registration for community health tracking purposes.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Patient
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
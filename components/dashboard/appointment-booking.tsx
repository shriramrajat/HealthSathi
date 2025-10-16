"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Stethoscope, AlertCircle } from "lucide-react"
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Appointment, AppointmentBookingForm } from "@/lib/types/healthcare-models"
import { notificationTriggersService } from "@/lib/services/notification-triggers"

// Mock doctors data - in real implementation, this would come from Firestore
const mockDoctors = [
  {
    id: "doc1",
    name: "Dr. Sarah Johnson",
    specialty: "General Medicine",
    availability: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  },
  {
    id: "doc2", 
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    availability: ["10:00", "11:00", "14:30", "15:30", "16:30"],
  },
  {
    id: "doc3",
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics", 
    availability: ["08:00", "09:00", "10:00", "13:00", "14:00"],
  },
]

const appointmentTypes = [
  { value: "consultation", label: "General Consultation" },
  { value: "follow-up", label: "Follow-up Visit" },
  { value: "routine-checkup", label: "Routine Checkup" },
  { value: "emergency", label: "Emergency" },
]

const priorityLevels = [
  { value: "low", label: "Low Priority" },
  { value: "normal", label: "Normal Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent" },
]

const commonSymptoms = [
  "fever", "cough", "headache", "fatigue", "nausea", "vomiting", 
  "chest_pain", "breathing_difficulty", "dizziness", "sore_throat",
  "abdominal_pain", "back_pain", "joint_pain", "skin_rash"
]

interface AppointmentBookingProps {
  onBookingComplete?: (appointment: Appointment) => void
  onClose?: () => void
}

export default function AppointmentBooking({ onBookingComplete, onClose }: AppointmentBookingProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [appointmentType, setAppointmentType] = useState<string>("consultation")
  const [priority, setPriority] = useState<string>("normal")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState<string>("")
  
  // Available time slots based on selected doctor and date
  const [availableSlots, setAvailableSlots] = useState<string[]>([])

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]
  
  // Get maximum date (30 days from now)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateString = maxDate.toISOString().split('T')[0]

  // Update available slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const doctor = mockDoctors.find(d => d.id === selectedDoctor)
      if (doctor) {
        // In real implementation, check existing appointments for this date
        setAvailableSlots(doctor.availability)
      }
    } else {
      setAvailableSlots([])
    }
  }, [selectedDoctor, selectedDate])

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) {
      setError("User not authenticated")
      return
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create appointment date/time
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      
      // Create appointment object
      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId: user.uid,
        doctorId: selectedDoctor,
        scheduledAt: Timestamp.fromDate(appointmentDateTime),
        duration: 30, // Default 30 minutes
        type: appointmentType as Appointment['type'],
        status: 'scheduled',
        symptoms: selectedSymptoms,
        notes: notes.trim() || undefined,
        priority: priority as Appointment['priority'],
        reminderSent: false,
        // Denormalized fields for quick display
        patientName: user.name,
        patientPhone: user.phoneNumber,
        doctorName: mockDoctors.find(d => d.id === selectedDoctor)?.name,
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      const newAppointment: Appointment = {
        id: docRef.id,
        ...appointmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      // Trigger appointment booking notifications
      try {
        await notificationTriggersService.triggerAppointmentBooked(newAppointment)
        await notificationTriggersService.scheduleAppointmentReminders(newAppointment)
      } catch (notificationError) {
        console.warn('Failed to send appointment notifications:', notificationError)
        // Don't fail the booking if notifications fail
      }

      setSuccess(true)
      
      // Call callback if provided
      if (onBookingComplete) {
        onBookingComplete(newAppointment)
      }

      // Reset form after successful booking
      setTimeout(() => {
        setSelectedDoctor("")
        setSelectedDate("")
        setSelectedTime("")
        setAppointmentType("consultation")
        setPriority("normal")
        setSelectedSymptoms([])
        setNotes("")
        setSuccess(false)
        if (onClose) {
          onClose()
        }
      }, 2000)

    } catch (err) {
      console.error("Error booking appointment:", err)
      setError("Failed to book appointment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Appointment Booked Successfully!
            </h3>
            <p className="text-green-700 text-sm">
              Your appointment has been scheduled. You will receive a confirmation notification shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Book New Appointment</span>
        </CardTitle>
        <CardDescription>
          Schedule a consultation with one of our healthcare providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label htmlFor="doctor">Select Doctor *</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a healthcare provider" />
              </SelectTrigger>
              <SelectContent>
                {mockDoctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-xs text-muted-foreground">{doctor.specialty}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Appointment Date *</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              max={maxDateString}
              required
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Available Time Slots *</Label>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTime === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(slot)}
                    className="justify-center"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {slot}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please select a doctor and date to see available time slots
              </p>
            )}
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Appointment Type</Label>
            <Select value={appointmentType} onValueChange={setAppointmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <Badge 
                      variant={level.value === 'urgent' ? 'destructive' : 
                              level.value === 'high' ? 'default' : 'secondary'}
                      className="mr-2"
                    >
                      {level.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Symptoms Selection */}
          <div className="space-y-3">
            <Label>Current Symptoms (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={selectedSymptoms.includes(symptom)}
                    onCheckedChange={() => handleSymptomToggle(symptom)}
                  />
                  <Label 
                    htmlFor={symptom} 
                    className="text-sm capitalize cursor-pointer"
                  >
                    {symptom.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Describe your symptoms or concerns in detail..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={isLoading || !selectedDoctor || !selectedDate || !selectedTime}
              className="flex-1"
            >
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
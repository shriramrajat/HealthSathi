"use client"

import type React from "react"

import { useState } from "react"
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

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [prescriptionText, setPrescriptionText] = useState("")
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [consultationNotes, setConsultationNotes] = useState("")

  const todayAppointments = mockAppointments.filter((apt) => apt.date === "2024-01-15")
  const upcomingAppointments = todayAppointments.filter((apt) => apt.status !== "completed")
  const completedAppointments = todayAppointments.filter((apt) => apt.status === "completed")

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Rural Health Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Doctor</Badge>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Dr. Sarah Johnson
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Good morning, Dr. Johnson</h2>
          <p className="text-muted-foreground">
            You have {upcomingAppointments.length} appointments scheduled for today
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">{upcomingAppointments.length} pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockPatients.length}</div>
                  <p className="text-xs text-muted-foreground">Active patients</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Completed today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Issued this week</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Next Appointments</CardTitle>
                  <CardDescription>Upcoming consultations for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.symptoms}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Create Prescription
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Prescription</DialogTitle>
                        <DialogDescription>Upload or write a prescription for a patient</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePrescriptionUpload} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient">Select Patient</Label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockPatients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name} (ID: {patient.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prescription">Prescription Details</Label>
                          <Textarea
                            id="prescription"
                            placeholder="Enter prescription details..."
                            value={prescriptionText}
                            onChange={(e) => setPrescriptionText(e.target.value)}
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="file">Upload Prescription File (Optional)</Label>
                          <Input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                        </div>

                        <Button type="submit" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Create Prescription
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Consultation
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    View Patient Records
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Today's Schedule</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{appointment.patientName}</h4>
                          <Badge variant="outline">ID: {appointment.patientId}</Badge>
                          <Badge variant="outline">Age: {appointment.age}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.symptoms}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center">
                            <Stethoscope className="h-4 w-4 mr-1" />
                            {appointment.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            appointment.status === "completed"
                              ? "default"
                              : appointment.status === "confirmed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {appointment.status}
                        </Badge>
                        {appointment.status !== "completed" && (
                          <>
                            <Button size="sm" variant="outline">
                              <Video className="h-4 w-4 mr-2" />
                              Join Call
                            </Button>
                            <Button size="sm">Start Consultation</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Patient Records</h3>
              <Button>
                <User className="h-4 w-4 mr-2" />
                Add New Patient
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockPatients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{patient.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
                        </div>
                        <Badge variant="outline">Age: {patient.age}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Visit:</span>
                          <span>{patient.lastVisit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Condition:</span>
                          <span>{patient.condition}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <FileText className="h-4 w-4 mr-1" />
                          Records
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prescription Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    New Prescription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Prescription</DialogTitle>
                    <DialogDescription>Create and upload a prescription for a patient</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePrescriptionUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-select">Select Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockPatients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} (ID: {patient.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prescription-details">Prescription Details</Label>
                      <Textarea
                        id="prescription-details"
                        placeholder="Enter medications, dosage, and instructions..."
                        value={prescriptionText}
                        onChange={(e) => setPrescriptionText(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prescription-file">Upload File (Optional)</Label>
                      <Input
                        id="prescription-file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Create & Send Prescription
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Prescriptions</CardTitle>
                <CardDescription>Prescriptions issued in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">John Doe (P001)</p>
                      <p className="text-sm text-muted-foreground">Amoxicillin 500mg, Paracetamol 650mg</p>
                      <p className="text-xs text-muted-foreground">Issued: 2024-01-10</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Mary Smith (P002)</p>
                      <p className="text-sm text-muted-foreground">Metformin 500mg, Lisinopril 10mg</p>
                      <p className="text-xs text-muted-foreground">Issued: 2024-01-12</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Video Consultations</h3>
              <Button>
                <Video className="h-4 w-4 mr-2" />
                Start New Consultation
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Consultations</CardTitle>
                  <CardDescription>Ongoing video calls with patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active consultations</p>
                    <Button className="mt-4">Start Video Call</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Consultation Notes</CardTitle>
                  <CardDescription>Add notes for current consultation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter consultation notes, observations, and recommendations..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    rows={6}
                  />
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Consultations</CardTitle>
                <CardDescription>Completed video consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.symptoms}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed: {appointment.date} at {appointment.time}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Notes
                        </Button>
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4 mr-2" />
                          Recording
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

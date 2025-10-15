"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
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
  MapPin,
  Phone,
  Plus,
  Stethoscope,
  User,
  Users,
  Activity,
  AlertCircle,
} from "lucide-react"

// Mock data
const mockPatients = [
  {
    id: "P001",
    name: "John Doe",
    age: 35,
    village: "Riverside Village",
    phone: "+1234567890",
    lastVisit: "2024-01-10",
    condition: "Hypertension",
    status: "active",
  },
  {
    id: "P002",
    name: "Mary Smith",
    age: 42,
    village: "Hillside Community",
    phone: "+1234567891",
    lastVisit: "2024-01-08",
    condition: "Diabetes",
    status: "follow-up",
  },
  {
    id: "P003",
    name: "Robert Johnson",
    age: 28,
    village: "Riverside Village",
    phone: "+1234567892",
    lastVisit: "2024-01-12",
    condition: "Migraine",
    status: "referred",
  },
]

const mockCases = [
  {
    id: "C001",
    patientName: "John Doe",
    village: "Riverside Village",
    caseType: "Routine Checkup",
    symptoms: "Blood pressure monitoring",
    date: "2024-01-15",
    status: "completed",
    notes: "BP stable, medication compliance good",
  },
  {
    id: "C002",
    patientName: "Mary Smith",
    village: "Hillside Community",
    caseType: "Emergency",
    symptoms: "Severe headache, dizziness",
    date: "2024-01-14",
    status: "referred",
    notes: "Referred to district hospital for further evaluation",
  },
  {
    id: "C003",
    patientName: "Sarah Wilson",
    village: "Mountain View",
    caseType: "Preventive Care",
    symptoms: "Vaccination follow-up",
    date: "2024-01-13",
    status: "scheduled",
    notes: "Second dose of hepatitis B vaccine due",
  },
]

const mockAppointments = [
  {
    id: "A001",
    patientName: "John Doe",
    doctorName: "Dr. Sarah Johnson",
    date: "2024-01-16",
    time: "10:00 AM",
    type: "consultation",
    status: "scheduled",
  },
  {
    id: "A002",
    patientName: "Mary Smith",
    doctorName: "Dr. Michael Chen",
    date: "2024-01-17",
    time: "2:30 PM",
    type: "follow-up",
    status: "confirmed",
  },
]

export default function CHWDashboard() {
  const { user } = useAuth()
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    village: "",
    phone: "",
    condition: "",
  })

  const [newCase, setNewCase] = useState({
    patientName: "",
    village: "",
    caseType: "",
    symptoms: "",
    notes: "",
  })

  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState("")

  const villages = ["Riverside Village", "Hillside Community", "Mountain View", "Valley Springs"]
  const doctors = ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Davis"]
  const caseTypes = ["Routine Checkup", "Emergency", "Preventive Care", "Follow-up", "Vaccination"]

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Register patient in Firestore
    console.log("Registering patient:", newPatient)
    setNewPatient({ name: "", age: "", village: "", phone: "", condition: "" })
  }

  const handleLogCase = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Log case in Firestore
    console.log("Logging case:", newCase)
    setNewCase({ patientName: "", village: "", caseType: "", symptoms: "", notes: "" })
  }

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Book appointment in Firestore
    console.log("Booking appointment:", { selectedPatient, selectedDoctor })
    setSelectedPatient("")
    setSelectedDoctor("")
  }

  const activeCases = mockCases.filter((c) => c.status !== "completed")
  const completedCases = mockCases.filter((c) => c.status === "completed")
  const upcomingAppointments = mockAppointments.filter((a) => a.status === "scheduled" || a.status === "confirmed")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Community Health Dashboard</h2>
        <p className="text-muted-foreground">
          Supporting rural communities with healthcare coordination and patient assistance
        </p>
      </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockPatients.length}</div>
                  <p className="text-xs text-muted-foreground">Under care</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCases.length}</div>
                  <p className="text-xs text-muted-foreground">Ongoing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Villages Served</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{villages.length}</div>
                  <p className="text-xs text-muted-foreground">Communities</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cases</CardTitle>
                  <CardDescription>Latest patient cases and interventions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockCases.slice(0, 3).map((case_) => (
                    <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{case_.patientName}</p>
                        <p className="text-sm text-muted-foreground">{case_.caseType}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {case_.village}
                        </div>
                      </div>
                      <Badge
                        variant={
                          case_.status === "completed"
                            ? "default"
                            : case_.status === "referred"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {case_.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and patient assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Register New Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Register New Patient</DialogTitle>
                        <DialogDescription>Add a new patient to the community health system</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRegisterPatient} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient-name">Full Name</Label>
                          <Input
                            id="patient-name"
                            value={newPatient.name}
                            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="patient-age">Age</Label>
                            <Input
                              id="patient-age"
                              type="number"
                              value={newPatient.age}
                              onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="patient-village">Village</Label>
                            <Select
                              value={newPatient.village}
                              onValueChange={(value) => setNewPatient({ ...newPatient, village: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select village" />
                              </SelectTrigger>
                              <SelectContent>
                                {villages.map((village) => (
                                  <SelectItem key={village} value={village}>
                                    {village}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="patient-phone">Phone Number</Label>
                          <Input
                            id="patient-phone"
                            value={newPatient.phone}
                            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="patient-condition">Medical Condition (Optional)</Label>
                          <Input
                            id="patient-condition"
                            value={newPatient.condition}
                            onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Register Patient
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                        <DialogDescription>Schedule a consultation for a patient</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBookAppointment} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointment-patient">Select Patient</Label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockPatients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name} - {patient.village}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appointment-doctor">Select Doctor</Label>
                          <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor} value={doctor}>
                                  {doctor}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="appointment-date">Date</Label>
                            <Input id="appointment-date" type="date" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="appointment-time">Time</Label>
                            <Input id="appointment-time" type="time" required />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Appointment
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Log New Case
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Log New Case</DialogTitle>
                        <DialogDescription>Record a new patient case or intervention</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleLogCase} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="case-patient">Patient Name</Label>
                          <Input
                            id="case-patient"
                            value={newCase.patientName}
                            onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="case-village">Village</Label>
                            <Select
                              value={newCase.village}
                              onValueChange={(value) => setNewCase({ ...newCase, village: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select village" />
                              </SelectTrigger>
                              <SelectContent>
                                {villages.map((village) => (
                                  <SelectItem key={village} value={village}>
                                    {village}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="case-type">Case Type</Label>
                            <Select
                              value={newCase.caseType}
                              onValueChange={(value) => setNewCase({ ...newCase, caseType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {caseTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="case-symptoms">Symptoms/Description</Label>
                          <Textarea
                            id="case-symptoms"
                            value={newCase.symptoms}
                            onChange={(e) => setNewCase({ ...newCase, symptoms: e.target.value })}
                            rows={3}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="case-notes">Notes/Action Taken</Label>
                          <Textarea
                            id="case-notes"
                            value={newCase.notes}
                            onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Log Case
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Patient Registry</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register New Patient</DialogTitle>
                    <DialogDescription>Add a new patient to the community registry</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterPatient} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-age">Age</Label>
                        <Input
                          id="reg-age"
                          type="number"
                          value={newPatient.age}
                          onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-village">Village</Label>
                        <Select
                          value={newPatient.village}
                          onValueChange={(value) => setNewPatient({ ...newPatient, village: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select village" />
                          </SelectTrigger>
                          <SelectContent>
                            {villages.map((village) => (
                              <SelectItem key={village} value={village}>
                                {village}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <Input
                        id="reg-phone"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-condition">Medical Condition</Label>
                      <Input
                        id="reg-condition"
                        value={newPatient.condition}
                        onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Register Patient
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{patient.village}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{patient.phone}</span>
                        </div>
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
                          <Stethoscope className="h-4 w-4 mr-1" />
                          Visit
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

          <TabsContent value="cases" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Case Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Log New Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Log New Case</DialogTitle>
                    <DialogDescription>Record a patient case or health intervention</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogCase} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="log-patient">Patient Name</Label>
                      <Input
                        id="log-patient"
                        value={newCase.patientName}
                        onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="log-village">Village</Label>
                        <Select
                          value={newCase.village}
                          onValueChange={(value) => setNewCase({ ...newCase, village: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select village" />
                          </SelectTrigger>
                          <SelectContent>
                            {villages.map((village) => (
                              <SelectItem key={village} value={village}>
                                {village}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="log-type">Case Type</Label>
                        <Select
                          value={newCase.caseType}
                          onValueChange={(value) => setNewCase({ ...newCase, caseType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {caseTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="log-symptoms">Symptoms/Description</Label>
                      <Textarea
                        id="log-symptoms"
                        value={newCase.symptoms}
                        onChange={(e) => setNewCase({ ...newCase, symptoms: e.target.value })}
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="log-notes">Notes/Action Taken</Label>
                      <Textarea
                        id="log-notes"
                        value={newCase.notes}
                        onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Log Case
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {mockCases.map((case_) => (
                <Card key={case_.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{case_.patientName}</h4>
                          <Badge variant="outline">{case_.caseType}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {case_.village}
                          <span className="mx-2">•</span>
                          <Clock className="h-4 w-4 mr-1" />
                          {case_.date}
                        </div>
                        <p className="text-sm">{case_.symptoms}</p>
                        {case_.notes && <p className="text-sm text-muted-foreground italic">{case_.notes}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            case_.status === "completed"
                              ? "default"
                              : case_.status === "referred"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {case_.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Appointment Coordination</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Book Patient Appointment</DialogTitle>
                    <DialogDescription>Schedule a consultation for a community member</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="book-patient">Select Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockPatients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} - {patient.village}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="book-doctor">Select Doctor</Label>
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor} value={doctor}>
                              {doctor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="book-date">Date</Label>
                        <Input id="book-date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="book-time">Time</Label>
                        <Input id="book-time" type="time" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {mockAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{appointment.patientName}</h4>
                        <p className="text-sm text-muted-foreground">with {appointment.doctorName}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {appointment.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Remind
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="outreach" className="space-y-6">
            <h3 className="text-lg font-semibold">Community Outreach</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Village Statistics</CardTitle>
                  <CardDescription>Health metrics by community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {villages.map((village) => {
                    const villagePatients = mockPatients.filter((p) => p.village === village)
                    const villageCases = mockCases.filter((c) => c.village === village)
                    return (
                      <div key={village} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{village}</p>
                          <p className="text-sm text-muted-foreground">
                            {villagePatients.length} patients • {villageCases.length} cases
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <MapPin className="h-4 w-4 mr-2" />
                          Visit
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Alerts</CardTitle>
                  <CardDescription>Community health notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg border-orange-200">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium">Vaccination Drive</p>
                      <p className="text-sm text-muted-foreground">
                        Hepatitis B vaccines available at Riverside Village
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg border-blue-200">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Health Screening</p>
                      <p className="text-sm text-muted-foreground">Diabetes screening scheduled for Mountain View</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg border-green-200">
                    <AlertCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Health Education</p>
                      <p className="text-sm text-muted-foreground">Hygiene workshop at Hillside Community Center</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  )
}

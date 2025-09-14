"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  FileText,
  Heart,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  Thermometer,
  User,
  Video,
} from "lucide-react"
import QRCode from "react-qr-code"

// Mock data
const mockAppointments = [
  {
    id: "1",
    doctorName: "Dr. Sarah Johnson",
    specialty: "General Medicine",
    date: "2024-01-15",
    time: "10:00 AM",
    status: "confirmed",
  },
  {
    id: "2",
    doctorName: "Dr. Michael Chen",
    specialty: "Cardiology",
    date: "2024-01-20",
    time: "2:30 PM",
    status: "pending",
  },
]

const mockPrescriptions = [
  {
    id: "1",
    doctorName: "Dr. Sarah Johnson",
    date: "2024-01-10",
    medications: ["Amoxicillin 500mg", "Paracetamol 650mg"],
    instructions: "Take twice daily after meals",
  },
]

const mockPharmacies = [
  {
    id: "1",
    name: "Central Pharmacy",
    location: "Main Street, Village Center",
    distance: "0.5 km",
    stock: { Amoxicillin: 25, Paracetamol: 50, Aspirin: 30 },
  },
  {
    id: "2",
    name: "Health Plus Pharmacy",
    location: "Market Road",
    distance: "1.2 km",
    stock: { Amoxicillin: 10, Insulin: 15, Metformin: 20 },
  },
]

const symptomRules = {
  "fever+cough": "Possible flu. Rest, fluids, and monitor symptoms. Consult doctor if symptoms worsen.",
  "fever+breathing_difficulty": "Urgent. Consult doctor immediately or visit nearest health center.",
  "headache+fatigue": "Likely dehydration or stress. Rest, drink fluids, and avoid screen time.",
  chest_pain: "Seek immediate medical attention. This could be serious.",
  "nausea+vomiting": "Possible food poisoning or stomach flu. Stay hydrated and rest.",
}

export default function PatientDashboard() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [symptomAdvice, setSymptomAdvice] = useState<string>("")
  const [searchMedicine, setSearchMedicine] = useState("")

  const symptoms = [
    "fever",
    "cough",
    "headache",
    "fatigue",
    "nausea",
    "vomiting",
    "chest_pain",
    "breathing_difficulty",
    "dizziness",
    "sore_throat",
  ]

  const handleSymptomCheck = () => {
    const symptomKey = selectedSymptoms.sort().join("+")
    const advice =
      symptomRules[symptomKey as keyof typeof symptomRules] ||
      "Based on your symptoms, consider consulting with a healthcare provider for proper evaluation."
    setSymptomAdvice(advice)
  }

  const filteredPharmacies = mockPharmacies.filter(
    (pharmacy) =>
      searchMedicine === "" ||
      Object.keys(pharmacy.stock).some((med) => med.toLowerCase().includes(searchMedicine.toLowerCase())),
  )

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
              <Badge variant="secondary">Patient</Badge>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                John Doe
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, John</h2>
          <p className="text-muted-foreground">Manage your health and connect with healthcare providers</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="symptoms">Symptom Checker</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Jan 15</div>
                  <p className="text-xs text-muted-foreground">Dr. Sarah Johnson at 10:00 AM</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Current medications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Good</div>
                  <p className="text-xs text-muted-foreground">Based on recent checkups</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Consultation
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Check Symptoms
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest health interactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Prescription received</p>
                      <p className="text-xs text-muted-foreground">From Dr. Sarah Johnson</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Appointment confirmed</p>
                      <p className="text-xs text-muted-foreground">Jan 15, 10:00 AM</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 week ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Symptom Checker</CardTitle>
                <CardDescription>
                  Select your symptoms to get preliminary health advice. This is not a substitute for professional
                  medical consultation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSymptoms([...selectedSymptoms, symptom])
                          } else {
                            setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom))
                          }
                        }}
                      />
                      <Label htmlFor={symptom} className="capitalize">
                        {symptom.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSymptomCheck} disabled={selectedSymptoms.length === 0}>
                  <Thermometer className="h-4 w-4 mr-2" />
                  Check Symptoms
                </Button>

                {symptomAdvice && (
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Health Advice:</h4>
                      <p className="text-sm">{symptomAdvice}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        * This is preliminary advice. Please consult a healthcare professional for proper diagnosis.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Appointments</h3>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
            </div>

            <div className="space-y-4">
              {mockAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{appointment.doctorName}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
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
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-6">
            <h3 className="text-lg font-semibold">Your Prescriptions</h3>

            <div className="space-y-4">
              {mockPrescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Prescribed by {prescription.doctorName}</h4>
                          <p className="text-sm text-muted-foreground">{prescription.date}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Medications:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {prescription.medications.map((med, index) => (
                            <li key={index} className="text-sm">
                              {med}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Instructions:</h5>
                        <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pharmacy" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Find Medicines</h3>

              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search for medicine..."
                    value={searchMedicine}
                    onChange={(e) => setSearchMedicine(e.target.value)}
                  />
                </div>
                <Button>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPharmacies.map((pharmacy) => (
                <Card key={pharmacy.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{pharmacy.name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {pharmacy.location} • {pharmacy.distance}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Available Stock:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(pharmacy.stock).map(([medicine, quantity]) => (
                            <div key={medicine} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="text-sm">{medicine}</span>
                              <Badge variant="outline">{quantity}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic health profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value="John Doe" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value="john.doe@email.com" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input value="35" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value="Patient" readOnly />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QR ID</CardTitle>
                  <CardDescription>Your unique patient identifier</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCode value="QR-DEMO123" size={150} />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm">QR-DEMO123</p>
                    <p className="text-xs text-muted-foreground">Show this to healthcare providers</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

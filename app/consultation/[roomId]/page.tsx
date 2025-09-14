"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import VideoConsultation from "@/components/video-consultation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Heart } from "lucide-react"

// Mock data - in real app this would come from authentication context
const mockUser = {
  role: "patient" as const,
  name: "John Doe",
}

const mockAppointment = {
  patientName: "John Doe",
  doctorName: "Dr. Sarah Johnson",
  date: "2024-01-15",
  time: "10:00 AM",
}

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  const handleJoinCall = () => {
    setIsJoining(true)
    // Simulate joining delay
    setTimeout(() => {
      setIsJoining(false)
      setHasJoined(true)
    }, 1000)
  }

  const handleEndCall = () => {
    setHasJoined(false)
    router.push("/dashboard/patient")
  }

  if (hasJoined) {
    return (
      <div className="min-h-screen bg-background p-4">
        <VideoConsultation
          roomId={roomId}
          patientName={mockAppointment.patientName}
          doctorName={mockAppointment.doctorName}
          userRole={mockUser.role}
          onEndCall={handleEndCall}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Heart className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Video Consultation</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Join Video Consultation</CardTitle>
            <CardDescription>You're about to join a video consultation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <h3 className="font-semibold">Consultation Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Patient:</span>
                  <p className="font-medium">{mockAppointment.patientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Doctor:</span>
                  <p className="font-medium">{mockAppointment.doctorName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{mockAppointment.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium">{mockAppointment.time}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Before you join:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Test your camera and microphone</li>
                <li>• Find a quiet, well-lit space</li>
                <li>• Have your medical records ready if needed</li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Room ID: <span className="font-mono font-medium">{roomId}</span>
              </p>

              <Button onClick={handleJoinCall} size="lg" className="w-full" disabled={isJoining}>
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </>
                ) : (
                  "Join Video Call"
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By joining this call, you agree to our privacy policy and terms of service.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

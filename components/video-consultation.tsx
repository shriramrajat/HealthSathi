"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Users, MessageSquare, FileText, Camera } from "lucide-react"

interface VideoConsultationProps {
  roomId: string
  patientName?: string
  doctorName?: string
  onEndCall?: () => void
  userRole: "patient" | "doctor"
}

export default function VideoConsultation({
  roomId,
  patientName,
  doctorName,
  onEndCall,
  userRole,
}: VideoConsultationProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: string; message: string; timestamp: Date }>
  >([])
  const [newMessage, setNewMessage] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [consultationNotes, setConsultationNotes] = useState("")
  const [callDuration, setCallDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callStartTime = useRef<Date | null>(null)

  // Mock Jitsi Meet integration
  useEffect(() => {
    if (isCallActive) {
      callStartTime.current = new Date()
      const timer = setInterval(() => {
        if (callStartTime.current) {
          setCallDuration(Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000))
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isCallActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startCall = async () => {
    setIsConnecting(true)

    // Simulate connection delay
    setTimeout(() => {
      setIsCallActive(true)
      setIsConnecting(false)
      setParticipants([userRole === "patient" ? patientName || "Patient" : doctorName || "Doctor"])

      // Mock getting user media
      if (localVideoRef.current) {
        // In a real implementation, this would be the actual video stream
        localVideoRef.current.src = "/video-call-placeholder.jpg"
      }
    }, 2000)
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsConnecting(false)
    callStartTime.current = null
    setCallDuration(0)
    onEndCall?.()
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
    // In real implementation, this would control the video track
  }

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled)
    // In real implementation, this would control the audio track
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: userRole === "patient" ? patientName || "Patient" : doctorName || "Doctor",
        message: newMessage,
        timestamp: new Date(),
      }
      setChatMessages([...chatMessages, message])
      setNewMessage("")
    }
  }

  if (!isCallActive && !isConnecting) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Video className="h-6 w-6 mr-2" />
            Video Consultation
          </CardTitle>
          <CardDescription>
            {userRole === "patient"
              ? `Connect with ${doctorName || "your doctor"}`
              : `Consultation with ${patientName || "patient"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Video className="h-16 w-16 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <p className="font-medium">Room ID: {roomId}</p>
              <p className="text-sm text-muted-foreground">
                {userRole === "patient" ? "Click start to begin your consultation" : "Start the video call when ready"}
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={toggleVideo} variant={isVideoEnabled ? "default" : "secondary"} size="sm">
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button onClick={toggleAudio} variant={isAudioEnabled ? "default" : "secondary"} size="sm">
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </div>

            <Button onClick={startCall} size="lg" className="w-full">
              <Video className="h-5 w-5 mr-2" />
              Start Video Call
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isConnecting) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium">Connecting to video call...</p>
            <p className="text-sm text-muted-foreground">Please wait while we establish the connection</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Call Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live
              </Badge>
              <div>
                <p className="font-medium">
                  {userRole === "patient" ? `Consultation with ${doctorName}` : `Patient: ${patientName}`}
                </p>
                <p className="text-sm text-muted-foreground">Duration: {formatDuration(callDuration)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {participants.length + 1}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Video Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Remote Video */}
          <Card className="relative">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden">
                <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
                <div className="absolute bottom-4 left-4">
                  <Badge variant="secondary">{userRole === "patient" ? doctorName : patientName}</Badge>
                </div>
                {/* Placeholder for remote video */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">{userRole === "patient" ? doctorName : patientName}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Video (Picture-in-Picture) */}
          <div className="relative">
            <Card className="absolute bottom-4 right-4 w-48 z-10">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-800 rounded-lg relative overflow-hidden">
                  <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  </div>
                  {/* Placeholder for local video */}
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                      <VideoOff className="h-8 w-8 text-white opacity-50" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call Controls */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "destructive"}
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={() => setShowChat(!showChat)}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button variant="outline" size="lg" className="rounded-full w-12 h-12 p-0 bg-transparent">
                  <Settings className="h-5 w-5" />
                </Button>

                <Button onClick={endCall} variant="destructive" size="lg" className="rounded-full w-12 h-12 p-0">
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Chat */}
          {showChat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-48 overflow-y-auto space-y-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <p className="font-medium text-xs text-muted-foreground">{msg.sender}</p>
                      <p className="bg-muted p-2 rounded text-xs">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <Button onClick={sendMessage} size="sm">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultation Notes (Doctor Only) */}
          {userRole === "doctor" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consultation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Add consultation notes..."
                  rows={6}
                  className="text-sm"
                />
                <Button size="sm" className="w-full mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Call Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Call Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room ID:</span>
                <span className="font-mono">{roomId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{formatDuration(callDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participants:</span>
                <span>{participants.length + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <Badge variant="outline" className="text-xs">
                  HD
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

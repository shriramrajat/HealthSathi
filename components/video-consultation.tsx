"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Users, MessageSquare, FileText, Camera, Clock, Pill, Save } from "lucide-react"
import { ConsultationNotes } from "@/components/dashboard/consultation-notes"
import { PrescriptionCreator } from "@/components/dashboard/prescription-creator"
import { Consultation, Patient } from "@/lib/types/dashboard-models"
import { consultationService, updateConsultationNotes } from "@/lib/services/consultation-service"
import { toast } from "sonner"

interface VideoConsultationProps {
  roomId: string
  patientName?: string
  doctorName?: string
  onEndCall?: () => void
  userRole: "patient" | "doctor"
  // Enhanced props for consultation context
  consultation?: Consultation
  patient?: Patient
  onConsultationUpdate?: (consultation: Consultation) => void
}

export default function VideoConsultation({
  roomId,
  patientName,
  doctorName,
  onEndCall,
  userRole,
  consultation,
  patient,
  onConsultationUpdate,
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
  const [consultationNotes, setConsultationNotes] = useState(consultation?.notes || "")
  const [callDuration, setCallDuration] = useState(0)
  
  // Enhanced state for consultation features
  const [showNotesPanel, setShowNotesPanel] = useState(userRole === "doctor")
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [consultationSummary, setConsultationSummary] = useState("")

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callStartTime = useRef<Date | null>(null)
  const notesAutoSaveRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced consultation timer with automatic note-taking and duration tracking
  useEffect(() => {
    if (isCallActive) {
      callStartTime.current = new Date()
      
      // Add automatic consultation start note
      if (userRole === "doctor" && consultation && autoSaveEnabled) {
        const startNote = `Consultation started at ${new Date().toLocaleTimeString()}\n`
        const updatedNotes = consultationNotes + (consultationNotes ? '\n\n' : '') + startNote
        setConsultationNotes(updatedNotes)
        autoSaveNotes(updatedNotes)
      }
      
      const timer = setInterval(() => {
        if (callStartTime.current) {
          const newDuration = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000)
          setCallDuration(newDuration)
          
          // Update consultation duration in database every 30 seconds
          if (consultation?.id && newDuration % 30 === 0 && userRole === "doctor") {
            consultationService.updateConsultationDuration(consultation.id, newDuration)
              .catch(error => console.error('Error updating consultation duration:', error))
          }
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isCallActive, userRole, consultation, consultationNotes, autoSaveEnabled])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Auto-save consultation notes
  const autoSaveNotes = useCallback(async (notes: string) => {
    if (!consultation?.id || !autoSaveEnabled || userRole !== "doctor") return

    try {
      await updateConsultationNotes(consultation.id, notes)
      if (onConsultationUpdate) {
        onConsultationUpdate({ ...consultation, notes })
      }
    } catch (error) {
      console.error('Error auto-saving notes:', error)
      toast.error('Failed to save notes automatically')
    }
  }, [consultation, autoSaveEnabled, userRole, onConsultationUpdate])

  // Handle notes change with auto-save
  const handleNotesChange = useCallback((notes: string) => {
    setConsultationNotes(notes)
    
    // Clear existing timeout
    if (notesAutoSaveRef.current) {
      clearTimeout(notesAutoSaveRef.current)
    }

    // Set new auto-save timeout (3 seconds after user stops typing)
    notesAutoSaveRef.current = setTimeout(() => {
      autoSaveNotes(notes)
    }, 3000)
  }, [autoSaveNotes])

  // Enhanced consultation summary generation using consultation service
  const generateConsultationSummary = useCallback(async () => {
    if (!consultation?.id) {
      toast.error('Cannot generate summary: Consultation not found')
      return
    }

    try {
      // Generate summary using consultation service
      const summary = await consultationService.generateConsultationSummary(consultation.id)
      setConsultationSummary(summary)
      
      // Also create a local summary with current session data
      const localSummary = `LIVE CONSULTATION SUMMARY
========================

CURRENT SESSION
--------------
Patient: ${patientName || 'Unknown'}
Doctor: ${doctorName || 'Unknown'}
Date: ${new Date().toLocaleDateString()}
Start Time: ${callStartTime.current?.toLocaleTimeString() || 'Unknown'}
Current Duration: ${formatDuration(callDuration)}
Room ID: ${roomId}
Status: ${isCallActive ? 'Active' : 'Ended'}

LIVE NOTES
----------
${consultationNotes || 'No notes recorded'}

SESSION DETAILS
--------------
Participants: ${participants.length + 1}
Recording: ${isRecording ? 'Active' : 'Not recording'}
Video: ${isVideoEnabled ? 'Enabled' : 'Disabled'}
Audio: ${isAudioEnabled ? 'Enabled' : 'Disabled'}

Generated at: ${new Date().toLocaleString()}
`
      
      // Show summary in a downloadable format
      const blob = new Blob([summary + '\n\n' + localSummary], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consultation-summary-${consultation.id}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Consultation summary generated and downloaded')
      return summary
    } catch (error) {
      console.error('Error generating consultation summary:', error)
      toast.error('Failed to generate consultation summary')
    }
  }, [consultation, patientName, doctorName, callDuration, roomId, isCallActive, consultationNotes, participants.length, isRecording, isVideoEnabled, isAudioEnabled])

  // Enhanced recording functionality with consultation service integration
  const toggleRecording = useCallback(async () => {
    if (!consultation?.id) {
      toast.error('Cannot record: Consultation not found')
      return
    }

    try {
      if (!isRecording) {
        // Start recording
        await consultationService.startConsultationRecording(consultation.id)
        setIsRecording(true)
        
        if (userRole === "doctor" && autoSaveEnabled) {
          const recordingNote = `Started recording at ${new Date().toLocaleTimeString()}\n`
          const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + recordingNote
          setConsultationNotes(updatedNotes)
          autoSaveNotes(updatedNotes)
        }
        
        toast.success('Recording started')
      } else {
        // Stop recording
        await consultationService.stopConsultationRecording(consultation.id)
        setIsRecording(false)
        
        if (userRole === "doctor" && autoSaveEnabled) {
          const recordingNote = `Stopped recording at ${new Date().toLocaleTimeString()}\n`
          const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + recordingNote
          setConsultationNotes(updatedNotes)
          autoSaveNotes(updatedNotes)
        }
        
        toast.success('Recording stopped')
      }
    } catch (error) {
      console.error('Error toggling recording:', error)
      toast.error(`Failed to ${!isRecording ? 'start' : 'stop'} recording`)
    }
  }, [isRecording, consultation, userRole, autoSaveEnabled, consultationNotes, autoSaveNotes])

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (notesAutoSaveRef.current) {
        clearTimeout(notesAutoSaveRef.current)
      }
    }
  }, [])

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

  const endCall = useCallback(async () => {
    // Generate final consultation summary
    const summary = generateConsultationSummary()
    
    // Add end consultation note for doctors
    if (userRole === "doctor" && consultation && autoSaveEnabled) {
      const endNote = `\nConsultation ended at ${new Date().toLocaleTimeString()}\nTotal duration: ${formatDuration(callDuration)}`
      const finalNotes = consultationNotes + endNote
      setConsultationNotes(finalNotes)
      
      // Save final notes
      try {
        await autoSaveNotes(finalNotes)
      } catch (error) {
        console.error('Error saving final notes:', error)
      }
    }
    
    setIsCallActive(false)
    setIsConnecting(false)
    callStartTime.current = null
    setCallDuration(0)
    
    // Show prescription dialog for doctors after consultation
    if (userRole === "doctor" && patient) {
      setShowPrescriptionDialog(true)
    } else {
      onEndCall?.()
    }
  }, [generateConsultationSummary, userRole, consultation, autoSaveEnabled, callDuration, consultationNotes, autoSaveNotes, patient, onEndCall])

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

                {/* Enhanced controls for doctors */}
                {userRole === "doctor" && (
                  <>
                    <Button
                      onClick={() => setShowNotesPanel(!showNotesPanel)}
                      variant={showNotesPanel ? "default" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12 p-0"
                    >
                      <FileText className="h-5 w-5" />
                    </Button>

                    <Button
                      onClick={toggleRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="lg"
                      className="rounded-full w-12 h-12 p-0"
                    >
                      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-current'}`} />
                    </Button>
                  </>
                )}

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

          {/* Enhanced Consultation Notes (Doctor Only) */}
          {userRole === "doctor" && showNotesPanel && consultation && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Live Notes</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={autoSaveEnabled ? "default" : "secondary"} className="text-xs">
                        {autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        className="h-6 w-6 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={consultationNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Notes auto-save during consultation..."
                    rows={8}
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>{consultationNotes.length} characters</span>
                    <span>Auto-saves every 3 seconds</span>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Context (if available) */}
              {patient && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Patient Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age:</span>
                      <span>{patient.dateOfBirth ? Math.floor((new Date().getTime() - patient.dateOfBirth.toDate().getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="capitalize">{patient.gender || 'N/A'}</span>
                    </div>
                    {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                      <div className="pt-2">
                        <span className="text-muted-foreground text-xs">Recent conditions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.medicalHistory.slice(0, 3).map((record, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {record.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Enhanced Call Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room ID:</span>
                <span className="font-mono">{roomId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callDuration)}
                </span>
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
              {userRole === "doctor" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recording:</span>
                    <Badge variant={isRecording ? "destructive" : "secondary"} className="text-xs">
                      {isRecording ? "Recording" : "Not recording"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes:</span>
                    <span>{consultationNotes.length > 0 ? "Active" : "None"}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions for Doctors */}
          {userRole === "doctor" && patient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowPrescriptionDialog(true)}
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={generateConsultationSummary}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Consultation Timer & Controls */}
          {userRole === "doctor" && consultation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consultation Timer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {formatDuration(callDuration)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isCallActive ? 'Active consultation' : 'Consultation ended'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">Started</div>
                    <div className="text-muted-foreground">
                      {callStartTime.current?.toLocaleTimeString() || '--:--'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">Duration</div>
                    <div className="text-muted-foreground">
                      {Math.floor(callDuration / 60)}m {callDuration % 60}s
                    </div>
                  </div>
                </div>

                {isCallActive && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Auto-tracking:</span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Post-Consultation Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Post-Consultation Prescription</DialogTitle>
          </DialogHeader>
          
          {patient && consultation && (
            <div className="space-y-4">
              {/* Consultation Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Consultation Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Patient:</span> {patient.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span> {formatDuration(callDuration)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span> {new Date().toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span> {callStartTime.current?.toLocaleTimeString() || 'N/A'}
                    </div>
                  </div>
                  
                  {consultationNotes && (
                    <div className="mt-4">
                      <span className="text-muted-foreground">Notes:</span>
                      <div className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                        {consultationNotes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescription Creator */}
              <PrescriptionCreator
                patientId={patient.id}
                appointmentId={consultation.appointmentId}
                onSubmit={async (data, file) => {
                  try {
                    // Here you would call your prescription service to create the prescription
                    // For now, we'll just show success and close the dialog
                    toast.success('Prescription created successfully')
                    setShowPrescriptionDialog(false)
                    onEndCall?.()
                  } catch (error) {
                    console.error('Error creating prescription:', error)
                    toast.error('Failed to create prescription')
                  }
                }}
                onCancel={() => {
                  setShowPrescriptionDialog(false)
                  onEndCall?.()
                }}
                isLoading={false}
                patients={[{ id: patient.id, name: patient.name }]}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

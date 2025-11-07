"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, VideoOff, Mic, MicOff, PhoneOff, Settings, Users, MessageSquare, FileText, Camera, Clock, Pill, Save, Monitor } from "lucide-react"
import { ConsultationNotes } from "@/components/dashboard/consultation-notes"
import { PrescriptionCreator } from "@/components/dashboard/prescription-creator"
import { Consultation, Patient } from "@/lib/types/dashboard-models"
import { consultationService, updateConsultationNotes } from "@/lib/services/consultation-service"
import { jitsiService, JitsiService, JitsiEventHandlers } from "@/lib/services/jitsi-service"
import { notificationTriggersService } from "@/lib/services/notification-triggers"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

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
  const t = useTranslations('consultation.videoConsultation')
  const tCommon = useTranslations('common')
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: string; message: string; timestamp: Date }>
  >([])
  const [newMessage, setNewMessage] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [consultationNotes, setConsultationNotes] = useState(consultation?.notes || "")
  const [callDuration, setCallDuration] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<{
    audioInput: any[]
    audioOutput: any[]
    videoInput: any[]
  }>({ audioInput: [], audioOutput: [], videoInput: [] })
  const [selectedDevices, setSelectedDevices] = useState<{
    audioInput?: string
    audioOutput?: string
    videoInput?: string
  }>({})
  const [showSettings, setShowSettings] = useState(false)
  const [showPostCallSummary, setShowPostCallSummary] = useState(false)
  const [postCallSummaryData, setPostCallSummaryData] = useState<string>('')
  
  // Enhanced state for consultation features
  const [showNotesPanel, setShowNotesPanel] = useState(userRole === "doctor")
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [consultationSummary, setConsultationSummary] = useState("")

  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const callStartTime = useRef<Date | null>(null)
  const notesAutoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const jitsiApiRef = useRef<any>(null)

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

  // Auto-save consultation notes with enhanced functionality
  const autoSaveNotes = useCallback(async (notes: string) => {
    if (!consultation?.id || !autoSaveEnabled || userRole !== "doctor") return

    try {
      await updateConsultationNotes(consultation.id, notes)
      if (onConsultationUpdate) {
        onConsultationUpdate({ ...consultation, notes })
      }
      
      // Show subtle success indicator
      console.log('Notes auto-saved successfully')
    } catch (error) {
      console.error('Error auto-saving notes:', error)
      toast.error('Failed to save notes automatically')
    }
  }, [consultation, autoSaveEnabled, userRole, onConsultationUpdate])

  // Enhanced auto-save with immediate save for critical events
  const saveNotesImmediately = useCallback(async (notes: string) => {
    if (!consultation?.id || userRole !== "doctor") return

    try {
      await updateConsultationNotes(consultation.id, notes)
      if (onConsultationUpdate) {
        onConsultationUpdate({ ...consultation, notes })
      }
    } catch (error) {
      console.error('Error saving notes immediately:', error)
      toast.error('Failed to save notes')
    }
  }, [consultation, userRole, onConsultationUpdate])

  // Handle notes change with enhanced auto-save
  const handleNotesChange = useCallback((notes: string) => {
    setConsultationNotes(notes)
    
    // Clear existing timeout
    if (notesAutoSaveRef.current) {
      clearTimeout(notesAutoSaveRef.current)
    }

    // Set new auto-save timeout (2 seconds after user stops typing for better UX)
    notesAutoSaveRef.current = setTimeout(() => {
      autoSaveNotes(notes)
    }, 2000)
  }, [autoSaveNotes])

  // Manual save function for immediate saves
  const handleManualSave = useCallback(async () => {
    if (notesAutoSaveRef.current) {
      clearTimeout(notesAutoSaveRef.current)
    }
    
    await saveNotesImmediately(consultationNotes)
    toast.success(t('messages.notesSaved'))
  }, [saveNotesImmediately, consultationNotes])

  // Enhanced consultation summary generation with real-time data
  const generateConsultationSummary = useCallback(async () => {
    if (!consultation?.id) {
      toast.error(t('messages.cannotGenerateSummary'))
      return
    }

    try {
      // Generate summary using consultation service
      const summary = await consultationService.generateConsultationSummary(consultation.id)
      setConsultationSummary(summary)
      
      // Create comprehensive summary with real-time session data
      const sessionSummary = `CONSULTATION SUMMARY
==================

CONSULTATION DETAILS
-------------------
Consultation ID: ${consultation.id}
Patient: ${patientName || patient?.name || 'Unknown'}
Doctor: ${doctorName || 'Unknown'}
Date: ${new Date().toLocaleDateString()}
Start Time: ${callStartTime.current?.toLocaleTimeString() || 'Unknown'}
End Time: ${isCallActive ? 'Ongoing' : new Date().toLocaleTimeString()}
Total Duration: ${formatDuration(callDuration)}
Room ID: ${roomId}

TECHNICAL SESSION INFO
---------------------
Participants Count: ${participantCount}
Connection Quality: ${connectionQuality}
Recording Status: ${isRecording ? 'Recorded' : 'Not recorded'}
Screen Sharing Used: ${isScreenSharing ? 'Yes' : 'No'}
Final Video Status: ${isVideoEnabled ? 'Enabled' : 'Disabled'}
Final Audio Status: ${isAudioEnabled ? 'Enabled' : 'Disabled'}

CONSULTATION NOTES
-----------------
${consultationNotes || 'No notes recorded during this consultation'}

PATIENT CONTEXT
--------------
${patient ? `
Patient ID: ${patient.id}
Age: ${patient.dateOfBirth ? Math.floor((new Date().getTime() - patient.dateOfBirth.toDate().getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}
Gender: ${patient.gender || 'N/A'}
Emergency Contact: ${patient.emergencyContact || 'N/A'}
Medical History: ${patient.medicalHistory?.length ? patient.medicalHistory.map(h => h.title).join(', ') : 'None recorded'}
` : 'Patient information not available'}

SYSTEM INFORMATION
-----------------
Generated at: ${new Date().toLocaleString()}
Generated by: NeuraNovaHealth Video Consultation System
Summary Version: 2.0
`
      
      // Combine service summary with session summary
      const fullSummary = summary ? `${summary}\n\n${sessionSummary}` : sessionSummary
      
      // Show summary in a downloadable format
      const blob = new Blob([fullSummary], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consultation-summary-${consultation.id}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(t('messages.summaryGenerated'))
      return fullSummary
    } catch (error) {
      console.error('Error generating consultation summary:', error)
      toast.error(t('messages.summaryFailed'))
    }
  }, [consultation, patientName, doctorName, callDuration, roomId, isCallActive, consultationNotes, participantCount, isRecording, isVideoEnabled, isAudioEnabled, connectionQuality, isScreenSharing, patient])

  // Enhanced recording functionality with Jitsi and consultation service integration
  const toggleRecording = useCallback(async () => {
    if (!consultation?.id) {
      toast.error(t('messages.cannotRecord'))
      return
    }

    try {
      if (!isRecording) {
        // Start recording via Jitsi
        if (jitsiService.isConferenceActive()) {
          jitsiService.toggleRecording()
        }
        
        // Also start recording in consultation service
        await consultationService.startConsultationRecording(consultation.id)
        setIsRecording(true)
        
        if (userRole === "doctor" && autoSaveEnabled) {
          const recordingNote = `Started recording at ${new Date().toLocaleTimeString()}\n`
          const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + recordingNote
          setConsultationNotes(updatedNotes)
          autoSaveNotes(updatedNotes)
        }
        
        toast.success(t('messages.recordingStarted'))
      } else {
        // Stop recording via Jitsi
        if (jitsiService.isConferenceActive()) {
          jitsiService.toggleRecording()
        }
        
        // Also stop recording in consultation service
        await consultationService.stopConsultationRecording(consultation.id)
        setIsRecording(false)
        
        if (userRole === "doctor" && autoSaveEnabled) {
          const recordingNote = `Stopped recording at ${new Date().toLocaleTimeString()}\n`
          const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + recordingNote
          setConsultationNotes(updatedNotes)
          autoSaveNotes(updatedNotes)
        }
        
        toast.success(t('messages.recordingStopped'))
      }
    } catch (error) {
      console.error('Error toggling recording:', error)
      toast.error(!isRecording ? t('messages.recordingStartFailed') : t('messages.recordingStopFailed'))
    }
  }, [isRecording, consultation, userRole, autoSaveEnabled, consultationNotes, autoSaveNotes])

  // Cleanup auto-save timeout and Jitsi
  useEffect(() => {
    return () => {
      if (notesAutoSaveRef.current) {
        clearTimeout(notesAutoSaveRef.current)
      }
      
      // Cleanup Jitsi conference on unmount
      if (jitsiService.isConferenceActive()) {
        jitsiService.dispose()
      }
    }
  }, [])

  const startCall = async () => {
    if (!jitsiContainerRef.current) {
      toast.error(t('messages.videoContainerNotReady'))
      return
    }

    setIsConnecting(true)

    try {
      // Generate room name from roomId
      const jitsiRoomName = JitsiService.generateRoomName(roomId, patient?.id)
      
      // Set up event handlers
      const eventHandlers: JitsiEventHandlers = {
        onVideoConferenceJoined: async (event) => {
          console.log('Conference joined:', event)
          setIsCallActive(true)
          setIsConnecting(false)
          setParticipantCount(jitsiService.getParticipantCount())
          
          // Update audio/video states from Jitsi
          setIsAudioEnabled(!jitsiService.isAudioMuted())
          setIsVideoEnabled(!jitsiService.isVideoMuted())
          
          // Load available devices
          try {
            const devices = await jitsiService.getAvailableDevices()
            setAvailableDevices(devices)
          } catch (error) {
            console.error('Error loading devices:', error)
          }

          // Trigger consultation started notification
          if (consultation) {
            try {
              await notificationTriggersService.triggerConsultationStarted(consultation)
            } catch (notificationError) {
              console.warn('Failed to send consultation started notification:', notificationError)
              // Don't fail the consultation start if notification fails
            }
          }
          
          toast.success(t('messages.joinedSuccessfully'))
        },
        
        onVideoConferenceLeft: (event) => {
          console.log('Conference left:', event)
          setIsCallActive(false)
          setParticipantCount(0)
          onEndCall?.()
        },
        
        onParticipantJoined: (event) => {
          console.log('Participant joined:', event)
          setParticipantCount(jitsiService.getParticipantCount())
          
          if (userRole === "doctor" && autoSaveEnabled) {
            const participantName = event.displayName || 'Unknown participant'
            const joinNote = `📥 ${participantName} joined the consultation at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + joinNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onParticipantLeft: (event) => {
          console.log('Participant left:', event)
          setParticipantCount(jitsiService.getParticipantCount())
          
          if (userRole === "doctor" && autoSaveEnabled) {
            const participantName = event.displayName || 'Unknown participant'
            const leaveNote = `📤 ${participantName} left the consultation at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + leaveNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onMicMutedChanged: (event) => {
          setIsAudioEnabled(!event.muted)
          
          if (userRole === "doctor" && autoSaveEnabled) {
            const audioNote = `🎤 Audio ${event.muted ? 'muted' : 'unmuted'} at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + audioNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onCameraMutedChanged: (event) => {
          setIsVideoEnabled(!event.muted)
          
          if (userRole === "doctor" && autoSaveEnabled) {
            const videoNote = `📹 Video ${event.muted ? 'disabled' : 'enabled'} at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + videoNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onScreenSharingStatusChanged: (event) => {
          setIsScreenSharing(event.on)
          
          if (userRole === "doctor" && autoSaveEnabled) {
            const screenNote = `🖥️ Screen sharing ${event.on ? 'started' : 'stopped'} at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + screenNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onIncomingMessage: (event) => {
          const message = {
            id: Date.now().toString(),
            sender: event.from || 'Unknown',
            message: event.message,
            timestamp: new Date(),
          }
          setChatMessages(prev => [...prev, message])
        },
        
        onConnectionStatusChanged: (event) => {
          // Update connection quality based on Jitsi's connection status
          if (event.connectionQuality) {
            const quality = event.connectionQuality
            if (quality >= 80) setConnectionQuality('excellent')
            else if (quality >= 60) setConnectionQuality('good')
            else setConnectionQuality('poor')
          }
        },
        
        onRecordingStatusChanged: (event) => {
          setIsRecording(event.on)
          if (userRole === "doctor" && autoSaveEnabled) {
            const recordingNote = `🔴 Recording ${event.on ? 'started' : 'stopped'} at ${new Date().toLocaleTimeString()}`
            const updatedNotes = consultationNotes + (consultationNotes ? '\n' : '') + recordingNote
            setConsultationNotes(updatedNotes)
            autoSaveNotes(updatedNotes)
          }
        },
        
        onError: (event) => {
          console.error('Jitsi error:', event)
          toast.error(`Video call error: ${event.error?.message || 'Unknown error'}`)
          setIsConnecting(false)
        }
      }

      // Initialize Jitsi conference
      const api = await jitsiService.initializeConference({
        roomName: jitsiRoomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: userRole === "patient" ? patientName : doctorName,
          email: undefined // Could be added from user profile
        },
        configOverwrite: {
          startWithAudioMuted: !isAudioEnabled,
          startWithVideoMuted: !isVideoEnabled,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        }
      }, eventHandlers)

      jitsiApiRef.current = api
      
    } catch (error) {
      console.error('Error starting video call:', error)
      toast.error(t('messages.failedToStart'))
      setIsConnecting(false)
    }
  }

  const endCall = useCallback(async () => {
    // Add end consultation note for doctors
    if (userRole === "doctor" && consultation && autoSaveEnabled) {
      const endNote = `\n📋 Consultation ended at ${new Date().toLocaleTimeString()}\n⏱️ Total duration: ${formatDuration(callDuration)}\n✅ Session completed successfully`
      const finalNotes = consultationNotes + endNote
      setConsultationNotes(finalNotes)
      
      // Save final notes immediately
      try {
        await saveNotesImmediately(finalNotes)
      } catch (error) {
        console.error('Error saving final notes:', error)
      }
    }

    // Trigger consultation ended notification
    if (consultation) {
      try {
        // Update consultation with final notes and duration
        const updatedConsultation = {
          ...consultation,
          notes: consultationNotes,
          duration: callDuration,
          endTime: new Date()
        }
        await notificationTriggersService.triggerConsultationEnded(updatedConsultation)
      } catch (notificationError) {
        console.warn('Failed to send consultation ended notification:', notificationError)
        // Don't fail the consultation end if notification fails
      }
    }
    
    // Generate final consultation summary
    try {
      const summary = await generateConsultationSummary()
      if (summary && userRole === "doctor") {
        setPostCallSummaryData(summary)
        setShowPostCallSummary(true)
      }
    } catch (error) {
      console.error('Error generating post-call summary:', error)
    }
    
    // Properly dispose of Jitsi conference
    if (jitsiService.isConferenceActive()) {
      jitsiService.hangUp()
      // Small delay to allow hangup to complete
      setTimeout(() => {
        jitsiService.dispose()
      }, 1000)
    }
    
    // Reset all states
    jitsiApiRef.current = null
    setIsCallActive(false)
    setIsConnecting(false)
    setParticipantCount(0)
    callStartTime.current = null
    setCallDuration(0)
    setIsScreenSharing(false)
    setConnectionQuality('unknown')
    setShowSettings(false)
    setAvailableDevices({ audioInput: [], audioOutput: [], videoInput: [] })
    setSelectedDevices({})
    
    // Show prescription dialog for doctors after consultation (if not showing summary)
    if (userRole === "doctor" && patient && !showPostCallSummary) {
      setShowPrescriptionDialog(true)
    } else if (userRole === "patient") {
      onEndCall?.()
    }
  }, [userRole, consultation, autoSaveEnabled, callDuration, consultationNotes, saveNotesImmediately, generateConsultationSummary, patient, showPostCallSummary, onEndCall])

  const toggleVideo = () => {
    if (isCallActive && jitsiService.isConferenceActive()) {
      jitsiService.toggleVideo()
      // State will be updated via onCameraMutedChanged event
    } else {
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const toggleAudio = () => {
    if (isCallActive && jitsiService.isConferenceActive()) {
      jitsiService.toggleAudio()
      // State will be updated via onMicMutedChanged event
    } else {
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleScreenShare = () => {
    if (isCallActive && jitsiService.isConferenceActive()) {
      jitsiService.toggleScreenShare()
      // State will be updated via onScreenSharingStatusChanged event
    }
  }

  const handleDeviceChange = (deviceType: 'audioInput' | 'audioOutput' | 'videoInput', deviceId: string) => {
    if (!isCallActive || !jitsiService.isConferenceActive()) return

    try {
      switch (deviceType) {
        case 'audioInput':
          jitsiService.setAudioInputDevice(deviceId)
          break
        case 'audioOutput':
          jitsiService.setAudioOutputDevice(deviceId)
          break
        case 'videoInput':
          jitsiService.setVideoInputDevice(deviceId)
          break
      }
      
      setSelectedDevices(prev => ({
        ...prev,
        [deviceType]: deviceId
      }))
      
      toast.success(t('messages.deviceChangedSuccess', { deviceType }))
    } catch (error) {
      console.error(`Error changing ${deviceType} device:`, error)
      toast.error(t('messages.deviceChangeFailed', { deviceType }))
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      if (isCallActive && jitsiService.isConferenceActive()) {
        // Send message via Jitsi chat
        jitsiService.sendChatMessage(newMessage)
      } else {
        // Fallback to local chat
        const message = {
          id: Date.now().toString(),
          sender: userRole === "patient" ? patientName || "Patient" : doctorName || "Doctor",
          message: newMessage,
          timestamp: new Date(),
        }
        setChatMessages([...chatMessages, message])
      }
      setNewMessage("")
    }
  }

  if (!isCallActive && !isConnecting) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <Video className="h-6 w-6 mr-2" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {userRole === "patient"
              ? `${t('connectWith')} ${doctorName || tCommon('navigation.doctor')}`
              : `${t('consultationWith')} ${patientName || t('patient')}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Video className="h-16 w-16 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <p className="font-medium">{t('roomId')}: {roomId}</p>
              <p className="text-sm text-muted-foreground">
                {userRole === "patient" ? t('clickToStart') : t('startWhenReady')}
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
              {t('startVideoCall')}
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
            <p className="font-medium">{t('connecting')}</p>
            <p className="text-sm text-muted-foreground">{t('pleaseWait')}</p>
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
                {t('live')}
              </Badge>
              <div>
                <p className="font-medium">
                  {userRole === "patient" ? `${t('consultationWith')} ${doctorName}` : `${t('patient')}: ${patientName}`}
                </p>
                <p className="text-sm text-muted-foreground">{t('duration')}: {formatDuration(callDuration)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {participantCount}
              </Badge>
              {connectionQuality !== 'unknown' && (
                <Badge variant={connectionQuality === 'excellent' ? 'default' : connectionQuality === 'good' ? 'secondary' : 'destructive'}>
                  {connectionQuality}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Video Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Jitsi Video Container */}
          <Card className="relative">
            <CardContent className="p-0">
              <div 
                ref={jitsiContainerRef}
                className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden"
                style={{ minHeight: '400px' }}
              >
                {!isCallActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {isConnecting ? t('connecting') : t('videoWillAppear')}
                      </p>
                      {isConnecting && (
                        <div className="mt-4">
                          <div className="w-8 h-8 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Connection status overlay */}
                {isCallActive && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {t('status.connected')}
                    </Badge>
                  </div>
                )}
                
                {/* Screen sharing indicator */}
                {isScreenSharing && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Monitor className="h-3 w-3 mr-1" />
                      {t('status.screenSharing')}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                  onClick={toggleScreenShare}
                  variant={isScreenSharing ? "default" : "outline"}
                  size="lg"
                  className="rounded-full w-12 h-12 p-0"
                  disabled={!isCallActive}
                >
                  <Monitor className="h-5 w-5" />
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

                <Button 
                  onClick={() => setShowSettings(!showSettings)}
                  variant={showSettings ? "default" : "outline"} 
                  size="lg" 
                  className="rounded-full w-12 h-12 p-0"
                  disabled={!isCallActive}
                >
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
          {/* Device Settings */}
          {showSettings && isCallActive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('deviceSettings.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Audio Input */}
                {availableDevices.audioInput.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t('deviceSettings.microphone')}</label>
                    <select
                      value={selectedDevices.audioInput || ''}
                      onChange={(e) => handleDeviceChange('audioInput', e.target.value)}
                      className="w-full text-xs p-2 border rounded"
                    >
                      <option value="">{t('deviceSettings.default')}</option>
                      {availableDevices.audioInput.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `${t('deviceSettings.microphone')} ${device.deviceId.substring(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Audio Output */}
                {availableDevices.audioOutput.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t('deviceSettings.speaker')}</label>
                    <select
                      value={selectedDevices.audioOutput || ''}
                      onChange={(e) => handleDeviceChange('audioOutput', e.target.value)}
                      className="w-full text-xs p-2 border rounded"
                    >
                      <option value="">{t('deviceSettings.default')}</option>
                      {availableDevices.audioOutput.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `${t('deviceSettings.speaker')} ${device.deviceId.substring(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Video Input */}
                {availableDevices.videoInput.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t('deviceSettings.camera')}</label>
                    <select
                      value={selectedDevices.videoInput || ''}
                      onChange={(e) => handleDeviceChange('videoInput', e.target.value)}
                      className="w-full text-xs p-2 border rounded"
                    >
                      <option value="">{t('deviceSettings.default')}</option>
                      {availableDevices.videoInput.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `${t('deviceSettings.camera')} ${device.deviceId.substring(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Connection Quality */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">{t('deviceSettings.connectionQuality')}</label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{t('deviceSettings.quality')}:</span>
                    <Badge variant={
                      connectionQuality === 'excellent' ? 'default' : 
                      connectionQuality === 'good' ? 'secondary' : 
                      connectionQuality === 'poor' ? 'destructive' : 'outline'
                    }>
                      {t(`deviceSettings.${connectionQuality}`)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Chat */}
          {showChat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('chat.title')}</CardTitle>
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
                    placeholder={t('chat.typeMessage')}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <Button onClick={sendMessage} size="sm">
                    {t('chat.send')}
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
                    <CardTitle className="text-sm">{t('liveNotes.title')}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={autoSaveEnabled ? "default" : "secondary"} className="text-xs">
                        {autoSaveEnabled ? t('liveNotes.autoSaveOn') : t('liveNotes.autoSaveOff')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        className="h-6 w-6 p-0"
                        title={t('liveNotes.toggleAutoSave')}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleManualSave}
                        className="h-6 w-6 p-0"
                        title={t('liveNotes.saveNow')}
                      >
                        <Save className="h-3 w-3 text-green-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={consultationNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder={t('liveNotes.placeholder')}
                    rows={8}
                    className="text-sm"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>{consultationNotes.length} {t('liveNotes.characters')}</span>
                    <span>{autoSaveEnabled ? t('liveNotes.autoSaveInterval') : t('liveNotes.manualSaveOnly')}</span>
                  </div>
                  
                  {/* Live event indicators */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span>{isCallActive ? t('liveNotes.liveConsultation') : t('liveNotes.consultationEnded')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Context (if available) */}
              {patient && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('patientContext.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('patientContext.name')}:</span>
                      <span>{patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('patientContext.age')}:</span>
                      <span>{patient.dateOfBirth ? Math.floor((new Date().getTime() - patient.dateOfBirth.toDate().getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('patientContext.gender')}:</span>
                      <span className="capitalize">{patient.gender || 'N/A'}</span>
                    </div>
                    {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                      <div className="pt-2">
                        <span className="text-muted-foreground text-xs">{t('patientContext.recentConditions')}:</span>
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
              <CardTitle className="text-sm">{t('sessionInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sessionInfo.roomId')}:</span>
                <span className="font-mono">{roomId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sessionInfo.duration')}:</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(callDuration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sessionInfo.participants')}:</span>
                <span>{participantCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('sessionInfo.quality')}:</span>
                <Badge variant="outline" className="text-xs">
                  {t('hd')}
                </Badge>
              </div>
              {userRole === "doctor" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('sessionInfo.recording')}:</span>
                    <Badge variant={isRecording ? "destructive" : "secondary"} className="text-xs">
                      {isRecording ? t('recording') : t('notRecording')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('sessionInfo.notes')}:</span>
                    <span>{consultationNotes.length > 0 ? t('sessionInfo.active') : t('sessionInfo.none')}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions for Doctors */}
          {userRole === "doctor" && patient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('quickActions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowPrescriptionDialog(true)}
                >
                  <Pill className="h-4 w-4 mr-2" />
                  {t('quickActions.createPrescription')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={generateConsultationSummary}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('quickActions.generateSummary')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Consultation Timer & Controls */}
          {userRole === "doctor" && consultation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('consultationTimer.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {formatDuration(callDuration)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isCallActive ? t('consultationTimer.activeConsultation') : t('consultationTimer.consultationEnded')}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">{t('consultationTimer.started')}</div>
                    <div className="text-muted-foreground">
                      {callStartTime.current?.toLocaleTimeString() || '--:--'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <div className="font-medium">{t('consultationTimer.duration')}</div>
                    <div className="text-muted-foreground">
                      {Math.floor(callDuration / 60)}m {callDuration % 60}s
                    </div>
                  </div>
                </div>

                {isCallActive && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('consultationTimer.autoTracking')}:</span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {t('consultationTimer.live')}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Post-Call Summary Dialog */}
      {showPostCallSummary && userRole === "doctor" && (
        <Dialog open={showPostCallSummary} onOpenChange={setShowPostCallSummary}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('postCallSummary.title')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">{t('postCallSummary.sessionCompleted')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('postCallSummary.consultationEnded', { patientName })}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">{t('postCallSummary.quickStats')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>{t('postCallSummary.duration')}:</span>
                    <span className="font-medium">{formatDuration(callDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('postCallSummary.participants')}:</span>
                    <span className="font-medium">{participantCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('postCallSummary.recording')}:</span>
                    <span className="font-medium">{isRecording ? t('postCallSummary.yes') : t('postCallSummary.no')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('postCallSummary.notesLength')}:</span>
                    <span className="font-medium">{consultationNotes.length} {t('postCallSummary.chars')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowPostCallSummary(false)
                    if (patient) {
                      setShowPrescriptionDialog(true)
                    } else {
                      onEndCall?.()
                    }
                  }}
                  className="flex-1"
                >
                  {patient ? t('postCallSummary.createPrescription') : t('postCallSummary.close')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    generateConsultationSummary()
                  }}
                >
                  {t('postCallSummary.downloadSummary')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPostCallSummary(false)
                    onEndCall?.()
                  }}
                >
                  {t('postCallSummary.close')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Post-Consultation Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('prescriptionDialog.title')}</DialogTitle>
          </DialogHeader>
          
          {patient && consultation && (
            <div className="space-y-4">
              {/* Consultation Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{t('prescriptionDialog.consultationSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">{t('prescriptionDialog.patient')}:</span> {patient.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('prescriptionDialog.duration')}:</span> {formatDuration(callDuration)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('prescriptionDialog.date')}:</span> {new Date().toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('prescriptionDialog.time')}:</span> {callStartTime.current?.toLocaleTimeString() || 'N/A'}
                    </div>
                  </div>
                  
                  {consultationNotes && (
                    <div className="mt-4">
                      <span className="text-muted-foreground">{t('prescriptionDialog.notes')}:</span>
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
                    toast.success(t('messages.prescriptionCreated'))
                    setShowPrescriptionDialog(false)
                    onEndCall?.()
                  } catch (error) {
                    console.error('Error creating prescription:', error)
                    toast.error(t('messages.prescriptionFailed'))
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

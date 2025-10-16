"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  QrCode,
  Camera,
  X,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Stethoscope,
} from "lucide-react"
import { collection, query, where, getDocs, addDoc, Timestamp, GeoPoint } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Patient, QRScanLog } from "@/lib/types/healthcare-models"

interface QRScannerProps {
  chwId: string
  onScanComplete: (patient: Patient | null) => void
  onClose: () => void
}

interface ScanResult {
  success: boolean
  patient?: Patient
  error?: string
  qrId?: string
}

export default function QRScanner({ chwId, onScanComplete, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualQRInput, setManualQRInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get current location for scan logging
  useEffect(() => {
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
  }, [])

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start scanning for QR codes
      startQRDetection()
      
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.")
      setIsScanning(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Simple QR code detection using canvas
  const startQRDetection = () => {
    const detectQR = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // In a real implementation, you would use a QR code detection library here
        // For now, we'll simulate QR detection and allow manual input
        // Libraries like 'qr-scanner' or 'jsqr' would be used for actual QR detection
      }

      if (isScanning) {
        requestAnimationFrame(detectQR)
      }
    }

    detectQR()
  }

  // Process QR code (either scanned or manually entered)
  const processQRCode = async (qrId: string) => {
    if (!qrId.trim()) return

    setIsProcessing(true)
    
    try {
      // Search for patient with this QR ID
      const patientsQuery = query(
        collection(db, 'patients'),
        where('qrId', '==', qrId.trim()),
        where('isActive', '==', true)
      )

      const patientsSnapshot = await getDocs(patientsQuery)
      
      if (patientsSnapshot.empty) {
        setScanResult({
          success: false,
          error: "No patient found with this QR code. Please verify the QR code is valid.",
          qrId: qrId.trim()
        })
        return
      }

      // Get patient data
      const patientDoc = patientsSnapshot.docs[0]
      const patient: Patient = {
        id: patientDoc.id,
        ...patientDoc.data()
      } as Patient

      // Log the QR scan
      await addDoc(collection(db, 'chw-logs'), {
        chwId: chwId,
        patientId: patient.id,
        action: 'qr_scan',
        location: currentLocation ? new GeoPoint(currentLocation.latitude, currentLocation.longitude) : new GeoPoint(0, 0),
        description: `Scanned QR code for patient: ${patient.name}`,
        followUpRequired: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Log QR scan in QR scan logs
      await addDoc(collection(db, 'qr-scan-logs'), {
        qrId: qrId.trim(),
        patientId: patient.id,
        scannedBy: chwId,
        scannerRole: 'chw',
        location: currentLocation ? new GeoPoint(currentLocation.latitude, currentLocation.longitude) : undefined,
        purpose: 'general',
        accessGranted: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      setScanResult({
        success: true,
        patient: patient,
        qrId: qrId.trim()
      })

      // Stop camera after successful scan
      stopCamera()
      
    } catch (error) {
      console.error('Error processing QR code:', error)
      setScanResult({
        success: false,
        error: "Error retrieving patient data. Please try again.",
        qrId: qrId.trim()
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle manual QR input
  const handleManualQRSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualQRInput.trim()) {
      processQRCode(manualQRInput.trim())
    }
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }

  // Calculate age
  const calculateAge = (dateOfBirth: any) => {
    const today = new Date()
    const birthDate = dateOfBirth.toDate()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Handle scan completion
  const handleScanComplete = () => {
    onScanComplete(scanResult?.patient || null)
    onClose()
  }

  // Navigate to patient record page
  const handleViewFullRecords = () => {
    if (scanResult?.patient) {
      // Navigate to the patient record page
      window.open(`/record/${scanResult.patient.id}`, '_blank')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>Scan Patient QR Code</span>
        </CardTitle>
        <CardDescription>
          Scan a patient's QR code to access their health records instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scan Result Display */}
        {scanResult && (
          <div className="space-y-4">
            {scanResult.success && scanResult.patient ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Patient Found!</h3>
                </div>
                
                {/* Patient Information */}
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold">{scanResult.patient.name}</h4>
                    <Badge variant="outline" className="font-mono">
                      {scanResult.patient.qrId}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Age: {calculateAge(scanResult.patient.dateOfBirth)} years</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="capitalize">{scanResult.patient.gender}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{scanResult.patient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {formatDate(scanResult.patient.dateOfBirth)}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p>{scanResult.patient.address.street}</p>
                      <p>{scanResult.patient.address.city}, {scanResult.patient.address.state} {scanResult.patient.address.zipCode}</p>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Emergency Contact</h5>
                    <div className="text-sm space-y-1">
                      <p><strong>{scanResult.patient.emergencyContact.name}</strong> ({scanResult.patient.emergencyContact.relationship})</p>
                      <p>{scanResult.patient.emergencyContact.phone}</p>
                    </div>
                  </div>

                  {/* Medical Information */}
                  {((scanResult.patient.allergies && scanResult.patient.allergies.length > 0) || (scanResult.patient.chronicConditions && scanResult.patient.chronicConditions.length > 0) || scanResult.patient.bloodType) && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <h5 className="font-medium text-sm mb-2 text-red-800">Medical Information</h5>
                      <div className="text-sm space-y-1">
                        {scanResult.patient.bloodType && (
                          <p><strong>Blood Type:</strong> {scanResult.patient.bloodType}</p>
                        )}
                        {scanResult.patient.allergies && scanResult.patient.allergies.length > 0 && (
                          <p><strong>Allergies:</strong> {scanResult.patient.allergies.join(', ')}</p>
                        )}
                        {scanResult.patient.chronicConditions && scanResult.patient.chronicConditions.length > 0 && (
                          <p><strong>Chronic Conditions:</strong> {scanResult.patient.chronicConditions.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-3 mt-4">
                  <Button onClick={handleViewFullRecords}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Records
                  </Button>
                  <Button variant="outline" onClick={() => setScanResult(null)}>
                    Scan Another
                  </Button>
                  <Button variant="outline" onClick={handleScanComplete}>
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Scan Failed</h3>
                </div>
                <p className="text-red-700 mb-4">{scanResult.error}</p>
                {scanResult.qrId && (
                  <p className="text-sm text-red-600 mb-4">
                    QR Code: <code className="bg-red-100 px-2 py-1 rounded">{scanResult.qrId}</code>
                  </p>
                )}
                <div className="flex justify-center space-x-3">
                  <Button variant="outline" onClick={() => setScanResult(null)}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Scanner */}
        {!scanResult && (
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground mb-4">
                    Position the patient's QR code within the camera frame
                  </p>
                  <Button onClick={startCamera} className="mb-4">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <QrCode className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Position QR code here</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stop button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={stopCamera}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isProcessing && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Processing QR code...</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Error */}
            {cameraError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {/* Manual QR Input */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Or Enter QR Code Manually</h4>
              <form onSubmit={handleManualQRSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={manualQRInput}
                  onChange={(e) => setManualQRInput(e.target.value)}
                  placeholder="Enter QR code (e.g., QR-1234567890-ABC123)"
                  className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                  disabled={isProcessing}
                />
                <Button 
                  type="submit" 
                  disabled={!manualQRInput.trim() || isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "Scan"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!scanResult && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
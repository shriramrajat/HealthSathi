"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  Pill,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Prescription, Medicine } from "@/lib/types/healthcare-models"

interface PrescriptionDisplayProps {
  onClose?: () => void
}

export default function PrescriptionDisplay({ onClose }: PrescriptionDisplayProps) {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Fetch user's prescriptions
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user?.uid) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const prescriptionsQuery = query(
          collection(db, 'prescriptions'),
          where('patientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(prescriptionsQuery)
        const prescriptionsList: Prescription[] = []
        
        querySnapshot.forEach((doc) => {
          prescriptionsList.push({
            id: doc.id,
            ...doc.data()
          } as Prescription)
        })
        
        setPrescriptions(prescriptionsList)
      } catch (error) {
        console.error('Error fetching prescriptions:', error)
        setError('Failed to load prescriptions. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrescriptions()
  }, [user?.uid])

  // Filter prescriptions based on search term and status
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = searchTerm === "" || 
      prescription.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medicines.some(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesStatus = statusFilter === "all" || prescription.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: Prescription['status']) => {
    switch (status) {
      case 'issued':
        return 'default'
      case 'dispensed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'expired':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Get status icon
  const getStatusIcon = (status: Prescription['status']) => {
    switch (status) {
      case 'issued':
        return <Clock className="h-4 w-4" />
      case 'dispensed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'expired':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Handle prescription download (placeholder)
  const handleDownload = (prescription: Prescription) => {
    // In real implementation, this would download the prescription file
    console.log('Downloading prescription:', prescription.id)
    // For now, just show an alert
    alert(`Download functionality for prescription ${prescription.id} will be implemented with file storage.`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading prescriptions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium mb-2">Error Loading Prescriptions</p>
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>My Prescriptions</span>
              </CardTitle>
              <CardDescription>
                View and manage your prescription history
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search prescriptions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by doctor, diagnosis, or medicine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter" className="sr-only">Filter by status</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="issued">Issued</option>
                <option value="dispensed">Dispensed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Prescriptions List */}
          {filteredPrescriptions.length > 0 ? (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">
                              Prescribed by {prescription.doctorName || 'Unknown Doctor'}
                            </h4>
                            <Badge 
                              variant={getStatusBadgeVariant(prescription.status)}
                              className="flex items-center space-x-1"
                            >
                              {getStatusIcon(prescription.status)}
                              <span className="capitalize">{prescription.status}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Issued: {formatDate(prescription.createdAt)}
                            </div>
                            {prescription.dispensedAt && (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Dispensed: {formatDate(prescription.dispensedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(prescription)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>

                      {/* Diagnosis */}
                      {prescription.diagnosis && (
                        <div>
                          <h5 className="font-medium text-sm mb-1">Diagnosis:</h5>
                          <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                        </div>
                      )}

                      <Separator />

                      {/* Medicines */}
                      <div>
                        <h5 className="font-medium text-sm mb-3 flex items-center">
                          <Pill className="h-4 w-4 mr-1" />
                          Medications ({prescription.medicines.length})
                        </h5>
                        <div className="grid gap-3 md:grid-cols-2">
                          {prescription.medicines.map((medicine, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <div className="space-y-2">
                                <h6 className="font-medium text-sm">{medicine.name}</h6>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Dosage:</span> {medicine.dosage}
                                  </div>
                                  <div>
                                    <span className="font-medium">Frequency:</span> {medicine.frequency}
                                  </div>
                                  <div>
                                    <span className="font-medium">Duration:</span> {medicine.duration}
                                  </div>
                                  {medicine.quantity && (
                                    <div>
                                      <span className="font-medium">Quantity:</span> {medicine.quantity}
                                    </div>
                                  )}
                                </div>
                                {medicine.instructions && (
                                  <div className="mt-2">
                                    <span className="font-medium text-xs">Instructions:</span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {medicine.instructions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {prescription.notes && (
                        <>
                          <Separator />
                          <div>
                            <h5 className="font-medium text-sm mb-1">Additional Notes:</h5>
                            <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                          </div>
                        </>
                      )}

                      {/* Pharmacy Information */}
                      {prescription.pharmacyName && (
                        <>
                          <Separator />
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="h-4 w-4 mr-1" />
                            <span>Dispensed by: {prescription.pharmacyName}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {prescriptions.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No prescriptions yet</p>
                  <p className="text-sm">Your prescriptions will appear here after doctor consultations</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No matching prescriptions</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {prescriptions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {prescriptions.filter(p => p.status === 'issued').length}
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {prescriptions.filter(p => p.status === 'dispensed').length}
                </div>
                <p className="text-xs text-muted-foreground">Dispensed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {prescriptions.filter(p => p.status === 'expired').length}
                </div>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {prescriptions.length}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
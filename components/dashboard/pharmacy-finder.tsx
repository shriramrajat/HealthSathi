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
  MapPin, 
  Search, 
  Phone, 
  Clock, 
  Navigation,
  AlertCircle,
  Loader2,
  Store,
  Package,
  Star
} from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Pharmacy, PharmacyStock } from "@/lib/types/healthcare-models"

interface PharmacyWithStock extends Pharmacy {
  stock: PharmacyStock[]
  distance?: number
}

interface UserLocation {
  latitude: number
  longitude: number
}

interface PharmacyFinderProps {
  onClose?: () => void
}

// Mock pharmacy data for demonstration
const mockPharmacies: PharmacyWithStock[] = [
  {
    id: "pharmacy1",
    name: "Central Pharmacy",
    email: "central@pharmacy.com",
    phone: "+1-555-0101",
    address: {
      street: "123 Main Street",
      city: "Downtown",
      state: "CA",
      zipCode: "90210",
      country: "USA"
    },
    licenseNumber: "PH001",
    operatingHours: {
      monday: { open: "08:00", close: "20:00", isOpen: true },
      tuesday: { open: "08:00", close: "20:00", isOpen: true },
      wednesday: { open: "08:00", close: "20:00", isOpen: true },
      thursday: { open: "08:00", close: "20:00", isOpen: true },
      friday: { open: "08:00", close: "20:00", isOpen: true },
      saturday: { open: "09:00", close: "18:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: true }
    },
    services: ["Prescription Dispensing", "Health Consultations", "Vaccinations"],
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    stock: [
      {
        id: "stock1",
        pharmacyId: "pharmacy1",
        medicineId: "med1",
        medicineName: "Amoxicillin 500mg",
        quantity: 25,
        expiryDate: new Date("2025-06-01") as any,
        batchNumber: "AMX001",
        price: 15.99,
        manufacturer: "PharmaCorp",
        category: "Antibiotic",
        minStockLevel: 10,
        maxStockLevel: 100,
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      },
      {
        id: "stock2",
        pharmacyId: "pharmacy1",
        medicineId: "med2",
        medicineName: "Paracetamol 650mg",
        quantity: 50,
        expiryDate: new Date("2025-08-15") as any,
        batchNumber: "PAR001",
        price: 8.99,
        manufacturer: "MediCorp",
        category: "Pain Relief",
        minStockLevel: 20,
        maxStockLevel: 200,
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      }
    ],
    distance: 0.5
  },
  {
    id: "pharmacy2",
    name: "Health Plus Pharmacy",
    email: "info@healthplus.com",
    phone: "+1-555-0102",
    address: {
      street: "456 Market Road",
      city: "Midtown",
      state: "CA",
      zipCode: "90211",
      country: "USA"
    },
    licenseNumber: "PH002",
    operatingHours: {
      monday: { open: "07:00", close: "22:00", isOpen: true },
      tuesday: { open: "07:00", close: "22:00", isOpen: true },
      wednesday: { open: "07:00", close: "22:00", isOpen: true },
      thursday: { open: "07:00", close: "22:00", isOpen: true },
      friday: { open: "07:00", close: "22:00", isOpen: true },
      saturday: { open: "08:00", close: "20:00", isOpen: true },
      sunday: { open: "09:00", close: "18:00", isOpen: true }
    },
    services: ["24/7 Emergency", "Prescription Dispensing", "Medical Supplies"],
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    stock: [
      {
        id: "stock3",
        pharmacyId: "pharmacy2",
        medicineId: "med3",
        medicineName: "Insulin Glargine",
        quantity: 15,
        expiryDate: new Date("2025-04-30") as any,
        batchNumber: "INS001",
        price: 89.99,
        manufacturer: "DiabetesCare",
        category: "Diabetes",
        minStockLevel: 5,
        maxStockLevel: 50,
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      },
      {
        id: "stock4",
        pharmacyId: "pharmacy2",
        medicineId: "med4",
        medicineName: "Metformin 500mg",
        quantity: 30,
        expiryDate: new Date("2025-07-20") as any,
        batchNumber: "MET001",
        price: 12.99,
        manufacturer: "DiabetesCare",
        category: "Diabetes",
        minStockLevel: 15,
        maxStockLevel: 100,
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      }
    ],
    distance: 1.2
  },
  {
    id: "pharmacy3",
    name: "Community Care Pharmacy",
    email: "care@community.com",
    phone: "+1-555-0103",
    address: {
      street: "789 Oak Avenue",
      city: "Uptown",
      state: "CA",
      zipCode: "90212",
      country: "USA"
    },
    licenseNumber: "PH003",
    operatingHours: {
      monday: { open: "09:00", close: "19:00", isOpen: true },
      tuesday: { open: "09:00", close: "19:00", isOpen: true },
      wednesday: { open: "09:00", close: "19:00", isOpen: true },
      thursday: { open: "09:00", close: "19:00", isOpen: true },
      friday: { open: "09:00", close: "19:00", isOpen: true },
      saturday: { open: "10:00", close: "17:00", isOpen: true },
      sunday: { open: "closed", close: "closed", isOpen: false }
    },
    services: ["Prescription Dispensing", "Health Screenings", "Medication Reviews"],
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
    stock: [
      {
        id: "stock5",
        pharmacyId: "pharmacy3",
        medicineId: "med5",
        medicineName: "Lisinopril 10mg",
        quantity: 40,
        expiryDate: new Date("2025-09-10") as any,
        batchNumber: "LIS001",
        price: 18.99,
        manufacturer: "CardioMed",
        category: "Blood Pressure",
        minStockLevel: 20,
        maxStockLevel: 80,
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      }
    ],
    distance: 2.1
  }
]

export default function PharmacyFinder({ onClose }: PharmacyFinderProps) {
  const { user } = useAuth()
  const [pharmacies, setPharmacies] = useState<PharmacyWithStock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setIsLoadingLocation(false)
        // In real implementation, this would trigger a new search with location
        calculateDistances(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        let errorMessage = "Unable to get your location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setLocationError(errorMessage)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Calculate distances (simplified calculation for demo)
  const calculateDistances = (userLat: number, userLng: number) => {
    const updatedPharmacies = mockPharmacies.map(pharmacy => ({
      ...pharmacy,
      distance: Math.random() * 5 + 0.1 // Random distance for demo
    }))
    
    // Sort by distance
    updatedPharmacies.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    setPharmacies(updatedPharmacies)
  }

  // Load pharmacies on component mount
  useEffect(() => {
    setIsLoading(true)
    // In real implementation, this would fetch from Firestore
    setTimeout(() => {
      setPharmacies(mockPharmacies)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter pharmacies based on search term
  const filteredPharmacies = pharmacies.filter(pharmacy => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      pharmacy.name.toLowerCase().includes(searchLower) ||
      pharmacy.address.street.toLowerCase().includes(searchLower) ||
      pharmacy.address.city.toLowerCase().includes(searchLower) ||
      pharmacy.services.some(service => service.toLowerCase().includes(searchLower)) ||
      pharmacy.stock.some(item => item.medicineName.toLowerCase().includes(searchLower))
    )
  })

  // Check if pharmacy is currently open
  const isPharmacyOpen = (pharmacy: Pharmacy) => {
    const now = new Date()
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    const todayHours = pharmacy.operatingHours[dayName]
    if (!todayHours || !todayHours.isOpen) return false
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close
  }

  // Format operating hours for display
  const formatOperatingHours = (pharmacy: Pharmacy) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = pharmacy.operatingHours[today]
    
    if (!todayHours || !todayHours.isOpen) {
      return "Closed today"
    }
    
    return `${todayHours.open} - ${todayHours.close}`
  }

  // Handle calling pharmacy
  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  // Handle getting directions
  const handleDirections = (pharmacy: Pharmacy) => {
    const address = `${pharmacy.address.street}, ${pharmacy.address.city}, ${pharmacy.address.state} ${pharmacy.address.zipCode}`
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Finding nearby pharmacies...</p>
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
                <MapPin className="h-5 w-5" />
                <span>Nearby Pharmacies</span>
              </CardTitle>
              <CardDescription>
                Find pharmacies and check medicine availability
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
          {/* Location and Search Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search pharmacies</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by pharmacy name, location, or medicine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                variant="outline"
                className="sm:w-auto"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Use My Location
              </Button>
            </div>

            {/* Location Status */}
            {locationError && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">{locationError}</span>
              </div>
            )}

            {userLocation && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Location found - showing pharmacies sorted by distance
                </span>
              </div>
            )}
          </div>

          {/* Pharmacies List */}
          {filteredPharmacies.length > 0 ? (
            <div className="space-y-4">
              {filteredPharmacies.map((pharmacy) => (
                <Card key={pharmacy.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-lg">{pharmacy.name}</h4>
                            <Badge 
                              variant={isPharmacyOpen(pharmacy) ? "default" : "secondary"}
                              className="flex items-center space-x-1"
                            >
                              <Clock className="h-3 w-3" />
                              <span>{isPharmacyOpen(pharmacy) ? "Open" : "Closed"}</span>
                            </Badge>
                            {pharmacy.distance && (
                              <Badge variant="outline">
                                {pharmacy.distance.toFixed(1)} km
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {pharmacy.address.street}, {pharmacy.address.city}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Today: {formatOperatingHours(pharmacy)}
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {pharmacy.phone}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCall(pharmacy.phone)}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDirections(pharmacy)}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Directions
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Services */}
                      <div>
                        <h5 className="font-medium text-sm mb-2 flex items-center">
                          <Store className="h-4 w-4 mr-1" />
                          Services
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {pharmacy.services.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Available Stock */}
                      {pharmacy.stock.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h5 className="font-medium text-sm mb-3 flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Available Medicines ({pharmacy.stock.length})
                            </h5>
                            <div className="grid gap-2 md:grid-cols-2">
                              {pharmacy.stock.slice(0, 4).map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                  <div>
                                    <span className="text-sm font-medium">{item.medicineName}</span>
                                    <div className="text-xs text-muted-foreground">
                                      ${item.price} • {item.category}
                                    </div>
                                  </div>
                                  <Badge 
                                    variant={item.quantity > item.minStockLevel ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {item.quantity} in stock
                                  </Badge>
                                </div>
                              ))}
                              {pharmacy.stock.length > 4 && (
                                <div className="text-center text-sm text-muted-foreground p-2">
                                  +{pharmacy.stock.length - 4} more medicines available
                                </div>
                              )}
                            </div>
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
              {pharmacies.length === 0 ? (
                <>
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No pharmacies found</p>
                  <p className="text-sm">Try enabling location services or search in a different area</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No matching pharmacies</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {filteredPharmacies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredPharmacies.filter(p => isPharmacyOpen(p)).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently Open</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredPharmacies.reduce((total, p) => total + p.stock.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Medicines Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {userLocation ? 
                    `${Math.min(...filteredPharmacies.map(p => p.distance || 0)).toFixed(1)} km` : 
                    'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Nearest Pharmacy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
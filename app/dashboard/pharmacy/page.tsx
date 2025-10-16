"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkipLink, useAnnouncement } from "@/components/accessibility/accessibility-provider"
import { useDashboardPerformance } from "@/hooks/use-performance-monitor"
import {
  Package,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Calendar,
  TrendingUp
} from "lucide-react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { PharmacyStock, PrescriptionQueue, Prescription } from "@/lib/types/healthcare-models"
import { 
  StockManagementWithSuspense,
  PrescriptionManagementWithSuspense
} from "@/components/lazy/lazy-dashboard-components"

// Dashboard section navigation
const dashboardSections = [
  {
    id: "stock",
    title: "Manage Stock",
    description: "Track medicine inventory and stock levels",
    icon: Package,
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    id: "prescriptions",
    title: "View Prescriptions",
    description: "Process and manage prescription orders",
    icon: FileText,
    color: "bg-green-50 text-green-600 border-green-200",
  },
  {
    id: "dispense",
    title: "Dispense Medicine",
    description: "Mark prescriptions as dispensed",
    icon: CheckCircle,
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
]

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<string>("stock")
  
  // Performance monitoring
  const {
    dashboardMetrics,
    trackSectionLoad,
    setTotalSections,
    markCriticalDataLoaded
  } = useDashboardPerformance('pharmacy')
  
  // Accessibility announcements
  const { announce } = useAnnouncement()

  // Initialize dashboard sections count
  useEffect(() => {
    setTotalSections(3) // stock, prescriptions, dispense
  }, [setTotalSections])
  const [stockItems, setStockItems] = useState<PharmacyStock[]>([])
  const [prescriptionQueue, setPrescriptionQueue] = useState<PrescriptionQueue[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    pendingPrescriptions: 0,
    dispensedToday: 0,
  })

  // Mock pharmacy ID - in real implementation, this would come from user auth
  const pharmacyId = (user as any)?.pharmacyId || "pharmacy-demo-001"

  // Fetch pharmacy data
  useEffect(() => {
    const fetchPharmacyData = async () => {
      if (!pharmacyId) return
      
      setIsLoading(true)
      try {
        // Fetch stock items
        const stockQuery = query(
          collection(db, 'pharmacy-stock'),
          where('pharmacyId', '==', pharmacyId),
          where('isActive', '==', true),
          orderBy('medicineName', 'asc')
        )
        
        const stockSnapshot = await getDocs(stockQuery)
        const stockList: PharmacyStock[] = []
        
        stockSnapshot.forEach((doc) => {
          stockList.push({
            id: doc.id,
            ...doc.data()
          } as PharmacyStock)
        })
        
        setStockItems(stockList)

        // Fetch prescription queue
        const queueQuery = query(
          collection(db, 'prescription-queue'),
          where('pharmacyId', '==', pharmacyId),
          where('status', 'in', ['pending', 'in-progress']),
          orderBy('priority', 'desc'),
          orderBy('createdAt', 'asc')
        )
        
        const queueSnapshot = await getDocs(queueQuery)
        const queueList: PrescriptionQueue[] = []
        
        queueSnapshot.forEach((doc) => {
          queueList.push({
            id: doc.id,
            ...doc.data()
          } as PrescriptionQueue)
        })
        
        setPrescriptionQueue(queueList)

        // Fetch recent prescriptions
        const prescriptionsQuery = query(
          collection(db, 'prescriptions'),
          where('pharmacyId', '==', pharmacyId),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        
        const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
        const prescriptionsList: Prescription[] = []
        
        prescriptionsSnapshot.forEach((doc) => {
          prescriptionsList.push({
            id: doc.id,
            ...doc.data()
          } as Prescription)
        })
        
        setPrescriptions(prescriptionsList)

        // Calculate stats
        const lowStock = stockList.filter(item => item.quantity <= item.minStockLevel).length
        const expiringSoon = stockList.filter(item => {
          const expiryDate = item.expiryDate.toDate()
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          return expiryDate <= thirtyDaysFromNow
        }).length
        
        const dispensedToday = prescriptionsList.filter(prescription => {
          if (prescription.dispensedAt) {
            const dispensedDate = prescription.dispensedAt.toDate()
            const today = new Date()
            return dispensedDate.toDateString() === today.toDateString()
          }
          return false
        }).length

        setStats({
          totalStock: stockList.reduce((sum, item) => sum + item.quantity, 0),
          lowStockItems: lowStock,
          expiringSoon: expiringSoon,
          pendingPrescriptions: queueList.length,
          dispensedToday: dispensedToday,
        })
        
      } catch (error) {
        console.error('Error fetching pharmacy data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPharmacyData()
  }, [pharmacyId])

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'normal': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  // Get stock status color
  const getStockStatusColor = (item: PharmacyStock) => {
    if (item.quantity === 0) return 'destructive'
    if (item.quantity <= item.minStockLevel) return 'default'
    return 'secondary'
  }

  return (
    <>
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#pharmacy-stats">Skip to pharmacy statistics</SkipLink>
      <SkipLink href="#pharmacy-tabs">Skip to pharmacy management tabs</SkipLink>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" id="main-content">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Pharmacy Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your pharmacy operations and serve patients efficiently
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8" id="pharmacy-stats" role="region" aria-label="Pharmacy statistics overview">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStock}</div>
            <p className="text-xs text-muted-foreground">Medicine units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPrescriptions}</div>
            <p className="text-xs text-muted-foreground">To be processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispensed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.dispensedToday}</div>
            <p className="text-xs text-muted-foreground">Prescriptions filled</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs 
        value={activeSection} 
        onValueChange={(value) => {
          setActiveSection(value)
          announce(`Switched to ${value} tab`, 'polite')
          trackSectionLoad(value, true)
        }} 
        className="space-y-6"
        id="pharmacy-tabs"
        role="region"
        aria-label="Pharmacy management sections"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Stock Management</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="dispense" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Dispense Queue</span>
          </TabsTrigger>
        </TabsList>

        {/* Stock Management Tab */}
        <TabsContent value="stock" className="space-y-6" role="tabpanel" aria-labelledby="stock-tab">
          <StockManagementWithSuspense 
            pharmacyId={pharmacyId} 
            onStockUpdate={() => {
              // Refresh dashboard stats when stock is updated
              const fetchPharmacyData = async () => {
                if (!pharmacyId) return
                
                setIsLoading(true)
                try {
                  // Fetch updated stock items for stats
                  const stockQuery = query(
                    collection(db, 'pharmacy-stock'),
                    where('pharmacyId', '==', pharmacyId),
                    where('isActive', '==', true),
                    orderBy('medicineName', 'asc')
                  )
                  
                  const stockSnapshot = await getDocs(stockQuery)
                  const stockList: PharmacyStock[] = []
                  
                  stockSnapshot.forEach((doc) => {
                    stockList.push({
                      id: doc.id,
                      ...doc.data()
                    } as PharmacyStock)
                  })
                  
                  setStockItems(stockList)

                  // Update stats
                  const lowStock = stockList.filter(item => item.quantity <= item.minStockLevel).length
                  const expiringSoon = stockList.filter(item => {
                    const expiryDate = item.expiryDate.toDate()
                    const thirtyDaysFromNow = new Date()
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                    return expiryDate <= thirtyDaysFromNow
                  }).length

                  setStats(prev => ({
                    ...prev,
                    totalStock: stockList.reduce((sum, item) => sum + item.quantity, 0),
                    lowStockItems: lowStock,
                    expiringSoon: expiringSoon,
                  }))
                  
                } catch (error) {
                  console.error('Error fetching updated stock data:', error)
                } finally {
                  setIsLoading(false)
                }
              }
              fetchPharmacyData()
            }}
          />
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-6" role="tabpanel" aria-labelledby="prescriptions-tab">
          <PrescriptionManagementWithSuspense 
            pharmacyId={pharmacyId} 
            onPrescriptionUpdate={() => {
              // Refresh dashboard stats when prescriptions are updated
              const fetchPrescriptionData = async () => {
                if (!pharmacyId) return
                
                try {
                  // Fetch updated prescriptions for stats
                  const prescriptionsQuery = query(
                    collection(db, 'prescriptions'),
                    where('pharmacyId', '==', pharmacyId),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                  )
                  
                  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
                  const prescriptionsList: Prescription[] = []
                  
                  prescriptionsSnapshot.forEach((doc) => {
                    prescriptionsList.push({
                      id: doc.id,
                      ...doc.data()
                    } as Prescription)
                  })
                  
                  setPrescriptions(prescriptionsList)

                  // Fetch updated queue for stats
                  const queueQuery = query(
                    collection(db, 'prescription-queue'),
                    where('pharmacyId', '==', pharmacyId),
                    where('status', 'in', ['pending', 'in-progress']),
                    orderBy('priority', 'desc'),
                    orderBy('createdAt', 'asc')
                  )
                  
                  const queueSnapshot = await getDocs(queueQuery)
                  const queueList: PrescriptionQueue[] = []
                  
                  queueSnapshot.forEach((doc) => {
                    queueList.push({
                      id: doc.id,
                      ...doc.data()
                    } as PrescriptionQueue)
                  })
                  
                  setPrescriptionQueue(queueList)

                  // Update stats
                  const dispensedToday = prescriptionsList.filter(prescription => {
                    if (prescription.dispensedAt) {
                      const dispensedDate = prescription.dispensedAt.toDate()
                      const today = new Date()
                      return dispensedDate.toDateString() === today.toDateString()
                    }
                    return false
                  }).length

                  setStats(prev => ({
                    ...prev,
                    pendingPrescriptions: queueList.length,
                    dispensedToday: dispensedToday,
                  }))
                  
                } catch (error) {
                  console.error('Error fetching updated prescription data:', error)
                }
              }
              fetchPrescriptionData()
            }}
          />
        </TabsContent>

        {/* Dispense Queue Tab */}
        <TabsContent value="dispense" className="space-y-6" role="tabpanel" aria-labelledby="dispense-tab">
          <PrescriptionManagementWithSuspense 
            pharmacyId={pharmacyId} 
            onPrescriptionUpdate={() => {
              // Refresh dashboard stats when prescriptions are updated
              const fetchPrescriptionData = async () => {
                if (!pharmacyId) return
                
                try {
                  // Fetch updated prescriptions for stats
                  const prescriptionsQuery = query(
                    collection(db, 'prescriptions'),
                    where('pharmacyId', '==', pharmacyId),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                  )
                  
                  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
                  const prescriptionsList: Prescription[] = []
                  
                  prescriptionsSnapshot.forEach((doc) => {
                    prescriptionsList.push({
                      id: doc.id,
                      ...doc.data()
                    } as Prescription)
                  })
                  
                  setPrescriptions(prescriptionsList)

                  // Fetch updated queue for stats
                  const queueQuery = query(
                    collection(db, 'prescription-queue'),
                    where('pharmacyId', '==', pharmacyId),
                    where('status', 'in', ['pending', 'in-progress']),
                    orderBy('priority', 'desc'),
                    orderBy('createdAt', 'asc')
                  )
                  
                  const queueSnapshot = await getDocs(queueQuery)
                  const queueList: PrescriptionQueue[] = []
                  
                  queueSnapshot.forEach((doc) => {
                    queueList.push({
                      id: doc.id,
                      ...doc.data()
                    } as PrescriptionQueue)
                  })
                  
                  setPrescriptionQueue(queueList)

                  // Update stats
                  const dispensedToday = prescriptionsList.filter(prescription => {
                    if (prescription.dispensedAt) {
                      const dispensedDate = prescription.dispensedAt.toDate()
                      const today = new Date()
                      return dispensedDate.toDateString() === today.toDateString()
                    }
                    return false
                  }).length

                  setStats(prev => ({
                    ...prev,
                    pendingPrescriptions: queueList.length,
                    dispensedToday: dispensedToday,
                  }))
                  
                } catch (error) {
                  console.error('Error fetching updated prescription data:', error)
                }
              }
              fetchPrescriptionData()
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common pharmacy tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Stock Item
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Prescriptions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Low Stock Alerts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Check Expiring Items
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Sales Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Your pharmacy performance today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Prescriptions Dispensed</span>
              </div>
              <span className="font-semibold">{stats.dispensedToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Pending Orders</span>
              </div>
              <span className="font-semibold">{stats.pendingPrescriptions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Low Stock Items</span>
              </div>
              <span className="font-semibold">{stats.lowStockItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Total Stock Units</span>
              </div>
              <span className="font-semibold">{stats.totalStock}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { AlertTriangle, Heart, Package, Plus, Search, ShoppingCart, TrendingDown, TrendingUp, User } from "lucide-react"

// Mock data
const mockInventory = [
  {
    id: "1",
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    currentStock: 25,
    minStock: 10,
    maxStock: 100,
    price: 12.5,
    expiryDate: "2025-06-15",
    supplier: "MedSupply Co.",
  },
  {
    id: "2",
    name: "Paracetamol 650mg",
    category: "Pain Relief",
    currentStock: 50,
    minStock: 20,
    maxStock: 200,
    price: 5.25,
    expiryDate: "2025-03-20",
    supplier: "HealthCorp",
  },
  {
    id: "3",
    name: "Aspirin 100mg",
    category: "Cardiovascular",
    currentStock: 8,
    minStock: 15,
    maxStock: 80,
    price: 8.75,
    expiryDate: "2024-12-10",
    supplier: "MedSupply Co.",
  },
  {
    id: "4",
    name: "Metformin 500mg",
    category: "Diabetes",
    currentStock: 30,
    minStock: 10,
    maxStock: 60,
    price: 15.0,
    expiryDate: "2025-08-30",
    supplier: "DiabetesCare Ltd",
  },
  {
    id: "5",
    name: "Lisinopril 10mg",
    category: "Cardiovascular",
    currentStock: 5,
    minStock: 12,
    maxStock: 50,
    price: 18.25,
    expiryDate: "2025-01-25",
    supplier: "CardioMeds",
  },
]

const mockOrders = [
  {
    id: "ORD001",
    patientName: "John Doe",
    doctorName: "Dr. Sarah Johnson",
    medications: ["Amoxicillin 500mg x30", "Paracetamol 650mg x20"],
    status: "pending",
    orderDate: "2024-01-15",
    totalAmount: 480.0,
  },
  {
    id: "ORD002",
    patientName: "Mary Smith",
    doctorName: "Dr. Michael Chen",
    medications: ["Metformin 500mg x60"],
    status: "ready",
    orderDate: "2024-01-14",
    totalAmount: 900.0,
  },
  {
    id: "ORD003",
    patientName: "Robert Johnson",
    doctorName: "Dr. Sarah Johnson",
    medications: ["Aspirin 100mg x30", "Lisinopril 10mg x30"],
    status: "completed",
    orderDate: "2024-01-13",
    totalAmount: 810.0,
  },
]

export default function PharmacyDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    price: "",
    expiryDate: "",
    supplier: "",
  })

  const categories = ["all", "Antibiotics", "Pain Relief", "Cardiovascular", "Diabetes"]

  const filteredInventory = mockInventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = mockInventory.filter((item) => item.currentStock <= item.minStock)
  const expiringItems = mockInventory.filter((item) => {
    const expiryDate = new Date(item.expiryDate)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    return expiryDate <= threeMonthsFromNow
  })

  const pendingOrders = mockOrders.filter((order) => order.status === "pending")
  const readyOrders = mockOrders.filter((order) => order.status === "ready")

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Add medicine to Firestore
    console.log("Adding medicine:", newMedicine)
    // Reset form
    setNewMedicine({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      price: "",
      expiryDate: "",
      supplier: "",
    })
  }

  const handleStockUpdate = (medicineId: string, newStock: number) => {
    // TODO: Update stock in Firestore
    console.log("Updating stock:", { medicineId, newStock })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Pharmacy Management</h2>
        <p className="text-muted-foreground">
          Manage your inventory, process orders, and track medication availability
        </p>
      </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockInventory.length}</div>
                  <p className="text-xs text-muted-foreground">In inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground">Need restocking</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders.length}</div>
                  <p className="text-xs text-muted-foreground">To process</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{readyOrders.length}</div>
                  <p className="text-xs text-muted-foreground">Orders ready</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest prescription orders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{order.patientName}</p>
                        <p className="text-sm text-muted-foreground">{order.medications[0]}</p>
                        <p className="text-xs text-muted-foreground">₹{order.totalAmount}</p>
                      </div>
                      <Badge
                        variant={
                          order.status === "completed" ? "default" : order.status === "ready" ? "secondary" : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Alerts</CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg border-destructive/20"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Current: {item.currentStock}</p>
                        <p className="text-xs text-destructive">Below minimum stock</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Reorder
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Medicine</DialogTitle>
                    <DialogDescription>Add a new medicine to your inventory</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMedicine} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Medicine Name</Label>
                        <Input
                          id="name"
                          value={newMedicine.name}
                          onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newMedicine.category}
                          onValueChange={(value) => setNewMedicine({ ...newMedicine, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.slice(1).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentStock">Current Stock</Label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={newMedicine.currentStock}
                          onChange={(e) => setNewMedicine({ ...newMedicine, currentStock: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Min Stock</Label>
                        <Input
                          id="minStock"
                          type="number"
                          value={newMedicine.minStock}
                          onChange={(e) => setNewMedicine({ ...newMedicine, minStock: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxStock">Max Stock</Label>
                        <Input
                          id="maxStock"
                          type="number"
                          value={newMedicine.maxStock}
                          onChange={(e) => setNewMedicine({ ...newMedicine, maxStock: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newMedicine.price}
                          onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={newMedicine.expiryDate}
                          onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newMedicine.supplier}
                        onChange={(e) => setNewMedicine({ ...newMedicine, supplier: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medicine
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredInventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="outline">{item.category}</Badge>
                          {item.currentStock <= item.minStock && <Badge variant="destructive">Low Stock</Badge>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Stock: </span>
                            <span className={item.currentStock <= item.minStock ? "text-destructive font-medium" : ""}>
                              {item.currentStock}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Price: </span>
                            <span>₹{item.price}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires: </span>
                            <span>{item.expiryDate}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Supplier: </span>
                            <span>{item.supplier}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input type="number" placeholder="Qty" className="w-20" min="0" />
                        <Button size="sm" variant="outline">
                          Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prescription Orders</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export Orders
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {mockOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">Order #{order.id}</h4>
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "ready"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Patient: </span>
                            <span className="font-medium">{order.patientName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Doctor: </span>
                            <span>{order.doctorName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span>{order.orderDate}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground text-sm">Medications: </span>
                          <div className="mt-1">
                            {order.medications.map((med, index) => (
                              <Badge key={index} variant="outline" className="mr-2 mb-1">
                                {med}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground text-sm">Total: </span>
                          <span className="font-semibold">₹{order.totalAmount}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {order.status === "pending" && (
                          <>
                            <Button size="sm">Process Order</Button>
                            <Button size="sm" variant="outline">
                              Contact Patient
                            </Button>
                          </>
                        )}
                        {order.status === "ready" && (
                          <>
                            <Button size="sm">Mark as Picked Up</Button>
                            <Button size="sm" variant="outline">
                              Print Label
                            </Button>
                          </>
                        )}
                        {order.status === "completed" && (
                          <Button size="sm" variant="outline">
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <h3 className="text-lg font-semibold">Inventory Alerts</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-destructive mr-2" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Medicines below minimum stock level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg border-destructive/20"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.currentStock} | Min: {item.minStock}
                        </p>
                        <Badge variant="destructive" className="text-xs">
                          {item.minStock - item.currentStock} units short
                        </Badge>
                      </div>
                      <Button size="sm">Reorder</Button>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No low stock items</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                    Expiry Alerts
                  </CardTitle>
                  <CardDescription>Medicines expiring within 3 months</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expiringItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg border-orange-200"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Stock: {item.currentStock} units</p>
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          Expires: {item.expiryDate}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        Mark for Sale
                      </Button>
                    </div>
                  ))}
                  {expiringItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No items expiring soon</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  )
}

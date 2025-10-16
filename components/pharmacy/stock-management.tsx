"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// Alert dialog import will be added after component is created
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { PharmacyStock } from "@/lib/types/healthcare-models"
import { toast } from "sonner"

interface StockManagementProps {
  pharmacyId: string
  onStockUpdate?: () => void
}

interface StockFormData {
  medicineName: string
  quantity: number
  expiryDate: string
  batchNumber: string
  price: number
  manufacturer: string
  category: string
  minStockLevel: number
  maxStockLevel: number
}

const initialFormData: StockFormData = {
  medicineName: '',
  quantity: 0,
  expiryDate: '',
  batchNumber: '',
  price: 0,
  manufacturer: '',
  category: '',
  minStockLevel: 10,
  maxStockLevel: 100,
}

const medicineCategories = [
  'Antibiotics',
  'Pain Relief',
  'Cardiovascular',
  'Diabetes',
  'Respiratory',
  'Gastrointestinal',
  'Dermatology',
  'Vitamins & Supplements',
  'Other'
]

export default function StockManagement({ pharmacyId, onStockUpdate }: StockManagementProps) {
  const [stockItems, setStockItems] = useState<PharmacyStock[]>([])
  const [filteredItems, setFilteredItems] = useState<PharmacyStock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PharmacyStock | null>(null)
  const [formData, setFormData] = useState<StockFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Fetch stock items
  const fetchStockItems = async () => {
    setIsLoading(true)
    try {
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
      setFilteredItems(stockList)
    } catch (error) {
      console.error('Error fetching stock items:', error)
      toast.error('Failed to load stock items')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (pharmacyId) {
      fetchStockItems()
    }
  }, [pharmacyId])

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = stockItems

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'low-stock') {
          return item.quantity <= item.minStockLevel && item.quantity > 0
        } else if (filterStatus === 'out-of-stock') {
          return item.quantity === 0
        } else if (filterStatus === 'expiring-soon') {
          const expiryDate = item.expiryDate.toDate()
          const thirtyDaysFromNow = new Date()
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
          return expiryDate <= thirtyDaysFromNow
        }
        return true
      })
    }

    setFilteredItems(filtered)
  }, [stockItems, searchTerm, filterCategory, filterStatus])

  // Handle form submission for adding new stock
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const newStock = {
        pharmacyId,
        medicineId: `med-${Date.now()}`, // Generate unique medicine ID
        medicineName: formData.medicineName,
        quantity: formData.quantity,
        expiryDate: Timestamp.fromDate(new Date(formData.expiryDate)),
        batchNumber: formData.batchNumber,
        price: formData.price,
        manufacturer: formData.manufacturer,
        category: formData.category,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection(db, 'pharmacy-stock'), newStock)
      
      toast.success('Stock item added successfully')
      setIsAddDialogOpen(false)
      setFormData(initialFormData)
      fetchStockItems()
      onStockUpdate?.()
    } catch (error) {
      console.error('Error adding stock item:', error)
      toast.error('Failed to add stock item')
    }
  }

  // Handle form submission for editing stock
  const handleEditStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingItem) return

    try {
      const updatedStock = {
        medicineName: formData.medicineName,
        quantity: formData.quantity,
        expiryDate: Timestamp.fromDate(new Date(formData.expiryDate)),
        batchNumber: formData.batchNumber,
        price: formData.price,
        manufacturer: formData.manufacturer,
        category: formData.category,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        updatedAt: Timestamp.now(),
      }

      await updateDoc(doc(db, 'pharmacy-stock', editingItem.id), updatedStock)
      
      toast.success('Stock item updated successfully')
      setIsEditDialogOpen(false)
      setEditingItem(null)
      setFormData(initialFormData)
      fetchStockItems()
      onStockUpdate?.()
    } catch (error) {
      console.error('Error updating stock item:', error)
      toast.error('Failed to update stock item')
    }
  }

  // Handle stock deletion
  const handleDeleteStock = async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'pharmacy-stock', itemId), {
        isActive: false,
        updatedAt: Timestamp.now(),
      })
      
      toast.success('Stock item deleted successfully')
      fetchStockItems()
      onStockUpdate?.()
    } catch (error) {
      console.error('Error deleting stock item:', error)
      toast.error('Failed to delete stock item')
    }
  }

  // Handle restock (quick quantity update)
  const handleRestock = async (item: PharmacyStock, additionalQuantity: number) => {
    try {
      const newQuantity = item.quantity + additionalQuantity
      await updateDoc(doc(db, 'pharmacy-stock', item.id), {
        quantity: newQuantity,
        updatedAt: Timestamp.now(),
      })
      
      toast.success(`Added ${additionalQuantity} units to ${item.medicineName}`)
      fetchStockItems()
      onStockUpdate?.()
    } catch (error) {
      console.error('Error restocking item:', error)
      toast.error('Failed to restock item')
    }
  }

  // Open edit dialog with item data
  const openEditDialog = (item: PharmacyStock) => {
    setEditingItem(item)
    setFormData({
      medicineName: item.medicineName,
      quantity: item.quantity,
      expiryDate: item.expiryDate.toDate().toISOString().split('T')[0],
      batchNumber: item.batchNumber,
      price: item.price,
      manufacturer: item.manufacturer,
      category: item.category,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
    })
    setIsEditDialogOpen(true)
  }

  // Get stock status
  const getStockStatus = (item: PharmacyStock) => {
    if (item.quantity === 0) return { status: 'Out of Stock', color: 'destructive' }
    if (item.quantity <= item.minStockLevel) return { status: 'Low Stock', color: 'default' }
    return { status: 'In Stock', color: 'secondary' }
  }

  // Check if item is expiring soon
  const isExpiringSoon = (item: PharmacyStock) => {
    const expiryDate = item.expiryDate.toDate()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Stock Management</h2>
          <p className="text-muted-foreground">Manage your pharmacy inventory</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchStockItems}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Stock Item</DialogTitle>
                <DialogDescription>
                  Add a new medicine to your pharmacy inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicineName">Medicine Name *</Label>
                    <Input
                      id="medicineName"
                      value={formData.medicineName}
                      onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicineCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number *</Label>
                    <Input
                      id="batchNumber"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min="0"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStockLevel">Max Stock Level *</Label>
                    <Input
                      id="maxStockLevel"
                      type="number"
                      min="1"
                      value={formData.maxStockLevel}
                      onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Stock Item</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medicines, manufacturers, or batch numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {medicineCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading stock...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const expiringSoon = isExpiringSoon(item)
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{item.medicineName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.manufacturer} • {item.category}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-sm text-muted-foreground">units</span>
                          {item.quantity <= item.minStockLevel && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{formatDate(item.expiryDate)}</span>
                          {expiringSoon && (
                            <Badge variant="destructive" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Expiring
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.batchNumber}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.color as any}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestock(item, 10)}
                            disabled={item.quantity === 0}
                          >
                            +10
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${item.medicineName}? This action cannot be undone.`)) {
                                handleDeleteStock(item.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                  ? 'No items match your filters' 
                  : 'No stock items found'
                }
              </p>
              <p className="text-sm mb-4">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first medicine to get started'
                }
              </p>
              {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock Item
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogDescription>
              Update the details of this medicine in your inventory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-medicineName">Medicine Name *</Label>
                <Input
                  id="edit-medicineName"
                  value={formData.medicineName}
                  onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer *</Label>
                <Input
                  id="edit-manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicineCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-batchNumber">Batch Number *</Label>
                <Input
                  id="edit-batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expiryDate">Expiry Date *</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-minStockLevel">Min Stock Level *</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStockLevel">Max Stock Level *</Label>
                <Input
                  id="edit-maxStockLevel"
                  type="number"
                  min="1"
                  value={formData.maxStockLevel}
                  onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Stock Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
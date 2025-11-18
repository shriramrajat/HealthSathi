"use client"

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useState, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { User, Camera, Save, AlertCircle, CheckCircle, Upload, X, Settings } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/validation-schemas"
import { getRoleDisplayName, getRoleBadgeVariant, type UserRole } from "@/lib/dashboard-utils"

export default function ProfilePage() {
  const { user, updateProfile, loading } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      age: user?.age || undefined,
      phoneNumber: user?.phoneNumber || "",
    },
  })

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUpdateError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!photoPreview || !user) return

    setIsUploadingPhoto(true)
    setUpdateError(null)

    try {
      // For now, show that photo upload is coming soon
      setUpdateError('Profile photo upload is coming soon! This feature will be available in a future update.')
      setPhotoPreview(null)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoClear = () => {
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: ProfileUpdateFormData) => {
    if (!user) return

    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      // Prepare update data, filtering out empty strings
      const updateData: Partial<ProfileUpdateFormData> = {}
      
      if (data.name !== user.name) {
        updateData.name = data.name
      }
      
      if (data.age !== user.age) {
        updateData.age = data.age
      }
      
      if (data.phoneNumber !== user.phoneNumber) {
        updateData.phoneNumber = data.phoneNumber || undefined
      }

      // Only update if there are actual changes
      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData)
        setUpdateSuccess(true)
        
        // Clear success message after 3 seconds
        setTimeout(() => setUpdateSuccess(false), 3000)
      }
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = () => {
    reset({
      name: user?.name || "",
      age: user?.age || undefined,
      phoneNumber: user?.phoneNumber || "",
    })
    setUpdateError(null)
    setUpdateSuccess(false)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your personal information and account settings
            </p>
          </div>
          <Link href="/dashboard/account">
            <Button variant="outline" className="mt-4 sm:mt-0 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Settings
            </Button>
          </Link>
        </div>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {updateError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>
                Your account information and role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={photoPreview || user.photoURL} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="text-lg">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    title="Change profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>

                {/* Photo Upload Actions */}
                {photoPreview && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      {isUploadingPhoto ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePhotoClear}
                      disabled={isUploadingPhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                    {getRoleDisplayName(user.role as UserRole)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Account Info */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{user.email}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                  <p className="text-sm font-mono">{user.qrId}</p>
                </div>
                
                {user.age && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-sm">{user.age} years old</p>
                  </div>
                )}
                
                {user.phoneNumber && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm">{user.phoneNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your personal information below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter your full name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Age Field */}
                <div className="space-y-2">
                  <Label htmlFor="age">Age (Optional)</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="150"
                    {...register("age", { valueAsNumber: true })}
                    placeholder="Enter your age"
                    className={errors.age ? "border-destructive" : ""}
                  />
                  {errors.age && (
                    <p className="text-sm text-destructive">{errors.age.message}</p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register("phoneNumber")}
                    placeholder="Enter your phone number (e.g., +1234567890)"
                    className={errors.phoneNumber ? "border-destructive" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Include country code for international numbers
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={!isDirty || isUpdating || loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={!isDirty || isUpdating}
                  >
                    Reset Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
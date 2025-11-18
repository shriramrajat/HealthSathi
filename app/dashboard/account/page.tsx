"use client"

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Key, 
  Mail, 
  Shield, 
  Trash2, 
  User 
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  changePasswordSchema, 
  changeEmailSchema, 
  deleteAccountSchema,
  type ChangePasswordFormData,
  type ChangeEmailFormData,
  type DeleteAccountFormData
} from "@/lib/validation-schemas"

export default function AccountPage() {
  const { user, changeEmail, changePassword, deleteAccount, signOut } = useAuth()
  const router = useRouter()
  
  // State for different operations
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  
  // Success/error states
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Form hooks
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const emailForm = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      currentPassword: "",
      newEmail: "",
      confirmNewEmail: "",
    },
  })

  const deleteForm = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      currentPassword: "",
      confirmationText: "",
    },
  })

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      await changePassword(data.currentPassword, data.newPassword)
      setPasswordSuccess(true)
      passwordForm.reset()
      
      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const onEmailSubmit = async (data: ChangeEmailFormData) => {
    setIsChangingEmail(true)
    setEmailError(null)
    setEmailSuccess(false)

    try {
      await changeEmail(data.currentPassword, data.newEmail)
      setEmailSuccess(true)
      emailForm.reset()
      
      // Clear success message after 5 seconds
      setTimeout(() => setEmailSuccess(false), 5000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Failed to change email")
    } finally {
      setIsChangingEmail(false)
    }
  }

  const onDeleteSubmit = async (data: DeleteAccountFormData) => {
    setIsDeletingAccount(true)
    setDeleteError(null)

    try {
      await deleteAccount(data.currentPassword)
      // User will be automatically signed out and redirected
      router.push("/")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account")
      setIsDeletingAccount(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading account settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security and preferences
          </p>
        </div>

        {/* Success Messages */}
        {passwordSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Password changed successfully!
            </AlertDescription>
          </Alert>
        )}

        {emailSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Email address changed successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      {...passwordForm.register("currentPassword")}
                      placeholder="Enter your current password"
                      className={passwordForm.formState.errors.currentPassword ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      {...passwordForm.register("newPassword")}
                      placeholder="Enter your new password"
                      className={passwordForm.formState.errors.newPassword ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...passwordForm.register("confirmNewPassword")}
                      placeholder="Confirm your new password"
                      className={passwordForm.formState.errors.confirmNewPassword ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmNewPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Change Email Address
              </CardTitle>
              <CardDescription>
                Update your email address. Current email: {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="emailCurrentPassword">Current Password</Label>
                  <Input
                    id="emailCurrentPassword"
                    type="password"
                    {...emailForm.register("currentPassword")}
                    placeholder="Enter your current password"
                    className={emailForm.formState.errors.currentPassword ? "border-destructive" : ""}
                  />
                  {emailForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Email */}
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email Address</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    {...emailForm.register("newEmail")}
                    placeholder="Enter your new email address"
                    className={emailForm.formState.errors.newEmail ? "border-destructive" : ""}
                  />
                  {emailForm.formState.errors.newEmail && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.newEmail.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Email */}
                <div className="space-y-2">
                  <Label htmlFor="confirmNewEmail">Confirm New Email Address</Label>
                  <Input
                    id="confirmNewEmail"
                    type="email"
                    {...emailForm.register("confirmNewEmail")}
                    placeholder="Confirm your new email address"
                    className={emailForm.formState.errors.confirmNewEmail ? "border-destructive" : ""}
                  />
                  {emailForm.formState.errors.confirmNewEmail && (
                    <p className="text-sm text-destructive">
                      {emailForm.formState.errors.confirmNewEmail.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isChangingEmail}
                  className="w-full sm:w-auto"
                >
                  {isChangingEmail ? "Changing Email..." : "Change Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="font-semibold text-destructive mb-2">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. This will permanently 
                    delete your profile, posts, and all associated data.
                  </p>
                  
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account
                        </DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account 
                          and remove all your data from our servers.
                        </DialogDescription>
                      </DialogHeader>

                      {deleteError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{deleteError}</AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit as any)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="deleteCurrentPassword">Current Password</Label>
                          <Input
                            id="deleteCurrentPassword"
                            type="password"
                            {...deleteForm.register("currentPassword")}
                            placeholder="Enter your current password"
                            className={deleteForm.formState.errors.currentPassword ? "border-destructive" : ""}
                          />
                          {deleteForm.formState.errors.currentPassword && (
                            <p className="text-sm text-destructive">
                              {deleteForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmationText">
                            Type <strong>DELETE</strong> to confirm
                          </Label>
                          <Input
                            id="confirmationText"
                            {...deleteForm.register("confirmationText")}
                            placeholder="DELETE"
                            className={deleteForm.formState.errors.confirmationText ? "border-destructive" : ""}
                          />
                          {deleteForm.formState.errors.confirmationText && (
                            <p className="text-sm text-destructive">
                              {deleteForm.formState.errors.confirmationText.message}
                            </p>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeletingAccount}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            disabled={isDeletingAccount}
                          >
                            {isDeletingAccount ? "Deleting..." : "Delete Account"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
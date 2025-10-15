"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Heart, UserPlus, LogIn, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { loginSchema, registrationSchema, passwordResetSchema, type LoginFormData, type RegistrationFormData, type PasswordResetFormData } from "@/lib/validation-schemas"

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Registration form
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "patient",
      age: undefined,
    },
  })

  // Password reset form
  const resetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setAuthError(null)
    
    try {
      await signIn(data.email, data.password)
      // Redirect will be handled by auth provider based on user role
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegistration = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    setAuthError(null)
    
    try {
      await signUp(data.email, data.password, data.name, data.role, data.age)
      // Redirect will be handled by auth provider based on user role
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    setAuthError(null)
    
    try {
      await signInWithGoogle()
      // Redirect will be handled by auth provider based on user role
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async (data: PasswordResetFormData) => {
    setIsSubmitting(true)
    setAuthError(null)
    
    try {
      await resetPassword(data.email)
      setResetEmailSent(true)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Password reset failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearError = () => {
    setAuthError(null)
  }

  const switchToLogin = () => {
    setIsLogin(true)
    setShowForgotPassword(false)
    setResetEmailSent(false)
    clearError()
  }

  const switchToRegister = () => {
    setIsLogin(false)
    setShowForgotPassword(false)
    setResetEmailSent(false)
    clearError()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-foreground">Rural Health</h1>
          </div>
          <p className="text-muted-foreground">Connecting rural communities with quality healthcare</p>
        </div>

        <Card>
          <CardHeader>
            {!showForgotPassword ? (
              <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="flex items-center gap-2" onClick={switchToLogin}>
                    <LogIn className="h-4 w-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex items-center gap-2" onClick={switchToRegister}>
                    <UserPlus className="h-4 w-4" />
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your healthcare dashboard</CardDescription>
                </TabsContent>

                <TabsContent value="register">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join our rural health network</CardDescription>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  {resetEmailSent 
                    ? "Check your email for password reset instructions"
                    : "Enter your email to receive password reset instructions"
                  }
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert for Password Reset */}
            {resetEmailSent && (
              <Alert className="mb-4">
                <AlertDescription>
                  Password reset email sent! Check your inbox and follow the instructions to reset your password.
                </AlertDescription>
              </Alert>
            )}

            {showForgotPassword ? (
              /* Password Reset Form */
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    {...resetForm.register("email")}
                    disabled={isSubmitting || resetEmailSent}
                  />
                  {resetForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || resetEmailSent}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : resetEmailSent ? (
                      "Email Sent"
                    ) : (
                      "Send Reset Email"
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={switchToLogin}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : isLogin ? (
              /* Login Form */
              <div className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      {...loginForm.register("email")}
                      disabled={isSubmitting}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      {...loginForm.register("password")}
                      disabled={isSubmitting}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-4">
                <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      {...registrationForm.register("email")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Enter your password"
                      {...registrationForm.register("password")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      {...registrationForm.register("confirmPassword")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      {...registrationForm.register("name")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">Role</Label>
                    <Select 
                      value={registrationForm.watch("role")} 
                      onValueChange={(value) => registrationForm.setValue("role", value as any)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="chw">Community Health Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    {registrationForm.formState.errors.role && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.role.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-age">Age (Optional)</Label>
                    <Input
                      id="register-age"
                      type="number"
                      placeholder="Enter your age"
                      min="1"
                      max="150"
                      {...registrationForm.register("age", { 
                        setValueAs: (value) => value === "" ? undefined : parseInt(value, 10) 
                      })}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.age && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.age.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure • Private • Accessible</p>
        </div>
      </div>
    </div>
  )
}

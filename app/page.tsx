"use client"

// Force dynamic rendering to prevent static generation errors with auth
export const dynamic = 'force-dynamic'
export const dynamicParams = true

import type React from "react"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
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
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { createValidationSchemas, type LoginFormData, type RegistrationFormData, type PasswordResetFormData } from "@/lib/validation-schemas-i18n"

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const t = useTranslations('auth')

  // Create validation schemas with translated error messages
  const { loginSchema, registrationSchema, passwordResetSchema } = useMemo(
    () => createValidationSchemas((key: string) => t(key)),
    [t]
  )

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <div className="flex items-center">
              <Heart className="h-12 w-12 text-primary mr-2" />
              <h1 className="text-3xl font-bold text-foreground">{t('appTitle')}</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageSwitcher variant="compact" size="sm" />
            </div>
          </div>
          <p className="text-muted-foreground">{t('appSubtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            {!showForgotPassword ? (
              <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="flex items-center gap-2" onClick={switchToLogin}>
                    <LogIn className="h-4 w-4" />
                    {t('tabs.login')}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="flex items-center gap-2" onClick={switchToRegister}>
                    <UserPlus className="h-4 w-4" />
                    {t('tabs.register')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <CardTitle>{t('login.title')}</CardTitle>
                  <CardDescription>{t('login.subtitle')}</CardDescription>
                </TabsContent>

                <TabsContent value="register">
                  <CardTitle>{t('register.title')}</CardTitle>
                  <CardDescription>{t('register.subtitle')}</CardDescription>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <CardTitle>{t('forgotPassword.title')}</CardTitle>
                <CardDescription>
                  {resetEmailSent 
                    ? t('forgotPassword.subtitleSuccess')
                    : t('forgotPassword.subtitle')
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
                  {t('forgotPassword.emailSentMessage')}
                </AlertDescription>
              </Alert>
            )}

            {showForgotPassword ? (
              /* Password Reset Form */
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t('forgotPassword.email')}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('forgotPassword.emailPlaceholder')}
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
                        {t('forgotPassword.submitting')}
                      </>
                    ) : resetEmailSent ? (
                      t('forgotPassword.emailSent')
                    ) : (
                      t('forgotPassword.submit')
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={switchToLogin}
                  >
                    {t('forgotPassword.backToLogin')}
                  </Button>
                </div>
              </form>
            ) : isLogin ? (
              /* Login Form */
              <div className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('login.email')}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      {...loginForm.register("email")}
                      disabled={isSubmitting}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('login.password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t('login.passwordPlaceholder')}
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
                        {t('login.submitting')}
                      </>
                    ) : (
                      t('login.submit')
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('login.orContinueWith')}</span>
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
                  {t('login.socialLogin.google')}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    className="text-sm text-muted-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    {t('login.forgotPassword')}
                  </Button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-4">
                <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">{t('register.email')}</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder={t('register.emailPlaceholder')}
                      {...registrationForm.register("email")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">{t('register.password')}</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={t('register.passwordPlaceholder')}
                      {...registrationForm.register("password")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('register.confirmPassword')}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      {...registrationForm.register("confirmPassword")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-name">{t('register.fullName')}</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={t('register.fullNamePlaceholder')}
                      {...registrationForm.register("name")}
                      disabled={isSubmitting}
                    />
                    {registrationForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">{t('register.role')}</Label>
                    <Select 
                      value={registrationForm.watch("role")} 
                      onValueChange={(value) => registrationForm.setValue("role", value as any)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('register.roleSelectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">{t('register.roles.patient')}</SelectItem>
                        <SelectItem value="doctor">{t('register.roles.doctor')}</SelectItem>
                        <SelectItem value="pharmacy">{t('register.roles.pharmacy')}</SelectItem>
                        <SelectItem value="chw">{t('register.roles.chw')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {registrationForm.formState.errors.role && (
                      <p className="text-sm text-destructive">{registrationForm.formState.errors.role.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-age">{t('register.age')}</Label>
                    <Input
                      id="register-age"
                      type="number"
                      placeholder={t('register.agePlaceholder')}
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
                        {t('register.submitting')}
                      </>
                    ) : (
                      t('register.submit')
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('register.orContinueWith')}</span>
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
                  {t('register.socialLogin.google')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('footer')}</p>
        </div>
      </div>
    </div>
  )
}

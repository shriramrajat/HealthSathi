"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Loader2, AlertCircle, Lock } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'patient' | 'doctor' | 'pharmacy' | 'chw'
  fallback?: React.ReactNode
}

/**
 * Protected Route Component
 * Provides client-side route protection with authentication and role verification
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth state to initialize
    if (!loading) {
      setIsChecking(false)
    }
  }, [loading])

  // Show loading state while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication error: {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    const returnUrl = encodeURIComponent(pathname)
    router.push(`/login?returnUrl=${returnUrl}`)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Check role-based access if required role is specified
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to user's appropriate dashboard
    const userDashboard = `/dashboard/${user.role}`
    
    if (pathname !== userDashboard) {
      router.push(userDashboard)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and has proper role access
  return <>{children}</>
}

/**
 * Higher-order component for role-based route protection
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: 'patient' | 'doctor' | 'pharmacy' | 'chw'
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Unauthorized Access Component
 * Shows when user doesn't have permission to access a route
 */
export function UnauthorizedAccess({ 
  requiredRole, 
  userRole 
}: { 
  requiredRole: string
  userRole: string 
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <Lock className="h-12 w-12 mx-auto text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page requires <strong>{requiredRole}</strong> role access. 
            Your current role is <strong>{userRole}</strong>.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push(`/dashboard/${userRole}`)}
            className="w-full"
          >
            Go to My Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Dashboard Route Guard
 * Specifically for dashboard routes with automatic role-based redirection
 */
export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user) {
      // Extract the role from the current path
      const pathRole = pathname.split('/dashboard/')[1]
      
      // If user is on wrong dashboard, redirect to correct one
      if (pathRole && pathRole !== user.role) {
        router.push(`/dashboard/${user.role}`)
      }
      
      // If user is on /dashboard root, redirect to their role dashboard
      if (pathname === '/dashboard') {
        router.push(`/dashboard/${user.role}`)
      }
    }
  }, [user, loading, pathname, router])

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}

/**
 * Auth Guard Hook
 * Custom hook for components that need authentication checks
 */
export function useAuthGuard(requiredRole?: 'patient' | 'doctor' | 'pharmacy' | 'chw') {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user && !loading
  const hasRequiredRole = !requiredRole || (user?.role === requiredRole)
  const canAccess = isAuthenticated && hasRequiredRole

  const redirectToLogin = () => {
    const returnUrl = encodeURIComponent(pathname)
    router.push(`/login?returnUrl=${returnUrl}`)
  }

  const redirectToDashboard = () => {
    if (user) {
      router.push(`/dashboard/${user.role}`)
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hasRequiredRole,
    canAccess,
    redirectToLogin,
    redirectToDashboard,
  }
}
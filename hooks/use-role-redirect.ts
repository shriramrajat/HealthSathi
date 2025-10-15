"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { 
  handleRoleChange, 
  isValidRole, 
  type UserRole 
} from "@/lib/dashboard-utils"

/**
 * Custom hook to handle role-based redirects and access control
 */
export function useRoleRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const previousRoleRef = useRef<UserRole | null>(null)

  useEffect(() => {
    if (loading || !user) {
      return
    }

    // Validate user role
    if (!isValidRole(user.role)) {
      console.error("Invalid user role:", user.role)
      router.push("/auth/login?error=invalid_role")
      return
    }

    const currentRole = user.role as UserRole
    const previousRole = previousRoleRef.current

    // Handle role changes or initial load
    const roleChangeResult = handleRoleChange(previousRole, currentRole, pathname)
    
    if (roleChangeResult.shouldRedirect && roleChangeResult.redirectPath) {
      console.log(`Redirecting from ${pathname} to ${roleChangeResult.redirectPath}`)
      router.push(roleChangeResult.redirectPath)
    }

    // Update the previous role reference
    previousRoleRef.current = currentRole
  }, [user, loading, router, pathname])

  return {
    user,
    loading,
    isValidUser: user && isValidRole(user.role),
  }
}

/**
 * Hook specifically for dashboard pages to ensure proper access control
 */
export function useDashboardAccess(requiredRole?: UserRole) {
  const { user, loading, isValidUser } = useRoleRedirect()
  
  const hasAccess = isValidUser && (!requiredRole || user?.role === requiredRole)
  
  return {
    user,
    loading,
    hasAccess,
    isValidUser,
  }
}
"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Heart } from "lucide-react"
import { getDashboardRoute, isValidRole, type UserRole } from "@/lib/dashboard-utils"

export default function DashboardRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push("/auth/login")
        return
      }

      // Validate user role
      if (!isValidRole(user.role)) {
        console.error("Invalid user role:", user.role)
        router.push("/auth/login?error=invalid_role")
        return
      }

      // User is authenticated with valid role, redirect to their dashboard
      const targetRoute = getDashboardRoute(user.role as UserRole)
      router.push(targetRoute)
    }
  }, [user, loading, router])

  // Show loading state while determining redirect
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Heart className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">
          {loading ? "Loading..." : "Redirecting to your dashboard..."}
        </p>
      </div>
    </div>
  )
}
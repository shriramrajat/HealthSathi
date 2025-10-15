"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

interface DashboardErrorProps {
  type: "invalid_role" | "access_denied" | "role_change_required"
  message?: string
  redirectPath?: string
}

export function DashboardError({ type, message, redirectPath }: DashboardErrorProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleRedirect = () => {
    if (redirectPath) {
      router.push(redirectPath)
    } else {
      router.push("/dashboard")
    }
  }

  const getErrorContent = () => {
    switch (type) {
      case "invalid_role":
        return {
          title: "Invalid Role",
          description: message || "Your account has an invalid role. Please contact support for assistance.",
          showSignOut: true,
          showRedirect: false,
        }
      case "access_denied":
        return {
          title: "Access Denied",
          description: message || "You don't have permission to access this dashboard.",
          showSignOut: false,
          showRedirect: true,
        }
      case "role_change_required":
        return {
          title: "Role Changed",
          description: message || "Your role has been updated. You'll be redirected to the appropriate dashboard.",
          showSignOut: false,
          showRedirect: true,
        }
      default:
        return {
          title: "Dashboard Error",
          description: message || "An error occurred while accessing the dashboard.",
          showSignOut: true,
          showRedirect: true,
        }
    }
  }

  const errorContent = getErrorContent()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{errorContent.title}</CardTitle>
          <CardDescription className="text-center">
            {errorContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {errorContent.showRedirect && (
            <Button onClick={handleRedirect} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          )}
          {errorContent.showSignOut && (
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
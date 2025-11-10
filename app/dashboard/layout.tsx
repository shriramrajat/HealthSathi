"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Heart, User, LogOut, Settings, ChevronDown } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { 
  hasAccessToRoute, 
  handleRoleChange, 
  getRoleDisplayName, 
  getRoleBadgeVariant,
  isValidRole,
  type UserRole 
} from "@/lib/dashboard-utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Handle authentication and role-based access control
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

      // Check if user has access to current route
      if (!hasAccessToRoute(user.role as UserRole, pathname)) {
        // User doesn't have access, redirect to their appropriate dashboard
        const roleChange = handleRoleChange(null, user.role as UserRole, pathname)
        if (roleChange.shouldRedirect && roleChange.redirectPath) {
          console.log(`Access denied. Redirecting from ${pathname} to ${roleChange.redirectPath}`)
          router.push(roleChange.redirectPath)
        }
      }
    }
  }, [user, loading, router, pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }



  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Rural Health Portal</h1>
            </div>

            {/* User Profile and Actions */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher variant="compact" size="sm" />
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Role Badge */}
              <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                {getRoleDisplayName(user.role as UserRole)}
              </Badge>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.photoURL} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.qrId && (
                        <p className="text-xs text-muted-foreground">ID: {user.qrId}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
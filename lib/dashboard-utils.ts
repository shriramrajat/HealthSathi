/**
 * Dashboard utilities for role-based routing and access control
 */

export type UserRole = "patient" | "doctor" | "pharmacy" | "chw"

/**
 * Map user roles to their corresponding dashboard routes
 */
export const ROLE_ROUTES: Record<UserRole, string> = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  pharmacy: "/dashboard/pharmacy",
  chw: "/dashboard/chw",
}

/**
 * Get the dashboard route for a specific role
 */
export function getDashboardRoute(role: UserRole): string {
  return ROLE_ROUTES[role]
}

/**
 * Check if a user role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return Object.keys(ROLE_ROUTES).includes(role)
}

/**
 * Get the role from a dashboard path
 */
export function getRoleFromPath(path: string): UserRole | null {
  for (const [role, route] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route)) {
      return role as UserRole
    }
  }
  return null
}

/**
 * Check if a user has access to a specific dashboard route
 */
export function hasAccessToRoute(userRole: UserRole, targetPath: string): boolean {
  const requiredRole = getRoleFromPath(targetPath)
  
  // If no specific role is required (e.g., /dashboard), allow access
  if (!requiredRole) {
    return true
  }
  
  // Check if user's role matches the required role
  return userRole === requiredRole
}

/**
 * Redirect user to their appropriate dashboard based on role
 */
export function getRedirectPath(userRole: UserRole, currentPath?: string): string {
  // If user is already on their correct dashboard, stay there
  if (currentPath && hasAccessToRoute(userRole, currentPath)) {
    return currentPath
  }
  
  // Otherwise, redirect to their role-specific dashboard
  return getDashboardRoute(userRole)
}

/**
 * Handle role change scenarios
 */
export function handleRoleChange(
  oldRole: UserRole | null,
  newRole: UserRole,
  currentPath: string
): { shouldRedirect: boolean; redirectPath?: string } {
  // If no old role (new user), redirect to new role dashboard
  if (!oldRole) {
    return {
      shouldRedirect: true,
      redirectPath: getDashboardRoute(newRole),
    }
  }
  
  // If role changed, redirect to new role dashboard
  if (oldRole !== newRole) {
    return {
      shouldRedirect: true,
      redirectPath: getDashboardRoute(newRole),
    }
  }
  
  // If role is the same but user is on wrong dashboard, redirect
  if (!hasAccessToRoute(newRole, currentPath)) {
    return {
      shouldRedirect: true,
      redirectPath: getDashboardRoute(newRole),
    }
  }
  
  // No redirect needed
  return { shouldRedirect: false }
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    patient: "Patient",
    doctor: "Doctor",
    pharmacy: "Pharmacy",
    chw: "Community Health Worker",
  }
  
  return roleNames[role]
}

/**
 * Get role badge variant for UI styling
 */
export function getRoleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" | "destructive" {
  const variants: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
    doctor: "default",
    patient: "secondary", 
    pharmacy: "outline",
    chw: "destructive",
  }
  
  return variants[role]
}

/**
 * Error messages for role-related issues
 */
export const ROLE_ERROR_MESSAGES = {
  INVALID_ROLE: "Invalid user role. Please contact support.",
  ACCESS_DENIED: "You don't have access to this dashboard.",
  ROLE_CHANGE_REQUIRED: "Your role has changed. Redirecting to appropriate dashboard.",
} as const
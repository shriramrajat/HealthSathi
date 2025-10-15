"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User as FirebaseUser } from "firebase/auth"
import { getFirebaseAuth, preloadFirebaseServices } from "@/lib/firebase"
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
  updateUserProfile,
  getCurrentUser,
  changeUserEmail,
  changeUserPassword,
  deleteUserAccount,
  type UserProfile,
  type RegistrationData 
} from "@/lib/auth-service"

// Updated User interface to match UserProfile from auth-service
interface User {
  uid: string
  email: string
  name: string
  role: "patient" | "doctor" | "pharmacy" | "chw"
  age?: number
  qrId: string
  photoURL?: string
  phoneNumber?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: User["role"], age?: number) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<User, 'name' | 'age' | 'phoneNumber' | 'photoURL'>>) => Promise<void>
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: (currentPassword: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  // Convert UserProfile to User interface
  const convertUserProfile = (profile: UserProfile): User => ({
    uid: profile.uid,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    age: profile.age,
    qrId: profile.qrId,
    photoURL: profile.photoURL,
    phoneNumber: profile.phoneNumber,
  })

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    // Initialize Firebase Auth with optimized loading
    const initializeAuth = async () => {
      try {
        // Preload Firebase services for better performance
        await preloadFirebaseServices()
        
        const auth = await getFirebaseAuth()
        const { onAuthStateChanged } = await import('firebase/auth')
        
        // Set up Firebase auth state listener for real-time updates
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          try {
            if (firebaseUser) {
              // User is signed in, get their profile from Firestore
              const userProfile = await getCurrentUser()
              if (userProfile) {
                setAuthState({
                  user: convertUserProfile(userProfile),
                  loading: false,
                  error: null,
                })
              } else {
                // Firebase user exists but no profile in Firestore (edge case)
                setAuthState({
                  user: null,
                  loading: false,
                  error: "User profile not found. Please contact support.",
                })
              }
            } else {
              // User is signed out
              setAuthState({
                user: null,
                loading: false,
                error: null,
              })
            }
          } catch (error) {
            console.error("Auth state change error:", error)
            setAuthState({
              user: null,
              loading: false,
              error: error instanceof Error ? error.message : "Authentication error",
            })
          }
        })
      } catch (error) {
        console.error("Failed to initialize Firebase Auth:", error)
        setAuthState({
          user: null,
          loading: false,
          error: "Failed to initialize authentication. Please refresh the page.",
        })
      }
    }

    initializeAuth()

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await signInWithEmail(email, password)
      // Auth state will be updated by the onAuthStateChanged listener
      // No need to manually set state here
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      }))
    }
  }

  const signUp = async (email: string, password: string, name: string, role: User["role"], age?: number) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const registrationData: RegistrationData = {
        email,
        password,
        name,
        role,
        age,
      }
      const result = await signUpWithEmail(registrationData)
      // Auth state will be updated by the onAuthStateChanged listener
      // No need to manually set state here
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }))
    }
  }

  const handleSignInWithGoogle = async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await signInWithGoogle()
      // Auth state will be updated by the onAuthStateChanged listener
      // No need to manually set state here
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Google sign in failed",
      }))
    }
  }

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }))
    try {
      await firebaseSignOut()
      // Auth state will be updated by the onAuthStateChanged listener
      // No need to manually set state here
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }))
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email)
      // Success - no state update needed for password reset
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Password reset failed",
      }))
      throw error // Re-throw so caller can handle success/error UI
    }
  }

  const handleUpdateProfile = async (updates: Partial<Pick<User, 'name' | 'age' | 'phoneNumber' | 'photoURL'>>) => {
    if (!authState.user) {
      throw new Error("No user logged in")
    }

    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await updateUserProfile(authState.user.uid, updates)
      
      // Update local state immediately for better UX
      setAuthState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
        loading: false,
      }))
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Profile update failed",
      }))
      throw error
    }
  }

  const handleChangeEmail = async (currentPassword: string, newEmail: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await changeUserEmail(currentPassword, newEmail)
      
      // Update local state with new email
      setAuthState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, email: newEmail } : null,
        loading: false,
      }))
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Email change failed",
      }))
      throw error
    }
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await changeUserPassword(currentPassword, newPassword)
      setAuthState((prev) => ({ ...prev, loading: false }))
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Password change failed",
      }))
      throw error
    }
  }

  const handleDeleteAccount = async (currentPassword: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await deleteUserAccount(currentPassword)
      // User will be automatically signed out and state updated by onAuthStateChanged
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Account deletion failed",
      }))
      throw error
    }
  }

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signInWithGoogle: handleSignInWithGoogle,
        signOut,
        resetPassword: handleResetPassword,
        updateProfile: handleUpdateProfile,
        changeEmail: handleChangeEmail,
        changePassword: handleChangePassword,
        deleteAccount: handleDeleteAccount,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

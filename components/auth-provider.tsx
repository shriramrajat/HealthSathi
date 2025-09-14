"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, AuthState } from "@/lib/auth"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: User["role"], age?: number) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // TODO: Check Firebase auth state
        setAuthState((prev) => ({ ...prev, loading: false }))
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Authentication error",
        }))
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      // TODO: Implement Firebase signIn
      const user: User = {
        uid: "demo-user",
        email,
        name: "Demo User",
        role: "patient",
        qrId: "QR-DEMO123",
      }
      setAuthState({ user, loading: false, error: null })
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
      // TODO: Implement Firebase signUp
      const user: User = {
        uid: "demo-user-" + Date.now(),
        email,
        name,
        role,
        age,
        qrId: "QR-" + Math.random().toString(36).substr(2, 9),
      }
      setAuthState({ user, loading: false, error: null })
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }))
    }
  }

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }))
    try {
      // TODO: Implement Firebase signOut
      setAuthState({ user: null, loading: false, error: null })
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signOut,
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

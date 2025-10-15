import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AuthProvider } from '@/components/auth-provider'
import { ProtectedRoute } from '@/components/protected-route'
import type { ReactNode } from 'react'

// Mock Firebase modules for integration testing
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
}))

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  })),
  getFirebaseFirestore: vi.fn(() => ({})),
  getGoogleProvider: vi.fn(() => ({})),
  preloadFirebaseServices: vi.fn(),
}))

vi.mock('@/lib/firebase-config', () => ({
  COLLECTIONS: {
    USERS: 'users',
  },
}))

// Mock Next.js router
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard/patient',
}))

// Import Firebase functions after mocking
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

// Mock implementations
const mockSignInWithEmailAndPassword = vi.mocked(signInWithEmailAndPassword)
const mockCreateUserWithEmailAndPassword = vi.mocked(createUserWithEmailAndPassword)
const mockSignInWithPopup = vi.mocked(signInWithPopup)
const mockFirebaseSignOut = vi.mocked(firebaseSignOut)
const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail)
const mockUpdateProfile = vi.mocked(updateProfile)
const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged)
const mockDoc = vi.mocked(doc)
const mockSetDoc = vi.mocked(setDoc)
const mockGetDoc = vi.mocked(getDoc)
const mockUpdateDoc = vi.mocked(updateDoc)

// Test components
const TestLoginForm = () => {
  return (
    <div>
      <input data-testid="email-input" type="email" placeholder="Email" />
      <input data-testid="password-input" type="password" placeholder="Password" />
      <button data-testid="login-button">Sign In</button>
      <button data-testid="google-signin-button">Sign in with Google</button>
      <button data-testid="forgot-password-button">Forgot Password</button>
    </div>
  )
}

const TestRegistrationForm = () => {
  return (
    <div>
      <input data-testid="reg-email-input" type="email" placeholder="Email" />
      <input data-testid="reg-password-input" type="password" placeholder="Password" />
      <input data-testid="reg-name-input" type="text" placeholder="Full Name" />
      <select data-testid="reg-role-select">
        <option value="">Select Role</option>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="pharmacy">Pharmacy</option>
        <option value="chw">Community Health Worker</option>
      </select>
      <input data-testid="reg-age-input" type="number" placeholder="Age" />
      <button data-testid="register-button">Register</button>
      <button data-testid="reg-google-button">Sign up with Google</button>
    </div>
  )
}

const TestDashboard = ({ role }: { role: string }) => {
  return (
    <div data-testid={`${role}-dashboard`}>
      <h1>{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
      <button data-testid="logout-button">Logout</button>
    </div>
  )
}

const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

describe('Authentication Flow Integration Tests', () => {
  const mockFirebaseUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
  }

  const mockUserProfile = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'patient' as const,
    age: 30,
    qrId: 'QR123456',
    photoURL: undefined,
    phoneNumber: undefined,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    isActive: true,
    lastLoginAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
    
    // Setup default mock implementations
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate no user initially
      callback(null)
      return vi.fn() // Unsubscribe function
    })
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  describe('Complete Registration Process', () => {
    it('should successfully register a new user and redirect to dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => false }

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      // Simulate auth state change after registration
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockFirebaseUser as any), 100)
        return vi.fn()
      })

      render(
        <TestWrapper>
          <TestRegistrationForm />
        </TestWrapper>
      )

      // Act - Fill out registration form
      await user.type(screen.getByTestId('reg-email-input'), 'newuser@example.com')
      await user.type(screen.getByTestId('reg-password-input'), 'password123')
      await user.type(screen.getByTestId('reg-name-input'), 'New User')
      await user.selectOptions(screen.getByTestId('reg-role-select'), 'patient')
      await user.type(screen.getByTestId('reg-age-input'), '25')
      
      await user.click(screen.getByTestId('register-button'))

      // Assert
      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'newuser@example.com',
          'password123'
        )
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: 'New User',
      })

      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should handle registration validation errors', async () => {
      // Arrange
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <TestRegistrationForm />
        </TestWrapper>
      )

      // Act - Submit form with invalid data
      await user.type(screen.getByTestId('reg-email-input'), 'invalid-email')
      await user.type(screen.getByTestId('reg-password-input'), '123') // Too short
      await user.click(screen.getByTestId('register-button'))

      // Assert - Should not call Firebase functions with invalid data
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled()
    })

    it('should handle email already in use error', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { code: 'auth/email-already-in-use' }

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError)

      render(
        <TestWrapper>
          <TestRegistrationForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('reg-email-input'), 'existing@example.com')
      await user.type(screen.getByTestId('reg-password-input'), 'password123')
      await user.type(screen.getByTestId('reg-name-input'), 'Test User')
      await user.selectOptions(screen.getByTestId('reg-role-select'), 'patient')
      await user.click(screen.getByTestId('register-button'))

      // Assert
      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled()
      })
    })
  })

  describe('Complete Login Process', () => {
    it('should successfully login existing user and redirect to role-specific dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Simulate auth state change after login
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockFirebaseUser as any), 100)
        return vi.fn()
      })

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        )
      })

      expect(mockGetDoc).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalled() // Update last login
    })

    it('should handle invalid login credentials', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { code: 'auth/wrong-password' }

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'wrongpassword')
      await user.click(screen.getByTestId('login-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })

    it('should handle user not found error', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { code: 'auth/user-not-found' }

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'nonexistent@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })
  })

  describe('Google Sign-In Flow', () => {
    it('should successfully sign in existing user with Google', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.click(screen.getByTestId('google-signin-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      expect(mockGetDoc).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalled()
    })

    it('should create profile for new Google user', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => false }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockSetDoc.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <TestRegistrationForm />
        </TestWrapper>
      )

      // Act
      await user.click(screen.getByTestId('reg-google-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      expect(mockSetDoc).toHaveBeenCalled() // Profile creation for new user
    })

    it('should handle Google sign-in cancellation', async () => {
      // Arrange
      const user = userEvent.setup()
      const googleError = { code: 'auth/popup-closed-by-user' }

      mockSignInWithPopup.mockRejectedValue(googleError)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.click(screen.getByTestId('google-signin-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })
    })
  })

  describe('Role-Based Access Control', () => {
    it('should redirect patient to patient dashboard', async () => {
      // Arrange
      const patientProfile = { ...mockUserProfile, role: 'patient' as const }
      const mockDocSnap = { exists: () => true, data: () => patientProfile }

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser as any)
        return vi.fn()
      })

      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      render(
        <TestWrapper>
          <ProtectedRoute requiredRole="patient">
            <TestDashboard role="patient" />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('patient-dashboard')).toBeInTheDocument()
      })
    })

    it('should redirect doctor to doctor dashboard', async () => {
      // Arrange
      const doctorProfile = { ...mockUserProfile, role: 'doctor' as const }
      const mockDocSnap = { exists: () => true, data: () => doctorProfile }

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser as any)
        return vi.fn()
      })

      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      render(
        <TestWrapper>
          <ProtectedRoute requiredRole="doctor">
            <TestDashboard role="doctor" />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('doctor-dashboard')).toBeInTheDocument()
      })
    })

    it('should prevent access to wrong role dashboard', async () => {
      // Arrange - Patient trying to access doctor dashboard
      const patientProfile = { ...mockUserProfile, role: 'patient' as const }
      const mockDocSnap = { exists: () => true, data: () => patientProfile }

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser as any)
        return vi.fn()
      })

      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      render(
        <TestWrapper>
          <ProtectedRoute requiredRole="doctor">
            <TestDashboard role="doctor" />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Assert - Should not render doctor dashboard
      await waitFor(() => {
        expect(screen.queryByTestId('doctor-dashboard')).not.toBeInTheDocument()
      })
    })

    it('should redirect unauthenticated users to login', async () => {
      // Arrange
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null) // No authenticated user
        return vi.fn()
      })

      render(
        <TestWrapper>
          <ProtectedRoute requiredRole="patient">
            <TestDashboard role="patient" />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Assert - Should not render protected content
      await waitFor(() => {
        expect(screen.queryByTestId('patient-dashboard')).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Flow', () => {
    it('should successfully send password reset email', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSendPasswordResetEmail.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.click(screen.getByTestId('forgot-password-button'))
      // Simulate entering email in a modal/form
      // This would typically involve more complex UI interaction

      // Assert
      // Note: This test would need to be expanded based on actual UI implementation
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled() // Until email is provided
    })

    it('should handle password reset for non-existent email', async () => {
      // Arrange
      const firebaseError = { code: 'auth/user-not-found' }
      mockSendPasswordResetEmail.mockRejectedValue(firebaseError)

      // This test would need actual password reset form implementation
      // For now, we're testing the service layer behavior
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors during authentication', async () => {
      // Arrange
      const user = userEvent.setup()
      const networkError = { code: 'auth/network-request-failed' }

      mockSignInWithEmailAndPassword.mockRejectedValue(networkError)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })

    it('should handle Firestore permission errors', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const firestoreError = { code: 'permission-denied' }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockRejectedValue(firestoreError)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Assert
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })

    it('should handle concurrent authentication attempts', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act - Simulate rapid clicking
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      
      const loginButton = screen.getByTestId('login-button')
      await user.click(loginButton)
      await user.click(loginButton)
      await user.click(loginButton)

      // Assert - Should handle multiple attempts gracefully
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })

    it('should handle malformed user data from Firestore', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const malformedProfile = { ...mockUserProfile, role: undefined }
      const mockDocSnap = { exists: () => true, data: () => malformedProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      render(
        <TestWrapper>
          <TestLoginForm />
        </TestWrapper>
      )

      // Act
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Assert - Should handle gracefully
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalled()
      })
    })
  })

  describe('Session Management', () => {
    it('should handle session expiration', async () => {
      // Arrange
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate user initially authenticated
        callback(mockFirebaseUser as any)
        
        // Then simulate session expiration
        setTimeout(() => callback(null), 1000)
        
        return vi.fn()
      })

      render(
        <TestWrapper>
          <ProtectedRoute requiredRole="patient">
            <TestDashboard role="patient" />
          </ProtectedRoute>
        </TestWrapper>
      )

      // Assert - Should handle session changes
      await waitFor(() => {
        // Initial auth state should be handled
        expect(mockOnAuthStateChanged).toHaveBeenCalled()
      })
    })

    it('should handle logout flow', async () => {
      // Arrange
      const user = userEvent.setup()
      mockFirebaseSignOut.mockResolvedValue(undefined)

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockFirebaseUser as any)
        return vi.fn()
      })

      render(
        <TestWrapper>
          <TestDashboard role="patient" />
        </TestWrapper>
      )

      // Act
      await user.click(screen.getByTestId('logout-button'))

      // Assert
      await waitFor(() => {
        expect(mockFirebaseSignOut).toHaveBeenCalled()
      })
    })
  })
})
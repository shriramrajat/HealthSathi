import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase modules first
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
}))

vi.mock('../firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  googleProvider: {},
}))

vi.mock('../firebase-config', () => ({
  COLLECTIONS: {
    USERS: 'users',
  },
}))

// Mock validation functions
vi.mock('../validation-schemas', () => ({
  validateEmail: vi.fn((email: string) => email.includes('@')),
  validatePassword: vi.fn((password: string) => password.length >= 6),
  validateRole: vi.fn((role: string) => ['patient', 'doctor', 'pharmacy', 'chw'].includes(role)),
}))

// Mock auth errors
vi.mock('../auth-errors', () => ({
  getAuthErrorMessage: vi.fn((error: any) => {
    if (error.code === 'auth/user-not-found') return 'No account found with this email'
    if (error.code === 'auth/wrong-password') return 'Incorrect password'
    if (error.code === 'auth/email-already-in-use') return 'An account with this email already exists'
    return error.message || 'An error occurred'
  }),
}))

// Import Firebase functions after mocking
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

// Import the service functions after mocking
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
  signOut,
  getCurrentUser,
  updateUserProfile,
  isAuthenticated,
  getFirebaseUser,
  type RegistrationData,
  type UserProfile,
} from '../auth-service'

// Import the mocked auth instance
import { auth, googleProvider } from '../firebase'

// Mock implementations
const mockSignInWithEmailAndPassword = vi.mocked(signInWithEmailAndPassword)
const mockCreateUserWithEmailAndPassword = vi.mocked(createUserWithEmailAndPassword)
const mockSignInWithPopup = vi.mocked(signInWithPopup)
const mockFirebaseSignOut = vi.mocked(firebaseSignOut)
const mockSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail)
const mockUpdateProfile = vi.mocked(updateProfile)
const mockDoc = vi.mocked(doc)
const mockSetDoc = vi.mocked(setDoc)
const mockGetDoc = vi.mocked(getDoc)
const mockUpdateDoc = vi.mocked(updateDoc)
const mockServerTimestamp = vi.mocked(serverTimestamp)

describe('Authentication Service', () => {
  const mockFirebaseUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
  }

  const mockUserProfile: UserProfile = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'patient',
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
    // Reset auth state
    ;(auth as any).currentUser = null
    mockServerTimestamp.mockReturnValue({ seconds: Date.now() / 1000, nanoseconds: 0 } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('signInWithEmail', () => {
    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Act
      const result = await signInWithEmail(email, password)

      // Assert
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password)
      expect(mockGetDoc).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalled() // For updating last login
      expect(result).toEqual({
        user: mockUserProfile,
        isNewUser: false,
      })
    })

    it('should throw error for invalid email', async () => {
      // Arrange
      const email = 'invalid-email'
      const password = 'password123'

      // Act & Assert
      await expect(signInWithEmail(email, password)).rejects.toThrow('Please enter a valid email address')
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled()
    })

    it('should throw error for empty password', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = ''

      // Act & Assert
      await expect(signInWithEmail(email, password)).rejects.toThrow('Password is required')
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled()
    })

    it('should handle Firebase authentication errors', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'wrongpassword'
      const firebaseError = { code: 'auth/wrong-password' }

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError)

      // Act & Assert
      await expect(signInWithEmail(email, password)).rejects.toThrow('Incorrect password')
    })

    it('should create profile if user exists in Auth but not in Firestore', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => false }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockSetDoc.mockResolvedValue(undefined)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Act
      const result = await signInWithEmail(email, password)

      // Assert
      expect(mockSetDoc).toHaveBeenCalled() // Profile creation
      expect(result.isNewUser).toBe(false)
    })
  })

  describe('signUpWithEmail', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registrationData: RegistrationData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'patient',
        age: 25,
      }
      const mockUserCredential = { user: mockFirebaseUser }

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      // Act
      const result = await signUpWithEmail(registrationData)

      // Assert
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        registrationData.email,
        registrationData.password
      )
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: registrationData.name,
      })
      expect(mockSetDoc).toHaveBeenCalled()
      expect(result.isNewUser).toBe(true)
    })

    it('should validate registration data', async () => {
      // Arrange
      const invalidData: RegistrationData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: 'A', // Too short
        role: 'invalid-role' as any,
      }

      // Act & Assert
      await expect(signUpWithEmail(invalidData)).rejects.toThrow('Please enter a valid email address')
    })

    it('should handle email already in use error', async () => {
      // Arrange
      const registrationData: RegistrationData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'patient',
      }
      const firebaseError = { code: 'auth/email-already-in-use' }

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError)

      // Act & Assert
      await expect(signUpWithEmail(registrationData)).rejects.toThrow(
        'An account with this email already exists'
      )
    })
  })

  describe('signInWithGoogle', () => {
    it('should successfully sign in existing user with Google', async () => {
      // Arrange
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Act
      const result = await signInWithGoogle()

      // Assert
      expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, googleProvider)
      expect(mockGetDoc).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalled() // Update last login
      expect(result).toEqual({
        user: mockUserProfile,
        isNewUser: false,
      })
    })

    it('should create profile for new Google user', async () => {
      // Arrange
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => false }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockSetDoc.mockResolvedValue(undefined)

      // Act
      const result = await signInWithGoogle()

      // Assert
      expect(mockSetDoc).toHaveBeenCalled() // Profile creation
      expect(result.isNewUser).toBe(true)
    })

    it('should handle Google sign-in cancellation', async () => {
      // Arrange
      const googleError = { code: 'auth/popup-closed-by-user' }
      mockSignInWithPopup.mockRejectedValue(googleError)

      // Act & Assert
      await expect(signInWithGoogle()).rejects.toThrow()
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email for valid email', async () => {
      // Arrange
      const email = 'test@example.com'
      mockSendPasswordResetEmail.mockResolvedValue(undefined)

      // Act
      await resetPassword(email)

      // Assert
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(auth, email)
    })

    it('should throw error for invalid email', async () => {
      // Arrange
      const email = 'invalid-email'

      // Act & Assert
      await expect(resetPassword(email)).rejects.toThrow('Please enter a valid email address')
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('should handle Firebase errors', async () => {
      // Arrange
      const email = 'test@example.com'
      const firebaseError = { code: 'auth/user-not-found' }
      mockSendPasswordResetEmail.mockRejectedValue(firebaseError)

      // Act & Assert
      await expect(resetPassword(email)).rejects.toThrow('No account found with this email')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      // Arrange
      mockFirebaseSignOut.mockResolvedValue(undefined)

      // Act
      await signOut()

      // Assert
      expect(mockFirebaseSignOut).toHaveBeenCalledWith(auth)
    })

    it('should handle sign out errors', async () => {
      // Arrange
      const signOutError = new Error('Sign out failed')
      mockFirebaseSignOut.mockRejectedValue(signOutError)

      // Act & Assert
      await expect(signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user profile when authenticated', async () => {
      // Arrange
      ;(auth as any).currentUser = mockFirebaseUser
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }
      mockGetDoc.mockResolvedValue(mockDocSnap as any)

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(mockGetDoc).toHaveBeenCalled()
      expect(result).toEqual(mockUserProfile)
    })

    it('should return null when not authenticated', async () => {
      // Arrange
      ;(auth as any).currentUser = null

      // Act
      const result = await getCurrentUser()

      // Assert
      expect(result).toBeNull()
      expect(mockGetDoc).not.toHaveBeenCalled()
    })

    it('should handle Firestore errors', async () => {
      // Arrange
      ;(auth as any).currentUser = mockFirebaseUser
      const firestoreError = new Error('Firestore error')
      mockGetDoc.mockRejectedValue(firestoreError)

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow('Firestore error')
    })
  })

  describe('updateUserProfile', () => {
    it('should successfully update user profile', async () => {
      // Arrange
      const uid = 'test-uid-123'
      const updates = { name: 'Updated Name', age: 35 }
      ;(auth as any).currentUser = mockFirebaseUser
      mockUpdateDoc.mockResolvedValue(undefined)
      mockUpdateProfile.mockResolvedValue(undefined)

      // Act
      await updateUserProfile(uid, updates)

      // Assert
      expect(mockUpdateDoc).toHaveBeenCalled()
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: updates.name,
        photoURL: mockFirebaseUser.photoURL,
      })
    })

    it('should validate update data', async () => {
      // Arrange
      const uid = 'test-uid-123'
      const invalidUpdates = { name: 'A', age: 200 } // Invalid name and age

      // Act & Assert
      await expect(updateUserProfile(uid, invalidUpdates)).rejects.toThrow(
        'Name must be at least 2 characters long'
      )
    })

    it('should handle Firestore update errors', async () => {
      // Arrange
      const uid = 'test-uid-123'
      const updates = { name: 'Valid Name' }
      const firestoreError = new Error('Update failed')
      mockUpdateDoc.mockRejectedValue(firestoreError)

      // Act & Assert
      await expect(updateUserProfile(uid, updates)).rejects.toThrow('Update failed')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      // Arrange
      ;(auth as any).currentUser = mockFirebaseUser

      // Act
      const result = isAuthenticated()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user is not authenticated', () => {
      // Arrange
      ;(auth as any).currentUser = null

      // Act
      const result = isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getFirebaseUser', () => {
    it('should return Firebase user when authenticated', () => {
      // Arrange
      ;(auth as any).currentUser = mockFirebaseUser

      // Act
      const result = getFirebaseUser()

      // Assert
      expect(result).toBe(mockFirebaseUser)
    })

    it('should return null when not authenticated', () => {
      // Arrange
      ;(auth as any).currentUser = null

      // Act
      const result = getFirebaseUser()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const networkError = { code: 'auth/network-request-failed' }
      mockSignInWithEmailAndPassword.mockRejectedValue(networkError)

      // Act & Assert
      await expect(signInWithEmail(email, password)).rejects.toThrow()
    })

    it('should handle Firestore permission errors', async () => {
      // Arrange
      const uid = 'test-uid-123'
      const permissionError = { code: 'permission-denied' }
      mockGetDoc.mockRejectedValue(permissionError)
      ;(auth as any).currentUser = mockFirebaseUser

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow()
    })

    it('should handle malformed user data in Firestore', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { 
        exists: () => true, 
        data: () => ({ ...mockUserProfile, role: undefined }) // Missing required field
      }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Act
      const result = await signInWithEmail(email, password)

      // Assert - Should still work but with potentially incomplete data
      expect(result.user.role).toBeUndefined()
    })

    it('should handle concurrent authentication attempts', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      // Act - Multiple concurrent sign-in attempts
      const promises = [
        signInWithEmail(email, password),
        signInWithEmail(email, password),
        signInWithEmail(email, password),
      ]

      const results = await Promise.all(promises)

      // Assert - All should succeed
      results.forEach(result => {
        expect(result.user).toEqual(mockUserProfile)
        expect(result.isNewUser).toBe(false)
      })
    })
  })
})
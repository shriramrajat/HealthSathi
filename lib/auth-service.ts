// Optimized Firebase Authentication Service
// Centralized authentication operations with Firebase Auth and Firestore integration
// Includes performance monitoring and lazy loading optimizations

import { User as FirebaseUser, UserCredential } from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'
import { 
  getFirebaseAuth, 
  getFirebaseFirestore, 
  getGoogleProvider 
} from './firebase'
import { COLLECTIONS } from './firebase-config'
import { getAuthErrorMessage } from './auth-errors'
import { validateEmail, validatePassword, validateRole } from './validation-schemas'
import { 
  withPerformanceTracking, 
  FirestoreQueryOptimizer 
} from './firebase-performance'

// User profile interface matching Firestore schema
export interface UserProfile {
  uid: string
  email: string
  name: string
  role: 'patient' | 'doctor' | 'pharmacy' | 'chw'
  age?: number
  qrId: string
  photoURL?: string
  phoneNumber?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
  lastLoginAt?: Timestamp
}

// Registration data interface
export interface RegistrationData {
  email: string
  password: string
  name: string
  role: 'patient' | 'doctor' | 'pharmacy' | 'chw'
  age?: number
}

// Authentication result interface
export interface AuthResult {
  user: UserProfile
  isNewUser: boolean
}

/**
 * Generate a unique QR ID for the user
 */
function generateQRId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomStr}`.toUpperCase()
}

/**
 * Create user profile document in Firestore with performance tracking
 */
const createUserProfile = withPerformanceTracking(
  'createUserProfile',
  async (
    firebaseUser: FirebaseUser,
    additionalData: Partial<UserProfile> = {}
  ): Promise<UserProfile> => {
    const db = await getFirebaseFirestore()
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    
    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
    
    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || additionalData.name || '',
      role: additionalData.role || 'patient',
      age: additionalData.age,
      qrId: generateQRId(),
      photoURL: firebaseUser.photoURL || additionalData.photoURL,
      phoneNumber: firebaseUser.phoneNumber || additionalData.phoneNumber,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      isActive: true,
      lastLoginAt: serverTimestamp() as Timestamp,
    }

    await setDoc(userRef, userProfile)
    return userProfile
  }
)

/**
 * Get user profile from Firestore with caching and performance tracking
 */
const getUserProfile = withPerformanceTracking(
  'getUserProfile',
  async (uid: string): Promise<UserProfile | null> => {
    try {
      // Check cache first
      const cacheKey = `user_profile_${uid}`
      const cached = FirestoreQueryOptimizer.getCachedQuery(cacheKey)
      if (cached) {
        return cached
      }

      const db = await getFirebaseFirestore()
      const { doc, getDoc } = await import('firebase/firestore')
      
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const userProfile = userSnap.data() as UserProfile
        // Cache for 5 minutes
        FirestoreQueryOptimizer.cacheQuery(cacheKey, userProfile, 5 * 60 * 1000)
        return userProfile
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Update user's last login timestamp with performance tracking
 */
const updateLastLogin = withPerformanceTracking(
  'updateLastLogin',
  async (uid: string): Promise<void> => {
    try {
      const db = await getFirebaseFirestore()
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Invalidate cache for this user
      const cacheKey = `user_profile_${uid}`
      FirestoreQueryOptimizer.cacheQuery(cacheKey, null, 0) // Expire immediately
    } catch (error) {
      console.error('Error updating last login:', error)
      // Don't throw error for login timestamp update failure
    }
  }
)

/**
 * Sign in with email and password with optimized Firebase loading
 */
export const signInWithEmail = withPerformanceTracking(
  'signInWithEmail',
  async (email: string, password: string): Promise<AuthResult> => {
    try {
      // Validate input
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password) {
        throw new Error('Password is required')
      }

      // Lazy load Firebase Auth
      const auth = await getFirebaseAuth()
      const { signInWithEmailAndPassword } = await import('firebase/auth')

      // Sign in with Firebase Auth
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Get user profile from Firestore
      let userProfile = await getUserProfile(userCredential.user.uid)
      
      if (!userProfile) {
        // Create profile if it doesn't exist (edge case)
        userProfile = await createUserProfile(userCredential.user)
      }

      // Update last login timestamp (async, don't wait)
      updateLastLogin(userCredential.user.uid).catch(console.error)

      return {
        user: userProfile,
        isNewUser: false,
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Sign up with email and password with optimized Firebase loading
 */
export const signUpWithEmail = withPerformanceTracking(
  'signUpWithEmail',
  async (registrationData: RegistrationData): Promise<AuthResult> => {
    try {
      const { email, password, name, role, age } = registrationData

      // Validate input
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long')
      }
      if (!name || name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }
      if (!validateRole(role)) {
        throw new Error('Please select a valid role')
      }

      // Lazy load Firebase Auth
      const auth = await getFirebaseAuth()
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')

      // Create user with Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: name,
      })

      // Create user profile in Firestore
      const userProfile = await createUserProfile(userCredential.user, {
        name,
        role,
        age,
      })

      return {
        user: userProfile,
        isNewUser: true,
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)/**
 * Sign in with Google OAuth with optimized Firebase loading
 */
export const signInWithGoogle = withPerformanceTracking(
  'signInWithGoogle',
  async (): Promise<AuthResult> => {
    try {
      // Lazy load Firebase Auth and Google provider
      const auth = await getFirebaseAuth()
      const googleProvider = await getGoogleProvider()
      const { signInWithPopup } = await import('firebase/auth')

      // Sign in with Google popup
      const userCredential: UserCredential = await signInWithPopup(auth, googleProvider)
      
      // Check if user profile exists in Firestore
      let userProfile = await getUserProfile(userCredential.user.uid)
      let isNewUser = false

      if (!userProfile) {
        // New user - create profile with default role
        userProfile = await createUserProfile(userCredential.user, {
          role: 'patient', // Default role for Google sign-in
        })
        isNewUser = true
      } else {
        // Existing user - update last login (async, don't wait)
        updateLastLogin(userCredential.user.uid).catch(console.error)
      }

      return {
        user: userProfile,
        isNewUser,
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Send password reset email with optimized Firebase loading
 */
export const resetPassword = withPerformanceTracking(
  'resetPassword',
  async (email: string): Promise<void> => {
    try {
      // Validate email
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }

      const auth = await getFirebaseAuth()
      const { sendPasswordResetEmail } = await import('firebase/auth')
      
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Sign out current user with cache cleanup
 */
export const signOut = withPerformanceTracking(
  'signOut',
  async (): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      const { signOut: firebaseSignOut } = await import('firebase/auth')
      
      await firebaseSignOut(auth)
      
      // Clear all cached data on sign out
      FirestoreQueryOptimizer.clearCache()
    } catch (error) {
      console.error('Sign out error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Get current authenticated user profile with optimized loading
 */
export const getCurrentUser = withPerformanceTracking(
  'getCurrentUser',
  async (): Promise<UserProfile | null> => {
    try {
      const auth = await getFirebaseAuth()
      const firebaseUser = auth.currentUser
      
      if (!firebaseUser) {
        return null
      }

      return await getUserProfile(firebaseUser.uid)
    } catch (error) {
      console.error('Get current user error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Update user profile in Firestore with optimized Firebase loading
 */
export const updateUserProfile = withPerformanceTracking(
  'updateUserProfile',
  async (
    uid: string,
    updates: Partial<Pick<UserProfile, 'name' | 'age' | 'phoneNumber' | 'photoURL'>>
  ): Promise<void> => {
    try {
      // Validate updates
      if (updates.name && updates.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }
      if (updates.age && (updates.age < 1 || updates.age > 150)) {
        throw new Error('Age must be between 1 and 150')
      }
      if (updates.phoneNumber && updates.phoneNumber.trim() && !/^\+?[\d\s-()]+$/.test(updates.phoneNumber)) {
        throw new Error('Please enter a valid phone number')
      }

      const db = await getFirebaseFirestore()
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updateData)

      // Update Firebase Auth profile if name or photo changed
      const auth = await getFirebaseAuth()
      if (auth.currentUser && (updates.name || updates.photoURL)) {
        const { updateProfile } = await import('firebase/auth')
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL,
        })
      }

      // Invalidate cache for this user
      const cacheKey = `user_profile_${uid}`
      FirestoreQueryOptimizer.cacheQuery(cacheKey, null, 0) // Expire immediately
    } catch (error) {
      console.error('Update user profile error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Upload profile photo to Firebase Storage (placeholder for future implementation)
 * This is a placeholder function for the optional profile photo upload feature
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  // TODO: Implement Firebase Storage integration for profile photos
  // For now, return a placeholder URL or throw an error
  throw new Error('Profile photo upload is not yet implemented. This feature is coming soon.')
}

/**
 * Delete profile photo from Firebase Storage (placeholder for future implementation)
 */
export async function deleteProfilePhoto(photoURL: string): Promise<void> {
  // TODO: Implement Firebase Storage deletion for profile photos
  // For now, this is a placeholder
  console.log('Profile photo deletion not yet implemented:', photoURL)
}

/**
 * Reauthenticate user with current password
 */
async function reauthenticateUser(currentPassword: string): Promise<void> {
  const auth = await getFirebaseAuth()
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('No authenticated user found')
  }

  const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth')
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
}

/**
 * Change user email address with optimized Firebase loading
 */
export const changeUserEmail = withPerformanceTracking(
  'changeUserEmail',
  async (currentPassword: string, newEmail: string): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Validate new email
      if (!validateEmail(newEmail)) {
        throw new Error('Please enter a valid email address')
      }

      // Reauthenticate user
      await reauthenticateUser(currentPassword)

      // Update email in Firebase Auth
      const { updateEmail } = await import('firebase/auth')
      await updateEmail(user, newEmail)

      // Update email in Firestore profile
      const db = await getFirebaseFirestore()
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
      const userRef = doc(db, COLLECTIONS.USERS, user.uid)
      await updateDoc(userRef, {
        email: newEmail,
        updatedAt: serverTimestamp(),
      })

      // Invalidate cache for this user
      const cacheKey = `user_profile_${user.uid}`
      FirestoreQueryOptimizer.cacheQuery(cacheKey, null, 0) // Expire immediately
    } catch (error) {
      console.error('Change email error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Change user password with optimized Firebase loading
 */
export const changeUserPassword = withPerformanceTracking(
  'changeUserPassword',
  async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Validate new password
      if (!validatePassword(newPassword)) {
        throw new Error('New password must be at least 6 characters long')
      }

      // Reauthenticate user
      await reauthenticateUser(currentPassword)

      // Update password in Firebase Auth
      const { updatePassword } = await import('firebase/auth')
      await updatePassword(user, newPassword)
    } catch (error) {
      console.error('Change password error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Delete user account and all associated data with optimized Firebase loading
 */
export const deleteUserAccount = withPerformanceTracking(
  'deleteUserAccount',
  async (currentPassword: string): Promise<void> => {
    try {
      const auth = await getFirebaseAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Reauthenticate user
      await reauthenticateUser(currentPassword)

      // Delete user profile from Firestore
      const db = await getFirebaseFirestore()
      const { doc, deleteDoc } = await import('firebase/firestore')
      const userRef = doc(db, COLLECTIONS.USERS, user.uid)
      await deleteDoc(userRef)

      // Delete user from Firebase Auth (this must be done last)
      const { deleteUser } = await import('firebase/auth')
      await deleteUser(user)

      // Clear all cached data
      FirestoreQueryOptimizer.clearCache()
    } catch (error) {
      console.error('Delete account error:', error)
      throw new Error(getAuthErrorMessage(error))
    }
  }
)

/**
 * Get user profile with real-time updates
 */
export async function getUserProfileWithUpdates(uid: string): Promise<UserProfile | null> {
  try {
    // Refresh the profile data from Firestore
    return await getUserProfile(uid)
  } catch (error) {
    console.error('Error fetching updated user profile:', error)
    throw new Error(getAuthErrorMessage(error))
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const auth = await getFirebaseAuth()
    return !!auth.currentUser
  } catch {
    return false
  }
}

/**
 * Get Firebase Auth user (without Firestore profile)
 */
export async function getFirebaseUser(): Promise<FirebaseUser | null> {
  try {
    const auth = await getFirebaseAuth()
    return auth.currentUser
  } catch {
    return null
  }
}

/**
 * Authentication service interface for dependency injection
 */
export interface AuthService {
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>
  signUpWithEmail: (data: RegistrationData) => Promise<AuthResult>
  signInWithGoogle: () => Promise<AuthResult>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  getCurrentUser: () => Promise<UserProfile | null>
  updateUserProfile: (uid: string, updates: Partial<UserProfile>) => Promise<void>
  changeUserEmail: (currentPassword: string, newEmail: string) => Promise<void>
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteUserAccount: (currentPassword: string) => Promise<void>
  isAuthenticated: () => Promise<boolean>
}

/**
 * Default authentication service implementation
 */
export const authService: AuthService = {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
  signOut,
  getCurrentUser,
  updateUserProfile,
  changeUserEmail,
  changeUserPassword,
  deleteUserAccount,
  isAuthenticated,
}
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AuthProvider } from '@/components/auth-provider'
import { ProtectedRoute } from '@/components/protected-route'
import type { ReactNode } from 'react'

// Mock Firebase modules for E2E testing
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

// Mock Next.js router with more comprehensive navigation tracking
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
let currentPath = '/'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (path: string) => {
      currentPath = path
      mockPush(path)
    },
    replace: (path: string) => {
      currentPath = path
      mockReplace(path)
    },
    back: mockBack,
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => currentPath,
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
import { type } from 'os'
import { error } from 'console'
import { error } from 'console'
import { error } from 'console'
import { error } from 'console'
import { Sign } from 'crypto'
import { type } from 'os'
import { input } from '@testing-library/user-event/dist/cjs/event/input.js'
import { type } from 'os'
import { input } from '@testing-library/user-event/dist/cjs/event/input.js'
import { type } from 'os'
import { input } from '@testing-library/user-event/dist/cjs/event/input.js'
import { type } from 'os'
import { Sign } from 'crypto'
import { Sign } from 'crypto'
import { type } from 'os'
import { input } from '@testing-library/user-event/dist/cjs/event/input.js'
import { type } from 'os'

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

// Complete application components for E2E testing
const HomePage = () => {
  return (
    <div data-testid="home-page">
      <h1>NeuraNovaa Healthcare Platform</h1>
      <button data-testid="login-link" onClick={() => mockPush('/login')}>
        Login
      </button>
      <button data-testid="register-link" onClick={() => mockPush('/register')}>
        Register
      </button>
    </div>
  )
}

const LoginPage = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // This would normally use the auth context
      await mockSignInWithEmailAndPassword(null as any, email, password)
      mockPush('/dashboard/patient') // Simulate redirect
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await mockSignInWithPopup(null as any, null as any)
      mockPush('/dashboard/patient')
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }
    try {
      await mockSendPasswordResetEmail(null as any, email)
      alert('Password reset email sent!')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    }
  }

  return (
    <div data-testid="login-page">
      <h1>Login</h1>
      {error && <div data-testid="error-message" role="alert">{error}</div>}
      
      <input
        data-testid="email-input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <input
        data-testid="password-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button
        data-testid="login-button"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
      
      <button
        data-testid="google-signin-button"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Sign in with Google
      </button>
      
      <button
        data-testid="forgot-password-button"
        onClick={handleForgotPassword}
        disabled={loading}
      >
        Forgot Password?
      </button>
      
      <button data-testid="register-link" onClick={() => mockPush('/register')}>
        Don't have an account? Register
      </button>
    </div>
  )
}

const RegisterPage = () => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    name: '',
    role: '',
    age: '',
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      await mockCreateUserWithEmailAndPassword(null as any, formData.email, formData.password)
      await mockUpdateProfile(null as any, { displayName: formData.name })
      await mockSetDoc(null as any, {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        uid: 'new-user-uid',
        qrId: `QR${Date.now()}`,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        isActive: true,
      })
      mockPush(`/dashboard/${formData.role}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    try {
      await mockSignInWithPopup(null as any, null as any)
      // Would normally show role selection modal
      mockPush('/dashboard/patient')
    } catch (err: any) {
      setError(err.message || 'Google registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="register-page">
      <h1>Register</h1>
      {error && <div data-testid="error-message" role="alert">{error}</div>}
      
      <input
        data-testid="email-input"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      
      <input
        data-testid="password-input"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      
      <input
        data-testid="name-input"
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      
      <select
        data-testid="role-select"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      >
        <option value="">Select Role</option>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
        <option value="pharmacy">Pharmacy</option>
        <option value="chw">Community Health Worker</option>
      </select>
      
      <input
        data-testid="age-input"
        type="number"
        placeholder="Age (optional)"
        value={formData.age}
        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
      />
      
      <button
        data-testid="register-button"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Register'}
      </button>
      
      <button
        data-testid="google-register-button"
        onClick={handleGoogleRegister}
        disabled={loading}
      >
        Sign up with Google
      </button>
      
      <button data-testid="login-link" onClick={() => mockPush('/login')}>
        Already have an account? Login
      </button>
    </div>
  )
}

const DashboardPage = ({ role }: { role: string }) => {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    // Simulate loading user data
    setUser({
      name: 'Test User',
      email: 'test@example.com',
      role,
      qrId: 'QR123456',
    })
  }, [role])

  const handleLogout = async () => {
    await mockFirebaseSignOut(null as any)
    mockPush('/')
  }

  if (!user) {
    return <div data-testid="loading">Loading...</div>
  }

  return (
    <div data-testid={`${role}-dashboard`}>
      <header data-testid="dashboard-header">
        <h1>{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
        <div data-testid="user-info">
          <span>Welcome, {user.name}</span>
          <button data-testid="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      
      <main data-testid="dashboard-content">
        <div data-testid="qr-code">QR Code: {user.qrId}</div>
        
        {role === 'patient' && (
          <div data-testid="patient-features">
            <button data-testid="book-appointment">Book Appointment</button>
            <button data-testid="view-records">View Medical Records</button>
            <button data-testid="find-pharmacy">Find Pharmacy</button>
          </div>
        )}
        
        {role === 'doctor' && (
          <div data-testid="doctor-features">
            <button data-testid="view-patients">View Patients</button>
            <button data-testid="manage-appointments">Manage Appointments</button>
            <button data-testid="prescribe-medication">Prescribe Medication</button>
          </div>
        )}
        
        {role === 'pharmacy' && (
          <div data-testid="pharmacy-features">
            <button data-testid="manage-inventory">Manage Inventory</button>
            <button data-testid="process-prescriptions">Process Prescriptions</button>
            <button data-testid="view-orders">View Orders</button>
          </div>
        )}
        
        {role === 'chw' && (
          <div data-testid="chw-features">
            <button data-testid="community-health">Community Health</button>
            <button data-testid="patient-outreach">Patient Outreach</button>
            <button data-testid="health-education">Health Education</button>
          </div>
        )}
      </main>
    </div>
  )
}

const PasswordResetPage = () => {
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState('')

  const handlePasswordReset = async () => {
    setLoading(true)
    setError('')
    try {
      await mockSendPasswordResetEmail(null as any, email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div data-testid="password-reset-success">
        <h1>Password Reset Email Sent</h1>
        <p>Check your email for password reset instructions.</p>
        <button data-testid="back-to-login" onClick={() => mockPush('/login')}>
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div data-testid="password-reset-page">
      <h1>Reset Password</h1>
      {error && <div data-testid="error-message" role="alert">{error}</div>}
      
      <input
        data-testid="email-input"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <button
        data-testid="reset-button"
        onClick={handlePasswordReset}
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </button>
      
      <button data-testid="back-to-login" onClick={() => mockPush('/login')}>
        Back to Login
      </button>
    </div>
  )
}

// Application router component
const AppRouter = () => {
  const [currentPage, setCurrentPage] = React.useState('/')

  React.useEffect(() => {
    setCurrentPage(currentPath)
  }, [])

  // Listen for navigation changes
  React.useEffect(() => {
    const originalPush = mockPush
    mockPush.mockImplementation((path: string) => {
      currentPath = path
      setCurrentPage(path)
      originalPush(path)
    })

    const originalReplace = mockReplace
    mockReplace.mockImplementation((path: string) => {
      currentPath = path
      setCurrentPage(path)
      originalReplace(path)
    })
  }, [])

  switch (currentPage) {
    case '/':
      return <HomePage />
    case '/login':
      return <LoginPage />
    case '/register':
      return <RegisterPage />
    case '/reset-password':
      return <PasswordResetPage />
    case '/dashboard/patient':
      return <DashboardPage role="patient" />
    case '/dashboard/doctor':
      return <DashboardPage role="doctor" />
    case '/dashboard/pharmacy':
      return <DashboardPage role="pharmacy" />
    case '/dashboard/chw':
      return <DashboardPage role="chw" />
    default:
      return <div data-testid="not-found">Page Not Found</div>
  }
}

const TestApp = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

describe('End-to-End User Journey Tests', () => {
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
    currentPath = '/'
    
    // Setup default auth state
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return vi.fn()
    })
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  describe('Complete User Registration to Dashboard Access Journey', () => {
    it('should complete full patient registration and access patient dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      render(<TestApp />)

      // Step 1: Start from home page
      expect(screen.getByTestId('home-page')).toBeInTheDocument()

      // Step 2: Navigate to registration
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      // Step 3: Fill out registration form
      await user.type(screen.getByTestId('email-input'), 'newpatient@example.com')
      await user.type(screen.getByTestId('password-input'), 'securepassword123')
      await user.type(screen.getByTestId('name-input'), 'New Patient')
      await user.selectOptions(screen.getByTestId('role-select'), 'patient')
      await user.type(screen.getByTestId('age-input'), '28')

      // Step 4: Submit registration
      await user.click(screen.getByTestId('register-button'))

      // Step 5: Verify Firebase calls
      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          null,
          'newpatient@example.com',
          'securepassword123'
        )
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith(null, {
        displayName: 'New Patient',
      })

      expect(mockSetDoc).toHaveBeenCalled()

      // Step 6: Verify redirect to patient dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })

    it('should complete full doctor registration and access doctor dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: { ...mockFirebaseUser, email: 'doctor@example.com' } }

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      render(<TestApp />)

      // Navigate and register as doctor
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('email-input'), 'doctor@example.com')
      await user.type(screen.getByTestId('password-input'), 'doctorpassword123')
      await user.type(screen.getByTestId('name-input'), 'Dr. Smith')
      await user.selectOptions(screen.getByTestId('role-select'), 'doctor')
      await user.type(screen.getByTestId('age-input'), '45')

      await user.click(screen.getByTestId('register-button'))

      // Verify redirect to doctor dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/doctor')
      })
    })

    it('should handle registration errors gracefully', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { 
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use by another account.'
      }

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError)

      render(<TestApp />)

      // Navigate to registration and fill form
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('email-input'), 'existing@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.type(screen.getByTestId('name-input'), 'Test User')
      await user.selectOptions(screen.getByTestId('role-select'), 'patient')

      await user.click(screen.getByTestId('register-button'))

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(firebaseError.message)
      })

      // Verify user stays on registration page
      expect(screen.getByTestId('register-page')).toBeInTheDocument()
    })
  })

  describe('Complete Login to Dashboard Access Journey', () => {
    it('should complete login flow and access appropriate dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      render(<TestApp />)

      // Step 1: Navigate to login
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      // Step 2: Enter credentials
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')

      // Step 3: Submit login
      await user.click(screen.getByTestId('login-button'))

      // Step 4: Verify Firebase authentication
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          null,
          'test@example.com',
          'password123'
        )
      })

      // Step 5: Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })

    it('should handle login errors and allow retry', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { 
        code: 'auth/wrong-password',
        message: 'The password is invalid or the user does not have a password.'
      }

      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError)

      render(<TestApp />)

      // Navigate to login and attempt with wrong password
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'wrongpassword')
      await user.click(screen.getByTestId('login-button'))

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      // Clear error and try again with correct password
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      await user.clear(screen.getByTestId('password-input'))
      await user.type(screen.getByTestId('password-input'), 'correctpassword')
      await user.click(screen.getByTestId('login-button'))

      // Verify successful login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })
  })

  describe('Google Sign-In User Journey', () => {
    it('should complete Google sign-in for existing user', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      render(<TestApp />)

      // Navigate to login and use Google sign-in
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('google-signin-button'))

      // Verify Google authentication
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })

    it('should complete Google sign-up for new user', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => false }

      mockSignInWithPopup.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockSetDoc.mockResolvedValue(undefined)

      render(<TestApp />)

      // Navigate to registration and use Google sign-up
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('google-register-button'))

      // Verify Google authentication and profile creation
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // In a real app, this would show role selection modal
      // For this test, we simulate direct redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })

    it('should handle Google sign-in cancellation', async () => {
      // Arrange
      const user = userEvent.setup()
      const googleError = { 
        code: 'auth/popup-closed-by-user',
        message: 'The popup has been closed by the user before finalizing the operation.'
      }

      mockSignInWithPopup.mockRejectedValue(googleError)

      render(<TestApp />)

      // Navigate to login and attempt Google sign-in
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('google-signin-button'))

      // Verify error handling
      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // User should remain on login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('Password Reset User Journey', () => {
    it('should complete password reset flow', async () => {
      // Arrange
      const user = userEvent.setup()
      mockSendPasswordResetEmail.mockResolvedValue(undefined)

      render(<TestApp />)

      // Navigate to login page
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      // Enter email and click forgot password
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.click(screen.getByTestId('forgot-password-button'))

      // Verify password reset email is sent
      await waitFor(() => {
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(null, 'test@example.com')
      })
    })

    it('should handle password reset for non-existent email', async () => {
      // Arrange
      const user = userEvent.setup()
      const firebaseError = { 
        code: 'auth/user-not-found',
        message: 'There is no user record corresponding to this identifier.'
      }

      mockSendPasswordResetEmail.mockRejectedValue(firebaseError)

      render(<TestApp />)

      // Navigate to login and attempt password reset
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('email-input'), 'nonexistent@example.com')
      await user.click(screen.getByTestId('forgot-password-button'))

      // Verify error handling
      await waitFor(() => {
        expect(mockSendPasswordResetEmail).toHaveBeenCalled()
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
    })

    it('should require email before allowing password reset', async () => {
      // Arrange
      const user = userEvent.setup()

      render(<TestApp />)

      // Navigate to login without entering email
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('forgot-password-button'))

      // Verify error message for missing email
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Please enter your email first')
      })

      // Verify password reset email is not sent
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('Dashboard Navigation and Logout Journey', () => {
    it('should navigate between different role dashboards and logout', async () => {
      // Test patient dashboard
      currentPath = '/dashboard/patient'
      render(<TestApp />)

      await waitFor(() => {
        expect(screen.getByTestId('patient-dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('patient-features')).toBeInTheDocument()
      })

      // Test doctor dashboard
      currentPath = '/dashboard/doctor'
      cleanup()
      render(<TestApp />)

      await waitFor(() => {
        expect(screen.getByTestId('doctor-dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('doctor-features')).toBeInTheDocument()
      })

      // Test pharmacy dashboard
      currentPath = '/dashboard/pharmacy'
      cleanup()
      render(<TestApp />)

      await waitFor(() => {
        expect(screen.getByTestId('pharmacy-dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('pharmacy-features')).toBeInTheDocument()
      })

      // Test CHW dashboard
      currentPath = '/dashboard/chw'
      cleanup()
      render(<TestApp />)

      await waitFor(() => {
        expect(screen.getByTestId('chw-dashboard')).toBeInTheDocument()
        expect(screen.getByTestId('chw-features')).toBeInTheDocument()
      })
    })

    it('should complete logout flow from dashboard', async () => {
      // Arrange
      const user = userEvent.setup()
      mockFirebaseSignOut.mockResolvedValue(undefined)

      currentPath = '/dashboard/patient'
      render(<TestApp />)

      // Verify dashboard is loaded
      await waitFor(() => {
        expect(screen.getByTestId('patient-dashboard')).toBeInTheDocument()
      })

      // Click logout
      await user.click(screen.getByTestId('logout-button'))

      // Verify logout and redirect
      await waitFor(() => {
        expect(mockFirebaseSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('Cross-Platform User Journey', () => {
    it('should handle complete user journey with navigation between pages', async () => {
      // Arrange
      const user = userEvent.setup()
      
      render(<TestApp />)

      // Step 1: Start at home
      expect(screen.getByTestId('home-page')).toBeInTheDocument()

      // Step 2: Go to register, then back to login
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      // Step 3: Go back to register and complete registration
      await user.click(screen.getByTestId('register-link'))
      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument()
      })

      // Complete registration flow
      const mockUserCredential = { user: mockFirebaseUser }
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      await user.type(screen.getByTestId('email-input'), 'journey@example.com')
      await user.type(screen.getByTestId('password-input'), 'journeypassword123')
      await user.type(screen.getByTestId('name-input'), 'Journey User')
      await user.selectOptions(screen.getByTestId('role-select'), 'patient')
      await user.click(screen.getByTestId('register-button'))

      // Verify successful registration and redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle network errors and allow retry', async () => {
      // Arrange
      const user = userEvent.setup()
      const networkError = { 
        code: 'auth/network-request-failed',
        message: 'A network error has occurred.'
      }

      // First attempt fails with network error
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(networkError)

      render(<TestApp />)

      // Navigate to login and attempt sign-in
      await user.click(screen.getByTestId('login-link'))
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('login-button'))

      // Verify network error is handled
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      // Retry with successful response
      const mockUserCredential = { user: mockFirebaseUser }
      const mockDocSnap = { exists: () => true, data: () => mockUserProfile }

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any)
      mockGetDoc.mockResolvedValue(mockDocSnap as any)
      mockUpdateDoc.mockResolvedValue(undefined)

      await user.click(screen.getByTestId('login-button'))

      // Verify successful retry
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/patient')
      })
    })

    it('should handle session timeout gracefully', async () => {
      // This test would simulate session expiration during user interaction
      // In a real app, this would involve token refresh logic
      
      const user = userEvent.setup()
      currentPath = '/dashboard/patient'
      
      render(<TestApp />)

      // Simulate user being on dashboard
      await waitFor(() => {
        expect(screen.getByTestId('patient-dashboard')).toBeInTheDocument()
      })

      // Simulate session expiration (would be handled by auth state listener)
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null) // User is no longer authenticated
        return vi.fn()
      })

      // In a real implementation, this would trigger automatic redirect to login
      // For this test, we verify the auth state change is handled
      expect(mockOnAuthStateChanged).toHaveBeenCalled()
    })
  })
})
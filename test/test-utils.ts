import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '@/components/auth-provider'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock Firebase for testing
export const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
}

export const mockUserProfile = {
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

// Test data generators
export const createMockUser = (overrides: Partial<typeof mockFirebaseUser> = {}) => ({
  ...mockFirebaseUser,
  ...overrides,
})

export const createMockProfile = (overrides: Partial<typeof mockUserProfile> = {}) => ({
  ...mockUserProfile,
  ...overrides,
})

// Common test scenarios
export const testScenarios = {
  validRegistration: {
    email: 'newuser@example.com',
    password: 'securepassword123',
    name: 'New User',
    role: 'patient' as const,
    age: 28,
  },
  validLogin: {
    email: 'test@example.com',
    password: 'password123',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'password123',
  },
  weakPassword: {
    email: 'test@example.com',
    password: '123',
  },
  existingEmail: {
    email: 'existing@example.com',
    password: 'password123',
    name: 'Existing User',
    role: 'patient' as const,
  },
}

// Firebase error scenarios
export const firebaseErrors = {
  emailAlreadyInUse: {
    code: 'auth/email-already-in-use',
    message: 'The email address is already in use by another account.',
  },
  wrongPassword: {
    code: 'auth/wrong-password',
    message: 'The password is invalid or the user does not have a password.',
  },
  userNotFound: {
    code: 'auth/user-not-found',
    message: 'There is no user record corresponding to this identifier.',
  },
  weakPassword: {
    code: 'auth/weak-password',
    message: 'The password must be 6 characters long or more.',
  },
  invalidEmail: {
    code: 'auth/invalid-email',
    message: 'The email address is badly formatted.',
  },
  networkError: {
    code: 'auth/network-request-failed',
    message: 'A network error has occurred.',
  },
  popupClosed: {
    code: 'auth/popup-closed-by-user',
    message: 'The popup has been closed by the user before finalizing the operation.',
  },
  permissionDenied: {
    code: 'permission-denied',
    message: 'Missing or insufficient permissions.',
  },
}
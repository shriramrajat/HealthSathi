// Authentication utilities and types
export interface User {
  uid: string
  email: string
  name: string
  role: "patient" | "doctor" | "pharmacy" | "chw"
  age?: number
  qrId: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Mock authentication functions - to be replaced with Firebase
export const mockAuth = {
  signIn: async (email: string, password: string): Promise<User> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      uid: "mock-uid-123",
      email,
      name: "John Doe",
      role: "patient",
      age: 35,
      qrId: "QR-" + Math.random().toString(36).substr(2, 9),
    }
  },

  signUp: async (email: string, password: string, name: string, role: User["role"], age?: number): Promise<User> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      uid: "mock-uid-" + Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      age,
      qrId: "QR-" + Math.random().toString(36).substr(2, 9),
    }
  },

  signOut: async (): Promise<void> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
  },
}

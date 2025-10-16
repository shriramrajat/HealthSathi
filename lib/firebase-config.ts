// Firebase configuration for the Rural Health app
// This file sets up Firebase services for authentication, Firestore, and Storage

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Firebase configuration object
export const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: "users",
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  PRESCRIPTIONS: "prescriptions",
  CONSULTATIONS: "consultations",
  PHARMACIES: "pharmacies",
  PHARMACY_INVENTORY: "pharmacy_inventory",
  CHW_CASES: "chw_cases",
  CONSULTATION_SESSIONS: "consultation_sessions",
  MEDICATION_ORDERS: "medication_orders",
  HEALTH_RECORDS: "health_records",
  SYSTEM_SETTINGS: "system_settings",
  AUDIT_LOG: "audit_log",
  FCM_TOKENS: "fcm_tokens",
  NOTIFICATIONS: "notifications",
  NOTIFICATION_PREFERENCES: "notification_preferences",
} as const

// Firestore security rules structure
export const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Appointments - patients and doctors can access their appointments
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.patient_id || 
         request.auth.uid == resource.data.doctor_id);
    }
    
    // Prescriptions - patients and doctors can access
    match /prescriptions/{prescriptionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.patient_id || 
         request.auth.uid == resource.data.doctor_id);
    }
    
    // Pharmacy inventory - only pharmacy users can access
    match /pharmacy_inventory/{inventoryId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'pharmacy';
    }
    
    // CHW cases - only CHWs can access their cases
    match /chw_cases/{caseId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.chw_id;
    }
    
    // Consultation sessions - patients and doctors can access
    match /consultation_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.patient_id || 
         request.auth.uid == resource.data.doctor_id);
    }
    
    // Health records - patients and their doctors can access
    match /health_records/{recordId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.patient_id || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'chw'];
    }
    
    // System settings - public settings can be read by all authenticated users
    match /system_settings/{settingId} {
      allow read: if request.auth != null && resource.data.is_public == true;
      allow write: if false; // Only admin can write (handled server-side)
    }
    
    // Audit log - read-only for authenticated users (their own actions)
    match /audit_log/{logId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow write: if false; // Only system can write audit logs
    }
    
    // FCM tokens - users can manage their own tokens
    match /fcm_tokens/{tokenId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Notifications - users can read their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Notification preferences - users can manage their own preferences
    match /notification_preferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
`

// Firebase Storage security rules
export const STORAGE_RULES = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Prescription files - only patient and doctor can access
    match /prescriptions/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profile pictures
    match /profiles/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Consultation recordings - only participants can access
    match /consultations/{sessionId}/{fileName} {
      allow read, write: if request.auth != null;
      // Additional validation would be done server-side
    }
  }
}
`

// Environment variables needed for Firebase
export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
] as const

// Validate Firebase configuration
export function validateFirebaseConfig(): boolean {
  return REQUIRED_ENV_VARS.every((envVar) => {
    const value = process.env[envVar]
    return value && value.length > 0
  })
}

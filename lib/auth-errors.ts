import { FirebaseError } from "firebase/app";

// Firebase Auth error code mappings
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  "auth/user-not-found": "No account found with this email address",
  "auth/wrong-password": "Incorrect password. Please try again",
  "auth/invalid-credential": "Invalid email or password. Please check your credentials",
  "auth/user-disabled": "This account has been disabled. Please contact support",
  "auth/too-many-requests": "Too many failed attempts. Please try again later",
  "auth/operation-not-allowed": "This sign-in method is not enabled",
  
  // Registration errors
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/weak-password": "Password should be at least 6 characters long",
  "auth/invalid-email": "Please enter a valid email address",
  
  // Password reset errors - handled by existing user-not-found and invalid-email above
  
  // Google sign-in errors
  "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again",
  "auth/popup-blocked": "Pop-up was blocked by your browser. Please allow pop-ups and try again",
  "auth/cancelled-popup-request": "Sign-in was cancelled. Please try again",
  "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method",
  
  // Network and general errors
  "auth/network-request-failed": "Network error. Please check your connection and try again",
  "auth/timeout": "Request timed out. Please try again",
  "auth/internal-error": "An internal error occurred. Please try again",
  "auth/invalid-api-key": "Invalid API key. Please contact support",
  "auth/app-deleted": "Firebase app was deleted. Please refresh the page",
  
  // Token and session errors
  "auth/invalid-user-token": "Your session has expired. Please sign in again",
  "auth/user-token-expired": "Your session has expired. Please sign in again",
  "auth/null-user": "No user is currently signed in",
  "auth/requires-recent-login": "Please sign in again to complete this action",
  
  // Profile update errors
  "auth/email-already-exists": "This email is already in use by another account",
  "auth/invalid-phone-number": "Please enter a valid phone number",
  "auth/phone-number-already-exists": "This phone number is already in use by another account",
  
  // Custom validation errors
  "auth/missing-email": "Email address is required",
  "auth/missing-password": "Password is required",
  "auth/invalid-password": "Password must be at least 6 characters long",
};

// Firestore error code mappings
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  "permission-denied": "You don't have permission to access this data",
  "not-found": "The requested data was not found",
  "already-exists": "This data already exists",
  "resource-exhausted": "Too many requests. Please try again later",
  "failed-precondition": "The operation failed due to a conflict",
  "aborted": "The operation was aborted. Please try again",
  "out-of-range": "The provided data is out of range",
  "unimplemented": "This feature is not yet implemented",
  "internal": "An internal error occurred. Please try again",
  "unavailable": "The service is temporarily unavailable. Please try again",
  "data-loss": "Data loss occurred. Please contact support",
  "unauthenticated": "You must be signed in to perform this action",
  "deadline-exceeded": "The operation timed out. Please try again",
  "cancelled": "The operation was cancelled",
  "invalid-argument": "Invalid data provided",
};

// Network error mappings
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  "ERR_NETWORK": "Network connection failed. Please check your internet connection",
  "ERR_INTERNET_DISCONNECTED": "No internet connection. Please check your network",
  "ERR_CONNECTION_REFUSED": "Connection refused. Please try again later",
  "ERR_CONNECTION_TIMED_OUT": "Connection timed out. Please try again",
  "ERR_NAME_NOT_RESOLVED": "Unable to connect to the server. Please check your connection",
};

/**
 * Maps Firebase error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): string {
  // Handle FirebaseError
  if (error instanceof FirebaseError) {
    const message = AUTH_ERROR_MESSAGES[error.code] || FIRESTORE_ERROR_MESSAGES[error.code];
    if (message) {
      return message;
    }
  }
  
  // Handle generic Error objects
  if (error instanceof Error) {
    // Check for network errors
    const networkMessage = NETWORK_ERROR_MESSAGES[error.message];
    if (networkMessage) {
      return networkMessage;
    }
    
    // Check if error message contains known patterns
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes("network")) {
      return "Network error. Please check your connection and try again";
    }
    
    if (errorMessage.includes("timeout")) {
      return "Request timed out. Please try again";
    }
    
    if (errorMessage.includes("offline")) {
      return "You appear to be offline. Please check your connection";
    }
    
    // Return the original error message if it's user-friendly
    if (error.message && error.message.length < 100 && !error.message.includes("firebase")) {
      return error.message;
    }
  }
  
  // Handle string errors
  if (typeof error === "string") {
    const message = AUTH_ERROR_MESSAGES[error] || FIRESTORE_ERROR_MESSAGES[error];
    if (message) {
      return message;
    }
  }
  
  // Default fallback message
  return "An unexpected error occurred. Please try again";
}

/**
 * Checks if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === "auth/network-request-failed" || 
           error.code === "unavailable" ||
           error.code === "deadline-exceeded";
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("network") || 
           message.includes("offline") || 
           message.includes("connection") ||
           message.includes("timeout");
  }
  
  return false;
}

/**
 * Checks if an error requires user re-authentication
 */
export function requiresReauth(error: unknown): boolean {
  if (error instanceof FirebaseError) {
    return error.code === "auth/requires-recent-login" ||
           error.code === "auth/user-token-expired" ||
           error.code === "auth/invalid-user-token";
  }
  
  return false;
}

/**
 * Gets a retry-friendly error message for network errors
 */
export function getRetryErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "Connection failed. Please check your internet and try again";
  }
  
  return getAuthErrorMessage(error);
}

/**
 * Error severity levels for different types of errors
 */
export enum ErrorSeverity {
  LOW = "low",        // Validation errors, user input errors
  MEDIUM = "medium",  // Authentication failures, permission errors
  HIGH = "high",      // Network errors, server errors
  CRITICAL = "critical" // Data loss, security issues
}

/**
 * Gets the severity level of an error
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (error instanceof FirebaseError) {
    // Critical errors
    if (error.code === "data-loss" || error.code === "auth/app-deleted") {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity errors
    if (error.code === "auth/network-request-failed" || 
        error.code === "unavailable" ||
        error.code === "internal" ||
        error.code === "auth/internal-error") {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity errors
    if (error.code.startsWith("auth/") || error.code === "permission-denied") {
      return ErrorSeverity.MEDIUM;
    }
  }
  
  // Default to low severity for validation and user input errors
  return ErrorSeverity.LOW;
}
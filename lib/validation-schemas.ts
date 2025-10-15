import { z } from "zod";

// Base email validation schema
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

// Base password validation schema
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be less than 128 characters");

// Name validation schema
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes");

// Role validation schema
const roleSchema = z.enum(["patient", "doctor", "pharmacy", "chw"], {
  errorMap: () => ({ message: "Please select a valid role" }),
});

// Age validation schema
const ageSchema = z
  .number()
  .min(1, "Age must be at least 1")
  .max(150, "Age must be less than 150")
  .optional();

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Registration form validation schema
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  name: nameSchema,
  role: roleSchema,
  age: ageSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Password reset form validation schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  age: ageSchema,
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

// Change email validation schema
export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newEmail: emailSchema,
  confirmNewEmail: emailSchema,
}).refine((data) => data.newEmail === data.confirmNewEmail, {
  message: "Email addresses do not match",
  path: ["confirmNewEmail"],
});

// Delete account validation schema
export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  confirmationText: z.string().refine((val) => val === "DELETE", {
    message: "Please type 'DELETE' to confirm account deletion",
  }),
});

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validateRole = (role: string): boolean => {
  return roleSchema.safeParse(role).success;
};
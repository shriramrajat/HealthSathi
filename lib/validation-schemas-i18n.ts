import { z } from "zod";

// Factory function to create validation schemas with translated error messages
export const createValidationSchemas = (t: (key: string) => string) => {
  // Base email validation schema
  const emailSchema = z
    .string()
    .min(1, t('errors.emailRequired'))
    .email(t('errors.emailInvalid'));

  // Base password validation schema
  const passwordSchema = z
    .string()
    .min(6, t('errors.passwordTooShort'))
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
  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, t('errors.passwordRequired')),
  });

  // Registration form validation schema
  const registrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: nameSchema,
    role: roleSchema,
    age: ageSchema,
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('errors.passwordMismatch'),
    path: ["confirmPassword"],
  });

  // Password reset form validation schema
  const passwordResetSchema = z.object({
    email: emailSchema,
  });

  return {
    loginSchema,
    registrationSchema,
    passwordResetSchema,
    emailSchema,
    passwordSchema,
    nameSchema,
    roleSchema,
    ageSchema,
  };
};

// Type exports for form data
export type LoginFormData = {
  email: string;
  password: string;
};

export type RegistrationFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: "patient" | "doctor" | "pharmacy" | "chw";
  age?: number;
};

export type PasswordResetFormData = {
  email: string;
};

import { z } from 'zod';

// Regex patterns matching backend validation
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;
const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;  // E.164 format
const PASSWORD_SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;

// Validation messages for consistency
const messages = {
  username: {
    pattern: "Username can only contain letters, numbers, underscores and dashes",
    length: "Username must be between 3 and 64 characters"
  },
  password: {
    length: "Password must be at least 8 characters",
    uppercase: "Password must contain at least one uppercase letter",
    lowercase: "Password must contain at least one lowercase letter",
    number: "Password must contain at least one number",
    special: "Password must contain at least one special character",
    match: "Passwords do not match"
  },
  email: {
    invalid: "Please enter a valid email address"
  },
  phone: {
    pattern: "Phone number must be in E.164 format (e.g., +14155552671)"
  },
  terms: {
    required: "You must accept the terms and conditions"
  }
};

// Base password schema for reuse
const passwordSchema = z.string()
  .min(8, messages.password.length)
  .refine(value => /[A-Z]/.test(value), messages.password.uppercase)
  .refine(value => /[a-z]/.test(value), messages.password.lowercase)
  .refine(value => /[0-9]/.test(value), messages.password.number)
  .refine(value => PASSWORD_SPECIAL_CHARS.test(value), messages.password.special);

// Login schema matching backend expectations
export const loginSchema = z.object({
  username: z.string()
    .min(3, messages.username.length)
    .max(64, messages.username.length)
    .regex(USERNAME_PATTERN, messages.username.pattern),
  password: passwordSchema,
  rememberMe: z.boolean().default(false)
});

// Registration schema with complete backend validation alignment
export const registrationSchema = z.object({
  username: z.string()
    .min(3, messages.username.length)
    .max(64, messages.username.length)
    .regex(USERNAME_PATTERN, messages.username.pattern),
  email: z.string().email(messages.email.invalid),
  password: passwordSchema,
  confirmPassword: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string()
    .regex(PHONE_PATTERN, messages.phone.pattern)
    .optional()
    .nullable(),
  acceptTerms: z.boolean().refine(val => val === true, messages.terms.required)
}).refine(data => data.password === data.confirmPassword, {
  message: messages.password.match,
  path: ["confirmPassword"]
});

// Type inference for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Error mapping utility for backend responses
export const mapBackendError = (error: string): { field?: string; message: string } => {
  // Map known backend error messages to specific fields
  if (error.includes('Username is already in use')) {
    return { field: 'username', message: 'This username is already taken' };
  }
  if (error.includes('Email is already in use')) {
    return { field: 'email', message: 'This email is already registered' };
  }
  // Default to general error
  return { message: error };
};
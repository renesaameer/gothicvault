import { z } from 'zod';

// Register DTO
export const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// Login DTO
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Refresh Token DTO
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

// Forgot Password DTO
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

// Reset Password DTO
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// Verify Email DTO
export const verifyEmailSchema = z.object({
  token: z.string(),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;

// Auth Response DTO
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    email: z.string().email().nullable(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    isAdmin: z.boolean().nullable(),
    roles: z.array(z.enum(['admin', 'staff', 'user'])),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// User Response DTO
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isAdmin: z.boolean().nullable(),
  roles: z.array(z.enum(['admin', 'staff', 'user'])),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

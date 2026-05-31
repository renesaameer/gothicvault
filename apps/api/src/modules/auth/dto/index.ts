import { z } from 'zod';

// Register DTO
export const registerSchema = z.object({
  userId: z.string().uuid(),
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
  refreshToken: z.string(),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

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

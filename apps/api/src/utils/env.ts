import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32).default('cookie-secret-change-in-production'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  try {
    const env = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      LOG_LEVEL: process.env.LOG_LEVEL,
    });

    // Production-specific warnings
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET === 'your-jwt-secret-change-in-production' || 
          env.JWT_SECRET.length < 32) {
        console.warn('⚠️  WARNING: JWT_SECRET should be changed in production');
      }
      if (env.COOKIE_SECRET === 'cookie-secret-change-in-production' ||
          env.COOKIE_SECRET.length < 32) {
        console.warn('⚠️  WARNING: COOKIE_SECRET should be changed in production');
      }
      if (env.CORS_ORIGIN === 'http://localhost:5173') {
        console.warn('⚠️  WARNING: CORS_ORIGIN should be set to production domain');
      }
      if (!env.REDIS_URL) {
        console.warn('⚠️  WARNING: REDIS_URL is recommended for production');
      }
    }

    cachedEnv = env;
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

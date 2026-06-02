import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../../utils/logger.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ip = request.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      Object.keys(rateLimitStore).forEach((key) => {
        if (rateLimitStore[key].resetTime < windowStart) {
          delete rateLimitStore[key];
        }
      });

      // Get or create rate limit entry
      const entry = rateLimitStore[ip] || { count: 0, resetTime: now + windowMs };

      // Reset if window expired
      if (entry.resetTime < now) {
        entry.count = 0;
        entry.resetTime = now + windowMs;
      }

      // Increment count
      entry.count++;
      rateLimitStore[ip] = entry;

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        const resetTime = Math.ceil((entry.resetTime - now) / 1000);
        reply.header('X-RateLimit-Limit', maxRequests.toString());
        reply.header('X-RateLimit-Remaining', '0');
        reply.header('X-RateLimit-Reset', resetTime.toString());
        reply.status(429).send({ error: 'Too many requests' });
        return;
      }

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', maxRequests.toString());
      reply.header('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
      reply.header('X-RateLimit-Reset', Math.ceil((entry.resetTime - now) / 1000).toString());
    } catch (error) {
      logger.error({ msg: 'Error in rate limit middleware', error });
      // Don't block requests on rate limit errors
    }
  };
}

export function loginRateLimit() {
  return rateLimit(5, 15 * 60 * 1000); // 5 requests per 15 minutes
}

export function generalRateLimit() {
  return rateLimit(100, 60 * 1000); // 100 requests per minute
}

export function checkoutRateLimit() {
  return rateLimit(20, 60 * 1000); // 20 checkout operations per minute
}

export function uploadRateLimit() {
  return rateLimit(10, 60 * 1000); // 10 uploads per minute
}

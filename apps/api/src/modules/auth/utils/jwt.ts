import { FastifyInstance } from 'fastify';
import { validateEnv } from '../../../utils/env.js';

const env = validateEnv();

export interface TokenPayload {
  userId: string;
  email: string | null;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(fastify: FastifyInstance, payload: TokenPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: '15m' });
}

export function generateRefreshTokenString(fastify: FastifyInstance, payload: TokenPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: '7d' });
}

export function verifyAccessToken(fastify: FastifyInstance, token: string): TokenPayload {
  return fastify.jwt.verify(token) as TokenPayload;
}

export function verifyRefreshTokenString(fastify: FastifyInstance, token: string): TokenPayload {
  return fastify.jwt.verify(token) as TokenPayload;
}

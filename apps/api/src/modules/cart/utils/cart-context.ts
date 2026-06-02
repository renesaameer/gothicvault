import { FastifyRequest } from 'fastify';
import prisma from '../../../utils/prisma.js';
import type { AuthenticatedUser } from '../../auth/middleware/auth.middleware.js';

const CART_TOKEN_HEADER = 'x-cart-token';

export interface CartContext {
  profileId: string | null;
  cartToken: string;
  isAuthenticated: boolean;
}

export function getCartTokenFromRequest(request: FastifyRequest): string | undefined {
  const header = request.headers[CART_TOKEN_HEADER];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  const query = (request.query as { cartToken?: string })?.cartToken;
  return query?.trim() || undefined;
}

export async function resolveProfileId(request: FastifyRequest): Promise<string | null> {
  const user = (request as FastifyRequest & { user?: AuthenticatedUser }).user;
  if (!user?.userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  });

  return profile?.id ?? null;
}

export function generateCartToken(): string {
  return crypto.randomUUID();
}

export async function buildCartContext(request: FastifyRequest): Promise<CartContext> {
  const profileId = await resolveProfileId(request);
  const existingToken = getCartTokenFromRequest(request);
  const cartToken = existingToken || generateCartToken();

  return {
    profileId,
    cartToken,
    isAuthenticated: Boolean(profileId),
  };
}

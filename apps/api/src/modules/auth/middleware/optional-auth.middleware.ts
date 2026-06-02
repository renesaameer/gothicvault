import { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthenticatedUser } from './auth.middleware.js';

export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = request.server.jwt.verify(token) as AuthenticatedUser;
    (request as FastifyRequest & { user?: AuthenticatedUser }).user = decoded;
  } catch {
    // Guest flow — invalid token is ignored for optional auth routes
  }
}

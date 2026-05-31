import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedUser } from './auth.middleware.js';
import logger from '../../../utils/logger.js';

export function authorize(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user as AuthenticatedUser | undefined;

      if (!user) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const hasRole = allowedRoles.some((role) => user.roles.includes(role));

      if (!hasRole) {
        reply.status(403).send({ error: 'Forbidden' });
        return;
      }
    } catch (error) {
      logger.error({ msg: 'Error in authorize middleware', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  };
}

export function requireAdmin() {
  return authorize('admin');
}

export function requireStaff() {
  return authorize('admin', 'staff');
}

export function requireUser() {
  return authorize('admin', 'staff', 'user');
}

import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../../../utils/logger.js';

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  roles: string[];
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = request.server.jwt.verify(token) as AuthenticatedUser;
      (request as any).user = decoded;
    } catch (error) {
      logger.error({ msg: 'Error verifying token', error });
      reply.status(401).send({ error: 'Invalid token' });
      return;
    }
  } catch (error) {
    logger.error({ msg: 'Error in authenticate middleware', error });
    reply.status(500).send({ error: 'Internal server error' });
  }
}

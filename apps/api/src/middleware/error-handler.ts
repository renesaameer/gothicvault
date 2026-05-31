import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger.js';

export async function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  logger.error(error);

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  reply.status(statusCode).send(response);
}

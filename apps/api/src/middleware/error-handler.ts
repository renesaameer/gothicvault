import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

export async function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // Log the error
  logger.error({ msg: 'Error occurred', error });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
    return;
  }

  // Handle known error messages
  if (error instanceof Error) {
    const message = error.message;
    
    // Not found errors
    if (message === 'Product not found' ||
        message === 'Category not found' ||
        message === 'Coupon not found' ||
        message === 'Order not found' ||
        message === 'Customer not found') {
      reply.status(404).send({
        success: false,
        error: message,
      });
      return;
    }

    // Conflict errors
    if (message === 'User already exists') {
      reply.status(409).send({
        success: false,
        error: message,
      });
      return;
    }

    // Unauthorized errors
    if (message === 'Unauthorized' || message === 'Invalid token') {
      reply.status(401).send({
        success: false,
        error: message,
      });
      return;
    }

    // Forbidden errors
    if (message === 'Forbidden' || message === 'Insufficient permissions') {
      reply.status(403).send({
        success: false,
        error: message,
      });
      return;
    }
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  reply.status(statusCode).send(response);
}

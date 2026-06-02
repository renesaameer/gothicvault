import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';
import { CartValidationError } from '../cart/cart.service.js';
import { buildCartContext } from '../cart/utils/cart-context.js';
import { CheckoutService } from './checkout.service.js';
import { checkoutSchema } from './dto/index.js';

export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  private handleError(error: unknown, reply: FastifyReply) {
    if (error instanceof ZodError) {
      reply.status(400).send({ error: 'Validation error', details: error.errors });
      return;
    }

    if (error instanceof CartValidationError) {
      reply.status(error.statusCode).send({ error: error.message, code: error.code });
      return;
    }

    logger.error({ msg: 'Checkout controller error', error });
    reply.status(500).send({ error: 'Internal server error' });
  }

  async validate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = await buildCartContext(request);
      const result = await this.checkoutService.validateCheckout(context);
      reply.header('x-cart-token', context.cartToken);
      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async checkout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = checkoutSchema.parse(request.body);
      const context = await buildCartContext(request);
      const order = await this.checkoutService.checkout(context, data);
      reply.status(201).send({ order });
    } catch (error) {
      this.handleError(error, reply);
    }
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { CouponsService } from './coupons.service.js';
import { createCouponSchema, updateCouponSchema, couponQuerySchema, type CreateCouponDto, type UpdateCouponDto } from './dto/index.js';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';

export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  async getAllCoupons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = couponQuerySchema.parse(request.query);
      const result = await this.couponsService.getAllCoupons(query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get all coupons controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCouponById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const coupon = await this.couponsService.getCouponById(id);
      reply.send(coupon);
    } catch (error) {
      logger.error({ msg: 'Error in get coupon by id controller', error });
      if (error instanceof Error && error.message === 'Coupon not found') {
        reply.status(404).send({ error: 'Coupon not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCouponByCode(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };
      const coupon = await this.couponsService.getCouponByCode(code);
      reply.send(coupon);
    } catch (error) {
      logger.error({ msg: 'Error in get coupon by code controller', error });
      if (error instanceof Error && error.message === 'Coupon not found') {
        reply.status(404).send({ error: 'Coupon not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async createCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createCouponSchema.parse(request.body) as CreateCouponDto;
      const coupon = await this.couponsService.createCoupon(data);
      reply.status(201).send(coupon);
    } catch (error) {
      logger.error({ msg: 'Error in create coupon controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async updateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateCouponSchema.parse(request.body) as UpdateCouponDto;
      const coupon = await this.couponsService.updateCoupon(id, data);
      reply.send(coupon);
    } catch (error) {
      logger.error({ msg: 'Error in update coupon controller', error });
      if (error instanceof Error && error.message === 'Coupon not found') {
        reply.status(404).send({ error: 'Coupon not found' });
      } else if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async deleteCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.couponsService.deleteCoupon(id);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete coupon controller', error });
      if (error instanceof Error && error.message === 'Coupon not found') {
        reply.status(404).send({ error: 'Coupon not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async toggleCouponStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { enabled } = request.body as { enabled: boolean };
      const coupon = await this.couponsService.toggleCouponStatus(id, enabled);
      reply.send(coupon);
    } catch (error) {
      logger.error({ msg: 'Error in toggle coupon status controller', error });
      if (error instanceof Error && error.message === 'Coupon not found') {
        reply.status(404).send({ error: 'Coupon not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}

import prisma from '../../utils/prisma.js';
import type { CreateCouponDto, UpdateCouponDto, CouponQueryDto } from './dto/index.js';
import logger from '../../utils/logger.js';

export class CouponsService {
  async getAllCoupons(query: CouponQueryDto) {
    try {
      const { page = 1, limit = 50, enabled, search } = query;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (enabled !== undefined) {
        where.enabled = enabled;
      }

      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.coupon.count({ where }),
      ]);

      return {
        data: coupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ msg: 'Error getting all coupons', error });
      throw error;
    }
  }

  async getCouponById(id: string) {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id },
      });

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      return coupon;
    } catch (error) {
      logger.error({ msg: 'Error getting coupon by id', error });
      throw error;
    }
  }

  async getCouponByCode(code: string) {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      return coupon;
    } catch (error) {
      logger.error({ msg: 'Error getting coupon by code', error });
      throw error;
    }
  }

  async createCoupon(data: CreateCouponDto) {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          ...data,
          code: data.code.toUpperCase(),
        },
      });

      logger.info(`Coupon created: ${coupon.code}`);
      return coupon;
    } catch (error) {
      logger.error({ msg: 'Error creating coupon', error });
      throw error;
    }
  }

  async updateCoupon(id: string, data: UpdateCouponDto) {
    try {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          ...data,
          ...(data.code && { code: data.code.toUpperCase() }),
        },
      });

      logger.info(`Coupon updated: ${coupon.code}`);
      return coupon;
    } catch (error) {
      logger.error({ msg: 'Error updating coupon', error });
      throw error;
    }
  }

  async deleteCoupon(id: string) {
    try {
      await prisma.coupon.delete({
        where: { id },
      });

      logger.info(`Coupon deleted: ${id}`);
    } catch (error) {
      logger.error({ msg: 'Error deleting coupon', error });
      throw error;
    }
  }

  async toggleCouponStatus(id: string, enabled: boolean) {
    try {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { enabled },
      });

      logger.info(`Coupon ${enabled ? 'enabled' : 'disabled'}: ${coupon.code}`);
      return coupon;
    } catch (error) {
      logger.error({ msg: 'Error toggling coupon status', error });
      throw error;
    }
  }
}

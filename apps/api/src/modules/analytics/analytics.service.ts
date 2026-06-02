import prisma from '../../utils/prisma.js';
import logger from '../../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

export class AnalyticsService {
  async getSalesStats(startDate?: Date, endDate?: Date) {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = startDate;
        if (endDate) dateFilter.createdAt.lte = endDate;
      }

      const [totalOrders, totalRevenue, totalCustomers, avgOrderValue] = await Promise.all([
        prisma.order.count({ where: dateFilter }),
        prisma.order.aggregate({
          where: dateFilter,
          _sum: { total: true },
        }),
        prisma.customer.count(),
        prisma.order.aggregate({
          where: dateFilter,
          _avg: { total: true },
        }),
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
        totalCustomers,
        avgOrderValue: avgOrderValue._avg.total?.toNumber() || 0,
      };
    } catch (error) {
      logger.error({ msg: 'Error getting sales stats', error });
      throw error;
    }
  }

  async getOrderStats(startDate?: Date, endDate?: Date) {
    try {
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = startDate;
        if (endDate) dateFilter.createdAt.lte = endDate;
      }

      const ordersByStatus = await prisma.order.groupBy({
        by: ['orderStatus'],
        where: dateFilter,
        _count: true,
      });

      const ordersByPaymentStatus = await prisma.order.groupBy({
        by: ['paymentStatus'],
        where: dateFilter,
        _count: true,
      });

      return {
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.orderStatus,
          count: item._count,
        })),
        ordersByPaymentStatus: ordersByPaymentStatus.map((item) => ({
          status: item.paymentStatus,
          count: item._count,
        })),
      };
    } catch (error) {
      logger.error({ msg: 'Error getting order stats', error });
      throw error;
    }
  }

  async getTopProducts(limit: number = 10, _startDate?: Date, _endDate?: Date) {
    try {
      // Get products with best seller flag
      const products = await prisma.product.findMany({
        where: { bestSeller: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
        },
        take: limit,
        orderBy: { sortOrder: 'asc' },
      });

      return products.map((p) => ({
        ...p,
        price: p.price instanceof Decimal ? p.price.toNumber() : p.price,
        salePrice: p.salePrice instanceof Decimal ? p.salePrice.toNumber() : p.salePrice,
        totalSales: 0, // Placeholder until orderItem aggregation is fixed
      }));
    } catch (error) {
      logger.error({ msg: 'Error getting top products', error });
      throw error;
    }
  }

  async getRecentOrders(limit: number = 10) {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });

      return orders.map((o) => ({
        ...o,
        total: o.total instanceof Decimal ? o.total.toNumber() : o.total,
        subtotal: o.subtotal instanceof Decimal ? o.subtotal.toNumber() : o.subtotal,
        shippingCost: o.shippingCost instanceof Decimal ? o.shippingCost.toNumber() : o.shippingCost,
      }));
    } catch (error) {
      logger.error({ msg: 'Error getting recent orders', error });
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [salesStats, orderStats, topProducts, recentOrders] = await Promise.all([
        this.getSalesStats(thisMonth, undefined),
        this.getOrderStats(thisMonth, undefined),
        this.getTopProducts(5, thisMonth, undefined),
        this.getRecentOrders(5),
      ]);

      return {
        sales: salesStats,
        orders: orderStats,
        topProducts,
        recentOrders,
      };
    } catch (error) {
      logger.error({ msg: 'Error getting dashboard stats', error });
      throw error;
    }
  }
}

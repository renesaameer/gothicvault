import prisma from '../../utils/prisma.js';
import type { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/index.js';
import logger from '../../utils/logger.js';

export class CustomersService {
  async getAllCustomers(query: CustomerQueryDto) {
    try {
      const { page = 1, limit = 50, search } = query;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        data: customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ msg: 'Error getting all customers', error });
      throw error;
    }
  }

  async getCustomerById(id: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error) {
      logger.error({ msg: 'Error getting customer by id', error });
      throw error;
    }
  }

  async getCustomerByPhone(phone: string) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { phone },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      return customer;
    } catch (error) {
      logger.error({ msg: 'Error getting customer by phone', error });
      throw error;
    }
  }

  async createCustomer(data: CreateCustomerDto) {
    try {
      const customer = await prisma.customer.create({
        data: {
          ...data,
          totalOrders: 0,
          totalSpent: 0,
        },
      });

      logger.info(`Customer created: ${customer.name}`);
      return customer;
    } catch (error) {
      logger.error({ msg: 'Error creating customer', error });
      throw error;
    }
  }

  async updateCustomer(id: string, data: UpdateCustomerDto) {
    try {
      const customer = await prisma.customer.update({
        where: { id },
        data,
      });

      logger.info(`Customer updated: ${customer.name}`);
      return customer;
    } catch (error) {
      logger.error({ msg: 'Error updating customer', error });
      throw error;
    }
  }

  async deleteCustomer(id: string) {
    try {
      // Check if customer has orders
      const orders = await prisma.order.findMany({
        where: { customerId: id },
      });

      if (orders.length > 0) {
        throw new Error('Cannot delete customer with orders');
      }

      await prisma.customer.delete({
        where: { id },
      });

      logger.info(`Customer deleted: ${id}`);
    } catch (error) {
      logger.error({ msg: 'Error deleting customer', error });
      throw error;
    }
  }

  async getCustomerStats() {
    try {
      const [totalCustomers, totalOrders, totalSpent] = await Promise.all([
        prisma.customer.count(),
        prisma.order.count(),
        prisma.customer.aggregate({
          _sum: { totalSpent: true },
        }),
      ]);

      return {
        totalCustomers,
        totalOrders,
        totalSpent: totalSpent._sum.totalSpent || 0,
      };
    } catch (error) {
      logger.error({ msg: 'Error getting customer stats', error });
      throw error;
    }
  }
}

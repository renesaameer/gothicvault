import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service.js';
import { CustomersController } from './customers.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function customersRoutes(fastify: FastifyInstance) {
  const customersService = new CustomersService();
  const customersController = new CustomersController(customersService);

  // Get all customers (admin/staff only)
  fastify.get('/customers', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.getAllCustomers.bind(customersController),
  });

  // Get customer stats (admin/staff only)
  fastify.get('/customers/stats', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.getCustomerStats.bind(customersController),
  });

  // Get customer by ID (admin/staff only)
  fastify.get('/customers/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.getCustomerById.bind(customersController),
  });

  // Get customer by phone (admin/staff only)
  fastify.get('/customers/phone/:phone', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.getCustomerByPhone.bind(customersController),
  });

  // Create customer (admin/staff only)
  fastify.post('/customers', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.createCustomer.bind(customersController),
  });

  // Update customer (admin/staff only)
  fastify.put('/customers/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.updateCustomer.bind(customersController),
  });

  // Delete customer (admin/staff only)
  fastify.delete('/customers/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    handler: customersController.deleteCustomer.bind(customersController),
  });
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomersService } from './customers.service.js';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema, type CreateCustomerDto, type UpdateCustomerDto, type CustomerQueryDto } from './dto/index.js';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';

export class CustomersController {
  constructor(private customersService: CustomersService) {}

  async getAllCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = customerQuerySchema.parse(request.query);
      const result = await this.customersService.getAllCustomers(query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get all customers controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCustomerById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const customer = await this.customersService.getCustomerById(id);
      reply.send(customer);
    } catch (error) {
      logger.error({ msg: 'Error in get customer by id controller', error });
      if (error instanceof Error && error.message === 'Customer not found') {
        reply.status(404).send({ error: 'Customer not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCustomerByPhone(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { phone } = request.params as { phone: string };
      const customer = await this.customersService.getCustomerByPhone(phone);
      reply.send(customer);
    } catch (error) {
      logger.error({ msg: 'Error in get customer by phone controller', error });
      if (error instanceof Error && error.message === 'Customer not found') {
        reply.status(404).send({ error: 'Customer not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCustomerStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.customersService.getCustomerStats();
      reply.send(stats);
    } catch (error) {
      logger.error({ msg: 'Error in get customer stats controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createCustomerSchema.parse(request.body) as CreateCustomerDto;
      const customer = await this.customersService.createCustomer(data);
      reply.status(201).send(customer);
    } catch (error) {
      logger.error({ msg: 'Error in create customer controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async updateCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateCustomerSchema.parse(request.body) as UpdateCustomerDto;
      const customer = await this.customersService.updateCustomer(id, data);
      reply.send(customer);
    } catch (error) {
      logger.error({ msg: 'Error in update customer controller', error });
      if (error instanceof Error && error.message === 'Customer not found') {
        reply.status(404).send({ error: 'Customer not found' });
      } else if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async deleteCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.customersService.deleteCustomer(id);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete customer controller', error });
      if (error instanceof Error && error.message === 'Customer not found') {
        reply.status(404).send({ error: 'Customer not found' });
      } else if (error instanceof Error && error.message === 'Cannot delete customer with orders') {
        reply.status(400).send({ error: 'Cannot delete customer with orders' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}

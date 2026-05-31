import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductsService } from './products.service.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from './dto/index.js';
import logger from '../../utils/logger.js';

export class ProductsController {
  constructor(private productsService: ProductsService) {}

  async getAllProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = productQuerySchema.parse(request.query);
      const result = await this.productsService.getAllProducts(query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get all products controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getProductById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await this.productsService.getProductById(id);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get product by id controller', error });
      if (error instanceof Error && error.message === 'Product not found') {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getProductBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const result = await this.productsService.getProductBySlug(slug);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get product by slug controller', error });
      if (error instanceof Error && error.message === 'Product not found') {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getFeaturedProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = productQuerySchema.parse(request.query);
      const result = await this.productsService.getFeaturedProducts(query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get featured products controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getRelatedProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const query = productQuerySchema.parse(request.query);
      const result = await this.productsService.getRelatedProducts(id, query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get related products controller', error });
      if (error instanceof Error && error.message === 'Product not found') {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createProductSchema.parse(request.body);
      const result = await this.productsService.createProduct(data);
      reply.status(201).send(result);
    } catch (error) {
      logger.error({ msg: 'Error in create product controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateProductSchema.parse(request.body);
      const result = await this.productsService.updateProduct(id, data);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in update product controller', error });
      if (error instanceof Error && error.message === 'Product not found') {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.productsService.deleteProduct(id);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete product controller', error });
      if (error instanceof Error && error.message === 'Product not found') {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}

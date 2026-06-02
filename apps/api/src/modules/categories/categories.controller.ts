import { FastifyRequest, FastifyReply } from 'fastify';
import { CategoriesService } from './categories.service.js';
import { createCategorySchema, updateCategorySchema, categoryQuerySchema, type CreateCategoryDto, type UpdateCategoryDto } from './dto/index.js';
import { ZodError } from 'zod';
import logger from '../../utils/logger.js';

export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  async getAllCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = categoryQuerySchema.parse(request.query);
      const result = await this.categoriesService.getAllCategories(query);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get all categories controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCategoryById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const category = await this.categoriesService.getCategoryById(id);
      reply.send(category);
    } catch (error) {
      logger.error({ msg: 'Error in get category by id controller', error });
      if (error instanceof Error && error.message === 'Category not found') {
        reply.status(404).send({ error: 'Category not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCategoryBySlug(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { slug } = request.params as { slug: string };
      const category = await this.categoriesService.getCategoryBySlug(slug);
      reply.send(category);
    } catch (error) {
      logger.error({ msg: 'Error in get category by slug controller', error });
      if (error instanceof Error && error.message === 'Category not found') {
        reply.status(404).send({ error: 'Category not found' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async getCategoryTree(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { categoryType } = request.query as { categoryType?: string };
      const categories = await this.categoriesService.getCategoryTree(categoryType);
      reply.send(categories);
    } catch (error) {
      logger.error({ msg: 'Error in get category tree controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createCategorySchema.parse(request.body) as CreateCategoryDto;
      const category = await this.categoriesService.createCategory(data);
      reply.status(201).send(category);
    } catch (error) {
      logger.error({ msg: 'Error in create category controller', error });
      if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async updateCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const data = updateCategorySchema.parse(request.body) as UpdateCategoryDto;
      const category = await this.categoriesService.updateCategory(id, data);
      reply.send(category);
    } catch (error) {
      logger.error({ msg: 'Error in update category controller', error });
      if (error instanceof Error && error.message === 'Category not found') {
        reply.status(404).send({ error: 'Category not found' });
      } else if (error instanceof ZodError) {
        reply.status(400).send({ error: 'Validation error', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }

  async deleteCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.categoriesService.deleteCategory(id);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete category controller', error });
      if (error instanceof Error && error.message === 'Category not found') {
        reply.status(404).send({ error: 'Category not found' });
      } else if (error instanceof Error && error.message === 'Cannot delete category with subcategories') {
        reply.status(400).send({ error: 'Cannot delete category with subcategories' });
      } else if (error instanceof Error && error.message === 'Cannot delete category with products') {
        reply.status(400).send({ error: 'Cannot delete category with products' });
      } else {
        reply.status(500).send({ error: 'Internal server error' });
      }
    }
  }
}

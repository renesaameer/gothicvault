import prisma from '../../utils/prisma.js';
import type { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto/index.js';
import logger from '../../utils/logger.js';

export class CategoriesService {
  async getAllCategories(query: CategoryQueryDto) {
    try {
      const { page = 1, limit = 50, categoryType, search } = query;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (categoryType) {
        where.categoryType = categoryType as any;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.category.count({ where }),
      ]);

      return {
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ msg: 'Error getting all categories', error });
      throw error;
    }
  }

  async getCategoryById(id: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      logger.error({ msg: 'Error getting category by id', error });
      throw error;
    }
  }

  async getCategoryBySlug(slug: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      logger.error({ msg: 'Error getting category by slug', error });
      throw error;
    }
  }

  async getCategoryTree(categoryType?: string) {
    try {
      const where: any = { parentId: null };
      if (categoryType) {
        where.categoryType = categoryType as any;
      }

      const categories = await prisma.category.findMany({
        where,
        include: {
          children: {
            include: {
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return categories;
    } catch (error) {
      logger.error({ msg: 'Error getting category tree', error });
      throw error;
    }
  }

  async createCategory(data: CreateCategoryDto) {
    try {
      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          path: data.slug,
          level: data.parentId ? 1 : 0,
          description: data.description,
          categoryType: data.categoryType as any,
          parentId: data.parentId || null,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          featured: data.featured,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      logger.info(`Category created: ${category.name}`);
      return category;
    } catch (error) {
      logger.error({ msg: 'Error creating category', error });
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    try {
      const category = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          categoryType: data.categoryType as any,
          parentId: data.parentId !== undefined ? (data.parentId || null) : undefined,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          featured: data.featured,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      logger.info(`Category updated: ${category.name}`);
      return category;
    } catch (error) {
      logger.error({ msg: 'Error updating category', error });
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      // Check if category has children
      const children = await prisma.category.findMany({
        where: { parentId: id },
      });

      if (children.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Check if category has products
      const products = await prisma.product.findMany({
        where: { categoryId: id },
      });

      if (products.length > 0) {
        throw new Error('Cannot delete category with products');
      }

      await prisma.category.delete({
        where: { id },
      });

      logger.info(`Category deleted: ${id}`);
    } catch (error) {
      logger.error({ msg: 'Error deleting category', error });
      throw error;
    }
  }
}

import prisma from '../../utils/prisma.js';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  type ProductWithRelations,
  type PaginatedResult,
} from './dto/index.js';
import { calculatePagination, getSkipTake } from './utils/pagination.js';
import logger from '../../utils/logger.js';
import { Decimal } from '@prisma/client/runtime/library';

function convertDecimalToNumber(value: any): any {
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(convertDecimalToNumber);
  }
  if (typeof value === 'object' && value !== null) {
    const converted: any = {};
    for (const key in value) {
      converted[key] = convertDecimalToNumber(value[key]);
    }
    return converted;
  }
  return value;
}

export class ProductsService {
  async getAllProducts(query: ProductQueryDto): Promise<PaginatedResult<ProductWithRelations>> {
    try {
      const { page, limit, category, brand, tag, search, status, featured, bestSeller, isNewArrival, sortBy, sortOrder } = query;

      const where: any = {};

      // Filter by category
      if (category) {
        where.category = {
          slug: category,
        };
      }

      // Filter by brand
      if (brand) {
        where.brand = {
          slug: brand,
        };
      }

      // Filter by tag
      if (tag) {
        where.tags = {
          some: {
            tag: {
              slug: tag,
            },
          },
        };
      }

      // Search by name or description
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by status
      if (status) {
        where.status = status;
      } else {
        // Default to active products for public API
        where.status = 'active';
      }

      // Filter by featured
      if (featured !== undefined) {
        where.featured = featured;
      }

      // Filter by best seller
      if (bestSeller !== undefined) {
        where.bestSeller = bestSeller;
      }

      // Filter by new arrival
      if (isNewArrival !== undefined) {
        where.isNewArrival = isNewArrival;
      }

      const { skip, take } = getSkipTake(page, limit);

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variants: {
              where: { active: true },
              orderBy: { sortOrder: 'asc' },
            },
            media: {
              orderBy: { sortOrder: 'asc' },
            },
            faqs: {
              orderBy: { sortOrder: 'asc' },
            },
            tabs: {
              orderBy: { sortOrder: 'asc' },
            },
            offers: {
              where: { enabled: true },
              orderBy: { sortOrder: 'asc' },
            },
            tags: {
              include: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                  },
                },
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      const meta = calculatePagination(total, page, limit);

      return {
        data: convertDecimalToNumber(products) as ProductWithRelations[],
        meta,
      };
    } catch (error) {
      logger.error({ msg: 'Error getting all products', error });
      throw error;
    }
  }

  async getProductById(id: string): Promise<ProductWithRelations> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            orderBy: { sortOrder: 'asc' },
          },
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          faqs: {
            orderBy: { sortOrder: 'asc' },
          },
          tabs: {
            orderBy: { sortOrder: 'asc' },
          },
          offers: {
            orderBy: { sortOrder: 'asc' },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      return convertDecimalToNumber(product) as ProductWithRelations;
    } catch (error) {
      logger.error({ msg: 'Error getting product by id', error });
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<ProductWithRelations> {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
          },
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          faqs: {
            orderBy: { sortOrder: 'asc' },
          },
          tabs: {
            orderBy: { sortOrder: 'asc' },
          },
          offers: {
            where: { enabled: true },
            orderBy: { sortOrder: 'asc' },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      return convertDecimalToNumber(product) as ProductWithRelations;
    } catch (error) {
      logger.error({ msg: 'Error getting product by slug', error });
      throw error;
    }
  }

  async getFeaturedProducts(query: ProductQueryDto): Promise<PaginatedResult<ProductWithRelations>> {
    try {
      const featuredQuery = { ...query, featured: true };
      return this.getAllProducts(featuredQuery);
    } catch (error) {
      logger.error({ msg: 'Error getting featured products', error });
      throw error;
    }
  }

  async getRelatedProducts(productId: string, query: ProductQueryDto): Promise<ProductWithRelations[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true, brandId: true },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const { limit } = query;
      const where: any = {
        id: { not: productId },
        status: 'active',
      };

      // Get products from same category or brand
      if (product.categoryId || product.brandId) {
        where.OR = [];
        if (product.categoryId) {
          where.OR.push({ categoryId: product.categoryId });
        }
        if (product.brandId) {
          where.OR.push({ brandId: product.brandId });
        }
      }

      const products = await prisma.product.findMany({
        where,
        take: limit || 8,
        orderBy: { sortOrder: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
          },
          media: {
            orderBy: { sortOrder: 'asc' },
          },
          faqs: {
            orderBy: { sortOrder: 'asc' },
          },
          tabs: {
            orderBy: { sortOrder: 'asc' },
          },
          offers: {
            where: { enabled: true },
            orderBy: { sortOrder: 'asc' },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      return convertDecimalToNumber(products) as ProductWithRelations[];
    } catch (error) {
      logger.error({ msg: 'Error getting related products', error });
      throw error;
    }
  }

  async createProduct(data: CreateProductDto): Promise<ProductWithRelations> {
    try {
      const product = await prisma.product.create({
        data,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: true,
          media: true,
          faqs: true,
          tabs: true,
          offers: true,
          tags: true,
        },
      });

      logger.info(`Product created: ${product.name}`);
      return convertDecimalToNumber(product) as ProductWithRelations;
    } catch (error) {
      logger.error({ msg: 'Error creating product', error });
      throw error;
    }
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<ProductWithRelations> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: true,
          media: true,
          faqs: true,
          tabs: true,
          offers: true,
          tags: true,
        },
      });

      logger.info(`Product updated: ${product.name}`);
      return convertDecimalToNumber(product) as ProductWithRelations;
    } catch (error) {
      logger.error({ msg: 'Error updating product', error });
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id },
      });

      logger.info(`Product deleted: ${id}`);
    } catch (error) {
      logger.error({ msg: 'Error deleting product', error });
      throw error;
    }
  }
}

import { FastifyInstance } from 'fastify';
import { UploadsService } from './uploads.service.js';
import { UploadsController } from './uploads.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';
import { requireStaff } from '../auth/middleware/role.middleware.js';
import { generalRateLimit, uploadRateLimit } from '../auth/middleware/rate-limit.middleware.js';

export async function uploadsRoutes(fastify: FastifyInstance) {
  const uploadsService = new UploadsService();
  const uploadsController = new UploadsController(uploadsService);

  // Upload single file (admin/staff only)
  fastify.post('/uploads/single', {
    preHandler: [authenticate, requireStaff(), uploadRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Upload single file',
      description: 'Upload a single file to the specified directory',
      consumes: ['multipart/form-data'],
      querystring: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            enum: ['products', 'categories', 'brands', 'homepage', 'testimonials', 'misc'],
            default: 'misc',
            description: 'Directory to upload the file to',
          },
        },
      },
      // Body schema for Swagger UI (file input for documentation)
      body: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'number' },
            path: { type: 'string' },
            url: { type: 'string' },
          },
        },
      },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    handler: uploadsController.uploadSingle.bind(uploadsController),
  });

  // Upload multiple files (admin/staff only)
  fastify.post('/uploads/multiple', {
    preHandler: [authenticate, requireStaff(), uploadRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Upload multiple files',
      description: 'Upload multiple files to the specified directory',
      consumes: ['multipart/form-data'],
      querystring: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            enum: ['products', 'categories', 'brands', 'homepage', 'testimonials', 'misc'],
            default: 'misc',
            description: 'Directory to upload the files to',
          },
        },
      },
      // Body schema for Swagger UI (files input for documentation)
      body: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  originalName: { type: 'string' },
                  mimeType: { type: 'string' },
                  size: { type: 'number' },
                  path: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
            count: { type: 'number' },
          },
        },
      },
    },
    bodyLimit: 50 * 1024 * 1024, // 50MB for multiple files
    handler: uploadsController.uploadMultiple.bind(uploadsController),
  });

  // Delete file (admin/staff only)
  fastify.delete('/uploads', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Delete file',
      description: 'Delete a file from the server',
      body: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
        },
      },
      response: {
        204: {
          type: 'null',
          description: 'File deleted successfully',
        },
      },
    },
    handler: uploadsController.deleteFile.bind(uploadsController),
  });

  // Update file (admin/staff only)
  fastify.put('/uploads', {
    preHandler: [authenticate, requireStaff(), uploadRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Update file',
      description: 'Replace an existing file with a new one',
      consumes: ['multipart/form-data'],
      querystring: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            enum: ['products', 'categories', 'brands', 'homepage', 'testimonials', 'misc'],
            default: 'misc',
            description: 'Directory to upload the new file to',
          },
        },
      },
      // Body schema for Swagger UI (file and oldPath input for documentation)
      body: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
          oldPath: {
            type: 'string',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'number' },
            path: { type: 'string' },
            url: { type: 'string' },
          },
        },
      },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    handler: uploadsController.updateFile.bind(uploadsController),
  });

  // Get product media (public)
  fastify.get('/uploads/product/:productId', {
    preHandler: [generalRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Get product media',
      description: 'Get all media files for a specific product',
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productId: { type: 'string' },
              variantId: { type: 'string', nullable: true },
              imageUrl: { type: 'string' },
              altText: { type: 'string', nullable: true },
              type: { type: 'string', enum: ['image', 'video', 'view_360'] },
              sortOrder: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    handler: uploadsController.getProductMedia.bind(uploadsController),
  });

  // Create product media (admin/staff only)
  fastify.post('/uploads/product/:productId', {
    preHandler: [authenticate, requireStaff(), uploadRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Create product media',
      description: 'Upload a file and associate it with a product',
      consumes: ['multipart/form-data'],
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
        },
      },
      // Body schema for Swagger UI (file and form fields for documentation)
      body: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
          mediaType: { type: 'string', enum: ['image', 'video', 'view_360'] },
          altText: { type: 'string' },
          sortOrder: { type: 'number', default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            variantId: { type: 'string', nullable: true },
            imageUrl: { type: 'string' },
            altText: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['image', 'video', 'view_360'] },
            sortOrder: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    handler: uploadsController.createProductMedia.bind(uploadsController),
  });

  // Delete product media (admin/staff only)
  fastify.delete('/uploads/product/:productId/:id', {
    preHandler: [authenticate, requireStaff(), generalRateLimit()],
    schema: {
      tags: ['Uploads'],
      summary: 'Delete product media',
      description: 'Delete a specific media file from a product',
      params: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        204: {
          type: 'null',
          description: 'Product media deleted successfully',
        },
      },
    },
    handler: uploadsController.deleteProductMedia.bind(uploadsController),
  });
}

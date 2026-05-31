import { FastifyRequest, FastifyReply } from 'fastify';
import { UploadsService } from './uploads.service.js';
import { uploadDirectorySchema } from './dto/index.js';
import logger from '../../utils/logger.js';

export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  async uploadSingle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await (request as any).file();
      
      if (!data) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      const directory = (request.query as { directory: string }).directory || 'misc';
      const validatedDirectory = uploadDirectorySchema.parse(directory);

      const fileData = await data.toBuffer();
      const result = await this.uploadsService.uploadSingleFile(
        {
          filename: data.filename,
          mimetype: data.mimetype,
          data: fileData,
        },
        validatedDirectory
      );

      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in upload single controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await (request as any).files();
      
      const files: Array<{ filename: string; mimetype: string; data: Buffer }> = [];
      
      for await (const file of data) {
        const fileData = await file.toBuffer();
        files.push({
          filename: file.filename,
          mimetype: file.mimetype,
          data: fileData,
        });
      }

      if (files.length === 0) {
        reply.status(400).send({ error: 'No files uploaded' });
        return;
      }

      const directory = (request.query as { directory: string }).directory || 'misc';
      const validatedDirectory = uploadDirectorySchema.parse(directory);

      const result = await this.uploadsService.uploadMultipleFiles(files, validatedDirectory);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in upload multiple controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deleteFile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { path } = request.body as { path: string };
      
      if (!path) {
        reply.status(400).send({ error: 'File path is required' });
        return;
      }

      await this.uploadsService.deleteFileByPath(path);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete file controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateFile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await (request as any).file();
      
      if (!data) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      const { oldPath } = request.body as { oldPath: string };
      
      if (!oldPath) {
        reply.status(400).send({ error: 'Old file path is required' });
        return;
      }

      const directory = (request.query as { directory: string }).directory || 'misc';
      const validatedDirectory = uploadDirectorySchema.parse(directory);

      const fileData = await data.toBuffer();
      const result = await this.uploadsService.updateFile(
        oldPath,
        {
          filename: data.filename,
          mimetype: data.mimetype,
          data: fileData,
        },
        validatedDirectory
      );

      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in update file controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getProductMedia(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { productId } = request.params as { productId: string };
      const result = await this.uploadsService.getProductMedia(productId);
      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in get product media controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createProductMedia(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { productId, mediaType, altText, sortOrder } = request.body as {
        productId: string;
        mediaType: 'image' | 'video' | 'view_360';
        altText?: string;
        sortOrder?: number;
      };

      const data = await (request as any).file();
      
      if (!data) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      const fileData = await data.toBuffer();
      const uploadResult = await this.uploadsService.uploadSingleFile(
        {
          filename: data.filename,
          mimetype: data.mimetype,
          data: fileData,
        },
        'products'
      );

      const result = await this.uploadsService.createProductMedia(
        productId,
        mediaType,
        uploadResult.url,
        altText,
        sortOrder || 0
      );

      reply.send(result);
    } catch (error) {
      logger.error({ msg: 'Error in create product media controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deleteProductMedia(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      await this.uploadsService.deleteProductMedia(id);
      reply.status(204).send();
    } catch (error) {
      logger.error({ msg: 'Error in delete product media controller', error });
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

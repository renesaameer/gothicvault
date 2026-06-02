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
      const parts = (request as any).parts();
      let fileData: Buffer | null = null;
      let filename = '';
      let mimetype = '';
      let oldPath = '';

      for await (const part of parts) {
        if (part.type === 'file') {
          fileData = await part.toBuffer();
          filename = part.filename;
          mimetype = part.mimetype;
        } else {
          if (part.fieldname === 'oldPath') {
            oldPath = part.value as string;
          }
        }
      }

      if (!fileData || !filename) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      if (!oldPath) {
        reply.status(400).send({ error: 'Old file path is required' });
        return;
      }

      const directory = (request.query as { directory: string }).directory || 'misc';
      const validatedDirectory = uploadDirectorySchema.parse(directory);

      const result = await this.uploadsService.updateFile(
        oldPath,
        {
          filename,
          mimetype,
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
      const { productId } = request.params as { productId: string };
      const parts = (request as any).parts();
      let fileData: Buffer | null = null;
      let filename = '';
      let mimetype = '';
      let mediaType: 'image' | 'video' | 'view_360' = 'image';
      let altText: string | undefined;
      let sortOrder: number = 0;

      for await (const part of parts) {
        if (part.type === 'file') {
          fileData = await part.toBuffer();
          filename = part.filename;
          mimetype = part.mimetype;
        } else {
          if (part.fieldname === 'mediaType') {
            mediaType = part.value as 'image' | 'video' | 'view_360';
          } else if (part.fieldname === 'altText') {
            altText = part.value as string;
          } else if (part.fieldname === 'sortOrder') {
            sortOrder = parseInt(part.value as string, 10) || 0;
          }
        }
      }

      if (!fileData || !filename) {
        reply.status(400).send({ error: 'No file uploaded' });
        return;
      }

      const uploadResult = await this.uploadsService.uploadSingleFile(
        {
          filename,
          mimetype,
          data: fileData,
        },
        'products'
      );

      const result = await this.uploadsService.createProductMedia(
        productId,
        mediaType,
        uploadResult.url,
        altText,
        sortOrder
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

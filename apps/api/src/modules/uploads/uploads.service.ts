import { promises as fs } from 'fs';
import path from 'path';
import {
  sanitizeFilename,
  generateUniqueFilename,
  isValidMimeType,
  isValidFileSize,
  ensureUploadDirectory,
  deleteFile,
  generateFileUrl,
  isValidUploadDirectory,
  ALLOWED_IMAGE_MIME_TYPES,
  UPLOAD_DIRECTORIES,
  MAX_FILE_SIZE,
} from './utils/file-utils.js';
import { compressImageForProduct, compressImageForThumbnail } from './utils/image-compression.js';
import type { UploadResponse, MultipleUploadResponse, UploadDirectory } from './dto/index.js';
import logger from '../../utils/logger.js';

export class UploadsService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.API_BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async uploadSingleFile(
    file: { filename: string; mimetype: string; data: Buffer },
    directory: UploadDirectory
  ): Promise<UploadResponse> {
    try {
      // Validate directory
      if (!isValidUploadDirectory(UPLOAD_DIRECTORIES[directory])) {
        throw new Error('Invalid upload directory');
      }

      // Validate MIME type
      if (!isValidMimeType(file.mimetype, ALLOWED_IMAGE_MIME_TYPES)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size
      if (!isValidFileSize(file.data.length, MAX_FILE_SIZE)) {
        throw new Error('File size exceeds maximum limit of 10MB');
      }

      // Compress image if it's an image file
      let compressedData = file.data;
      let compressedMimeType = file.mimetype;
      
      if (file.mimetype.startsWith('image/')) {
        try {
          // Use appropriate compression based on directory
          if (directory === 'products' || directory === 'categories' || directory === 'brands') {
            compressedData = await compressImageForProduct(file.data);
            compressedMimeType = 'image/webp';
          } else {
            // Default compression for other directories (homepage, testimonials, misc)
            compressedData = await compressImageForThumbnail(file.data);
            compressedMimeType = 'image/webp';
          }
          
          logger.info(`Image compressed: ${file.filename} (${file.data.length} -> ${compressedData.length} bytes)`);
        } catch (compressionError) {
          logger.warn({ msg: 'Image compression failed, using original', error: compressionError });
          // Fall back to original if compression fails
          compressedData = file.data;
          compressedMimeType = file.mimetype;
        }
      }

      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(file.filename);
      const uniqueFilename = generateUniqueFilename(sanitizedFilename);

      // Ensure directory exists
      const dirPath = UPLOAD_DIRECTORIES[directory];
      await ensureUploadDirectory(dirPath);

      // Save file
      const filePath = path.join(dirPath, uniqueFilename);
      const fullPath = path.join(process.cwd(), filePath);
      await fs.writeFile(fullPath, compressedData);

      // Generate response
      const response: UploadResponse = {
        filename: uniqueFilename,
        originalName: file.filename,
        mimeType: compressedMimeType,
        size: compressedData.length,
        path: filePath,
        url: generateFileUrl(filePath, this.baseUrl),
      };

      logger.info(`File uploaded: ${filePath}`);
      return response;
    } catch (error) {
      logger.error({ msg: 'Error uploading file', error });
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Array<{ filename: string; mimetype: string; data: Buffer }>,
    directory: UploadDirectory
  ): Promise<MultipleUploadResponse> {
    try {
      const uploadedFiles: UploadResponse[] = [];

      for (const file of files) {
        const uploaded = await this.uploadSingleFile(file, directory);
        uploadedFiles.push(uploaded);
      }

      return {
        files: uploadedFiles,
        count: uploadedFiles.length,
      };
    } catch (error) {
      logger.error({ msg: 'Error uploading multiple files', error });
      throw error;
    }
  }

  async deleteFileByPath(filePath: string): Promise<void> {
    try {
      // Validate path to prevent directory traversal
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Invalid file path');
      }

      await deleteFile(filePath);
      logger.info(`File deleted: ${filePath}`);
    } catch (error) {
      logger.error({ msg: 'Error deleting file', error });
      throw error;
    }
  }

  async updateFile(
    oldFilePath: string,
    newFile: { filename: string; mimetype: string; data: Buffer },
    directory: UploadDirectory
  ): Promise<UploadResponse> {
    try {
      // Delete old file
      await this.deleteFileByPath(oldFilePath);

      // Upload new file
      return this.uploadSingleFile(newFile, directory);
    } catch (error) {
      logger.error({ msg: 'Error updating file', error });
      throw error;
    }
  }

  async getProductMedia(productId: string) {
    try {
      const prisma = (await import('../../utils/prisma.js')).default;
      const media = await prisma.productMedia.findMany({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      return media;
    } catch (error) {
      logger.error({ msg: 'Error getting product media', error });
      throw error;
    }
  }

  async createProductMedia(
    productId: string,
    mediaType: 'image' | 'video' | 'view_360',
    url: string,
    altText?: string,
    sortOrder: number = 0
  ) {
    try {
      const prisma = (await import('../../utils/prisma.js')).default;
      const media = await prisma.productMedia.create({
        data: {
          productId,
          type: mediaType,
          imageUrl: url,
          altText,
          sortOrder,
        },
      });
      return media;
    } catch (error) {
      logger.error({ msg: 'Error creating product media', error });
      throw error;
    }
  }

  async deleteProductMedia(id: string) {
    try {
      const prisma = (await import('../../utils/prisma.js')).default;
      const media = await prisma.productMedia.findUnique({
        where: { id },
      });

      if (media) {
        // Delete file from filesystem
        await this.deleteFileByPath(media.imageUrl);
        // Delete database record
        await prisma.productMedia.delete({
          where: { id },
        });
      }
    } catch (error) {
      logger.error({ msg: 'Error deleting product media', error });
      throw error;
    }
  }

  async cleanupProductMedia(productId: string) {
    try {
      const prisma = (await import('../../utils/prisma.js')).default;
      const mediaList = await prisma.productMedia.findMany({
        where: { productId },
      });

      for (const media of mediaList) {
        await this.deleteProductMedia(media.id);
      }
    } catch (error) {
      logger.error({ msg: 'Error cleaning up product media', error });
      throw error;
    }
  }
}

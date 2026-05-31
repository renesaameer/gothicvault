import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Allowed MIME types for images
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// Allowed MIME types for documents
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload directories
export const UPLOAD_DIRECTORIES = {
  products: 'uploads/products',
  categories: 'uploads/categories',
  brands: 'uploads/brands',
  homepage: 'uploads/homepage',
  testimonials: 'uploads/testimonials',
  misc: 'uploads/misc',
};

/**
 * Sanitize filename to prevent directory traversal and remove special characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = filename.replace(/(\.\.(\/|\\|$))/g, '');
  
  // Remove special characters, keep only alphanumeric, hyphens, underscores, and dots
  const cleanName = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove leading/trailing dots and spaces
  return cleanName.replace(/^\.+/, '').replace(/\.$/, '').trim();
}

/**
 * Generate unique filename with random suffix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const name = path.basename(originalFilename, ext);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  return `${name}_${randomSuffix}${ext}`;
}

/**
 * Validate file MIME type
 */
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size <= maxSize;
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDirectory(dirPath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), dirPath);
  try {
    await fs.access(fullPath);
  } catch {
    await fs.mkdir(fullPath, { recursive: true });
  }
}

/**
 * Delete file from filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
  };
  return mimeToExt[mimeType] || '.bin';
}

/**
 * Generate public URL for uploaded file
 */
export function generateFileUrl(filePath: string, baseUrl: string = 'http://localhost:3000'): string {
  return `${baseUrl}/${filePath}`;
}

/**
 * Validate upload directory type
 */
export function isValidUploadDirectory(dir: string): boolean {
  return Object.values(UPLOAD_DIRECTORIES).includes(dir);
}

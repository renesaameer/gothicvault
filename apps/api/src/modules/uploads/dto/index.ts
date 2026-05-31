import { z } from 'zod';

// Upload directory types
export const uploadDirectorySchema = z.enum(['products', 'categories', 'brands', 'homepage', 'testimonials', 'misc']);

export type UploadDirectory = z.infer<typeof uploadDirectorySchema>;

// Upload response DTO
export const uploadResponseSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  url: z.string(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

// Multiple upload response DTO
export const multipleUploadResponseSchema = z.object({
  files: z.array(uploadResponseSchema),
  count: z.number(),
});

export type MultipleUploadResponse = z.infer<typeof multipleUploadResponseSchema>;

// Delete file request DTO
export const deleteFileRequestSchema = z.object({
  path: z.string(),
});

export type DeleteFileRequest = z.infer<typeof deleteFileRequestSchema>;

// Update file request DTO
export const updateFileRequestSchema = z.object({
  oldPath: z.string(),
});

export type UpdateFileRequest = z.infer<typeof updateFileRequestSchema>;

// Product media upload DTO
export const productMediaUploadSchema = z.object({
  productId: z.string().uuid(),
  mediaType: z.enum(['image', 'video', 'view_360']),
  altText: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export type ProductMediaUpload = z.infer<typeof productMediaUploadSchema>;

// Product media response DTO
export const productMediaResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  mediaType: z.enum(['image', 'video', 'view_360']),
  url: z.string(),
  altText: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductMediaResponse = z.infer<typeof productMediaResponseSchema>;

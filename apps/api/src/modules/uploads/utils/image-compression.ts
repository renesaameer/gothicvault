import sharp from 'sharp';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'webp',
};

export async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let image = sharp(buffer);
  
  // Get metadata
  const metadata = await image.metadata();
  
  // Resize if dimensions exceed limits
  if (metadata.width && metadata.width > (opts.maxWidth || 1920)) {
    image = image.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  
  // Convert and compress based on format
  switch (opts.format) {
    case 'jpeg':
      image = image.jpeg({ quality: opts.quality });
      break;
    case 'png':
      image = image.png({ quality: opts.quality });
      break;
    case 'webp':
    default:
      image = image.webp({ quality: opts.quality });
      break;
  }
  
  return image.toBuffer();
}

export async function compressImageForProduct(buffer: Buffer): Promise<Buffer> {
  return compressImage(buffer, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    format: 'webp',
  });
}

export async function compressImageForThumbnail(buffer: Buffer): Promise<Buffer> {
  return compressImage(buffer, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 80,
    format: 'webp',
  });
}

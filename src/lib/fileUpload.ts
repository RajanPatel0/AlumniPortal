import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

function getSubfolder(folder: string): string {
  switch (folder) {
    case 'alumni_avatars':
      return 'avatars';
    case 'event_covers':
      return 'events';
    case 'startup_logos':
      return 'startups';
    case 'id_proofs':
    case 'id-proofs':
      return 'id-proofs';
    case 'album_images':
    case 'albums':
      return 'albums';
    case 'admin_posts':
    case 'alumni_posts':
    case 'posts':
      return 'posts';
    case 'landing_videos':
    case 'admin_videos':
    case 'videos':
      return 'videos';
    default:
      return 'albums';
  }
}

function getTargetResolution(subfolder: string): number {
  const RESOLUTION_MAP: Record<string, number> = {
    'avatars': 400,     // Profile photos
    'startups': 400,    // Startup logos / Brand graphics
    'events': 1200,     // Event covers
    'id-proofs': 1200,  // ID proofs
    'albums': 1200,     // Photo albums
    'posts': 1200,      // Feed posts
  };
  return RESOLUTION_MAP[subfolder] || 1200;
}

export async function uploadFile(
  file: File,
  folder: string = 'alumni_portal'
): Promise<UploadResult> {
  const subfolder = getSubfolder(folder);
  const targetDir = path.join(UPLOAD_DIR, subfolder);

  // Ensure upload directory exists
  await fs.mkdir(targetDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // Verify the actual file type using magic numbers (file-type) via dynamic import for ESM compatibility
  const { fileTypeFromBuffer } = await import('file-type');
  const detectedType = await fileTypeFromBuffer(buffer);
  const mimeType = detectedType ? detectedType.mime : file.type;
  
  // Set file extension. If it's an image, we force it to .webp since we will process/convert it.
  const isImage = mimeType.startsWith('image/');
  const fileExt = isImage 
    ? '.webp' 
    : (detectedType ? `.${detectedType.ext}` : (path.extname(file.name).toLowerCase() || '.jpg'));

  // Validation
  if (subfolder === 'videos') {
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only video files (MP4, WebM, OGG, MOV) are allowed.');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Video files must be less than 50MB.');
    }
  } else if (subfolder === 'id-proofs') {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only image files (JPG, PNG, WebP, HEIC) and PDF documents are allowed for ID proof.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('ID proof document must be less than 10MB.');
    }
  } else {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only image files (JPG, PNG, WebP, HEIC) are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image files must be less than 5MB.');
    }
  }

  const filename = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(targetDir, filename);

  // Resize and convert images to WebP (Always re-encode for security sanitization)
  if (isImage) {
    try {
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;
      
      const targetSize = getTargetResolution(subfolder);

      buffer = await sharp(buffer)
        .resize({
          width: targetSize,
          height: targetSize,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ 
          quality: 75, 
          effort: 4, 
          lossless: false 
        })
        .toBuffer();
    } catch (err) {
      console.error('[Sharp processing failed]', err);
      throw new Error('Invalid or corrupted image file, or the image processor module failed to load.');
    }
  }

  // Save to disk
  await fs.writeFile(filePath, buffer);

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const relativeUrl = `${BASE_PATH}/uploads/${subfolder}/${filename}`;

  return {
    secure_url: relativeUrl,
    public_id: relativeUrl,
  };
}

export async function deleteFile(relativeUrl: string | null | undefined): Promise<void> {
  if (!relativeUrl) return;

  // Strip BASE_PATH prefix if present (e.g. /alumni/uploads/... → /uploads/...)
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalizedUrl = BASE_PATH && relativeUrl.startsWith(BASE_PATH)
    ? relativeUrl.slice(BASE_PATH.length)
    : relativeUrl;

  if (normalizedUrl.startsWith('/uploads/')) {
    const subPath = normalizedUrl.substring('/uploads/'.length);
    const filePath = path.join(UPLOAD_DIR, subPath);

    try {
      await fs.unlink(filePath);
      console.log(`Successfully deleted file from disk: ${filePath}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete file from disk: ${filePath}`, err);
      }
    }
  }
}

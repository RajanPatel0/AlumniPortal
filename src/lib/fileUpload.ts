import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';

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

  const fileExt = path.extname(file.name).toLowerCase() || '.jpg';
  const mimeType = file.type;

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
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only image files (JPG, PNG, WebP) and PDF documents are allowed for ID proof.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('ID proof document must be less than 10MB.');
    }
  } else {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error('Only image files (JPG, PNG, WebP) are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image files must be less than 5MB.');
    }
  }

  const filename = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(targetDir, filename);

  // Resize and compress images
  if (mimeType.startsWith('image/')) {
    try {
      let sharpInstance = sharp(buffer);
      sharpInstance = sharpInstance.resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      });

      if (fileExt === '.jpg' || fileExt === '.jpeg') {
        buffer = await sharpInstance.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      } else if (fileExt === '.png') {
        buffer = await sharpInstance.png({ quality: 80 }).toBuffer();
      } else if (fileExt === '.webp') {
        buffer = await sharpInstance.webp({ quality: 80 }).toBuffer();
      } else {
        buffer = await sharpInstance.toBuffer();
      }
    } catch (err) {
      console.error('[Sharp processing failed, falling back to original buffer]', err);
    }
  }

  // Save to disk
  await fs.writeFile(filePath, buffer);

  const relativeUrl = `/uploads/${subfolder}/${filename}`;

  return {
    secure_url: relativeUrl,
    public_id: relativeUrl,
  };
}

export async function deleteFile(relativeUrl: string | null | undefined): Promise<void> {
  if (!relativeUrl) return;

  if (relativeUrl.startsWith('/uploads/')) {
    const subPath = relativeUrl.substring('/uploads/'.length);
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

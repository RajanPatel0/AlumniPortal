import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathArray = resolvedParams.path;
    
    const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(UPLOAD_DIR, ...filePathArray);

    // Prevent directory traversal
    const relative = path.relative(UPLOAD_DIR, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const contentType = mime.lookup(fullPath) || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return new NextResponse('Not Found', { status: 404 });
      }
      throw err;
    }
  } catch (error) {
    console.error('[SERVE_FILE_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

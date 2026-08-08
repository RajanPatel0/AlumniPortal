import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { uploadFile, deleteFile } from '@/lib/fileUpload';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Delete old avatar from disk if exists
    const currentAlumni = await prisma.alumni.findUnique({
      where: { id: alumni.id },
      select: { avatarUrl: true },
    });
    if (currentAlumni?.avatarUrl) {
      deleteFile(currentAlumni.avatarUrl).catch(err => 
        console.error('Non-blocking delete of old avatar failed:', err)
      );
    }

    // Upload file locally to uploads/avatars
    const uploadResult = await uploadFile(file, 'alumni_avatars');

    // Update alumni profile record
    const updated = await prisma.alumni.update({
      where: { id: alumni.id },
      data: { avatarUrl: uploadResult.secure_url },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updated.avatarUrl,
    });
  } catch (error: any) {
    console.error('[UPLOAD_AVATAR_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

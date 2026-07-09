import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { uploadFile } from '@/lib/fileUpload';

export async function POST(req: NextRequest) {
  try {
    // Accept requests from both alumni and staff
    const alumni = await getCurrentAlumni();
    const staff = !alumni ? await getAuthenticatedStaff() : null;

    if (!alumni && !staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'alumni_portal';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Save file locally (validation and processing handled inside uploadFile)
    const result = await uploadFile(file, folder);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('[UPLOAD_IMAGE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

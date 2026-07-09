import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, batchYear, branch, college, course, currentRole, currentCompany, city, phone } = body;

    const updated = await prisma.alumni.update({
      where: { id: alumni.id },
      data: {
        name,
        batchYear: batchYear ? Number(batchYear) : undefined,
        branch,
        college,
        course,
        currentRole,
        currentCompany,
        city,
        phone,
      },
    });

    // Sync with WorkExperience table
    const currentExperiences = await prisma.workExperience.findMany({
      where: { alumniId: alumni.id, isCurrent: true },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (currentRole || currentCompany) {
      if (currentExperiences.length > 0) {
        // Update the latest active one
        await prisma.workExperience.update({
          where: { id: currentExperiences[0].id },
          data: {
            title: currentRole || 'Not Specified',
            company: currentCompany || 'Not Specified',
            location: city || null,
          }
        });
      } else {
        // Create a new active one
        await prisma.workExperience.create({
          data: {
            alumniId: alumni.id,
            title: currentRole || 'Not Specified',
            company: currentCompany || 'Not Specified',
            location: city || null,
            startDate: new Date(),
            isCurrent: true,
          }
        });
      }
    } else {
      // Both currentRole and currentCompany are empty.
      // If there are current experiences, set them to isCurrent = false
      if (currentExperiences.length > 0) {
        await prisma.workExperience.updateMany({
          where: { alumniId: alumni.id, isCurrent: true },
          data: {
            isCurrent: false,
            endDate: new Date(),
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        batchYear: updated.batchYear,
        branch: updated.branch,
        college: updated.college,
        course: updated.course,
        currentRole: updated.currentRole,
        currentCompany: updated.currentCompany,
        city: updated.city,
        avatarUrl: updated.avatarUrl,
        phone: updated.phone,
      },
    });
  } catch (error: any) {
    console.error('[UPDATE_PROFILE_ERROR]', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

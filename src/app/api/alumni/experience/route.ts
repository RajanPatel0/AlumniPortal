import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { company, title, location, startDate, endDate, isCurrent, description } = body;

    if (!company || !title || !startDate) {
      return NextResponse.json({ error: 'Company, title, and start date are required' }, { status: 400 });
    }

    const exp = await prisma.workExperience.create({
      data: {
        alumniId: alumni.id,
        company,
        title,
        location: location || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: !!isCurrent,
        description: description || null,
      },
    });

    if (exp.isCurrent) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          currentRole: title,
          currentCompany: company,
          city: location || undefined,
        },
      });
    }

    return NextResponse.json({ success: true, experience: exp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create experience' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, company, title, location, startDate, endDate, isCurrent, description } = body;

    if (!id || !company || !title || !startDate) {
      return NextResponse.json({ error: 'ID, company, title, and start date are required' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.workExperience.findFirst({ where: { id, alumniId: alumni.id } });
    if (!existing) return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });

    const exp = await prisma.workExperience.update({
      where: { id },
      data: {
        company,
        title,
        location: location || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: !!isCurrent,
        description: description || null,
      },
    });

    // Update Alumni table professional details based on current experiences status
    const currentExps = await prisma.workExperience.findMany({
      where: { alumniId: alumni.id, isCurrent: true },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (currentExps.length > 0) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          currentRole: currentExps[0].title,
          currentCompany: currentExps[0].company,
          city: currentExps[0].location || undefined,
        },
      });
    } else {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          currentRole: null,
          currentCompany: null,
        },
      });
    }

    return NextResponse.json({ success: true, experience: exp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update experience' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Check ownership
    const existing = await prisma.workExperience.findFirst({ where: { id, alumniId: alumni.id } });
    if (!existing) return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });

    await prisma.workExperience.delete({ where: { id } });

    // Update Alumni table professional details
    const currentExps = await prisma.workExperience.findMany({
      where: { alumniId: alumni.id, isCurrent: true },
      orderBy: [
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (currentExps.length > 0) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          currentRole: currentExps[0].title,
          currentCompany: currentExps[0].company,
          city: currentExps[0].location || undefined,
        },
      });
    } else {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          currentRole: null,
          currentCompany: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete experience' }, { status: 500 });
  }
}

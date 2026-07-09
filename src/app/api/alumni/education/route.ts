import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { school, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = body;

    if (!school || !degree || !startDate) {
      return NextResponse.json({ error: 'School, degree, and start date are required' }, { status: 400 });
    }

    const edu = await prisma.education.create({
      data: {
        alumniId: alumni.id,
        school,
        degree,
        fieldOfStudy: fieldOfStudy || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: !!isCurrent,
        description: description || null,
      },
    });
    return NextResponse.json({ success: true, education: edu });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create education' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, school, degree, fieldOfStudy, startDate, endDate, isCurrent, description } = body;

    if (!id || !school || !degree || !startDate) {
      return NextResponse.json({ error: 'ID, school, degree, and start date are required' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.education.findFirst({ where: { id, alumniId: alumni.id } });
    if (!existing) return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });

    const edu = await prisma.education.update({
      where: { id },
      data: {
        school,
        degree,
        fieldOfStudy: fieldOfStudy || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: !!isCurrent,
        description: description || null,
      },
    });
    return NextResponse.json({ success: true, education: edu });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update education' }, { status: 500 });
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
    const existing = await prisma.education.findFirst({ where: { id, alumniId: alumni.id } });
    if (!existing) return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });

    await prisma.education.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete education' }, { status: 500 });
  }
}

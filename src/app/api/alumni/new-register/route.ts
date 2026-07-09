import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      enrollmentNo,
      batchYear,
      branch,
      college,
      course,
      phone,
      campusId,
      authProvider,
      providerId,
      passwordHash,
      currentRole,
      currentCompany,
    } = body;

    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!name?.trim() || !normalizedEmail || !batchYear || !branch?.trim() || !college?.trim() || !course?.trim()) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    if (!campusId) {
      return NextResponse.json({ error: 'Campus selection is required' }, { status: 400 });
    }

    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) {
      return NextResponse.json({ error: 'Invalid campus selected' }, { status: 400 });
    }

    if (authProvider === 'MANUAL' && !passwordHash) {
      return NextResponse.json({ error: 'Password is required for manual registration' }, { status: 400 });
    }

    const existingAlumni = await prisma.alumni.findUnique({ where: { email: normalizedEmail } });
    if (existingAlumni) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.registrationRequest.findUnique({ where: { email: normalizedEmail } });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Your registration request is already pending admin review.' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'Your previous request was rejected. Please contact support.' },
          { status: 403 }
        );
      }
    }

    const newRequest = await prisma.registrationRequest.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        enrollmentNo: enrollmentNo?.trim() || null,
        batchYear: Number(batchYear),
        branch: branch.trim(),
        college: college.trim(),
        course: course.trim(),
        phone: phone?.trim() || null,
        campusId,
        authProvider,
        providerId: providerId || null,
        passwordHash: passwordHash || null,
        currentRole: currentRole?.trim() || null,
        currentCompany: currentCompany?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: 'Registration request submitted successfully.', requestId: newRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('SELF_REGISTER_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

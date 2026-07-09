import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing token' }, { status: 400 });
  }

  const alumni = await prisma.alumni.findFirst({
    where: {
      inviteToken: token,
      inviteStatus: { in: ['PENDING', 'INVITED'] },
      isRegistered: false,
    },
    select: {
      id: true,
      name: true,
      batchYear: true,
      branch: true,
      college: true,
      course: true,
      email: true,
      originalInvitedEmail: true,
      campus: { select: { id: true, name: true } },
    },
  });

  if (!alumni) {
    const alreadyRegistered = await prisma.alumni.findFirst({
      where: { inviteToken: token, isRegistered: true },
      select: { id: true },
    });
    if (alreadyRegistered) {
      return NextResponse.json(
        { valid: false, error: 'This invitation has already been used. Please sign in with your credentials.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    alumni: {
      id: alumni.id,
      name: alumni.name,
      batchYear: alumni.batchYear,
      branch: alumni.branch,
      college: alumni.college,
      course: alumni.course,
      email: alumni.email,
      campus: alumni.campus,
    },
  });
}

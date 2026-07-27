import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { StaffRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const options = await prisma.academicOption.findMany({
      orderBy: [{ type: 'asc' }, { value: 'asc' }],
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('[ADMIN_ACADEMIC_OPTIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type, value } = body;

    if (!type || (type !== 'BRANCH' && type !== 'COURSE') || !value?.trim()) {
      return NextResponse.json(
        { error: 'Invalid parameters. Require type ("BRANCH" | "COURSE") and non-empty value.' },
        { status: 400 }
      );
    }

    const trimmedValue = value.trim();

    // Check if already exists
    const existing = await prisma.academicOption.findFirst({
      where: {
        type,
        value: { equals: trimmedValue },
      },
    });

    let option;
    if (existing) {
      option = await prisma.academicOption.update({
        where: { id: existing.id },
        data: { isActive: true, value: trimmedValue },
      });
    } else {
      option = await prisma.academicOption.create({
        data: {
          type,
          value: trimmedValue,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      message: `${type} "${trimmedValue}" added to canonical list successfully.`,
      option,
    });
  } catch (error) {
    console.error('[ADMIN_ACADEMIC_OPTIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== StaffRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, isActive, value } = body;

    if (!id) {
      return NextResponse.json({ error: 'Option id required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof value === 'string' && value.trim()) data.value = value.trim();

    const option = await prisma.academicOption.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: `Option updated successfully.`,
      option,
    });
  } catch (error) {
    console.error('[ADMIN_ACADEMIC_OPTIONS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

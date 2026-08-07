import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
    });
    return staff;
  } catch {
    return null;
  }
}

// GET: Fetch support tickets
export async function GET(request: Request) {
  const staff = await checkAdminAuth();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('q')?.trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { ticketNo: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const [tickets, totalCount, pendingCount, inProgressCount, resolvedCount] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'PENDING' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    ]);

    return NextResponse.json({
      tickets,
      counts: {
        total: totalCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN_SUPPORT_TICKETS_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// PATCH: Update ticket status and admin notes
export async function PATCH(request: Request) {
  const staff = await checkAdminAuth();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticketId, status, adminNotes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: 'Support ticket updated successfully',
    });
  } catch (error: any) {
    console.error('[ADMIN_SUPPORT_TICKETS_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}

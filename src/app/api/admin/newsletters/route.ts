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

// GET: Fetch all newsletter subscribers with search & sorting
export async function GET(request: Request) {
  const staff = await checkAdminAuth();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';

    const whereClause = search
      ? { email: { contains: search } }
      : {};

    const [subscribers, totalCount] = await Promise.all([
      prisma.newsletter.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.newsletter.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      subscribers,
      totalCount,
    });
  } catch (error: any) {
    console.error('[ADMIN_NEWSLETTER_GET_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch newsletter subscribers' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a newsletter subscriber
export async function DELETE(request: Request) {
  const staff = await checkAdminAuth();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscriber removed successfully',
    });
  } catch (error: any) {
    console.error('[ADMIN_NEWSLETTER_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}

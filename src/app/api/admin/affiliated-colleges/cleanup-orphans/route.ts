import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!staff || staff.role !== 'ADMIN') return null;
    return staff;
  } catch {
    return null;
  }
}

// POST: Delete all AffiliatedCollege rows with 0 referencing alumni and 0 referencing registration requests
export async function POST(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const colleges = await prisma.affiliatedCollege.findMany({
      include: {
        _count: {
          select: {
            alumni: true,
            registrationRequests: true,
          },
        },
      },
    });

    const orphanIds = colleges
      .filter((col) => col._count.alumni === 0 && col._count.registrationRequests === 0)
      .map((col) => col.id);

    if (orphanIds.length === 0) {
      return NextResponse.json({
        message: 'No orphaned affiliated college entries found.',
        deletedCount: 0,
      });
    }

    const deleteRes = await prisma.affiliatedCollege.deleteMany({
      where: { id: { in: orphanIds } },
    });

    return NextResponse.json({
      message: `Successfully cleaned up ${deleteRes.count} orphaned affiliated college entries.`,
      deletedCount: deleteRes.count,
    });
  } catch (error: any) {
    console.error('[CLEANUP_ORPHANED_AFFILIATED_COLLEGES]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

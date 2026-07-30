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

export async function GET(req: NextRequest) {
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await prisma.normalizationMergeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const parsedLogs = logs.map((log) => {
      let fromValues: string[] = [];
      let affectedIds: string[] = [];
      try {
        fromValues = JSON.parse(log.fromValues);
      } catch {
        fromValues = [log.fromValues];
      }
      try {
        affectedIds = JSON.parse(log.affectedIds);
      } catch {
        affectedIds = [];
      }

      return {
        id: log.id,
        field: log.field,
        fromValues,
        toValue: log.toValue,
        affectedCount: affectedIds.length,
        affectedIds,
        performedBy: log.performedBy,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({ logs: parsedLogs });
  } catch (error: any) {
    console.error('[GET_MERGE_LOGS]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

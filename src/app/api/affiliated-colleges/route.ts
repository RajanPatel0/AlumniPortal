import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const colleges = await prisma.affiliatedCollege.findMany({
      where: { isApproved: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(colleges);
  } catch (error) {
    console.error('[GET_AFFILIATED_COLLEGES]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const campuses = await prisma.campus.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(campuses);
}
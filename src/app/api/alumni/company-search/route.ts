import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCompanyName } from '@/lib/company-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const qLower = q.toLowerCase();

    // Query registered alumni and work experiences
    const [alumniRecords, expRecords] = await Promise.all([
      prisma.alumni.findMany({
        where: { isRegistered: true },
        select: { id: true, currentCompany: true },
      }),
      prisma.workExperience.findMany({
        where: { alumni: { isRegistered: true } },
        select: { alumniId: true, company: true },
      }),
    ]);

    // Map company lowercased key -> { display, alumniIds: Set<string> }
    const companyMap = new Map<string, { display: string; alumniIds: Set<string> }>();

    const addRecord = (alumniId: string, rawCompany?: string | null) => {
      if (!rawCompany || !rawCompany.trim()) return;
      const normalized = normalizeCompanyName(rawCompany);
      const lower = normalized.toLowerCase();

      // Check if matches query
      if (!lower.includes(qLower)) return;

      const existing = companyMap.get(lower);
      if (existing) {
        existing.alumniIds.add(alumniId);
      } else {
        companyMap.set(lower, {
          display: normalized,
          alumniIds: new Set([alumniId]),
        });
      }
    };

    alumniRecords.forEach((a) => addRecord(a.id, a.currentCompany));
    expRecords.forEach((e) => addRecord(e.alumniId, e.company));

    const suggestions = Array.from(companyMap.values())
      .map((item) => ({
        value: item.display,
        count: item.alumniIds.size,
      }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, 10);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[COMPANY_SEARCH_ERROR]', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Query distinct companies from Alumni currentCompany and WorkExperience company
    const [alumniCompanies, expCompanies] = await Promise.all([
      prisma.alumni.findMany({
        where: {
          currentCompany: {
            contains: q,
          },
        },
        select: { currentCompany: true },
      }),
      prisma.workExperience.findMany({
        where: {
          company: {
            contains: q,
          },
        },
        select: { company: true },
      }),
    ]);

    // Aggregate and count occurrences case-insensitively while preserving clean display casing
    const companyMap = new Map<string, { display: string; count: number }>();

    const addCompany = (rawName: string | null | undefined) => {
      if (!rawName) return;
      const trimmed = rawName.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();

      // Filter to ensure partial match (case-insensitive)
      if (!lower.includes(q.toLowerCase())) return;

      const existing = companyMap.get(lower);
      if (existing) {
        existing.count += 1;
      } else {
        companyMap.set(lower, { display: trimmed, count: 1 });
      }
    };

    alumniCompanies.forEach((a) => addCompany(a.currentCompany));
    expCompanies.forEach((e) => addCompany(e.company));

    // Convert map to array, sort by frequency count descending, then alphabetically
    const suggestions = Array.from(companyMap.values())
      .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display))
      .slice(0, 10)
      .map((item) => ({
        value: item.display,
        count: item.count,
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[COMPANY_SEARCH_ERROR]', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}

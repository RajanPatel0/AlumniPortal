import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;
  const staffToken = cookieStore.get('accessToken')?.value;

  if (!alumniToken && !staffToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let authorized = false;
  if (alumniToken) {
    try { verifyAlumniAccessToken(alumniToken); authorized = true; } catch {}
  }
  if (!authorized && staffToken) {
    try { verifyAccessToken(staffToken); authorized = true; } catch {}
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');

  // Accept EITHER the new `optionId` (preferred, safe) or the legacy `branch`
  // text param (kept for backward-compat with the inline admin panel expand).
  const optionId = searchParams.get('optionId');
  const legacyBranch = searchParams.get('branch');

  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

  if (!yearParam || (!optionId && !legacyBranch)) {
    return NextResponse.json(
      { error: 'year and either optionId or branch query params required' },
      { status: 400 }
    );
  }

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  try {
    // ── Resolve the canonical branch value and its known variants ────────────
    let canonicalValue: string | null = null;
    let branchFilter: string[];

    if (optionId) {
      // Primary path: look up by AcademicOption.id (clean URL, no special chars)
      const option = await prisma.academicOption.findUnique({
        where: { id: optionId },
        select: { value: true, type: true },
      });

      if (!option || option.type !== 'BRANCH') {
        return NextResponse.json({ error: 'Branch option not found' }, { status: 404 });
      }

      canonicalValue = option.value;

      // Build a set of known spelling variants to match against during the
      // data-cleanup transition period, so alumni whose branch hasn't been
      // normalised yet still appear on the correct page.
      branchFilter = buildVariants(canonicalValue);
    } else {
      // Legacy path: branch text sent directly (admin inline panel)
      canonicalValue = legacyBranch!;
      branchFilter = buildVariants(canonicalValue);
    }

    const searchFilter = search.trim()
      ? {
          OR: [
            { name: { contains: search } },
            { currentRole: { contains: search } },
            { currentCompany: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {};

    const where = {
      batchYear: year,
      branch: { in: branchFilter },
      ...searchFilter,
    };

    const [total, alumniList] = await Promise.all([
      prisma.alumni.count({ where }),
      prisma.alumni.findMany({
        where,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          currentRole: true,
          currentCompany: true,
          city: true,
          branch: true,
          batchYear: true,
          isRegistered: true,
          college: true,
          course: true,
        },
        orderBy: [{ name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      year,
      branch: canonicalValue,   // canonical display label for the UI
      optionId: optionId ?? null,
      alumni: alumniList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[yearbook/alumni]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildVariants
//
// Returns a list of known spelling variants for a canonical branch value so
// that the query matches alumni rows that haven't been normalised yet.
//
// The list is additive: if we don't recognise the canonical value, we fall
// back to just an exact match (still better than nothing).
// ─────────────────────────────────────────────────────────────────────────────
function buildVariants(canonical: string): string[] {
  const variants: Record<string, string[]> = {
    'Computer Science and Engineering': [
      'Computer Science and Engineering',
      'Computer Science & Engineering',
      'Computer Science Engineering',
      'CSE',
      'Comp. Sc. & Engg.',
      'Computer Science',
      'CS Engineering',
    ],
    'Electronics and Communication Engineering': [
      'Electronics and Communication Engineering',
      'Electronics & Communication Engineering',
      'Electronics Communication Engineering',
      'ECE',
      'E&CE',
    ],
    'Mechanical Engineering': [
      'Mechanical Engineering',
      'Mechanical Engg.',
      'ME',
      'Mech. Engg.',
    ],
    'Civil Engineering': [
      'Civil Engineering',
      'Civil Engg.',
      'CE',
    ],
    'Electrical Engineering': [
      'Electrical Engineering',
      'Electrical Engg.',
      'EE',
      'Elect. Engg.',
    ],
    'Computer Applications': [
      'Computer Applications',
      'Comp. Applications',
      'Computer Application',
    ],
    'Business Administration': [
      'Business Administration',
      'Business Admin',
      'MBA',
      'BBA',
    ],
    'Artificial Intelligence and Machine Learning': [
      'Artificial Intelligence and Machine Learning',
      'AI & ML',
      'AI and ML',
      'AIML',
      'AI/ML',
    ],
    'Hotel Management': [
      'Hotel Management',
      'Hotel Mgmt.',
      'Hospitality Management',
    ],
    'Information Technology': [
      'Information Technology',
      'IT',
    ],
    'Chemistry': ['Chemistry'],
    'Mathematics': ['Mathematics', 'Maths'],
    'Management Studies': ['Management Studies'],
  };

  return variants[canonical] ?? [canonical];
}

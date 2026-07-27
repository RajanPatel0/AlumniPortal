import { prisma } from '@/lib/prisma';

/**
 * Returns true if the course string resolves to BCA or MCA (canonical or variant).
 */
export function isBcaOrMca(course: string | null | undefined): boolean {
  if (!course) return false;
  const cleaned = course.trim().toLowerCase().replace(/[^a-z]/g, '');
  return cleaned === 'bca' || cleaned === 'mca';
}

/**
 * PART A: Deterministic auto-correction rule:
 * If course resolves to BCA or MCA, branch is ALWAYS "Computer Applications".
 */
export function getAutoCorrectedBranch(
  submittedBranch: string,
  submittedCourse: string | null | undefined
): string {
  if (isBcaOrMca(submittedCourse)) {
    return 'Computer Applications';
  }
  return (submittedBranch || '').trim();
}

/**
 * Ensures a branch or course value exists in the AcademicOption table as active.
 * Used when an admin approves a request, resolves a review queue item, or merges variants.
 */
export async function ensureAcademicOptionActive(
  type: 'BRANCH' | 'COURSE',
  value: string | null | undefined
): Promise<void> {
  const trimmed = (value || '').trim();
  if (!trimmed) return;

  // Case-insensitive check: if an active option exists with different casing, don't duplicate
  const existing = await prisma.academicOption.findFirst({
    where: {
      type,
      value: { equals: trimmed },
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.academicOption.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
  } else {
    await prisma.academicOption.create({
      data: {
        type,
        value: trimmed,
        isActive: true,
      },
    });
  }
}

/**
 * Checks whether submitted branch/course values match active canonical options.
 */
export async function checkAcademicNeedsReview(
  branch: string | null | undefined,
  course: string | null | undefined
): Promise<boolean> {
  const activeOptions = await prisma.academicOption.findMany({
    where: { isActive: true },
    select: { type: true, value: true },
  });

  const validBranches = new Set(
    activeOptions
      .filter((o) => o.type === 'BRANCH')
      .map((o) => o.value.trim().toLowerCase())
  );
  const validCourses = new Set(
    activeOptions
      .filter((o) => o.type === 'COURSE')
      .map((o) => o.value.trim().toLowerCase())
  );

  const trimmedBranch = (branch || '').trim().toLowerCase();
  const trimmedCourse = (course || '').trim().toLowerCase();

  const branchValid = !trimmedBranch || validBranches.has(trimmedBranch);
  const courseValid = !trimmedCourse || validCourses.has(trimmedCourse);

  return !branchValid || !courseValid;
}
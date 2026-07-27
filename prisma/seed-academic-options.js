/**
 * seed-academic-options.js
 *
 * Populates the AcademicOption table with canonical branch and course values.
 * Run once after `prisma migrate deploy` on a fresh environment:
 *
 *   node prisma/seed-academic-options.js
 *   — OR via npm —
 *   npm run seed-academic
 *   — OR via prisma —
 *   npx prisma db seed
 *
 * Safe to run multiple times: all upsert operations are idempotent.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL VALUES (based on live production export — 1,843 real alumni rows)
// Multi-word branch names use "and" (not "&") to remain URL-safe.
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_COURSES = [
  'B.Tech',
  'BCA',
  'MBA',
  'BBA',
  'BHMCT',
  'B.Sc. (Hons.)',
  'MCA',
  'M.Tech',
  'Ph.D.',
];

const CANONICAL_BRANCHES = [
  'Computer Science and Engineering',
  'Business Administration',
  'Computer Applications',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Artificial Intelligence and Machine Learning',
  'Hotel Management',
  'Chemistry',
  'Mathematics',
];

// Stale / superseded entries — not present in production data.
// Set isActive=false so existing DB references are not hard-deleted.
const RETIRED_COURSES = ['B.Sc', 'M.Sc'];
const RETIRED_BRANCHES = [
  'Information Technology',
  'Management Studies',
  // Old "&" spellings replaced by "and" spellings above
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
];

async function seedAcademicOptions() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' IKGPTU Alumni — AcademicOption seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. Upsert canonical courses ────────────────────────────────────────────
  console.log('Upserting canonical COURSES:');
  for (const course of CANONICAL_COURSES) {
    await prisma.academicOption.upsert({
      where: { type_value: { type: 'COURSE', value: course } },
      update: { isActive: true },
      create: { type: 'COURSE', value: course, isActive: true },
    });
    console.log(`  ✓ COURSE: ${course}`);
  }

  // ── 2. Upsert canonical branches ───────────────────────────────────────────
  console.log('\nUpserting canonical BRANCHES:');
  for (const branch of CANONICAL_BRANCHES) {
    await prisma.academicOption.upsert({
      where: { type_value: { type: 'BRANCH', value: branch } },
      update: { isActive: true },
      create: { type: 'BRANCH', value: branch, isActive: true },
    });
    console.log(`  ✓ BRANCH: ${branch}`);
  }

  // ── 3. Retire stale entries ────────────────────────────────────────────────
  console.log('\nRetiring stale COURSE entries (isActive → false):');
  for (const course of RETIRED_COURSES) {
    const result = await prisma.academicOption.updateMany({
      where: { type: 'COURSE', value: course },
      data: { isActive: false },
    });
    console.log(
      result.count > 0
        ? `  ↓ Retired COURSE: "${course}"`
        : `  – Not found (already absent): "${course}"`
    );
  }

  console.log('\nRetiring stale BRANCH entries (isActive → false):');
  for (const branch of RETIRED_BRANCHES) {
    const result = await prisma.academicOption.updateMany({
      where: { type: 'BRANCH', value: branch },
      data: { isActive: false },
    });
    console.log(
      result.count > 0
        ? `  ↓ Retired BRANCH: "${branch}"`
        : `  – Not found (already absent): "${branch}"`
    );
  }

  // ── 4. Summary ─────────────────────────────────────────────────────────────
  const [activeCourses, activeBranches] = await Promise.all([
    prisma.academicOption.findMany({
      where: { type: 'COURSE', isActive: true },
      orderBy: { value: 'asc' },
    }),
    prisma.academicOption.findMany({
      where: { type: 'BRANCH', isActive: true },
      orderBy: { value: 'asc' },
    }),
  ]);

  console.log('\n── Active COURSES ──────────────────────────────────');
  activeCourses.forEach((o) => console.log(`  ${o.value}`));
  console.log('\n── Active BRANCHES ─────────────────────────────────');
  activeBranches.forEach((o) => console.log(`  ${o.value}`));
  console.log(
    `\n✅ Seed complete. ${activeCourses.length} active courses, ${activeBranches.length} active branches.\n`
  );
}

seedAcademicOptions()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
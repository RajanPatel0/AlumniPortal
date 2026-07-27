import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL VALUES — 
// All multi-word branch names use "and" (not "&") to remain URL-safe.
// ─────────────────────────────────────────────────────────────────────────────

export const CANONICAL_COURSES = [
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

export const CANONICAL_BRANCHES = [
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

const RETIRED_COURSES = ['B.Sc', 'M.Sc'];
const RETIRED_BRANCHES = [
  'Information Technology',
  'Management Studies',
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
];

async function seedAcademicOptions() {
  console.log('Seeding Academic Options...\n');

  // ── 1. Upsert canonical courses ──────────────────────────────────────────
  console.log('Upserting canonical COURSES:');
  for (const course of CANONICAL_COURSES) {
    await prisma.academicOption.upsert({
      where: { type_value: { type: 'COURSE', value: course } },
      update: { isActive: true },
      create: { type: 'COURSE', value: course, isActive: true },
    });
    console.log(`  ✓ COURSE: ${course}`);
  }

  // ── 2. Upsert canonical branches ─────────────────────────────────────────
  console.log('\nUpserting canonical BRANCHES:');
  for (const branch of CANONICAL_BRANCHES) {
    await prisma.academicOption.upsert({
      where: { type_value: { type: 'BRANCH', value: branch } },
      update: { isActive: true },
      create: { type: 'BRANCH', value: branch, isActive: true },
    });
    console.log(`  ✓ BRANCH: ${branch}`);
  }

  // ── 3. Retire stale / superseded entries ─────────────────────────────────
  console.log('\nRetiring stale COURSE entries (isActive → false):');
  for (const course of RETIRED_COURSES) {
    const result = await prisma.academicOption.updateMany({
      where: { type: 'COURSE', value: course },
      data: { isActive: false },
    });
    if (result.count > 0) {
      console.log(`  ↓ Retired COURSE: "${course}"`);
    } else {
      console.log(`  – Not found (already absent): "${course}"`);
    }
  }

  console.log('\nRetiring stale BRANCH entries (isActive → false):');
  for (const branch of RETIRED_BRANCHES) {
    const result = await prisma.academicOption.updateMany({
      where: { type: 'BRANCH', value: branch },
      data: { isActive: false },
    });
    if (result.count > 0) {
      console.log(`  ↓ Retired BRANCH: "${branch}"`);
    } else {
      console.log(`  – Not found (already absent): "${branch}"`);
    }
  }

  // ── 4. Final summary ─────────────────────────────────────────────────────
  const activeCourses = await prisma.academicOption.findMany({
    where: { type: 'COURSE', isActive: true },
    orderBy: { value: 'asc' },
  });
  const activeBranches = await prisma.academicOption.findMany({
    where: { type: 'BRANCH', isActive: true },
    orderBy: { value: 'asc' },
  });

  console.log('\n── Active COURSES ──────────────────────────────────');
  activeCourses.forEach((o) => console.log(`  ${o.value}`));
  console.log('\n── Active BRANCHES ─────────────────────────────────');
  activeBranches.forEach((o) => console.log(`  ${o.value}`));
  console.log(
    `\n✅ Seed complete. ${activeCourses.length} active courses, ${activeBranches.length} active branches.`
  );
}

seedAcademicOptions()
  .catch((err) => {
    console.error('Error seeding academic options:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

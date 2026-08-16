import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { processCampaignBatch } from '../src/lib/notifications/processCampaignBatch';

const prisma = new PrismaClient();

async function runLoadTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 RUNNING 10,000 ALUMNI CAMPAIGN LOAD & CRASH TEST');
  console.log('═══════════════════════════════════════════════════════');

  // 1. Check existing alumni count
  const existingCount = await prisma.alumni.count({ where: { isRegistered: true, isActive: true } });
  console.log(`[LoadTest] Existing active registered alumni count: ${existingCount}`);

  const TARGET_DUMMY_COUNT = 10000;
  const needed = TARGET_DUMMY_COUNT - existingCount;

  if (needed > 0) {
    const campus = await prisma.campus.findFirst();
    const campusId = campus?.id || 'main';
    console.log(`[LoadTest] Seeding ${needed} temporary dummy alumni records using campusId ${campusId}...`);
    const dummyBatchSize = 1000;
    for (let i = 0; i < needed; i += dummyBatchSize) {
      const countToCreate = Math.min(dummyBatchSize, needed - i);
      const dummyData = Array.from({ length: countToCreate }).map((_, idx) => {
        const num = i + idx + 1;
        return {
          email: `loadtest_dummy_${Date.now()}_${num}@ikgptu.ac.in`,
          name: `Test Alumnus ${num}`,
          campusId,
          batchYear: 2024,
          branch: 'Computer Science and Engineering',
          college: 'IKGPTU Main Campus',
          course: 'B.Tech',
          isRegistered: true,
          isActive: true,
        };
      });
      await prisma.alumni.createMany({ data: dummyData });
      console.log(`[LoadTest] Seeded ${i + countToCreate} / ${needed} dummy alumni...`);
    }
  }

  const totalAlumni = await prisma.alumni.count({ where: { isRegistered: true, isActive: true } });
  console.log(`[LoadTest] Total active alumni ready for load test: ${totalAlumni}`);

  // 2. Create test INAPP_ONLY campaign
  const campaign = await prisma.notificationCampaign.create({
    data: {
      channel: 'INAPP_ONLY',
      type: 'POST_CREATED',
      title: 'Load Test Notification Title',
      body: 'This is a load test campaign body to measure worker fan-out speed.',
      url: '/alumni/feed?loadtest=true',
      filter: {},
      status: 'PENDING',
      totalTargets: totalAlumni,
    },
  });
  console.log(`[LoadTest] Created INAPP_ONLY campaign id: ${campaign.id}`);

  // 3. Process batches and measure duration
  const startTime = Date.now();
  let done = false;
  let batchCount = 0;
  let totalNotificationsCreated = 0;

  console.log('[LoadTest] Starting batch fan-out execution...');

  // Phase A: Process half of the batches, then simulate a worker crash & restart!
  const SIMULATED_CRASH_AFTER_BATCHES = Math.floor(Math.ceil(totalAlumni / 500) / 2);

  while (!done) {
    batchCount++;
    const batchStart = Date.now();
    const result = await processCampaignBatch(prisma, campaign.id, 500);
    const batchElapsed = Date.now() - batchStart;

    totalNotificationsCreated += result.sentCount || 0;
    console.log(`[LoadTest] Batch #${batchCount} processed (${result.batchCount} alumni) in ${batchElapsed}ms.`);

    done = result.done;

    // Simulate Worker Crash & Restart mid-run
    if (batchCount === SIMULATED_CRASH_AFTER_BATCHES && !done) {
      console.log('-------------------------------------------------------');
      console.log(`💥 SIMULATING WORKER CRASH & RESTART AT BATCH #${batchCount}...`);
      console.log('Restarting worker process loop and re-evaluating cursor...');
      console.log('-------------------------------------------------------');

      // Attempt to re-run the previous batch cursor (simulating retry on crash)
      const currentCampaign = await prisma.notificationCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
      const currentCursor = currentCampaign.cursor;

      // Re-run batch manually to test @@unique([userId, campaignId]) duplicate prevention
      const retryStart = Date.now();
      const retryResult = await processCampaignBatch(prisma, campaign.id, 500);
      const retryElapsed = Date.now() - retryStart;
      console.log(`[CrashRecovery] Retry pass executed in ${retryElapsed}ms (Sent count: ${retryResult.sentCount}).`);
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🏁 LOAD TEST COMPLETE IN ${totalDuration} SECONDS`);
  console.log(`📦 Batches Processed: ${batchCount}`);
  console.log(`👥 Total Alumni Target Count: ${totalAlumni}`);
  console.log('═══════════════════════════════════════════════════════');

  // 4. Verify duplicate counts in database
  const notificationCount = await prisma.notification.count({
    where: { campaignId: campaign.id },
  });

  const distinctUsers = await prisma.notification.groupBy({
    by: ['userId'],
    where: { campaignId: campaign.id },
    _count: { userId: true },
  });

  const duplicates = distinctUsers.filter((u) => u._count.userId > 1);

  console.log(`📊 Notification Database Verification:`);
  console.log(`   - Total Notification Rows Created: ${notificationCount}`);
  console.log(`   - Distinct Alumni Count: ${distinctUsers.length}`);
  console.log(`   - Duplicate Rows Detected: ${duplicates.length}`);

  // Clean up test data
  console.log('[LoadTest] Cleaning up test campaign & dummy alumni...');
  await prisma.notification.deleteMany({ where: { campaignId: campaign.id } });
  await prisma.notificationCampaign.delete({ where: { id: campaign.id } });
  await prisma.alumni.deleteMany({ where: { email: { startsWith: 'loadtest_dummy_' } } });

  await prisma.$disconnect();

  if (duplicates.length === 0 && notificationCount === totalAlumni) {
    console.log('✅ VERIFICATION SUCCESSFUL: Zero duplicates, exact 1:1 delivery!');
  } else {
    console.error('❌ VERIFICATION FAILED: Mismatch in counts or duplicates found.');
  }
}

runLoadTest().catch((err) => {
  console.error('[LoadTest Error]', err);
  process.exit(1);
});

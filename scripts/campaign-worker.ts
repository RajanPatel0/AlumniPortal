import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { processCampaignBatch } from '../src/lib/notifications/processCampaignBatch';

// Standalone PrismaClient with dedicated pool (independent of Next.js / iisnode)
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

let isRunning = false; // Single-process concurrency guard

async function runWorkerTick() {
  if (isRunning) {
    console.log('[Worker] Previous tick still in progress. Skipping overlapping run.');
    return;
  }

  isRunning = true;
  try {
    const activeCampaigns = await prisma.notificationCampaign.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    if (activeCampaigns.length > 0) {
      console.log(`[Worker] Found ${activeCampaigns.length} active campaign(s) to process.`);
    }

    for (const campaign of activeCampaigns) {
      console.log(`[Worker] Processing campaign "${campaign.title}" (${campaign.id})...`);
      let done = false;
      let iterations = 0;
      const MAX_BATCHES_PER_TICK = 50; // Safety bound (50 * 500 = 25,000 users per tick)

      while (!done && iterations < MAX_BATCHES_PER_TICK) {
        iterations++;
        const result = await processCampaignBatch(prisma, campaign.id, 500);
        done = result.done;
      }

      if (done) {
        console.log(`[Worker] Campaign "${campaign.title}" (${campaign.id}) COMPLETED.`);
      } else {
        console.log(`[Worker] Campaign "${campaign.title}" yielded tick after ${iterations} batches. Will resume next tick.`);
      }
    }
  } catch (err) {
    console.error('[Worker] Error during worker tick:', err);
  } finally {
    isRunning = false;
  }
}

// Schedule tick every 1 minute
console.log('═══════════════════════════════════════════════════════');
console.log('🚀 Alumni Portal Notification Campaign Worker Started');
console.log('🕒 Schedule: Every minute (*/1 * * * *)');
console.log('═══════════════════════════════════════════════════════');

cron.schedule('*/1 * * * *', async () => {
  await runWorkerTick();
});

// Run immediate first tick upon service start
runWorkerTick();

// Graceful shutdown handling
const shutdown = async () => {
  console.log('[Worker] Shutting down campaign worker...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
  console.error('[Worker] Unhandled rejection in worker:', err);
});
process.on('uncaughtException', (err) => {
  console.error('[Worker] Uncaught exception in worker:', err);
});

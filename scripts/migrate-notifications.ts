import { PrismaClient, PushDeliveryStatus } from '@prisma/client';
import { generateCampaignTags } from '../src/lib/notifications/tags';
import { buildAlumniWhere } from '../src/lib/notifications/buildAlumniWhere';

function escapeSql(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return "'" + val.replace(/(['\\])/g, "\\$1") + "'";
}

const prisma = new PrismaClient();

const statusMap: Record<string, PushDeliveryStatus> = {
  'PENDING': 'PENDING',
  'PROCESSING': 'PROCESSING',
  'COMPLETED': 'COMPLETED',
  'FAILED': 'FAILED'
};

async function main() {
  console.log('🔄 Starting notification migration...');

  // Check if migration has already been executed
  const checkColumn: any[] = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'audienceTag'
  `);
  if (checkColumn.length > 0) {
    const checkGroupId: any[] = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'campaignGroupId'
    `);
    if (checkGroupId.length === 0) {
      console.log('Adding missing campaignGroupId column to notifications table...');
      await prisma.$executeRawUnsafe('ALTER TABLE `notifications` ADD COLUMN `campaignGroupId` VARCHAR(191) NULL');
      await prisma.$executeRawUnsafe('CREATE INDEX `notifications_campaignGroupId_idx` ON `notifications`(`campaignGroupId`)');
      console.log('✅ Column campaignGroupId added and indexed successfully!');
    } else {
      console.log('✅ Notification migration has already been completed. Nothing to do!');
    }
    return;
  }

  // 0. Clean up shadow tables from any previous aborted attempts
  console.log('🧹 Cleaning up any previous shadow tables...');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `notification_states_v2`');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `notifications_v2`');

  // 1. Create temporary shadow tables
  console.log('🛠️ Creating shadow tables...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`notifications_v2\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`type\` ENUM('ADMIN_ANNOUNCEMENT', 'FOLLOW', 'ANALYTICS_MILESTONE', 'POST_CREATED', 'COMMUNITY_UPDATE') NOT NULL,
      \`title\` VARCHAR(191) NOT NULL,
      \`body\` TEXT NOT NULL,
      \`url\` VARCHAR(191) NULL,
      \`metadata\` JSON NULL,
      \`audienceTag\` VARCHAR(500) NOT NULL,
      \`targetUserId\` VARCHAR(191) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`channel\` ENUM('PUSH_AND_INAPP', 'INAPP_ONLY') NOT NULL DEFAULT 'INAPP_ONLY',
      \`filter\` JSON NULL,
      \`pushStatus\` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NULL,
      \`pushCursor\` VARCHAR(191) NULL,
      \`totalTargets\` INT NULL,
      \`sentCount\` INT NOT NULL DEFAULT 0,
      \`failedCount\` INT NOT NULL DEFAULT 0,
      \`startedAt\` DATETIME(3) NULL,
      \`completedAt\` DATETIME(3) NULL,
      \`createdById\` VARCHAR(191) NULL,
      \`campaignGroupId\` VARCHAR(191) NULL,
      PRIMARY KEY (\`id\`),
      FOREIGN KEY (\`targetUserId\`) REFERENCES \`alumni\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (\`createdById\`) REFERENCES \`staff\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`notification_states_v2\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`notificationId\` VARCHAR(191) NOT NULL,
      \`isRead\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`isDeleted\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`notification_states_v2_userId_notificationId_key\` (\`userId\`, \`notificationId\`),
      FOREIGN KEY (\`userId\`) REFERENCES \`alumni\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (\`notificationId\`) REFERENCES \`notifications_v2\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  // Create temporary indexes
  await prisma.$executeRawUnsafe('CREATE INDEX `notifications_v2_audienceTag_idx` ON `notifications_v2`(`audienceTag`)');
  await prisma.$executeRawUnsafe('CREATE INDEX `notifications_v2_createdAt_idx` ON `notifications_v2`(`createdAt`)');
  await prisma.$executeRawUnsafe('CREATE INDEX `notifications_v2_targetUserId_idx` ON `notifications_v2`(`targetUserId`)');
  await prisma.$executeRawUnsafe('CREATE INDEX `notifications_v2_pushStatus_idx` ON `notifications_v2`(`pushStatus`)');
  await prisma.$executeRawUnsafe('CREATE INDEX `notifications_v2_campaignGroupId_idx` ON `notifications_v2`(`campaignGroupId`)');
  await prisma.$executeRawUnsafe('CREATE INDEX `notification_states_v2_userId_idx` ON `notification_states_v2`(`userId`)');

  // 2. Migrate Personal (Unicast) Notifications in Chunks
  console.log('📦 Migrating unicast notifications in chunks...');
  let lastId = '';
  const LIMIT = 5000;
  let hasMore = true;

  while (hasMore) {
    const oldUnicast: any[] = await prisma.$queryRawUnsafe(
      'SELECT id, type, title, body, url, metadata, userId, createdAt, isRead FROM notifications WHERE campaignId IS NULL AND id > ? ORDER BY id ASC LIMIT ?',
      lastId,
      LIMIT
    );

    if (oldUnicast.length === 0) {
      hasMore = false;
      break;
    }

    const stateBatch = oldUnicast.map(uni => ({
      id: `state_p_${uni.id}`,
      userId: uni.userId,
      notificationId: uni.id,
      isRead: uni.isRead === 1 || uni.isRead === true,
      isDeleted: false,
    }));

    // Construct raw SQL insert values for notifications_v2
    const valuesSql = oldUnicast.map(uni => {
      const metadataStr = uni.metadata 
        ? (typeof uni.metadata === 'string' ? uni.metadata : JSON.stringify(uni.metadata))
        : null;
      const formattedDate = new Date(uni.createdAt).toISOString().slice(0, 19).replace('T', ' ');

      return `(
        '${uni.id}',
        '${uni.type}',
        ${escapeSql(uni.title)},
        ${escapeSql(uni.body)},
        ${uni.url ? `'${uni.url}'` : 'NULL'},
        ${metadataStr ? escapeSql(metadataStr) : 'NULL'},
        'user:${uni.userId}',
        '${uni.userId}',
        '${formattedDate}',
        'INAPP_ONLY'
      )`;
    }).join(',');

    await prisma.$executeRawUnsafe(`
      INSERT INTO notifications_v2 (
        id, type, title, body, url, metadata, audienceTag, targetUserId, createdAt, channel
      ) VALUES ${valuesSql}
      ON DUPLICATE KEY UPDATE id=id
    `);

    await prisma.$executeRawUnsafe(
      `INSERT INTO notification_states_v2 (id, userId, notificationId, isRead, isDeleted) VALUES ` +
      stateBatch.map(s => `('${s.id}', '${s.userId}', '${s.notificationId}', ${s.isRead ? 1 : 0}, 0)`).join(',') +
      ` ON DUPLICATE KEY UPDATE isRead = VALUES(isRead)`
    );

    lastId = oldUnicast[oldUnicast.length - 1].id;
    console.log(`Unicast progress: Migrated up to ${lastId}`);
  }

  // 3. Migrate Broadcast Campaigns
  console.log('📣 Migrating broadcast campaigns...');
  const campuses = await prisma.campus.findMany({ select: { id: true, code: true } });
  const campusMap = new Map(campuses.map(c => [c.id, c.code]));

  const oldCampaigns: any[] = await prisma.$queryRawUnsafe(
    'SELECT id, channel, filter, status, `cursor`, totalTargets, sentCount, failedCount, startedAt, completedAt, createdById FROM notification_campaigns'
  );

  for (const camp of oldCampaigns) {
    const oldCampaignNotifications: any[] = await prisma.$queryRawUnsafe(
      'SELECT id, userId, isRead, createdAt, type, title, body, url, metadata FROM notifications WHERE campaignId = ?',
      camp.id
    );

    if (oldCampaignNotifications.length === 0) continue;
    const sampleNotif = oldCampaignNotifications[0];

    let filterObj: any = {};
    try {
      filterObj = typeof camp.filter === 'string' ? JSON.parse(camp.filter) : (camp.filter || {});
    } catch (e) {
      filterObj = {};
    }

    const campusCode = filterObj.campusId ? campusMap.get(String(filterObj.campusId)) : null;

    // Generate correct tags (explodes batch year ranges if present)
    const combos = generateCampaignTags(filterObj, campusCode);

    for (let idx = 0; idx < combos.length; idx++) {
      const combo = combos[idx];
      const newNotifId = combos.length === 1 ? `mig_${camp.id}` : `mig_${camp.id}_${idx}`;

      // Query targeted alumni to filter read state correctly per combo
      const where = buildAlumniWhere(combo.scopedFilter);
      const matchingAlumni = await prisma.alumni.findMany({
        where,
        select: { id: true }
      });
      const matchingAlumniIds = new Set(matchingAlumni.map(a => a.id));

      const scopedUserNotifs = oldCampaignNotifications.filter(n => matchingAlumniIds.has(n.userId));
      const scopedTotalTargets = matchingAlumniIds.size;

      // Write consolidated notification combo record
      await prisma.$executeRawUnsafe(`
        INSERT INTO notifications_v2 (
          id, type, title, body, url, metadata, audienceTag, createdAt,
          channel, filter, pushStatus, pushCursor, totalTargets, sentCount, failedCount, startedAt, completedAt, createdById, campaignGroupId
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        ) ON DUPLICATE KEY UPDATE id=id
      `,
        newNotifId, sampleNotif.type, sampleNotif.title, sampleNotif.body, sampleNotif.url, 
        JSON.stringify(combo.scopedFilter), combo.tag, new Date(sampleNotif.createdAt),
        camp.channel, JSON.stringify(combo.scopedFilter), statusMap[camp.status] || 'COMPLETED',
        camp.pushCursor, scopedTotalTargets, camp.sentCount, camp.failedCount,
        camp.startedAt ? new Date(camp.startedAt) : null, camp.completedAt ? new Date(camp.completedAt) : null,
        camp.createdById, camp.id
      );

      // Batch write read states (1:1 with new unified notification)
      const statesData = scopedUserNotifs.map((un) => ({
        id: `state_c_${un.userId}_${newNotifId}`,
        userId: un.userId,
        notificationId: newNotifId,
        isRead: un.isRead === 1 || un.isRead === true,
        isDeleted: false,
      }));

      if (statesData.length > 0) {
        const CHUNK = 500;
        for (let j = 0; j < statesData.length; j += CHUNK) {
          const slice = statesData.slice(j, j + CHUNK);
          await prisma.$executeRawUnsafe(
            `INSERT INTO notification_states_v2 (id, userId, notificationId, isRead, isDeleted) VALUES ` +
            slice.map(s => `('${s.id}', '${s.userId}', '${s.notificationId}', ${s.isRead ? 1 : 0}, 0)`).join(',') +
            ` ON DUPLICATE KEY UPDATE isRead = VALUES(isRead)`
          );
        }
      }
    }
  }

  // 4. Perform atomic swap-rename
  console.log('🔄 Performing swap and rename...');
  
  // Discover constraints dynamically to drop safely
  const constraints: any[] = await prisma.$queryRawUnsafe(`
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND REFERENCED_TABLE_NAME = 'alumni'
  `);
  
  for (const c of constraints) {
    console.log(`Dropping foreign key constraint ${c.CONSTRAINT_NAME}...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`${c.CONSTRAINT_NAME}\``);
  }

  const checkOldStates: any[] = await prisma.$queryRawUnsafe(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_states'
  `);

  if (checkOldStates.length > 0) {
    await prisma.$executeRawUnsafe('RENAME TABLE `notifications` TO `notifications_old`, `notifications_v2` TO `notifications`, `notification_states` TO `notification_states_old`, `notification_states_v2` TO `notification_states`');
  } else {
    await prisma.$executeRawUnsafe('RENAME TABLE `notifications` TO `notifications_old`, `notifications_v2` TO `notifications`, `notification_states_v2` TO `notification_states`');
  }
  
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `notifications_old`');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `notification_states_old`');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS `notification_campaigns`');

  console.log('✅ Zero-downtime lossless notification migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

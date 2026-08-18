import { prisma } from '../src/lib/prisma';
import { getAlumniAudienceTags } from '../src/lib/notifications/tags';

async function main() {
  console.log('Testing query logic...');
  try {
    const alumni = await prisma.alumni.findFirst({
      select: {
        id: true,
        batchYear: true,
        branch: true,
        college: true,
        course: true,
        campus: { select: { code: true } }
      }
    });

    if (!alumni) {
      console.log('No alumni found.');
      return;
    }

    console.log('Alumni found:', alumni.id);

    const alumniData = {
      id: alumni.id,
      campusCode: alumni.campus?.code || null,
      batchYear: alumni.batchYear,
      branch: alumni.branch,
      course: alumni.course
    };

    const followedCommunities = await prisma.communityMember.findMany({
      where: { alumniId: alumni.id },
      select: { communityId: true, isFollowingNewsletter: true }
    });

    const userTags = getAlumniAudienceTags(
      alumniData as any,
      followedCommunities
    );

    console.log('Generated User Tags:', userTags);

    const whereCondition: any = {
      audienceTag: { in: userTags },
      userStates: {
        none: {
          userId: alumni.id,
          isDeleted: true
        }
      }
    };

    console.log('Running findMany...');
    const result = await prisma.notification.findMany({
      where: whereCondition,
      take: 21,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      include: {
        userStates: {
          where: { userId: alumni.id }
        }
      }
    });
    console.log('findMany success, items found:', result.length);

    console.log('Running count...');
    const count = await prisma.notification.count({
      where: {
        audienceTag: { in: userTags },
        userStates: { none: { userId: alumni.id, OR: [{ isRead: true }, { isDeleted: true }] } }
      }
    });
    console.log('count success, count:', count);
    console.log('🎉 Everything runs successfully!');
  } catch (err) {
    console.error('❌ Error caught:', err);
  }
}

main().catch(console.error);

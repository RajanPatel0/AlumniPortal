import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/brevo';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  assertBatchCampusAccess,
  CampusScopeError,
} from '@/lib/auth/staff-auth';

function getInviteLink(token: string, origin: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || origin;
  return `${appUrl}/alumni/login?token=${token}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { batchId } = await params;

  let alumniId: string | undefined;
  let mode: 'invite' | 'remind' = 'invite';
  try {
    const body = await req.json();
    alumniId = typeof body?.alumniId === 'string' ? body.alumniId : undefined;
    if (body?.mode === 'remind') {
      mode = 'remind';
    }
  } catch {
    // no JSON body sent — send to the whole batch with default invite mode
  }

  let scopedCampusId: string | null;
  try {
    scopedCampusId = resolveCampusScope(staff, null);
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const hasAccess = await assertBatchCampusAccess(batchId, scopedCampusId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const statusFilter = mode === 'remind' ? 'INVITED' : { in: ['PENDING', 'BOUNCED'] as any };

  const batch = await prisma.invitationBatch.findUnique({
    where: { id: batchId },
    include: {
      alumni: {
        where: {
          inviteStatus: statusFilter,
          ...(scopedCampusId ? { campusId: scopedCampusId } : {}),
          ...(alumniId ? { id: alumniId } : {}),
        },
      },
    },
  });

  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  if (alumniId && !batch.alumni.length) {
    return NextResponse.json({ error: 'Alumni record not found in this batch' }, { status: 404 });
  }

  if (!batch.alumni.length) {
    return NextResponse.json({
      message: 'No pending alumni found for invitation',
      sent: 0,
      failed: 0,
    });
  }

  let sent = 0;
  let failed = 0;
  const alumniList = batch.alumni;
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < alumniList.length; i++) {
    const alumni = alumniList[i];
    const inviteLink = getInviteLink(alumni.inviteToken || '', req.nextUrl.origin);
    if (!alumni.inviteToken) {
      failed++;
      continue;
    }

    const emailSubject = mode === 'remind' ? 'Reminder: Complete Your PTU Alumni Registration' : 'PTU Alumni Invitation';
    const emailIntro = mode === 'remind'
      ? 'This is a reminder to complete your alumni registration profile.'
      : "We're excited to welcome you to the IKGPTU Alumni Portal — a space where old connections can be rekindled, new relationships can be built, and opportunities can be shared.<br/>No matter when you graduated or where your journey has taken you, you will always be a part of the IKGPTU community. This Community is here to help us stay connected, support one another, and grow together as professionals and lifelong learners.";

    const emailResult = await sendEmail({
      to: [{ email: alumni.email, name: alumni.name }],
      subject: emailSubject,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
          <h2 style="color:#12388f;margin-bottom:8px;">Welcome to PTU Alumni Connect</h2>
          <p>Hello ${alumni.name},</p>
          <p>${emailIntro}</p>
          
          <h3 style="color:#12388f;margin-top:16px;">What can you expect here?</h3>
          <ul style="padding-left:20px;margin-bottom:20px;">
            <li>Connect with fellow alumni across industries and locations</li>
            <li>Share career opportunities, insights, and experiences</li>
            <li>Seek and offer mentorship</li>
            <li>Collaborate on projects, ideas, and initiatives</li>
            <li>Celebrate achievements and milestones</li>
            <li>Stay engaged with the growing IKGPTU alumni network</li>
          </ul>

          <p>
            <a href="${inviteLink}" style="display:inline-block;padding:10px 16px;background:#12388f;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
              Complete Registration
            </a>
          </p>
          <p style="font-size:12px;color:#666;">If the button does not work, copy this URL:</p>
          <p style="font-size:12px;color:#12388f;word-break:break-all;">${inviteLink}</p>
        </div>
      `,
      textContent: `Hello ${alumni.name}, Welcome to IKGPTU Alumni Portal. Link: ${inviteLink}`,
      tags: ['alumni-invitation', `batch-${batchId}`],
    });

    if (emailResult.ok) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          inviteStatus: 'INVITED',
          invitedAt: new Date(),
        },
      });
      sent++;
    } else {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: {
          inviteStatus: 'BOUNCED',
        },
      });
      failed++;
    }

    if (i < alumniList.length - 1) {
      await delay(2100);
    }
  }

  const pendingOrBouncedCount = await prisma.alumni.count({
    where: {
      batchId,
      inviteStatus: {
        in: ['PENDING', 'BOUNCED'],
      },
    },
  });

  const nextStatus = pendingOrBouncedCount === 0 ? 'INVITED' : 'PARTIAL_FAILED';

  await prisma.invitationBatch.update({
    where: { id: batchId },
    data: {
      status: nextStatus as any,
    },
  });

  return NextResponse.json({
    message: 'Invitation dispatch completed',
    sent,
    failed,
  });
}

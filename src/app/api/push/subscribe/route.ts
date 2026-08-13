import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  return NextResponse.json({ publicKey });
}

export async function POST(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription payload. Endpoint and keys are required.' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json(
        { error: 'Missing p256dh or auth keys in subscription.' },
        { status: 400 }
      );
    }

    const agent = userAgent || req.headers.get('user-agent') || null;

    const savedSub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: alumni.id,
        endpoint,
        p256dh,
        auth,
        userAgent: agent,
      },
      update: {
        userId: alumni.id,
        p256dh,
        auth,
        userAgent: agent,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: savedSub.id, endpoint: savedSub.endpoint },
    });
  } catch (err: unknown) {
    console.error('Error saving push subscription:', err);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required to unsubscribe' }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: alumni.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (err: unknown) {
    console.error('Error removing push subscription:', err);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}

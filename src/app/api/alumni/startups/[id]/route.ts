// src/app/api/alumni/startups/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { startupSchema } from '@/schemas/startup';
import { deleteFile } from '@/lib/fileUpload';

// ─── PATCH: Update a startup ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← now a Promise
) {
  try {
    const { id } = await params;  // ← await it

    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startup = await prisma.startUp.findUnique({
      where: { id },
      select: { founderId: true, logoUrl: true },
    });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    if (startup.founderId !== alumni.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await req.json();
    const validated = startupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Resolve custom industry
    let industry = validated.data.industry;
    if (industry === 'Other') {
      industry = validated.data.customIndustry || '';
    }

    // Delete old logo if changed
    if (startup.logoUrl && startup.logoUrl !== validated.data.logoUrl) {
      await deleteFile(startup.logoUrl);
    }

    const updated = await prisma.startUp.update({
      where: { id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        industry,
        websiteUrl: validated.data.websiteUrl || null,
        logoUrl: validated.data.logoUrl || null,
        foundedYear: validated.data.foundedYear || null,
      },
    });

    return NextResponse.json({ success: true, startup: updated });
  } catch (error) {
    console.error('[PATCH_STARTUP_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update startup' }, { status: 500 });
  }
}

// ─── DELETE: Remove a startup ─────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← now a Promise
) {
  try {
    const { id } = await params;  // ← await it

    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startup = await prisma.startUp.findUnique({
      where: { id },
      select: { founderId: true, logoUrl: true },
    });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    if (startup.founderId !== alumni.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    if (startup?.logoUrl) {
      await deleteFile(startup.logoUrl);
    }

    await prisma.startUp.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_STARTUP_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete startup' }, { status: 500 });
  }
}
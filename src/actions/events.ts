'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentAlumni, getCurrentAlumniOrStaff } from '@/lib/auth/getCurrentAlumni';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import { eventSchema, type EventSchemaType } from '@/schemas/event';
import { Prisma, RsvpStatus } from '@prisma/client';
import type { EventFilterParams, EventItemType, RsvpDetailsType } from '@/types/events';

// ─────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────

/** Reusable author select spec */
const alumniAuthorSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  currentRole: true,
} as const;

const staffAuthorSelect = {
  id: true,
  name: true,
} as const;

/** Build Prisma where clause from EventFilterParams */
function buildEventWhere(
  params: EventFilterParams,
  extra?: Prisma.EventWhereInput,
): Prisma.EventWhereInput {
  const { search, category, dateFrom, dateTo, categoryScope, postedBy } = params;
  const and: Prisma.EventWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
      ],
    });
  }

  if (category && category !== 'All') {
    and.push({ category });
  } else if (categoryScope && categoryScope.length > 0) {
    and.push({ category: { in: categoryScope } });
  }

  if (postedBy === 'staff') {
    and.push({ postedByStaffId: { not: null } });
  } else if (postedBy === 'alumni') {
    and.push({ postedByAlumniId: { not: null } });
  }

  if (dateFrom) and.push({ eventDate: { gte: new Date(dateFrom) } });
  if (dateTo) and.push({ eventDate: { lte: new Date(dateTo) } });

  if (extra) and.push(extra);

  return and.length > 0 ? { AND: and } : {};
}

/** Add RSVP stats to an event (attending count, maybe count, total) */
async function addRsvpStats<T extends { id: string }>(
  event: T,
  alumniId?: string,
): Promise<T & { attendingCount: number; maybeCount: number; totalRsvps: number; myRsvp: { status: RsvpStatus; message: string | null } | null }> {
  const [attendingCount, maybeCount, totalRsvps, myRsvp] = await Promise.all([
    prisma.rsvp.count({ where: { eventId: event.id, status: 'ATTENDING' } }),
    prisma.rsvp.count({ where: { eventId: event.id, status: 'MAYBE' } }),
    prisma.rsvp.count({ where: { eventId: event.id } }),
    alumniId
      ? prisma.rsvp.findUnique({
          where: { alumniId_eventId: { alumniId, eventId: event.id } },
          select: { status: true, message: true },
        })
      : Promise.resolve(null),
  ]);
  return { ...event, attendingCount, maybeCount, totalRsvps, myRsvp: myRsvp ?? null };
}

/** Parse and validate event form data */
function parseEventForm(formData: EventSchemaType) {
  const validated = eventSchema.safeParse(formData);
  if (!validated.success) return { error: 'Validation failed', data: null } as const;
  return { error: null, data: validated.data } as const;
}

/** Base create data shape (no poster ID) */
function buildEventData(data: EventSchemaType) {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    eventDate: data.eventDate,
    venue: data.venue,
    coverImageUrl: data.coverImageUrl || null,
    rsvpDeadline: data.rsvpDeadline ?? null,
    isPublished: data.isPublished,
  };
}

/** Standard action result */
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ─────────────────────────────────────────
// ALUMNI ACTIONS
// ─────────────────────────────────────────

/** Fetch events for the alumni-facing pages (events calendar + newscorner) */
export async function getEventsAction(params: EventFilterParams): Promise<{
  events: EventItemType[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
}> {
  const identity = await getCurrentAlumniOrStaff();
  if (!identity) throw new Error('Unauthorized');

  // alumniId is null when a staff/admin is the viewer
  const alumniId = identity.isAdmin ? null : identity.alumni.id;

  const { tab = 'all', page = 1, limit = 12, showDrafts = false } = params;

  // Base: only published, unless we show own drafts
  let base: Prisma.EventWhereInput;
  if (alumniId && tab === 'posted') {
    // My own posts (including drafts when showDrafts=true)
    base = showDrafts
      ? { postedByAlumniId: alumniId }
      : { postedByAlumniId: alumniId, isPublished: true };
  } else if (alumniId && tab === 'attended') {
    base = { rsvps: { some: { alumniId } } };
  } else {
    // "all" or admin viewer — published only
    base = { isPublished: true };
  }

  const whereClause = buildEventWhere(params, base);
  const skip = (page - 1) * limit;

  const [rawEvents, totalCount] = await Promise.all([
    prisma.event.findMany({
      where: whereClause,
      orderBy: { eventDate: 'desc' },
      skip,
      take: limit,
      include: {
        postedByAlumni: { select: alumniAuthorSelect },
        postedByStaff: { select: staffAuthorSelect },
      },
    }),
    prisma.event.count({ where: whereClause }),
  ]);

  const events = await Promise.all(
    rawEvents.map(async (e) => {
      const withStats = await addRsvpStats(e, alumniId ?? undefined);
      return {
        ...withStats,
        postedByMe: alumniId ? e.postedByAlumniId === alumniId : false,
      } as unknown as EventItemType;
    }),
  );

  return {
    events,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  };
}

export async function createEventAction(formData: EventSchemaType): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const { error, data } = parseEventForm(formData);
    if (error) return { success: false, error };

    await prisma.event.create({
      data: { ...buildEventData(data!), postedByAlumniId: alumni.id },
    });
    return { success: true };
  } catch (err: any) {
    console.error('[createEventAction]', err);
    return { success: false, error: err.message || 'Failed to create post' };
  }
}

export async function updateEventAction(id: string, formData: EventSchemaType): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({ where: { id }, select: { postedByAlumniId: true } });
    if (!event) return { success: false, error: 'Event not found' };
    if (event.postedByAlumniId !== alumni.id) return { success: false, error: 'Permission denied' };

    const { error, data } = parseEventForm(formData);
    if (error) return { success: false, error };

    await prisma.event.update({ where: { id }, data: buildEventData(data!) });
    return { success: true };
  } catch (err: any) {
    console.error('[updateEventAction]', err);
    return { success: false, error: err.message || 'Failed to update post' };
  }
}

export async function submitRsvpAction(
  eventId: string,
  status: RsvpStatus,
  message?: string,
): Promise<ActionResult> {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { isPublished: true, eventDate: true, rsvpDeadline: true },
    });

    if (!event) return { success: false, error: 'Event not found' };
    if (!event.isPublished) return { success: false, error: 'This event is not accepting RSVPs' };

    const now = new Date();
    if (now > event.eventDate) return { success: false, error: 'RSVP closed — event date has passed' };
    if (event.rsvpDeadline && now > event.rsvpDeadline) {
      return { success: false, error: 'RSVP deadline has passed' };
    }

    await prisma.rsvp.upsert({
      where: { alumniId_eventId: { alumniId: alumni.id, eventId } },
      create: { alumniId: alumni.id, eventId, status, message: message || null },
      update: { status, message: message || null, respondedAt: now },
    });

    return { success: true };
  } catch (err: any) {
    console.error('[submitRsvpAction]', err);
    return { success: false, error: err.message || 'Failed to submit RSVP' };
  }
}

// ─────────────────────────────────────────
// ADMIN ACTIONS
// ─────────────────────────────────────────

export async function getAdminEventsAction(params: EventFilterParams): Promise<{
  events: EventItemType[];
  pagination: { page: number; limit: number; totalCount: number; totalPages: number };
}> {
  const staff = await getAuthenticatedStaff();
  if (!staff) throw new Error('Unauthorized');

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('events')) {
    throw new Error('Forbidden: Access denied to events module');
  }

  const { tab = 'all', page = 1, limit = 10 } = params;

  // Build tab-specific WHERE clause
  let tabClause: Prisma.EventWhereInput | undefined;
  if (tab === 'posted') {
    tabClause = { postedByStaffId: staff.id };
  } else if (tab === 'alumni') {
    tabClause = { postedByAlumniId: { not: null } };
  } else if (tab === 'staff') {
    tabClause = { postedByStaffId: { not: null } };
  }

  const whereClause = buildEventWhere(params, tabClause);
  const skip = (page - 1) * limit;

  let scopedCampusId: string | null = null;
  if (staff.role !== 'ADMIN') {
    scopedCampusId = staff.campusId;
  }

  if (scopedCampusId) {
    const campusFilter = {
      OR: [
        { postedByStaff: { campusId: scopedCampusId } },
        { postedByStaff: { campusId: null } },
        { postedByAlumni: { campusId: scopedCampusId } }
      ]
    };
    if (whereClause.AND) {
      (whereClause.AND as any).push(campusFilter);
    } else {
      whereClause.AND = [campusFilter] as any;
    }
  }

  const [rawEvents, totalCount] = await Promise.all([
    prisma.event.findMany({
      where: whereClause,
      orderBy: { eventDate: 'desc' },
      skip,
      take: limit,
      include: {
        postedByAlumni: { select: alumniAuthorSelect },
        postedByStaff: { select: staffAuthorSelect },
      },
    }),
    prisma.event.count({ where: whereClause }),
  ]);

  const events = await Promise.all(
    rawEvents.map(async (e) => {
      const withStats = await addRsvpStats(e);
      return {
        ...withStats,
        postedByMe: e.postedByStaffId === staff.id,
      } as unknown as EventItemType;
    }),
  );

  return {
    events,
    pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  };
}

export async function createAdminEventAction(formData: EventSchemaType): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return { success: false, error: 'Forbidden: Access denied to events module' };
    }

    const { error, data } = parseEventForm(formData);
    if (error) return { success: false, error };

    await prisma.event.create({
      data: { ...buildEventData(data!), postedByStaffId: staff.id },
    });
    return { success: true };
  } catch (err: any) {
    console.error('[createAdminEventAction]', err);
    return { success: false, error: err.message || 'Failed to create event' };
  }
}

export async function updateAdminEventAction(id: string, formData: EventSchemaType): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return { success: false, error: 'Forbidden: Access denied to events module' };
    }

    const { error, data } = parseEventForm(formData);
    if (error) return { success: false, error };

    await prisma.event.update({ where: { id }, data: buildEventData(data!) });
    return { success: true };
  } catch (err: any) {
    console.error('[updateAdminEventAction]', err);
    return { success: false, error: err.message || 'Failed to update event' };
  }
}

export async function toggleEventPublishAction(id: string, isPublished: boolean): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return { success: false, error: 'Forbidden: Access denied to events module' };
    }

    await prisma.event.update({ where: { id }, data: { isPublished } });
    return { success: true };
  } catch (err: any) {
    console.error('[toggleEventPublishAction]', err);
    return { success: false, error: err.message || 'Failed to update publish status' };
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return { success: false, error: 'Unauthorized' };

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return { success: false, error: 'Forbidden: Access denied to events module' };
    }

    // Clear dependents first (FK constraints)
    await prisma.$transaction([
      prisma.rsvp.deleteMany({ where: { eventId: id } }),
      prisma.emailLog.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[deleteEventAction]', err);
    return { success: false, error: err.message || 'Failed to delete event' };
  }
}

export async function getEventRsvpsAction(eventId: string): Promise<RsvpDetailsType | null> {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) return null;

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('events')) {
      return null;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, eventDate: true },
    });
    if (!event) return null;

    const rsvps = await prisma.rsvp.findMany({
      where: { eventId },
      orderBy: { respondedAt: 'desc' },
      include: {
        alumni: {
          select: {
            id: true, name: true, email: true,
            batchYear: true, branch: true, course: true,
            currentRole: true, currentCompany: true, avatarUrl: true,
          },
        },
      },
    });

    const attendingCount = rsvps.filter((r) => r.status === 'ATTENDING').length;
    const maybeCount = rsvps.filter((r) => r.status === 'MAYBE').length;
    const notAttendingCount = rsvps.filter((r) => r.status === 'NOT_ATTENDING').length;

    return {
      eventTitle: event.title,
      eventDate: event.eventDate.toISOString(),
      totalCount: rsvps.length,
      attendingCount,
      maybeCount,
      notAttendingCount,
      rsvps: rsvps as any,
    };
  } catch (err) {
    console.error('[getEventRsvpsAction]', err);
    return null;
  }
}


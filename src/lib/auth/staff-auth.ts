import { cookies } from 'next/headers';
import { StaffRole, Campus, Staff } from '@prisma/client';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export type AuthenticatedStaff = Staff & { campus: Campus | null };

export async function getAuthenticatedStaff(): Promise<AuthenticatedStaff | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    const staff = await prisma.staff.findUnique({
      where: { id: payload.id },
      include: { campus: true },
    });
    return staff;
  } catch {
    return null;
  }
}

/**
 * Resolves the effective campusId filter for a staff member.
 * - ADMIN: optional campusId from query (null = all campuses)
 * - SUB_ADMIN / COORDINATOR: always locked to their assigned campus
 */
export function resolveCampusScope(
  staff: AuthenticatedStaff,
  requestedCampusId?: string | null
): string | null {
  if (staff.role === StaffRole.ADMIN) {
    return requestedCampusId?.trim() || null;
  }

  if (!staff.campusId) {
    throw new CampusScopeError('Your account is not linked to any campus');
  }

  return staff.campusId;
}

export class CampusScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CampusScopeError';
  }
}

/** Prisma where clause fragment for Alumni queries */
export function alumniCampusWhere(campusId: string | null): Record<string, unknown> {
  if (!campusId) return {};
  return { campusId };
}

/** Prisma where clause for InvitationBatch – batches that contain alumni from a campus */
export function batchCampusWhere(campusId: string | null): Record<string, unknown> {
  if (!campusId) return {};
  return { alumni: { some: { campusId } } };
}

/** Verify a batch is accessible within the staff member's campus scope */
export async function assertBatchCampusAccess(
  batchId: string,
  campusId: string | null
): Promise<boolean> {
  if (!campusId) return true;

  const count = await prisma.alumni.count({
    where: { batchId, campusId },
  });
  return count > 0;
}

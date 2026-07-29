import { cookies } from "next/headers";
import { verifyAlumniAccessToken } from "@/lib/auth/alumni-jwt";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";

export interface SessionContext {
  alumniId?: string;
  staffId?: string;
  isStaff: boolean;
  isAdmin: boolean;
  campusId?: string | null;
}

/**
 * Helper function to extract user session context (Alumni or Staff) for community API routes.
 */
export async function getCommunitySession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const alumniToken = cookieStore.get("alumniAccessToken")?.value;
  const staffToken = cookieStore.get("accessToken")?.value;

  if (staffToken) {
    try {
      const payload = verifyAccessToken(staffToken);
      const staff = await prisma.staff.findUnique({
        where: { id: payload.id },
        select: { id: true, role: true, campusId: true },
      });

      if (staff) {
        return {
          staffId: staff.id,
          isStaff: true,
          isAdmin: staff.role === StaffRole.ADMIN,
          campusId: staff.campusId,
        };
      }
    } catch {}
  }

  if (alumniToken) {
    try {
      const payload = verifyAlumniAccessToken(alumniToken);
      const alumni = await prisma.alumni.findUnique({
        where: { id: payload.id },
        select: { id: true, campusId: true },
      });

      if (alumni) {
        return {
          alumniId: alumni.id,
          isStaff: false,
          isAdmin: false,
          campusId: alumni.campusId,
        };
      }
    } catch {}
  }

  return null;
}

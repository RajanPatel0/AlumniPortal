import { cookies } from 'next/headers';
import { 
  verifyAlumniAccessToken,
  verifyAlumniRefreshToken,
  generateAlumniAccessToken,
  generateAlumniRefreshToken
} from '@/lib/auth/alumni-jwt';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

function parseExpiryToMs(expiry: string): number {
  const value = parseInt(expiry);
  const unit = expiry.slice(-1);
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return value * 1000;
}

export async function getCurrentAlumni() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('alumniAccessToken')?.value;
    
    if (token) {
      try {
        const payload = verifyAlumniAccessToken(token);
        if (payload?.id) {
          return await prisma.alumni.findUnique({
            where: { id: payload.id },
          });
        }
      } catch (err) {
        // Access token is expired, fall through to silent refresh
      }
    }

    // Try silent refresh
    const refreshToken = cookieStore.get('alumniRefreshToken')?.value;
    if (refreshToken) {
      try {
        const payload = verifyAlumniRefreshToken(refreshToken);
        const storedToken = await prisma.alumniRefreshToken.findUnique({
          where: { token: refreshToken },
        });

        if (storedToken && storedToken.alumniId === payload.id) {
          const alumni = await prisma.alumni.findUnique({
            where: { id: payload.id },
          });

          if (alumni) {
            // Generate rotated tokens
            const newAccessToken = generateAlumniAccessToken({
              id: alumni.id,
              email: alumni.email,
              name: alumni.name,
              campusId: alumni.campusId || undefined,
            });
            const newRefreshToken = generateAlumniRefreshToken({ id: alumni.id });

            // Rotate in database
            await prisma.alumniRefreshToken.update({
              where: { token: refreshToken },
              data: { token: newRefreshToken },
            });

            const isProd = process.env.NODE_ENV === 'production';
            const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
            const refreshMaxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');

            cookieStore.set('alumniAccessToken', newAccessToken, {
              httpOnly: true,
              secure: isProd,
              sameSite: 'lax',
              maxAge: accessMaxAge / 1000,
              path: '/',
            });
            cookieStore.set('alumniRefreshToken', newRefreshToken, {
              httpOnly: true,
              secure: isProd,
              sameSite: 'lax',
              maxAge: refreshMaxAge / 1000,
              path: '/',
            });

            return alumni;
          }
        }
      } catch (err) {
        console.error('Silent alumni refresh failed:', err);
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getCurrentAlumni:', error);
    return null;
  }
}

/**
 * Extended auth helper that accepts EITHER an alumni token OR a staff token.
 * Returns a normalized identity:
 *   - `isAdmin: false` → authenticated alumni (full alumni record)
 *   - `isAdmin: true`  → authenticated staff member (no alumni record)
 *
 * Use this in routes/actions that should be accessible by both alumni AND admin/staff.
 */
export async function getCurrentAlumniOrStaff(): Promise<
  | { isAdmin: false; alumni: NonNullable<Awaited<ReturnType<typeof getCurrentAlumni>>> }
  | { isAdmin: true; staffId: string }
  | null
> {
  try {
    const cookieStore = await cookies();
    const alumniToken = cookieStore.get('alumniAccessToken')?.value;
    const staffToken = cookieStore.get('accessToken')?.value;

    // Prefer staff token FIRST — avoids email collision with alumni records
    if (staffToken) {
      try {
        const payload = verifyAccessToken(staffToken);
        if (payload?.id) {
          return { isAdmin: true, staffId: payload.id };
        }
      } catch {
        // invalid staff token, fall through to alumni check
      }
    }

    // Try alumni token
    if (alumniToken) {
      try {
        const payload = verifyAlumniAccessToken(alumniToken);
        if (payload?.id) {
          const alumni = await prisma.alumni.findUnique({ where: { id: payload.id } });
          if (alumni) return { isAdmin: false, alumni };
        }
      } catch {
        // invalid alumni token too
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getCurrentAlumniOrStaff:', error);
    return null;
  }
}

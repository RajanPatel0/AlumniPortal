import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendSubAdminCredentials } from '@/lib/subadmin-email';

export async function POST(req: NextRequest) {
  // 1. Auth check: only ADMIN can create sub-admins
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let adminStaff;
  try {
    const payload = verifyAccessToken(token);
    adminStaff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!adminStaff || adminStaff.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create sub-admins' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Parse request body
  const { name, email, campusId, modules, password } = await req.json();
  if (!name || !email || !campusId || !modules || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate modules (should be array of strings)
  if (!Array.isArray(modules) || modules.length === 0) {
    return NextResponse.json({ error: 'At least one module must be selected' }, { status: 400 });
  }

  // Validate password length
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // Check if campus exists
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) {
    return NextResponse.json({ error: 'Invalid campus' }, { status: 400 });
  }

  // Check if email already used
  const existing = await prisma.staff.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create sub-admin
  const subAdmin = await prisma.staff.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'SUB_ADMIN',
      campusId,
      modules: modules, // store as JSON array
      isVerified: true, // sub-admins are created verified (no email OTP required)
      createdById: adminStaff.id,
    },
  });

  // Send credentials email (fire-and-forget, don't block on failure)
  sendSubAdminCredentials(email, name, password).catch(err =>
    console.error('Failed to send sub-admin email:', err)
  );

  return NextResponse.json({
    success: true,
    message: 'Sub-admin created successfully. Credentials sent via email.',
    subAdmin: {
      id: subAdmin.id,
      name: subAdmin.name,
      email: subAdmin.email,
      role: subAdmin.role,
      campus: campus.name,
      modules: subAdmin.modules,
    },
  });
}

// Add this GET handler to the same file
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let adminStaff;
  try {
    const payload = verifyAccessToken(token);
    adminStaff = await prisma.staff.findUnique({ where: { id: payload.id } });
    if (!adminStaff || adminStaff.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const subAdmins = await prisma.staff.findMany({
    where: { role: 'SUB_ADMIN' },
    orderBy: { createdAt: 'desc' },
    select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        modules: true,
        campus: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(subAdmins);
}
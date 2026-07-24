import { NextRequest, NextResponse } from 'next/server';
import { StaffRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff, CampusScopeError } from '@/lib/auth/staff-auth';
import { sendEmail } from '@/lib/brevo';
import { resolveLocation } from '@/lib/geocoding';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== StaffRole.ADMIN && !modules.includes('requests')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to registration requests' }, { status: 403 });
    }

    const { requestId } = await params;
    const body = await req.json().catch(() => ({}));
    const overrideCampusId = typeof body.campusId === 'string' ? body.campusId.trim() : '';

    const existingRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
      include: { campus: { select: { id: true, name: true } } },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This registration request has already been reviewed' },
        { status: 400 }
      );
    }

    let finalCampusId: string | null;

    if (staff.role === StaffRole.ADMIN) {
      finalCampusId = overrideCampusId || existingRequest.campusId;
    } else {
      if (!staff.campusId) {
        return NextResponse.json({ error: 'Your account is not linked to any campus' }, { status: 403 });
      }
      if (existingRequest.campusId && existingRequest.campusId !== staff.campusId) {
        return NextResponse.json({ error: 'Forbidden: You can only approve requests for your assigned campus' }, { status: 403 });
      }
      finalCampusId = staff.campusId;
    }

    if (!finalCampusId) {
      return NextResponse.json(
        { error: 'Campus assignment is required. The request has no campus — please assign one when approving.' },
        { status: 400 }
      );
    }

    const campus = await prisma.campus.findUnique({ where: { id: finalCampusId } });
    if (!campus) {
      return NextResponse.json({ error: 'Invalid campus' }, { status: 400 });
    }

    const duplicateAlumni = await prisma.alumni.findFirst({
      where: {
        OR: [
          { email: existingRequest.email },
          { originalInvitedEmail: existingRequest.email },
        ],
      },
    });
    
    if (duplicateAlumni) {
      return NextResponse.json(
        { error: 'An alumni account with this email already exists' },
        { status: 400 }
      );
    }

    // Pre-resolve location if request contains pincode details
    let resolvedLocation: { locationId: string | null; city?: string | null; country?: string | null } | null = null;
    if (existingRequest.pincode) {
      try {
        resolvedLocation = await resolveLocation("India", existingRequest.pincode, undefined, existingRequest.city || undefined);
      } catch (err) {
        console.error("Failed to resolve location during approval:", err);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          campusId: finalCampusId,
          reviewedById: staff.id,
          reviewedAt: new Date(),
        },
      });

      const newAlumni = await tx.alumni.create({
        data: {
          name: existingRequest.name,
          email: existingRequest.email,
          enrollmentNo: existingRequest.enrollmentNo,
          batchYear: existingRequest.batchYear,
          branch: existingRequest.branch,
          college: existingRequest.college,
          course: existingRequest.course,
          phone: existingRequest.phone,
          campusId: finalCampusId,
          isRegistered: true,
          inviteStatus: 'REGISTERED',
          registeredAt: new Date(),
          googleId: existingRequest.authProvider === 'GOOGLE' ? existingRequest.providerId : null,
          linkedinId: existingRequest.authProvider === 'LINKEDIN' ? existingRequest.providerId : null,
          passwordHash: existingRequest.authProvider === 'MANUAL' ? existingRequest.passwordHash : null,
          currentRole: existingRequest.currentRole,
          currentCompany: existingRequest.currentCompany,
          linkedinUrl: existingRequest.linkedinUrl,
          pincode: existingRequest.pincode,
          city: resolvedLocation?.city || existingRequest.city || null,
          country: resolvedLocation?.country || "India",
          locationId: resolvedLocation?.locationId || null,
        },
      });

      if (existingRequest.currentRole || existingRequest.currentCompany) {
        await tx.workExperience.create({
          data: {
            alumniId: newAlumni.id,
            company: existingRequest.currentCompany || 'Not Specified',
            title: existingRequest.currentRole || 'Not Specified',
            location: existingRequest.city || null,
            startDate: new Date(),
            isCurrent: true,
          },
        });
      }

      return { updatedRequest, newAlumni };
    });

    // Send registration approval notification email
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #003D7A; margin: 0;">IKGPTU Alumni Connect</h2>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0 0;">University Alumni Relations Portal</p>
        </div>
        
        <p>Dear <strong>${existingRequest.name}</strong>,</p>
        <p>We are pleased to inform you that your registration request for the I.K.G. Punjab Technical University Alumni Portal has been <strong>approved</strong> and your account is now active!</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #0f172a;">Account Details:</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <code>${existingRequest.email}</code></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Campus:</strong> ${campus.name}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Course / Branch:</strong> ${existingRequest.branch} ${existingRequest.course ? `(${existingRequest.course})` : ''}</p>
        </div>
        
        <p>You can now log in to the portal using your registered email and credentials or your Google/LinkedIn account (depending on how you registered).</p>
        
        <div style="text-align: center; margin: 28px 0;">
          <a href="${appUrl}/alumni/login" style="display: inline-block; padding: 12px 24px; background: #C41E3A; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Login to Portal</a>
        </div>
        
        <p style="font-size: 14px; line-height: 1.5;">Welcome to our alumni network! We are excited to have you connect with your fellow alumni, find career opportunities, share milestones, and engage with the university community.</p>
        
        <hr style="margin: 24px 0; border: 0; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">IKGPTU Alumni Connect · University Alumni Relations Office</p>
      </div>
    `;

    try {
      await sendEmail({
        to: [{ email: existingRequest.email, name: existingRequest.name }],
        subject: 'IKGPTU Alumni Portal — Registration Approved!',
        htmlContent: emailHtml,
        tags: ['alumni-approval'],
      });
    } catch (emailErr) {
      console.error('[APPROVE_EMAIL_ERROR] Failed to send approval email:', emailErr);
    }

    return NextResponse.json({
      message: 'Registration request approved and alumni account activated.',
      request: result.updatedRequest,
      alumniId: result.newAlumni.id,
      campus: { id: campus.id, name: campus.name },
    });
  } catch (error) {
    if (error instanceof CampusScopeError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[APPROVE_REGISTRATION_REQUEST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  CampusScopeError,
} from '@/lib/auth/staff-auth';
import { resolveLocation } from '@/lib/geocoding';
import { normalizeCompanyName } from '@/lib/company-utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('alumni')) {
    return NextResponse.json({ error: 'Forbidden: Access denied to alumni module' }, { status: 403 });
  }

  const { id } = await params;

  // Find alumni first to verify existence and check campus scope
  const alumni = await prisma.alumni.findUnique({
    where: { id },
  });

  if (!alumni) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }

  // Campus scope enforcement
  try {
    const scopedCampusId = resolveCampusScope(staff, alumni.campusId);
    if (scopedCampusId && alumni.campusId !== scopedCampusId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete alumni from this campus' }, { status: 403 });
    }
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  try {
    // Perform delete in a transaction to handle manual cascades if any
    await prisma.$transaction([
      // Delete RSVPs
      prisma.rsvp.deleteMany({
        where: { alumniId: id },
      }),
      // Set alumniId to null in EmailLogs (to preserve the log records)
      prisma.emailLog.updateMany({
        where: { alumniId: id },
        data: { alumniId: null },
      }),
      // Delete the alumni
      prisma.alumni.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Alumni deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting alumni:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete alumni' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
  if (staff.role !== 'ADMIN' && !modules.includes('alumni')) {
    return NextResponse.json({ error: 'Forbidden: Access denied to alumni module' }, { status: 403 });
  }

  const { id } = await params;

  // Find alumni first to verify existence and check campus scope
  const alumni = await prisma.alumni.findUnique({
    where: { id },
  });

  if (!alumni) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }

  // Campus scope enforcement
  try {
    const scopedCampusId = resolveCampusScope(staff, alumni.campusId);
    if (scopedCampusId && alumni.campusId !== scopedCampusId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to edit alumni from this campus' }, { status: 403 });
    }
  } catch (err) {
    if (err instanceof CampusScopeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  try {
    const body = await req.json();
    const {
      name,
      email,
      enrollmentNo,
      batchYear,
      branch,
      college,
      course,
      phone,
      currentRole,
      currentCompany,
      city,
      country,
      pincode,
    } = body;

    // Validate email uniqueness if it changed
    if (email && email !== alumni.email) {
      const emailExists = await prisma.alumni.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use by another alumni' }, { status: 400 });
      }
    }

    // Resolve location if country or pincode changes (similar to alumni self update profile)
    let newLocationId = alumni.locationId;
    let finalCity = city;
    let finalCountry = country;
    const countryChanged = country !== undefined && country !== alumni.country;
    const pincodeChanged = pincode !== undefined && pincode !== alumni.pincode;

    if (countryChanged || pincodeChanged) {
      const activeCountry = country !== undefined ? country : alumni.country;
      const activePincode = pincode !== undefined ? pincode : alumni.pincode;
      if (activeCountry && activePincode) {
        const resolved = await resolveLocation(activeCountry, activePincode, undefined, city || alumni.city || undefined);
        newLocationId = resolved.locationId;
        if (resolved.city) {
          finalCity = resolved.city;
        }
        if (resolved.country) {
          finalCountry = resolved.country;
        }
      } else {
        newLocationId = null;
      }
    }

    const finalCompany = currentCompany !== undefined ? normalizeCompanyName(currentCompany) : undefined;

    // Update in transaction to also handle work experience
    const updatedAlumni = await prisma.$transaction(async (tx) => {
      const updated = await tx.alumni.update({
        where: { id },
        data: {
          name,
          email,
          enrollmentNo: enrollmentNo !== undefined ? (enrollmentNo || null) : undefined,
          batchYear: batchYear ? Number(batchYear) : undefined,
          branch,
          college,
          course: course !== undefined ? (course || null) : undefined,
          phone: phone !== undefined ? (phone || null) : undefined,
          currentRole: currentRole !== undefined ? (currentRole || null) : undefined,
          currentCompany: finalCompany,
          city: finalCity !== undefined ? (finalCity || null) : undefined,
          country: finalCountry !== undefined ? (finalCountry || null) : undefined,
          pincode: pincode !== undefined ? (pincode || null) : undefined,
          locationId: newLocationId,
        },
      });

      // Sync with WorkExperience table (mimicking update-profile/route.ts logic)
      if (currentRole !== undefined || currentCompany !== undefined || city !== undefined) {
        const currentExperiences = await tx.workExperience.findMany({
          where: { alumniId: id, isCurrent: true },
          orderBy: [
            { startDate: 'desc' },
            { createdAt: 'desc' }
          ]
        });

        const activeRole = currentRole ?? updated.currentRole;
        const activeCompany = currentCompany ?? updated.currentCompany;
        const activeCity = city ?? updated.city;

        if (activeRole || activeCompany) {
          if (currentExperiences.length > 0) {
            // Update the latest active one
            await tx.workExperience.update({
              where: { id: currentExperiences[0].id },
              data: {
                title: activeRole || 'Not Specified',
                company: activeCompany || 'Not Specified',
                location: activeCity || null,
              }
            });
          } else {
            // Create a new active one
            await tx.workExperience.create({
              data: {
                alumniId: id,
                title: activeRole || 'Not Specified',
                company: activeCompany || 'Not Specified',
                location: activeCity || null,
                startDate: new Date(),
                isCurrent: true,
              }
            });
          }
        } else {
          // If there are current experiences, set them to isCurrent = false
          if (currentExperiences.length > 0) {
            await tx.workExperience.updateMany({
              where: { alumniId: id, isCurrent: true },
              data: {
                isCurrent: false,
                endDate: new Date(),
              }
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Alumni updated successfully',
      data: updatedAlumni,
    });
  } catch (error: any) {
    console.error('Error updating alumni:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update alumni' },
      { status: 500 }
    );
  }
}


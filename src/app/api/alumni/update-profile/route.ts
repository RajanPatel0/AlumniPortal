import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { prisma } from '@/lib/prisma';
import { resolveLocation } from '@/lib/geocoding';

export async function PUT(req: NextRequest) {
  try {
    const alumni = await getCurrentAlumni();
    if (!alumni) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      batchYear, 
      branch, 
      college, 
      course, 
      currentRole, 
      currentCompany, 
      city, 
      phone,
      country,
      pincode,
      mapVisibility,
      linkedinUrl
    } = body;

    // Build data object dynamically to support partial updates safely
    const dataToUpdate: any = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (batchYear !== undefined) dataToUpdate.batchYear = batchYear ? Number(batchYear) : undefined;
    if (branch !== undefined) dataToUpdate.branch = branch;
    if (college !== undefined) dataToUpdate.college = college;
    if (course !== undefined) dataToUpdate.course = course;
    if (currentRole !== undefined) dataToUpdate.currentRole = currentRole;
    if (currentCompany !== undefined) dataToUpdate.currentCompany = currentCompany;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (mapVisibility !== undefined) dataToUpdate.mapVisibility = mapVisibility;
    if (linkedinUrl !== undefined) dataToUpdate.linkedinUrl = linkedinUrl || null;

    // Handle location/country/pincode resolution only if location-related fields are explicitly passed
    if (country !== undefined || pincode !== undefined || city !== undefined) {
      const currentRecord = await prisma.alumni.findUnique({
        where: { id: alumni.id },
        select: { country: true, pincode: true, locationId: true, city: true }
      });

      const effectiveCountry = country !== undefined ? country : currentRecord?.country;
      const effectivePincode = pincode !== undefined ? pincode : currentRecord?.pincode;
      const effectiveCity = city !== undefined ? city : currentRecord?.city;

      const countryChanged = country !== undefined && (country ?? '') !== (currentRecord?.country ?? '');
      const pincodeChanged = pincode !== undefined && (pincode ?? '') !== (currentRecord?.pincode ?? '');

      let newLocationId = currentRecord?.locationId || null;
      let finalCity = effectiveCity;
      let finalCountry = effectiveCountry;

      if (countryChanged || pincodeChanged) {
        if (effectiveCountry && effectivePincode) {
          const resolved = await resolveLocation(effectiveCountry, effectivePincode, undefined, effectiveCity || undefined);
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
        dataToUpdate.locationId = newLocationId;
      }

      if (country !== undefined) dataToUpdate.country = finalCountry || null;
      if (pincode !== undefined) dataToUpdate.pincode = effectivePincode || null;
      if (city !== undefined || countryChanged || pincodeChanged) {
        dataToUpdate.city = finalCity || null;
      }
    }

    const updated = await prisma.alumni.update({
      where: { id: alumni.id },
      data: dataToUpdate,
    });

    // Sync with WorkExperience table only if currentRole or currentCompany are explicitly passed
    if (currentRole !== undefined || currentCompany !== undefined) {
      const currentExperiences = await prisma.workExperience.findMany({
        where: { alumniId: alumni.id, isCurrent: true },
        orderBy: [
          { startDate: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      const roleToUse = updated.currentRole;
      const companyToUse = updated.currentCompany;
      const cityToUse = updated.city;

      if (roleToUse || companyToUse) {
        if (currentExperiences.length > 0) {
          // Update the latest active one
          await prisma.workExperience.update({
            where: { id: currentExperiences[0].id },
            data: {
              title: roleToUse || 'Not Specified',
              company: companyToUse || 'Not Specified',
              location: cityToUse || null,
            }
          });
        } else {
          // Create a new active one
          await prisma.workExperience.create({
            data: {
              alumniId: alumni.id,
              title: roleToUse || 'Not Specified',
              company: companyToUse || 'Not Specified',
              location: cityToUse || null,
              startDate: new Date(),
              isCurrent: true,
            }
          });
        }
      } else {
        // Both currentRole and currentCompany are empty.
        if (currentExperiences.length > 0) {
          await prisma.workExperience.updateMany({
            where: { alumniId: alumni.id, isCurrent: true },
            data: {
              isCurrent: false,
              endDate: new Date(),
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        batchYear: updated.batchYear,
        branch: updated.branch,
        college: updated.college,
        course: updated.course,
        currentRole: updated.currentRole,
        currentCompany: updated.currentCompany,
        city: updated.city,
        avatarUrl: updated.avatarUrl,
        phone: updated.phone,
        country: updated.country,
        pincode: updated.pincode,
        mapVisibility: updated.mapVisibility,
        linkedinUrl: updated.linkedinUrl,
      },
    });
  } catch (error: any) {
    console.error('[UPDATE_PROFILE_ERROR]', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

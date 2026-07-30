import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAcademicNeedsReview, getAutoCorrectedBranch } from '@/lib/academic-options';

export async function POST(req: Request) {
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
      campusId,
      isAffiliated,
      affiliatedCollegeId,
      customCollegeName,
      authProvider,
      providerId,
      passwordHash,
      currentRole,
      currentCompany,
      pincode,
      city,
      linkedinUrl,
    } = body;

    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!name?.trim() || !normalizedEmail || !batchYear || !branch?.trim() || !course?.trim() || !pincode?.trim()) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    if (authProvider === 'MANUAL' && !passwordHash) {
      return NextResponse.json({ error: 'Password is required for manual registration' }, { status: 400 });
    }

    const existingAlumni = await prisma.alumni.findUnique({ where: { email: normalizedEmail } });
    if (existingAlumni) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.registrationRequest.findUnique({ where: { email: normalizedEmail } });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Your registration request is already pending admin review.' },
          { status: 400 }
        );
      }
      if (existingRequest.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'Your previous request was rejected. Please contact support.' },
          { status: 403 }
        );
      }
    }

    // All campuses for validation
    const allCampuses = await prisma.campus.findMany();
    const mainCampus = allCampuses.find((c) => c.code === 'main') || allCampuses[0];

    let targetCampusId: string;
    let targetCollegeName: string;
    let targetAffiliatedCollegeId: string | null = null;
    let forceNeedsReview = false;

    if (isAffiliated) {
      targetCampusId = mainCampus.id;

      if (affiliatedCollegeId && affiliatedCollegeId !== 'NEW') {
        const affCollege = await prisma.affiliatedCollege.findUnique({ where: { id: affiliatedCollegeId } });
        if (!affCollege) {
          return NextResponse.json({ error: 'Invalid affiliated college selected' }, { status: 400 });
        }
        targetCollegeName = affCollege.name;
        targetAffiliatedCollegeId = affCollege.id;
        if (!affCollege.isApproved) {
          forceNeedsReview = true;
        }
      } else if (customCollegeName?.trim()) {
        const trimmedCustom = customCollegeName.trim();

        // Check if typed name matches any constituent campus
        const matchedCampus = allCampuses.find(
          (c) => c.name.toLowerCase() === trimmedCustom.toLowerCase() || c.code.toLowerCase() === trimmedCustom.toLowerCase()
        );
        if (matchedCampus) {
          return NextResponse.json(
            {
              error: `"${trimmedCustom}" is a constituent university campus. Please uncheck "Affiliated College" and select "${matchedCampus.name}" from the Campus dropdown.`,
            },
            { status: 400 }
          );
        }

        // Check if unapproved/approved AffiliatedCollege with matching case-insensitive name exists
        const existingAff = await prisma.affiliatedCollege.findFirst({
          where: { name: { equals: trimmedCustom } },
        });

        if (existingAff) {
          targetAffiliatedCollegeId = existingAff.id;
          targetCollegeName = existingAff.name;
          if (!existingAff.isApproved) {
            forceNeedsReview = true;
          }
        } else {
          // Create new unapproved affiliated college
          const newAff = await prisma.affiliatedCollege.create({
            data: {
              name: trimmedCustom,
              isApproved: false,
              requestedBy: `${name.trim()} (${normalizedEmail})`,
            },
          });
          targetAffiliatedCollegeId = newAff.id;
          targetCollegeName = newAff.name;
          forceNeedsReview = true;
        }
      } else {
        return NextResponse.json({ error: 'Please select or specify an affiliated college' }, { status: 400 });
      }
    } else {
      // Constituent Campus Mode
      if (!campusId) {
        return NextResponse.json({ error: 'Campus selection is required' }, { status: 400 });
      }

      const campus = allCampuses.find((c) => c.id === campusId);
      if (!campus) {
        return NextResponse.json({ error: 'Invalid campus selected' }, { status: 400 });
      }

      targetCampusId = campus.id;
      targetCollegeName = campus.name;
      targetAffiliatedCollegeId = null;
    }

    // PART A: Auto-correct branch to "Computer Applications" if course is BCA or MCA
    const finalBranch = getAutoCorrectedBranch(branch, course);
    const finalCourse = course.trim();

    const academicNeedsReview = await checkAcademicNeedsReview(finalBranch, finalCourse);
    const needsReview = academicNeedsReview || forceNeedsReview;

    const newRequest = await prisma.registrationRequest.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        enrollmentNo: enrollmentNo?.trim() || null,
        batchYear: Number(batchYear),
        branch: finalBranch,
        college: targetCollegeName,
        course: finalCourse,
        phone: phone?.trim() || null,
        campusId: targetCampusId,
        affiliatedCollegeId: targetAffiliatedCollegeId,
        needsReview,
        authProvider,
        providerId: providerId || null,
        passwordHash: passwordHash || null,
        currentRole: currentRole?.trim() || null,
        currentCompany: currentCompany?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        pincode: pincode?.trim() || null,
        city: city?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: 'Registration request submitted successfully.', requestId: newRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('SELF_REGISTER_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

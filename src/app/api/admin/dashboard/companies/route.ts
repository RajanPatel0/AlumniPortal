import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedStaff,
  resolveCampusScope,
  CampusScopeError,
} from '@/lib/auth/staff-auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const staff = await getAuthenticatedStaff();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = Array.isArray(staff.modules) ? (staff.modules as string[]) : [];
    if (staff.role !== 'ADMIN' && !modules.includes('dashboard') && !modules.includes('alumni')) {
      return NextResponse.json({ error: 'Forbidden: Access denied to dashboard' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
    const isExport = searchParams.get('export') === 'true';

    let scopedCampusId: string | null;
    try {
      scopedCampusId = resolveCampusScope(staff, searchParams.get('campusId'));
    } catch (err) {
      if (err instanceof CampusScopeError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    const baseWhere: Record<string, any> = {
      currentCompany: { not: null, notIn: [''] },
    };
    if (scopedCampusId) {
      baseWhere.campusId = scopedCampusId;
    }
    if (search) {
      baseWhere.currentCompany = { contains: search };
    }

    // Total alumni count with valid company in scope for percentage denominator
    const companyTotalAlumni = await prisma.alumni.count({
      where: {
        ...(scopedCampusId ? { campusId: scopedCampusId } : {}),
        currentCompany: { not: null, notIn: [''] },
      },
    });

    const companyGroups = await prisma.alumni.groupBy({
      by: ['currentCompany'],
      where: baseWhere,
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const allFormatted = companyGroups.map((g) => {
      const companyName = g.currentCompany?.trim() || 'Unknown';
      const count = g._count._all;
      const percentage = companyTotalAlumni > 0 ? Number(((count / companyTotalAlumni) * 100).toFixed(1)) : 0;
      return { company: companyName, count, percentage };
    });

    if (isExport) {
      // Sheet 1: Summary
      const summaryRows = allFormatted.map((item) => ({
        'Company Name': item.company,
        'Alumni Count': item.count,
        'Percentage Share (%)': `${item.percentage}%`,
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

      // Sheet 2: Alumni Detail (one row per alumnus)
      const alumniList = await prisma.alumni.findMany({
        where: baseWhere,
        select: {
          currentCompany: true,
          name: true,
          currentRole: true,
          email: true,
          phone: true,
          branch: true,
          batchYear: true,
          city: true,
        },
        orderBy: [{ currentCompany: 'asc' }, { name: 'asc' }],
      });

      const detailRows = alumniList.map((a) => ({
        'Company Name': a.currentCompany || 'Unknown',
        'Alumni Name': a.name,
        'Role / Designation': a.currentRole || '-',
        Email: a.email,
        Phone: a.phone || '-',
        Branch: a.branch || '-',
        'Batch Year': a.batchYear || '-',
        City: a.city || '-',
      }));
      const detailSheet = XLSX.utils.json_to_sheet(detailRows);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Alumni Detail');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="top_companies_export_${Date.now()}.xlsx"`,
        },
      });
    }

    const total = allFormatted.length;
    const skip = (page - 1) * limit;
    const paginatedData = allFormatted.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[GET_ADMIN_DASHBOARD_COMPANIES_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

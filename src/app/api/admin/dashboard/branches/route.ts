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

    const baseWhere: Record<string, any> = {};
    if (scopedCampusId) {
      baseWhere.campusId = scopedCampusId;
    }
    if (search) {
      baseWhere.branch = { contains: search };
    }

    // Denominator for branch percentage calculation
    const scopeTotalAlumni = await prisma.alumni.count({
      where: scopedCampusId ? { campusId: scopedCampusId } : {},
    });

    const branchGroups = await prisma.alumni.groupBy({
      by: ['branch'],
      where: baseWhere,
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const allFormatted = branchGroups.map((g) => {
      const branchName = g.branch?.trim() || 'Unspecified';
      const count = g._count._all;
      const percentage = scopeTotalAlumni > 0 ? Number(((count / scopeTotalAlumni) * 100).toFixed(1)) : 0;
      return { branch: branchName, count, percentage };
    });

    if (isExport) {
      // Sheet 1: Branch Summary
      const summaryRows = allFormatted.map((item) => ({
        'Branch / Department': item.branch,
        'Alumni Count': item.count,
        'Percentage Share (%)': `${item.percentage}%`,
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

      // Sheet 2: Alumni Detail
      const alumniList = await prisma.alumni.findMany({
        where: baseWhere,
        select: {
          branch: true,
          name: true,
          email: true,
          batchYear: true,
          college: true,
        },
        orderBy: [{ branch: 'asc' }, { name: 'asc' }],
      });

      const detailRows = alumniList.map((a) => ({
        'Branch / Department': a.branch || 'Unspecified',
        'Alumni Name': a.name,
        Email: a.email,
        'Batch Year': a.batchYear || '-',
        College: a.college || '-',
      }));
      const detailSheet = XLSX.utils.json_to_sheet(detailRows);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Branch Summary');
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Alumni Detail');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="top_branches_export_${Date.now()}.xlsx"`,
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
    console.error('[GET_ADMIN_DASHBOARD_BRANCHES_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

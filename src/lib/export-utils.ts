import * as XLSX from 'xlsx';
import { BASE_PATH, APP_URL } from '@/lib/api';

export function exportCandidatesToExcel(title: string, candidates: any[]) {
  const sheetData = candidates.map(row => {
    let baseUrl = typeof window !== 'undefined' ? window.location.origin : (APP_URL || '');
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (BASE_PATH && baseUrl.endsWith(BASE_PATH)) {
      baseUrl = baseUrl.slice(0, -BASE_PATH.length);
    }
    const profileUrl = `${baseUrl}${BASE_PATH}/alumni/profile/${row.id}`;

    return {
      Name: row.name,
      Email: row.email,
      'Enrollment No': row.enrollmentNo || '-',
      Course: row.course || '-',
      College: row.college || '-',
      Branch: row.branch || '-',
      'Batch Year': row.batchYear || '-',
      'Profile URL': profileUrl,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
  
  // Clean title for use as file name
  const safeTitle = title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `interested_candidates_${safeTitle}_${Date.now()}.xlsx`);
}

export function exportRsvpsToExcel(title: string, rsvps: any[]) {
  const sheetData = rsvps.map((row) => ({
    'Event Title': row.eventTitle || '-',
    'Event Date': row.eventDate ? new Date(row.eventDate).toLocaleDateString() : '-',
    'Alumni Name': row.alumniName || '-',
    'Alumni Email': row.alumniEmail || '-',
    'Batch Year': row.batchYear || '-',
    Branch: row.branch || '-',
    Course: row.course || '-',
    'Current Role': row.currentRole || '-',
    'Current Company': row.currentCompany || '-',
    'RSVP Status': row.status || '-',
    Message: row.message || '-',
    'Responded At': row.respondedAt ? new Date(row.respondedAt).toLocaleString() : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Event RSVPs');

  const safeTitle = title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  XLSX.writeFile(workbook, `${safeTitle}_${Date.now()}.xlsx`);
}

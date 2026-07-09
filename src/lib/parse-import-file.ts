import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { AlumniImportRow } from '@/types/alumni-import';
import { normalizeHeader, normalizeTextValue } from './import-utils';

function mapHeaderAliases(row: Record<string, unknown>): AlumniImportRow {
  return {
    name: normalizeTextValue(row.name),
    email: normalizeTextValue(row.email),
    batch_year: normalizeTextValue(row.batch_year || row.batchyear || row.year),
    branch: normalizeTextValue(row.branch),
    college: normalizeTextValue(row.college || row.college_name || row.institute),
    course: normalizeTextValue(row.course || row.program) || undefined,
    enrollment_no: normalizeTextValue(row.enrollment_no || row.enrollment || row.roll_no) || undefined,
    phone: normalizeTextValue(row.phone || row.mobile || row.contact_no) || undefined,
  };
}

export async function parseFile(file: File): Promise<AlumniImportRow[]> {
  const buffer = await file.arrayBuffer();
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const result = Papa.parse<AlumniImportRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
    });
    if (result.errors.length) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }
    return result.data.map((row) => mapHeaderAliases(row as unknown as Record<string, unknown>));
  }
  
  // Excel parsing
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, {
    defval: '',
    raw: false,
  });
  
  // Normalize headers (lowercase, underscores)
  const normalizedData = json.map(row => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
      newRow[normalizeHeader(key)] = row[key];
    });
    return mapHeaderAliases(newRow);
  });
  
  return normalizedData;
}
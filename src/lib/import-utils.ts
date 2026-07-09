export function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }
  
  export function validateBatchYear(year: any): number | null {
    const num = parseInt(String(year));
    const currentYear = new Date().getFullYear();
    if (isNaN(num) || num < 1950 || num > currentYear + 5) return null;
    return num;
  }
  
  export function normalizeHeader(header: string): string {
    return header.trim().toLowerCase().replace(/[_\s]+/g, '_');
  }

export function normalizeTextValue(value: unknown): string {
  return String(value ?? '').trim();
}
  
  export function isValidFileType(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
  }
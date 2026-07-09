export interface AlumniImportRow {
    name: string;
    email: string;
    batch_year: string | number;
    branch: string;
    college: string;
    course?: string;
    enrollment_no?: string;
    phone?: string;
  }
  
  export interface ImportResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; email: string; reason: string }>;
    batchId: string;
  }
  
  export interface ImportOptions {
    batchLabel: string;
    file: File;
  }
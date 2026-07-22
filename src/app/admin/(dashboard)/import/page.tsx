'use client';

import { useEffect, useMemo, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { BASE_PATH } from '@/lib/api';
import * as XLSX from 'xlsx';
import { 
  CloudUpload, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  X, 
  Info, 
  Check,
  FileDown
} from 'lucide-react';

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; email: string; reason: string }>;
};

type BatchRow = {
  id: string;
  label: string;
  csvFilename: string | null;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  dbStatus: 'PROCESSING' | 'UPLOADED' | 'INVITED' | 'COMPLETED' | 'PARTIAL_FAILED';
  inviteStatus: 'PENDING' | 'INVITED' | 'REGISTERED';
  invitedCount: number;
  alumniCount: number;
  campusName?: string | null;
  createdAt: string;
  completedAt: string | null;
};

type AlumniRow = {
  id: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  college: string;
  course: string | null;
  enrollmentNo: string | null;
  phone: string | null;
  inviteStatus: 'PENDING' | 'INVITED' | 'REGISTERED' | 'BOUNCED';
  displayStatus: 'PENDING' | 'INVITED' | 'REGISTERED';
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [batchLabel, setBatchLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [tableError, setTableError] = useState('');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [labelFilter, setLabelFilter] = useState('');
  const [debouncedLabelFilter, setDebouncedLabelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [sendingBatchId, setSendingBatchId] = useState<string | null>(null);
  const [remindingBatchId, setRemindingBatchId] = useState<string | null>(null);
  const [modalRows, setModalRows] = useState<AlumniRow[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [modalPages, setModalPages] = useState(1);
  const [modalStatus, setModalStatus] = useState<'ALL' | 'PENDING' | 'INVITED' | 'REGISTERED'>('ALL');
  const [modalSearch, setModalSearch] = useState('');
  const [debouncedModalSearch, setDebouncedModalSearch] = useState('');
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [campusId, setCampusId] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCampusName, setAssignedCampusName] = useState<string | null>(null);
  const [historyCampusFilter, setHistoryCampusFilter] = useState('');

  useEffect(() => {
    axiosClient.get('/api/admin/me')
      .then(res => {
        setUserRole(res.data.user?.role ?? null);
        setAssignedCampusName(res.data.user?.campus?.name ?? null);
      })
      .catch(() => {});
    axiosClient.get('/api/admin/campuses')
      .then(res => setCampuses(res.data))
      .catch(() => {});
  }, []);

  const fetchBatches = async () => {
    setTableLoading(true);
    setTableError('');
    try {
      const params: Record<string, string | number> = {
        label: debouncedLabelFilter,
        status: statusFilter,
        page,
        limit: 8,
      };
      if (userRole === 'ADMIN' && historyCampusFilter) {
        params.campusId = historyCampusFilter;
      }
      const res = await axiosClient.get('/api/admin/invitation-batches', { params });
      setBatches(res.data.data || []);
      setPages(res.data.pagination?.pages || 1);
    } catch (err: any) {
      setTableError(err.response?.data?.error || 'Failed to load upload history');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === null) return;
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, historyCampusFilter, debouncedLabelFilter, userRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLabelFilter(labelFilter);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [labelFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedModalSearch(modalSearch);
      setModalPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [modalSearch]);

  useEffect(() => {
    if (!selectedBatch) return;
    fetchBatchAlumni(selectedBatch.id, 1, modalStatus, debouncedModalSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedModalSearch]);

  const [exportingBatches, setExportingBatches] = useState(false);
  const [exportingAlumni, setExportingAlumni] = useState(false);

  const handleExportBatches = async () => {
    setExportingBatches(true);
    try {
      const params: Record<string, string | number> = {
        label: debouncedLabelFilter,
        status: statusFilter,
        page: 1,
        limit: 50,
      };
      if (userRole === 'ADMIN' && historyCampusFilter) {
        params.campusId = historyCampusFilter;
      }

      const allRows: BatchRow[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const res = await axiosClient.get('/api/admin/invitation-batches', {
          params: { ...params, page: currentPage },
        });
        allRows.push(...(res.data.data || []));
        totalPages = res.data.pagination?.pages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      const sheetData = allRows.map((batch) => ({
        'Upload Label': batch.label,
        Campus: batch.campusName || '-',
        'Invite Status': batch.inviteStatus === 'PENDING' ? 'UPLOADED' : batch.inviteStatus === 'INVITED' ? 'INVITED' : 'COMPLETED',
        Rows: batch.totalCount,
        Invited: batch.invitedCount,
        Success: batch.sentCount,
        Failed: batch.failedCount,
        'Uploaded On': new Date(batch.createdAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload History');
      XLSX.writeFile(workbook, `upload-history-${Date.now()}.xlsx`);
    } catch (err: any) {
      setTableError(err.response?.data?.error || 'Failed to export upload history');
    } finally {
      setExportingBatches(false);
    }
  };

  const handleExportAlumni = async (batch: BatchRow) => {
    setExportingAlumni(true);
    try {
      const allRows: AlumniRow[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const res = await axiosClient.get(`/api/admin/invitation-batches/${batch.id}/alumni`, {
          params: { page: currentPage, limit: 50, status: modalStatus },
        });
        allRows.push(...(res.data.data || []));
        totalPages = res.data.pagination?.pages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      const sheetData = allRows.map((row) => ({
        Name: row.name,
        Email: row.email,
        'Batch Year': row.batchYear,
        Branch: row.branch,
        College: row.college,
        Course: row.course || '-',
        'Enrollment No': row.enrollmentNo || '-',
        Status: row.displayStatus,
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumni');
      XLSX.writeFile(workbook, `${batch.label.replace(/[^a-z0-9]+/gi, '-')}-alumni-${Date.now()}.xlsx`);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to export alumni rows');
    } finally {
      setExportingAlumni(false);
    }
  };

  const fetchBatchAlumni = async (batchId: string, pageNo = 1, status = modalStatus, searchVal = debouncedModalSearch) => {
    setModalLoading(true);
    setModalError('');
    try {
      const res = await axiosClient.get(`/api/admin/invitation-batches/${batchId}/alumni`, {
        params: { page: pageNo, limit: 8, status, search: searchVal },
      });
      setModalRows(res.data.data || []);
      setModalPages(res.data.pagination?.pages || 1);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to fetch alumni rows');
    } finally {
      setModalLoading(false);
    }
  };

  const [remindingAlumniId, setRemindingAlumniId] = useState<string | null>(null);

  const handleSendReminder = async (row: AlumniRow) => {
    if (!selectedBatch) return;
    setRemindingAlumniId(row.id);
    setModalError('');
    const mode = row.inviteStatus === 'INVITED' ? 'remind' : 'invite';
    try {
      await axiosClient.post(`/api/admin/invitation-batches/${selectedBatch.id}/send-invites`, {
        alumniId: row.id,
        mode,
      }, {
        timeout: 300000,
      });
      fetchBatchAlumni(selectedBatch.id, modalPage, modalStatus, debouncedModalSearch);
      fetchBatches();
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setRemindingAlumniId(null);
    }
  };

  const handleSendInvites = async (batch: BatchRow) => {
    setSendingBatchId(batch.id);
    setError('');
    try {
      const res = await axiosClient.post(`/api/admin/invitation-batches/${batch.id}/send-invites`, {
        mode: 'invite',
      }, {
        timeout: 300000,
      });
      setResult({
        success: res.data.sent || 0,
        failed: res.data.failed || 0,
        errors: [],
      });
      fetchBatches();
      if (selectedBatch?.id === batch.id) {
        fetchBatchAlumni(batch.id, modalPage, modalStatus, debouncedModalSearch);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invites');
    } finally {
      setSendingBatchId(null);
    }
  };

  const handleSendBatchReminder = async (batch: BatchRow) => {
    setRemindingBatchId(batch.id);
    setError('');
    try {
      const res = await axiosClient.post(`/api/admin/invitation-batches/${batch.id}/send-invites`, {
        mode: 'remind',
      }, {
        timeout: 300000,
      });
      setResult({
        success: res.data.sent || 0,
        failed: res.data.failed || 0,
        errors: [],
      });
      fetchBatches();
      if (selectedBatch?.id === batch.id) {
        fetchBatchAlumni(batch.id, modalPage, modalStatus, debouncedModalSearch);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reminders');
    } finally {
      setRemindingBatchId(null);
    }
  };

  const statusPillClass = useMemo(
    () => ({
      PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/10',
      INVITED: 'bg-blue-50 text-blue-700 ring-blue-700/10',
      REGISTERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !batchLabel.trim()) {
      setError('Please select a file and enter a batch label');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchLabel', batchLabel);

    if (userRole === 'ADMIN') {
      if (!campusId) {
        setError('Please select a campus');
        return;
      }
      formData.append('campusId', campusId);
    }

    try {
      const res = await axiosClient.post('/api/admin/import-alumni', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.result);
      setFile(null);
      setBatchLabel('');
      setPage(1);
      fetchBatches();
      setCampusId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6 px-4 sm:px-6 lg:px-8 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#012140] p-6 text-white shadow-md border border-gray-800">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="absolute -bottom-10 right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <h1 className="relative text-2xl font-extrabold tracking-tight md:text-3xl">Alumni Import Center</h1>
        <p className="relative mt-2 max-w-4xl text-sm text-gray-300">
          Upload alumni lists in CSV/Excel formats, configure invitation batches, and monitor database population.
        </p>
        {userRole === 'SUB_ADMIN' && assignedCampusName && (
          <p className="relative mt-3 text-xs inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-blue-200">
            <Info size={12} /> Campus Scope: <span className="font-semibold">{assignedCampusName}</span>
          </p>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-8"
        >
          <h2 className="text-lg font-bold text-[#012140] border-b border-gray-100 pb-3">Import Invitation Batch</h2>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Upload Label *</label>
              <input
                type="text"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                placeholder="e.g., B.Tech CSE 2019-2023"
                required
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition"
              />
            </div>
            
            {userRole === 'ADMIN' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700">Select Campus *</label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition"
                >
                  <option value="">Select Target Campus</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data File *</label>
            <label className="flex flex-col items-center justify-center min-h-[140px] cursor-pointer rounded-xl border-2 border-dashed border-gray-300 hover:border-[#012140] bg-gray-50 hover:bg-[#012140]/5 transition duration-300 p-6 text-center group">
              <CloudUpload className="w-10 h-10 text-gray-400 group-hover:text-[#012140] transition mb-2" />
              <p className="text-sm font-semibold text-gray-700">{file ? file.name : 'Choose CSV / XLSX file'}</p>
              <p className="text-xs text-gray-500 mt-1">Supports .csv, .xlsx, .xls</p>
              {file && (
                <span className="mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  Ready to Import
                </span>
              )}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#012140] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#012140]/90 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </form>

        {/* Sidebar Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4 space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FileSpreadsheet className="text-[#012140] w-5 h-5" /> File Specifications
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Required Columns</h3>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-center gap-2"><Check className="text-emerald-600 w-3.5 h-3.5" /> <span className="font-semibold text-gray-800">Name</span> (Full name)</li>
              <li className="flex items-center gap-2"><Check className="text-emerald-600 w-3.5 h-3.5" /> <span className="font-semibold text-gray-800">Email</span> (Unique address)</li>
              <li className="flex items-center gap-2"><Check className="text-emerald-600 w-3.5 h-3.5" /> <span className="font-semibold text-gray-800">Batch-Year</span> (e.g. 2022)</li>
              <li className="flex items-center gap-2"><Check className="text-emerald-600 w-3.5 h-3.5" /> <span className="font-semibold text-gray-800">Branch</span> (e.g. CSE)</li>
              <li className="flex items-center gap-2"><Check className="text-emerald-600 w-3.5 h-3.5" /> <span className="font-semibold text-gray-800">College</span> (Campus acronym)</li>
            </ul>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-4 mb-2">Optional Columns</h3>
            <p className="text-xs text-gray-500">Course, Enrollment-No, Phone</p>
          </div>

          <a
            href={`${BASE_PATH}/example.xlsx`}
            download
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <Download size={16} /> Download Sample Template
          </a>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      
      {/* Import Result Notification */}
      {result && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Import Process Finished</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-600 w-6 h-6 shrink-0" />
              <div>
                <p className="text-xs text-emerald-800 font-medium">Successfully Imported</p>
                <p className="text-lg font-bold text-emerald-900">{result.success} Rows</p>
              </div>
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 flex items-center gap-3">
              <XCircle className="text-rose-600 w-6 h-6 shrink-0" />
              <div>
                <p className="text-xs text-rose-800 font-medium">Validation Failures</p>
                <p className="text-lg font-bold text-rose-900">{result.failed} Rows</p>
              </div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <details className="group border border-gray-150 rounded-lg overflow-hidden">
              <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 select-none hover:bg-gray-100/70 transition">
                View Error Logs ({result.errors.length})
              </summary>
              <pre className="border-t border-gray-100 max-h-60 overflow-auto bg-gray-50 p-4 text-xs font-mono text-gray-600">
                {JSON.stringify(result.errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Upload History list */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Upload History</h2>
          <div className="flex flex-wrap items-center gap-2">
            {userRole === 'ADMIN' && (
              <select
                value={historyCampusFilter}
                onChange={(e) => {
                  setHistoryCampusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition text-slate-800"
              >
                <option value="">All Campuses</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              placeholder="Search by batch label"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition text-slate-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'COMPLETED');
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition text-slate-800"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Uploaded</option>
              <option value="COMPLETED">Invited</option>
            </select>
            <button
              type="button"
              onClick={handleExportBatches}
              disabled={exportingBatches}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100/75 hover:border-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={16} /> Export
            </button>
          </div>
        </div>

        {tableError && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{tableError}</div>}

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Upload Label</th>
                {userRole === 'ADMIN' && <th className="px-6 py-4 font-semibold text-gray-700">Campus</th>}
                <th className="px-6 py-4 font-semibold text-gray-700">Invite Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Rows</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Invited</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Success</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Failed</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Uploaded On</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableLoading ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-t-transparent border-[#012140] rounded-full animate-spin"></div>
                      <span>Loading upload history...</span>
                    </div>
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="px-6 py-8 text-center text-slate-500">No uploads found matching current filters.</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{batch.label}</td>
                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-black">{batch.campusName || '-'}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${statusPillClass[batch.inviteStatus]}`}>
                        {batch.inviteStatus === 'PENDING' ? 'UPLOADED' : batch.inviteStatus === 'INVITED' ? 'INVITED' : 'COMPLETED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{batch.totalCount}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{batch.invitedCount}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">{batch.sentCount}</td>
                    <td className="px-6 py-4 text-rose-600 font-medium">{batch.failedCount}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(batch.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendInvites(batch)}
                          disabled={sendingBatchId === batch.id || remindingBatchId === batch.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                            batch.inviteStatus !== 'PENDING'
                              ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                              : 'border-[#012140]/10 bg-[#012140] text-white hover:bg-[#012140]/90 shadow-sm'
                          }`}
                        >
                          <Send size={12} />
                          {sendingBatchId === batch.id
                            ? 'Sending...'
                            : batch.inviteStatus !== 'PENDING'
                              ? 'Resend Invites'
                              : 'Send Invites'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBatchReminder(batch)}
                          disabled={sendingBatchId === batch.id || remindingBatchId === batch.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
                        >
                          <Send size={12} />
                          {remindingBatchId === batch.id ? 'Reminding...' : 'Remind'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setModalPage(1);
                            setModalStatus('ALL');
                            setModalSearch('');
                            setDebouncedModalSearch('');
                            fetchBatchAlumni(batch.id, 1, 'ALL', '');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-gray-50 shadow-sm transition"
                        >
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 font-medium">Page {page} of {pages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Batch Details overlay Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#012140]">Batch Details: {selectedBatch.label}</h3>
                <p className="text-xs text-gray-500">Review imported alumni records scoped to this upload batch.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportAlumni(selectedBatch)}
                  disabled={exportingAlumni}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  <FileDown size={14} /> {exportingAlumni ? 'Exporting...' : 'Export list'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="text-gray-400 hover:text-gray-600 transition p-1.5"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3">
                <select
                  value={modalStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value as 'ALL' | 'PENDING' | 'INVITED' | 'REGISTERED';
                    setModalStatus(nextStatus);
                    setModalPage(1);
                    fetchBatchAlumni(selectedBatch.id, 1, nextStatus, debouncedModalSearch);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Invite</option>
                  <option value="INVITED">Invited</option>
                  <option value="REGISTERED">Registered</option>
                </select>
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#012140]/10 focus:border-[#012140] transition text-slate-800 w-64"
                />
              </div>

              {modalError && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{modalError}</div>}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Batch Year</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Branch</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">College</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Course</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Enrollment No</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {modalLoading ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          <div className="flex justify-center items-center gap-2">
                            <div className="w-4 h-4 border-2 border-t-transparent border-[#012140] rounded-full animate-spin"></div>
                            <span>Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : modalRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No alumni rows found matching selected filters.</td>
                      </tr>
                    ) : (
                      modalRows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-gray-600">{row.email}</td>
                          <td className="px-4 py-3 text-gray-700">{row.batchYear}</td>
                          <td className="px-4 py-3 text-gray-700">{row.branch}</td>
                          <td className="px-4 py-3 text-gray-700">{row.college}</td>
                          <td className="px-4 py-3 text-gray-700">{row.course || '-'}</td>
                          <td className="px-4 py-3 text-gray-700">{row.enrollmentNo || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
                              row.displayStatus === 'REGISTERED'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                                : row.displayStatus === 'INVITED'
                                  ? 'bg-blue-50 text-blue-700 ring-blue-700/10'
                                  : 'bg-amber-50 text-amber-700 ring-amber-600/10'
                            }`}>
                              {row.displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.inviteStatus !== 'REGISTERED' && (
                              <button
                                type="button"
                                onClick={() => handleSendReminder(row)}
                                disabled={remindingAlumniId === row.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#012140]/10 bg-[#012140] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#012140]/90 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send size={12} />
                                {remindingAlumniId === row.id
                                  ? 'Sending...'
                                  : row.inviteStatus === 'INVITED'
                                    ? 'Remind'
                                    : 'Send Invite'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, modalPage - 1);
                    setModalPage(next);
                    fetchBatchAlumni(selectedBatch.id, next, modalStatus, debouncedModalSearch);
                  }}
                  disabled={modalPage <= 1}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-medium">Page {modalPage} of {modalPages}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(modalPages, modalPage + 1);
                    setModalPage(next);
                    fetchBatchAlumni(selectedBatch.id, next, modalStatus, debouncedModalSearch);
                  }}
                  disabled={modalPage >= modalPages}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
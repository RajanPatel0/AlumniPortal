'use client';

import { useEffect, useMemo, useState } from 'react';
import axiosClient from '@/lib/axios-client';

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
  inviteStatus: 'PENDING' | 'COMPLETED';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [sendingBatchId, setSendingBatchId] = useState<string | null>(null);
  const [modalRows, setModalRows] = useState<AlumniRow[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [modalPages, setModalPages] = useState(1);
  const [modalStatus, setModalStatus] = useState<'ALL' | 'PENDING' | 'INVITED' | 'REGISTERED'>('ALL');
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
        label: labelFilter,
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
  }, [page, statusFilter, historyCampusFilter, userRole]);

  useEffect(() => {
    if (userRole === null) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchBatches();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelFilter, userRole]);

  const fetchBatchAlumni = async (batchId: string, pageNo = 1, status = modalStatus) => {
    setModalLoading(true);
    setModalError('');
    try {
      const res = await axiosClient.get(`/api/admin/invitation-batches/${batchId}/alumni`, {
        params: { page: pageNo, limit: 8, status },
      });
      setModalRows(res.data.data || []);
      setModalPages(res.data.pagination?.pages || 1);
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to fetch alumni rows');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSendInvites = async (batch: BatchRow) => {
    setSendingBatchId(batch.id);
    setError('');
    try {
      const res = await axiosClient.post(`/api/admin/invitation-batches/${batch.id}/send-invites`);
      setResult({
        success: res.data.sent || 0,
        failed: res.data.failed || 0,
        errors: [],
      });
      fetchBatches();
      if (selectedBatch?.id === batch.id) {
        fetchBatchAlumni(batch.id, modalPage, modalStatus);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invites');
    } finally {
      setSendingBatchId(null);
    }
  };

  const statusPillClass = useMemo(
    () => ({
      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <div className="relative overflow-hidden rounded-3xl border border-[#2f5dbf] bg-gradient-to-r from-[#0f2e75] via-[#1f46a3] to-[#cc1f4a] p-6 text-white shadow-xl">
        <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-10 h-44 w-44 rounded-full bg-red-300/20 blur-3xl" />
        <h1 className="relative text-2xl font-bold tracking-tight md:text-3xl">Alumni Import Center</h1>
        <p className="relative mt-2 max-w-4xl text-sm text-blue-50 md:text-base">
          Upload CSV/Excel Files, Validate Data Quality, and Track each Invitation Batch in One Place.
        </p>
        {userRole === 'SUB_ADMIN' && assignedCampusName && (
          <p className="relative mt-2 text-sm text-blue-100">
            Your campus: <span className="font-semibold">{assignedCampusName}</span>
          </p>
        )}
        <div className="relative mt-4 flex items-center gap-2 text-xs text-blue-100">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-300" />
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl xl:col-span-8"
        >
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-800">Upload Label</label>
              <input
                type="text"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                placeholder="e.g., CSE 2019 Batch"
                required
                className="mt-2 w-full rounded-xl border text-slate-800 border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
              />
            </div>
            
            {userRole === 'ADMIN' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800">Select Campus *</label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 text-sm outline-none focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">-- Select Campus --</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-slate-800">Data File</label>
              <label className="mt-2 flex min-h-[84px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-[#4671c9] bg-gradient-to-r from-[#edf3ff] to-[#fff1f5] px-4 py-3 transition duration-300 hover:border-[#cc1f4a]">
                <div>
                  <p className="text-sm font-medium text-slate-700">{file ? file.name : 'Choose CSV/XLSX file'}</p>
                  <p className="text-xs text-slate-500">Supports .csv, .xlsx, .xls</p>
                </div>
                <span className="rounded-lg bg-[#1f46a3] px-3 py-1.5 text-xs font-semibold text-white">Browse</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Required columns: <span className="font-medium text-slate-700">Name, Email, Batch-Year, Branch, Course, College</span>
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#12388f] to-[#cc1f4a] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="text-base font-semibold text-slate-900">Template Checklist</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
            <li>Required: <span className="font-medium text-slate-800">Name</span></li>
            <li>Required: <span className="font-medium text-slate-800">Email</span></li>
            <li>Required: <span className="font-medium text-slate-800">Batch-Year</span></li>
            <li>Required: <span className="font-medium text-slate-800">Branch, Course</span></li>
            <li>Required: <span className="font-medium text-slate-800">College</span></li>
            <li>Optional: Enrollment-No, Phone</li>
          </ul>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Import Result</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">Success: {result.success}</div>
            <div className="rounded-xl bg-rose-50 p-3 text-rose-700">Failed: {result.failed}</div>
          </div>
          {result.errors.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-rose-700">
                View errors ({result.errors.length})
              </summary>
              <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                {JSON.stringify(result.errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Upload History</h2>
          <div className="flex flex-wrap items-center gap-2">
            {userRole === 'ADMIN' && (
              <select
                value={historyCampusFilter}
                onChange={(e) => {
                  setHistoryCampusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border text-slate-800 border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
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
              placeholder="Filter by Upload Label"
              className="w-52 rounded-lg border text-slate-800 border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'COMPLETED');
                setPage(1);
              }}
              className="rounded-lg border text-slate-800 border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All Invite Status</option>
              <option value="PENDING">Uploaded</option>
              <option value="COMPLETED">Invited</option>
            </select>
          </div>
        </div>

        {tableError && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{tableError}</div>}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-100">
              <tr>
                <th className="px-4 py-3">Upload Label</th>
                {userRole === 'ADMIN' && <th className="px-4 py-3">Campus</th>}
                <th className="px-4 py-3">Invite Status</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Invited</th>
                <th className="px-4 py-3">Success</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Uploaded On</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="px-4 py-6 text-center text-slate-500">Loading batches...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="px-4 py-6 text-center text-slate-500">No uploads found for current filters.</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-800">{batch.label}</td>
                    {userRole === 'ADMIN' && (
                      <td className="px-4 py-3 text-slate-600">{batch.campusName || '-'}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass[batch.inviteStatus]}`}>
                        {batch.inviteStatus === 'PENDING' ? 'UPLOADED' : 'INVITED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{batch.totalCount}</td>
                    <td className="px-4 py-3 text-blue-700">{batch.invitedCount}</td>
                    <td className="px-4 py-3 text-emerald-700">{batch.sentCount}</td>
                    <td className="px-4 py-3 text-rose-700">{batch.failedCount}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(batch.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendInvites(batch)}
                          disabled={sendingBatchId === batch.id}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                            batch.inviteStatus === 'COMPLETED'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100'
                              : 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-500 hover:bg-rose-100'
                          }`}
                          aria-label={`Send invites for ${batch.label}`}
                        >
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
                            <path d="M2.5 4.5A1.5 1.5 0 014 3h12a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0116 17H4a1.5 1.5 0 01-1.5-1.5v-11zm2.1-.5L10 8.2 15.4 4H4.6zM16 5.2l-5.7 4.4a.5.5 0 01-.6 0L4 5.2v10.3a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V5.2z" />
                          </svg>
                          {sendingBatchId === batch.id 
                            ? 'Sending...' 
                            : batch.inviteStatus === 'COMPLETED' 
                              ? 'Send Again' 
                              : 'Send'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setModalPage(1);
                            setModalStatus('ALL');
                            fetchBatchAlumni(batch.id, 1, 'ALL');
                          }}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-500 hover:bg-blue-100"
                          aria-label={`View ${batch.label}`}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-600">Page {page} of {pages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#12388f] to-[#cc1f4a] px-5 py-3 text-white">
              <div>
                <h3 className="text-base font-semibold">Batch Details: {selectedBatch.label}</h3>
                <p className="text-xs text-blue-100">Showing uploaded alumni rows for this batch</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatch(null)}
                className="rounded-md border border-white/40 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <select
                  value={modalStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value as 'ALL' | 'PENDING' | 'INVITED' | 'REGISTERED';
                    setModalStatus(nextStatus);
                    setModalPage(1);
                    fetchBatchAlumni(selectedBatch.id, 1, nextStatus);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1f46a3] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Invite</option>
                  <option value="INVITED">Invited</option>
                  <option value="REGISTERED">Registered</option>
                </select>
              </div>

              {modalError && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{modalError}</div>}

              <div className="max-h-[58vh] overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wide text-slate-100">
                    <tr>
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Branch</th>
                      <th className="px-3 py-2.5">College</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading alumni...</td>
                      </tr>
                    ) : modalRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No alumni rows for selected filter.</td>
                      </tr>
                    ) : (
                      modalRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                          <td className="px-3 py-2.5 text-slate-700">{row.email}</td>
                          <td className="px-3 py-2.5 text-slate-700">{row.branch}</td>
                          <td className="px-3 py-2.5 text-slate-700">{row.college}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              row.displayStatus === 'REGISTERED'
                                ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                                : row.displayStatus === 'INVITED'
                                  ? 'border-blue-200 bg-blue-100 text-blue-700'
                                  : 'border-amber-200 bg-amber-100 text-amber-700'
                            }`}>
                              {row.displayStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, modalPage - 1);
                    setModalPage(next);
                    fetchBatchAlumni(selectedBatch.id, next, modalStatus);
                  }}
                  disabled={modalPage <= 1}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-600">Page {modalPage} of {modalPages}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(modalPages, modalPage + 1);
                    setModalPage(next);
                    fetchBatchAlumni(selectedBatch.id, next, modalStatus);
                  }}
                  disabled={modalPage >= modalPages}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
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
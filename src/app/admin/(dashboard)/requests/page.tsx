'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";
import { toast } from 'react-hot-toast';
import { isBcaOrMca } from '@/lib/academic-options';
import { Mail, Search, Download, Trash2, CheckCircle2, Users, Loader2 } from 'lucide-react';

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string;
  batchYear: number;
  branch: string;
  college: string;
  course?: string | null;
  status: string;
  createdAt: string;
  campusId?: string | null;
  campus?: { id: string; name: string } | null;
  affiliatedCollegeId?: string | null;
  affiliatedCollege?: { id: string; name: string } | null;
  currentRole?: string | null;
  currentCompany?: string | null;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface AffiliatedCollege {
  id: string;
  name: string;
}

export default function AdminRequestsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'subscribers'>('requests');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Newsletter states
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [deletingSubscriberId, setDeletingSubscriberId] = useState<string | null>(null);

  // Curated options
  const [branches, setBranches] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [approvedColleges, setApprovedColleges] = useState<AffiliatedCollege[]>([]);

  // Local state for inline edits per request
  const [edits, setEdits] = useState<Record<string, { branch: string; course: string; campusId: string; isAffiliated: boolean; affiliatedCollegeId: string }>>({});

  // States for sending individual registration link
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchOptions();
    fetchCampuses();
    fetchAffiliatedColleges();
    fetchNewsletters();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await apiFetch('/alumni/options');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  const fetchCampuses = async () => {
    try {
      const res = await apiFetch('/campuses');
      if (res.ok) {
        const data = await res.json();
        setCampuses(data.campuses || data || []);
      }
    } catch (err) {
      console.error('Failed to load campuses:', err);
    }
  };

  const fetchAffiliatedColleges = async () => {
    try {
      const res = await apiFetch('/admin/affiliated-colleges');
      if (res.ok) {
        const data = await res.json();
        setApprovedColleges(data.approved || []);
      }
    } catch (err) {
      console.error('Failed to load affiliated colleges:', err);
    }
  };

  const fetchNewsletters = async (searchQuery = '') => {
    setNewsletterLoading(true);
    try {
      const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await apiFetch(`/admin/newsletters${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSearchSubscribers = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNewsletters(newsletterSearch);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm('Remove this email from the newsletter subscription list?')) return;

    setDeletingSubscriberId(id);
    try {
      const res = await apiFetch(`/admin/newsletters?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Subscriber removed successfully');
        setSubscribers((prev) => prev.filter((sub) => sub.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove subscriber');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error removing subscriber');
    } finally {
      setDeletingSubscriberId(null);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error('No subscribers available to export');
      return;
    }

    const headers = ['ID', 'Email', 'Subscribed Date'];
    const rows = subscribers.map((sub) => [
      sub.id,
      `"${sub.email}"`,
      `"${new Date(sub.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${subscribers.length} subscribers to CSV!`);
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setSendingLink(true);
    try {
      const res = await apiFetch('/admin/registration-requests/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Invitation link sent successfully!');
        setInviteName('');
        setInviteEmail('');
      } else {
        toast.error(data.error || 'Failed to send registration link');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error sending registration link');
    } finally {
      setSendingLink(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await apiFetch('/admin/registration-requests');

      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        const textError = await res.text();
        console.error('Server returned non-JSON/Error page:', textError);
        toast.error(`Failed to load data (${res.status}). Verify API GET route exists.`);
        setRequests([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        const pending = data.filter((r: RegistrationRequest) => r.status === 'PENDING');
        setRequests(pending);

        // Initialize local edit state
        const initialEdits: Record<string, { branch: string; course: string; campusId: string; isAffiliated: boolean; affiliatedCollegeId: string }> = {};
        pending.forEach((r) => {
          initialEdits[r.id] = {
            branch: r.branch || '',
            course: r.course || '',
            campusId: r.campusId || r.campus?.id || '',
            isAffiliated: !!r.affiliatedCollegeId,
            affiliatedCollegeId: r.affiliatedCollegeId || '',
          };
        });
        setEdits(initialEdits);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      toast.error('Network error fetching registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (id: string, field: string, value: string | boolean) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    if (!requestId) return;
    setProcessingId(requestId);
    
    try {
      const requestEdit = edits[requestId];
      const payload: Record<string, unknown> = {};
      if (action === 'reject') {
        payload.rejectionReason = 'Information verification failed';
      } else if (action === 'approve' && requestEdit) {
        payload.branch = requestEdit.branch;
        payload.course = requestEdit.course;
        payload.campusId = requestEdit.campusId;
      }

      const res = await apiFetch(`/admin/registration-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const fallbackText = await res.text();
        console.error('Expected JSON but received raw response:', fallbackText);
        toast.error(`Server routing mismatch or error (${res.status}). Action aborted.`);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `Request ${action}ed successfully`);
        setRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
      } else {
        toast.error(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Error performing ${action} action:`, err);
      toast.error('Internal connection or client processing error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-medium text-black animate-pulse">
          Loading dashboard registrations...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Intake &amp; Subscriptions</h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Manage incoming alumni joining verification and community newsletter subscriptions
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-white text-[#003D7A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} />
              <span>Registration Requests</span>
              <span className="bg-blue-100 text-[#003D7A] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscribers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-white text-[#C41E3A] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail size={15} />
              <span>Newsletter Subscribers</span>
              <span className="bg-rose-100 text-[#C41E3A] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {subscribers.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: REGISTRATION REQUESTS ── */}
        {activeTab === 'requests' && (
          <div>
            {/* Send Individual Registration Link Form */}
            <div className="mb-8 bg-white rounded-2xl shadow-sm border p-6 border-slate-200">
              <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#003D7A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send Registration Link to Individual Alumni
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Directly email the registration form link to alumni without database upload
              </p>

              <form
                onSubmit={handleSendLink}
                className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#012140]">Full Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Rajan Patel"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-black placeholder-gray-400 focus:border-[#003D7A] focus:outline-none focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#012140]">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. rajan@example.com"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-black placeholder-gray-400 focus:border-[#003D7A] focus:outline-none focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingLink}
                  className="w-full bg-[#003D7A] hover:bg-[#012140] text-white text-sm font-bold py-2 px-4 rounded-xl transition disabled:opacity-50 h-[38px] flex items-center justify-center cursor-pointer"
                >
                  {sendingLink ? 'Sending Link...' : 'Send Link'}
                </button>
              </form>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border">
                <p className="text-gray-500 font-medium">No pending registration requests found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-black">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 font-semibold text-gray-700">Name / Email</th>
                        <th className="p-4 font-semibold text-gray-700 min-w-[280px]">Academic Details (Editable)</th>
                        <th className="p-4 font-semibold text-gray-700 min-w-[200px]">Campus / College (Editable)</th>
                        <th className="p-4 font-semibold text-gray-700">Professional Info</th>
                        <th className="p-4 font-semibold text-gray-700">Submitted</th>
                        <th className="p-4 font-semibold text-gray-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.map((request) => {
                        const currentEdit = edits[request.id] || { branch: request.branch || '', course: request.course || '', campusId: request.campus?.id || '', isAffiliated: !!request.affiliatedCollegeId, affiliatedCollegeId: request.affiliatedCollegeId || '' };
                        const isBcaMca = isBcaOrMca(currentEdit.course);
                        const isBranchMismatch = isBcaMca && (currentEdit.branch || '').trim().toLowerCase() !== 'computer applications';
                        const selectedCampus = campuses.find((c) => c.id === currentEdit.campusId);

                        return (
                          <tr key={request.id} className="hover:bg-gray-50/70 transition">
                            <td className="p-4 align-top">
                              <div className="font-bold text-gray-900">{request.name}</div>
                              <div className="text-sm text-gray-500">{request.email}</div>
                            </td>
                            <td className="p-4 align-top text-sm space-y-2">
                              {/* Course dropdown */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">Course</label>
                                <select
                                  value={currentEdit.course}
                                  onChange={(e) => handleEditChange(request.id, 'course', e.target.value)}
                                  className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#003D7A]"
                                >
                                  <option value="">-- Select Course --</option>
                                  {courses.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                  {currentEdit.course && !courses.includes(currentEdit.course) && (
                                    <option value={currentEdit.course}>{currentEdit.course} (submitted)</option>
                                  )}
                                </select>
                              </div>

                              {/* Branch dropdown */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">Branch</label>
                                <select
                                  value={currentEdit.branch}
                                  onChange={(e) => handleEditChange(request.id, 'branch', e.target.value)}
                                  className={`w-full mt-0.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-gray-900 bg-white focus:outline-none ${
                                    isBranchMismatch ? 'border-amber-500 ring-1 ring-amber-400' : 'border-slate-300 focus:border-[#003D7A]'
                                  }`}
                                >
                                  <option value="">-- Select Branch --</option>
                                  {branches.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                  {currentEdit.branch && !branches.includes(currentEdit.branch) && (
                                    <option value={currentEdit.branch}>{currentEdit.branch} (submitted)</option>
                                  )}
                                </select>
                              </div>

                              {/* BCA/MCA -> Computer Applications Rule Alert Banner */}
                              {isBranchMismatch && (
                                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                                  <p className="font-semibold flex items-center gap-1 text-[11px]">
                                    <span>💡</span> Course ({currentEdit.course}) implies branch should be &quot;Computer Applications&quot;
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleEditChange(request.id, 'branch', 'Computer Applications')}
                                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] transition cursor-pointer"
                                  >
                                    Fix Branch to &quot;Computer Applications&quot;
                                  </button>
                                </div>
                              )}

                              <div className="text-gray-500 text-xs">Batch Year: {request.batchYear}</div>
                              <div className="text-xs text-gray-400 font-mono">Roll No: {request.enrollmentNo || 'N/A'}</div>
                            </td>

                            {/* Campus / College editable column */}
                            <td className="p-4 align-top text-sm space-y-2">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase">Campus</label>
                                <select
                                  value={currentEdit.campusId}
                                  onChange={(e) => {
                                    handleEditChange(request.id, 'campusId', e.target.value);
                                  }}
                                  className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#003D7A]"
                                >
                                  <option value="">-- Select Campus --</option>
                                  {campuses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Affiliated College — only if request was submitted as affiliated */}
                              {(request.affiliatedCollegeId || currentEdit.isAffiliated) && (
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase">Affiliated College</label>
                                  <select
                                    value={currentEdit.affiliatedCollegeId}
                                    onChange={(e) => handleEditChange(request.id, 'affiliatedCollegeId', e.target.value)}
                                    className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#003D7A]"
                                  >
                                    <option value="">-- No Affiliated College --</option>
                                    {approvedColleges.map((a) => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                    {request.affiliatedCollege && !approvedColleges.find((a) => a.id === request.affiliatedCollegeId) && (
                                      <option value={request.affiliatedCollegeId || ''}>{request.affiliatedCollege.name} (pending)</option>
                                    )}
                                  </select>
                                </div>
                              )}

                              {/* College text readonly display */}
                              <div className="text-[11px] text-gray-500">
                                <span className="font-semibold">College:</span> {request.college || selectedCampus?.name || '—'}
                              </div>
                            </td>

                            <td className="p-4 align-top text-sm">
                              {request.currentRole || request.currentCompany ? (
                                <>
                                  <div className="font-semibold text-gray-800">{request.currentRole || '—'}</div>
                                  <div className="text-xs text-gray-500">{request.currentCompany || '—'}</div>
                                </>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Not specified</span>
                              )}
                            </td>
                            <td className="p-4 align-top text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="p-4 align-top text-right space-x-2 whitespace-nowrap">
                              <button
                                disabled={!!processingId}
                                onClick={() => handleAction(request.id, 'approve')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                              >
                                {processingId === request.id ? '...' : 'Approve'}
                              </button>
                              <button
                                disabled={!!processingId}
                                onClick={() => handleAction(request.id, 'reject')}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: NEWSLETTER SUBSCRIBERS ── */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Subscribers</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{subscribers.length}</p>
                </div>
                <div className="w-12 h-12 bg-rose-50 text-[#C41E3A] rounded-2xl flex items-center justify-center">
                  <Mail size={22} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto Confirmation Email</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Brevo API Active
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Export</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Ready for Mailchimp/CSV</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-[#003D7A] hover:bg-[#012140] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Search & Actions Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubscribers} className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={newsletterSearch}
                  onChange={(e) => {
                    setNewsletterSearch(e.target.value);
                    if (e.target.value === '') fetchNewsletters('');
                  }}
                  placeholder="Search subscriber email address..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:outline-none focus:border-[#003D7A] focus:ring-1 focus:ring-blue-100"
                />
              </form>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => fetchNewsletters(newsletterSearch)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {newsletterLoading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-[#C41E3A] hover:bg-[#a3182f] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Subscribers High-Density Industry Standard Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-black">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Subscriber Email</th>
                      <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Subscribed Date &amp; Time</th>
                      <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {newsletterLoading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#003D7A]" />
                          Fetching newsletter subscribers...
                        </td>
                      </tr>
                    ) : subscribers.length > 0 ? (
                      subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-rose-50 text-[#C41E3A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                <Mail size={15} />
                              </div>
                              <span className="font-bold text-slate-900">{sub.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-600">
                            {new Date(sub.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Subscriber
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              disabled={deletingSubscriberId === sub.id}
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition border border-rose-100 inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              title="Unsubscribe / Remove"
                            >
                              {deletingSubscriberId === sub.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 font-medium">
                          No newsletter subscribers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
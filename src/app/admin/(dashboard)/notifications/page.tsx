'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  Bell,
  Send,
  Users,
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Lock,
  Globe,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  type: string;
  title: string;
  body: string;
  url?: string | null;
  filter: Record<string, unknown>;
  pushStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalTargets: number | null;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function NotificationsPage() {
  // Current user / role info
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assignedCampus, setAssignedCampus] = useState<{ id: string; name: string } | null>(null);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);

  // Filter state
  const [campusFilter, setCampusFilter] = useState('all');
  const [batchYear, setBatchYear] = useState('');
  const [branch, setBranch] = useState('');
  const [course, setCourse] = useState('');
  const [inviteStatus, setInviteStatus] = useState('REGISTERED');

  // Live count state
  const [countLoading, setCountLoading] = useState(false);
  const [audienceCount, setAudienceCount] = useState<{ totalAlumni: number; subscribedDevices: number }>({
    totalAlumni: 0,
    subscribedDevices: 0,
  });

  // Compose form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/alumni/alumni/feed');
  const [type, setType] = useState('ADMIN_ANNOUNCEMENT');
  const [channel, setChannel] = useState('PUSH_AND_INAPP');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // History table state
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Academic options for dropdowns
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);

  // 1. Fetch staff profile and campuses
  useEffect(() => {
    apiFetch('/admin/me')
      .then((res) => res.json())
      .then((data) => {
        const role = data.user?.role ?? null;
        setUserRole(role);
        if (data.user?.campus) {
          setAssignedCampus(data.user.campus);
          if (role !== 'ADMIN') {
            setCampusFilter(data.user.campus.id);
          }
        }
      })
      .catch(() => {});

    apiFetch('/admin/campuses')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCampuses(Array.isArray(data) ? data : []))
      .catch(() => {});

    apiFetch('/admin/academic-options')
      .then((res) => (res.ok ? res.json() : { options: [] }))
      .then((data) => {
        if (Array.isArray(data.options)) {
          const branches = data.options.filter((o: any) => o.type === 'BRANCH').map((o: any) => o.value);
          const courses = data.options.filter((o: any) => o.type === 'COURSE').map((o: any) => o.value);
          setBranchOptions(branches);
          setCourseOptions(courses);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Calculate live audience count (debounced)
  const calculateAudience = useCallback(async () => {
    setCountLoading(true);
    try {
      const effectiveCampusId = userRole === 'ADMIN' ? (campusFilter === 'all' ? null : campusFilter) : assignedCampus?.id;
      const res = await apiFetch('/admin/notifications/campaigns/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: {
            campusId: effectiveCampusId,
            batchYear: batchYear || null,
            branch: branch || null,
            course: course || null,
            inviteStatus: inviteStatus,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAudienceCount({
          totalAlumni: data.totalAlumni || 0,
          subscribedDevices: data.subscribedDevices || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching count:', err);
    } finally {
      setCountLoading(false);
    }
  }, [userRole, campusFilter, assignedCampus, batchYear, branch, course, inviteStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateAudience();
    }, 350);
    return () => clearTimeout(timer);
  }, [calculateAudience]);

  // 3. Fetch past campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await apiFetch(`/admin/notifications/campaigns?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // 4. Auto-poll history if any campaign is PENDING or PROCESSING
  useEffect(() => {
    const hasActiveCampaigns = campaigns.some(
      (c) => c.pushStatus === 'PENDING' || c.pushStatus === 'PROCESSING'
    );

    if (!hasActiveCampaigns) return;

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 4000);

    return () => clearInterval(interval);
  }, [campaigns, fetchCampaigns]);

  // 5. Submit Campaign
  const handleSendCampaign = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter both title and body for the notification.');
      return;
    }

    if (audienceCount.totalAlumni === 0) {
      toast.error('The selected filter matches 0 alumni.');
      return;
    }

    setSubmitting(true);
    try {
      const effectiveCampusId = userRole === 'ADMIN' ? (campusFilter === 'all' ? null : campusFilter) : assignedCampus?.id;

      const res = await apiFetch('/admin/notifications/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          url,
          type,
          channel,
          filter: {
            campusId: effectiveCampusId,
            batchYear: batchYear || null,
            branch: branch || null,
            course: course || null,
            inviteStatus: inviteStatus,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit campaign');
      }

      toast.success('Campaign queued! Background worker will process delivery.');
      setTitle('');
      setBody('');
      setShowConfirmModal(false);
      fetchCampaigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting campaign';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#003D7A]/10 text-[#003D7A]">
              <Bell className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Push Notification Campaigns</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Compose and broadcast targeted OS-level push notifications to alumni devices via background batch worker.
          </p>
        </div>

        <button
          onClick={() => {
            fetchCampaigns();
            calculateAudience();
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition self-start md:self-auto"
        >
          <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Filter Builder & Compose Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audience Filter Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#003D7A]" />
                <h2 className="text-base font-bold text-slate-800">1. Target Audience Filter</h2>
              </div>

              {/* Live Count Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-800">
                {countLoading ? (
                  <RefreshCw size={12} className="animate-spin text-blue-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
                <span>
                  {countLoading ? 'Calculating...' : `${audienceCount.totalAlumni.toLocaleString()} Alumni`}
                </span>
                <span className="text-blue-400 font-normal">|</span>
                <span className="text-blue-700 font-semibold flex items-center gap-1">
                  <Smartphone size={11} /> {audienceCount.subscribedDevices.toLocaleString()} Devices
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campus Scope Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Campus Scope</span>
                  {userRole !== 'ADMIN' && (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                      <Lock size={10} /> Locked to your campus
                    </span>
                  )}
                </label>

                {userRole === 'ADMIN' ? (
                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  >
                    <option value="all" className="text-slate-900 bg-white">🌐 All Campuses (University-wide)</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                        🏛️ {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900">
                    <Lock size={13} className="text-slate-500" />
                    <span className="truncate">{assignedCampus?.name || 'Assigned Campus'}</span>
                  </div>
                )}
              </div>

              {/* Batch Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch / Passout Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2024 or 2021-28 and blank for all"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Branch / Department</label>
                {branchOptions.length > 0 ? (
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  >
                    <option value="" className="text-slate-900 bg-white">All Branches</option>
                    {branchOptions.map((b) => (
                      <option key={b} value={b} className="text-slate-900 bg-white">
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. CSE, Mechanical"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  />
                )}
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Degree / Course</label>
                {courseOptions.length > 0 ? (
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  >
                    <option value="" className="text-slate-900 bg-white">All Courses</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c} className="text-slate-900 bg-white">
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. B.Tech, MBA, MCA"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  />
                )}
              </div>

              {/* Registration Status */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Alumni Registration Status</label>
                <select
                  value={inviteStatus}
                  onChange={(e) => setInviteStatus(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                >
                  <option value="REGISTERED" className="text-slate-900 bg-white">🟢 Registered Users Only (Recommended)</option>
                  <option value="" className="text-slate-900 bg-white">🌐 All Alumni (Active + Future Registrants)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compose Form Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-5 h-5 text-[#C41E3A]" />
              <h2 className="text-base font-bold text-slate-800">2. Compose Notification Message</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Alumni Meet 2026 Registration Open"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  className="w-full text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Message Body</label>
                <textarea
                  placeholder="Enter the push message text..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm leading-relaxed"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>Keep body under 200 characters for optimal mobile OS display.</span>
                  <span>{body.length} / 500</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Landing URL (Relative)</label>
                  <input
                    type="text"
                    placeholder="/alumni/events or /alumni/feed"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notification Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  >
                    <option value="ADMIN_ANNOUNCEMENT" className="text-slate-900 bg-white">Admin Announcement</option>
                    <option value="ANALYTICS_MILESTONE" className="text-slate-900 bg-white">Milestone / Achievement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#003D7A] focus:outline-none transition shadow-sm"
                  >
                    <option value="PUSH_AND_INAPP" className="text-slate-900 bg-white">In-App + Web Push</option>
                    <option value="INAPP_ONLY" className="text-slate-900 bg-white">In-App Only (Quiet)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!title.trim() || !body.trim() || audienceCount.totalAlumni === 0 || submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#003D7A] to-[#C41E3A] hover:opacity-95 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  <span>Queue Broadcast to {audienceCount.totalAlumni.toLocaleString()} Alumni</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & History */}
        <div className="lg:col-span-5 space-y-6">
          {/* OS Push Notification Preview */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles size={13} className="text-amber-400" /> OS Notification Preview
              </span>
              <span>Now</span>
            </div>

            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 flex items-start gap-3.5 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-[#003D7A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-md">
                PTU
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IKGPTU Alumni</span>
                  <span className="text-[10px] text-slate-500">just now</span>
                </div>
                <h4 className="text-sm font-extrabold text-white mt-0.5 truncate">
                  {title || 'Announcement Title'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                  {body || 'Your broadcast message body will be displayed here on user devices.'}
                </p>
                {url && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-2 font-semibold">
                    <ExternalLink size={10} /> Link: {url}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-blue-50/60 rounded-3xl p-5 border border-blue-100 text-xs text-blue-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-blue-950">
              <Layers size={14} className="text-blue-600" /> Asynchronous Campaign Delivery
            </h4>
            <p className="text-blue-800/80 leading-relaxed">
              When you submit a campaign, it enters the MySQL queue as <span className="font-bold">PENDING</span>. The background Windows Service worker picks it up and delivers messages in bounded 500-user batches with resumable cursors.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#003D7A]" />
            <h2 className="text-lg font-bold text-slate-900">Campaign History & Progress</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Auto-refreshes active campaigns</span>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[#003D7A]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No notification campaigns submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Title & Message</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Audience</th>
                  <th className="pb-3 px-3">Progress</th>
                  <th className="pb-3 px-3">Created By</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const total = c.totalTargets || 0;
                  const processed = c.sentCount + c.failedCount;
                  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{c.title}</div>
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">{c.body}</div>
                        {c.url && (
                          <div className="text-[10px] text-blue-600 truncate mt-0.5">{c.url}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {c.pushStatus === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            <Clock size={11} /> PENDING
                          </span>
                        )}
                        {c.pushStatus === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 animate-pulse">
                            <RefreshCw size={11} className="animate-spin" /> PROCESSING
                          </span>
                        )}
                        {c.pushStatus === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> COMPLETED
                          </span>
                        )}
                        {c.pushStatus === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                            <AlertCircle size={11} /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-700">
                        {total.toLocaleString()} targets
                      </td>
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{c.sentCount} sent</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              c.pushStatus === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : c.pushStatus === 'PROCESSING'
                                ? 'bg-blue-600'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        {c.failedCount > 0 && (
                          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                            {c.failedCount} failed / expired
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {c.createdBy?.name || 'Staff'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Confirm Push Broadcast</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You are about to queue a push notification to{' '}
                <span className="font-extrabold text-slate-800">
                  ~{audienceCount.totalAlumni.toLocaleString()} alumni
                </span>
                . This action cannot be paused once batch delivery begins.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
              <div className="font-bold text-slate-800 truncate">Title: {title}</div>
              <div className="text-slate-600 line-clamp-2">Body: {body}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#003D7A] to-[#C41E3A] rounded-xl shadow transition disabled:opacity-50"
              >
                {submitting ? 'Queueing...' : 'Yes, Queue Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

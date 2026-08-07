'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { LifeBuoy, Search, Mail, Phone, Calendar, CheckCircle2, Clock, AlertCircle, X, MessageSquare, Tag } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNo: string;
  name: string;
  email: string;
  phone?: string | null;
  enrollmentNo?: string | null;
  category: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNotes?: string | null;
  createdAt: string;
}

export default function AdminSupportDeskPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async (searchQuery = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery) params.set('q', searchQuery);

      const res = await apiFetch(`/admin/support-tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.counts) setCounts(data.counts);
      } else {
        toast.error('Failed to load support tickets');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error fetching support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(search);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string, notes?: string) => {
    setUpdating(true);
    try {
      const res = await apiFetch('/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
          adminNotes: notes !== undefined ? notes : adminNotes,
        }),
      });

      if (res.ok) {
        toast.success(`Ticket status updated to ${newStatus}`);
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as any, adminNotes: notes !== undefined ? notes : adminNotes } : t))
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus as any, adminNotes: notes !== undefined ? notes : adminNotes } : null));
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error updating ticket');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <LifeBuoy className="text-[#C41E3A]" size={24} /> Alumni Support Desk
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Manage and resolve alumni inquiries, degree verifications, and technical support tickets
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{counts.total}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-bold">
              <LifeBuoy size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{counts.pending}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-black text-sky-600 mt-1">{counts.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
              <AlertCircle size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{counts.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#003D7A] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value === '') fetchTickets('');
              }}
              placeholder="Search ticket #, name, subject..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-black focus:outline-none focus:border-[#003D7A]"
            />
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-black">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Ticket #</th>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Alumni Contact</th>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Category &amp; Subject</th>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider">Submitted</th>
                  <th className="p-4 font-bold text-xs text-slate-700 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                      Loading support tickets...
                    </td>
                  </tr>
                ) : tickets.length > 0 ? (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 align-top">
                        <span className="font-mono text-xs font-extrabold text-[#C41E3A] bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg">
                          {t.ticketNo}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.email}</div>
                        {t.phone && <div className="text-[11px] text-slate-400 font-mono">{t.phone}</div>}
                      </td>
                      <td className="p-4 align-top">
                        <span className="inline-block text-[10px] font-extrabold text-[#003D7A] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                          {t.category}
                        </span>
                        <div className="font-bold text-slate-800 text-xs line-clamp-1">{t.subject}</div>
                      </td>
                      <td className="p-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            t.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : t.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === 'PENDING'
                                ? 'bg-amber-500'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-sky-500'
                                : t.status === 'RESOLVED'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 align-top text-xs text-slate-500 font-medium">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 align-top text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setAdminNotes(t.adminNotes || '');
                          }}
                          className="px-3 py-1.5 bg-[#003D7A] hover:bg-[#012140] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                      No support tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden p-6 sm:p-8 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-sm font-black text-[#C41E3A] bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
                  {selectedTicket.ticketNo}
                </span>
                <span className="text-xs font-extrabold text-[#003D7A] bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl uppercase">
                  {selectedTicket.category}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-2">{selectedTicket.subject}</h2>

              {/* Contact Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Alumni Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedTicket.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Email Address</span>
                  <a href={`mailto:${selectedTicket.email}`} className="font-bold text-blue-600 hover:underline">
                    {selectedTicket.email}
                  </a>
                </div>
                {selectedTicket.phone && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.phone}</span>
                  </div>
                )}
                {selectedTicket.enrollmentNo && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Roll / Reg No</span>
                    <span className="font-semibold text-slate-800">{selectedTicket.enrollmentNo}</span>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Status Updater Buttons */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Update Ticket Status</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'PENDING')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTicket.status === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    Set Pending
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTicket.status === 'IN_PROGRESS'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                    }`}
                  >
                    Set In Progress
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTicket.status === 'RESOLVED'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Set Resolved ✓
                  </button>
                  <button
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTicket.status === 'CLOSED'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Set Closed
                  </button>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admin Internal Notes / Resolution Log</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter internal staff notes or action taken..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-black focus:outline-none focus:border-[#003D7A] resize-none mb-3"
                />
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status, adminNotes)}
                  className="px-4 py-2 bg-[#003D7A] hover:bg-[#012140] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  Save Admin Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

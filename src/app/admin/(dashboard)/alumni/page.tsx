'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, Download, Eye, Mail, 
  ChevronLeft, ChevronRight, RefreshCw, 
  Users, GraduationCap, MapPin, Briefcase,
  CheckCircle, Clock, XCircle, UserCheck, UserX, X, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AlumniData {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string | null;
  batchYear: number;
  branch: string;
  college: string;
  course: string | null;
  phone: string | null;
  inviteStatus: string;
  isRegistered: boolean;
  displayStatus: string;
  invitedAt: string | null;
  registeredAt: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  city: string | null;
  originalInvitedEmail: string | null;
  googleId?: string | null;
  linkedinId?: string | null;
  campus?: { id: string; name: string } | null;
  avatarUrl?: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AlumniPage() {
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniData | null>(null);
  const [showModal, setShowModal] = useState(false); 
  const [alumni, setAlumni] = useState<AlumniData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  
  // Filter states
  const [search, setSearch] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [branch, setBranch] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Available filter options (for dropdowns)
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [campusFilter, setCampusFilter] = useState('');
  const [assignedCampusName, setAssignedCampusName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        setUserRole(data.user?.role ?? null);
        setAssignedCampusName(data.user?.campus?.name ?? null);
      })
      .catch(() => {});

    fetch('/api/admin/campuses')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCampuses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    if (search) params.set('search', search);
    if (batchYear) params.set('batchYear', batchYear);
    if (branch) params.set('branch', branch);
    if (course) params.set('course', course);
    if (status) params.set('status', status);
    if (userRole === 'ADMIN' && campusFilter) params.set('campusId', campusFilter);

    try {
      const res = await fetch(`/api/admin/alumni/all?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const alumniData = data.data as AlumniData[];
      setAlumni(alumniData);
      setPagination(data.pagination);

      if (data.filterOptions) {
        setAvailableBranches(data.filterOptions.branches || []);
        setAvailableCourses(data.filterOptions.courses || []);
        setAvailableYears(data.filterOptions.years || []);
      }
    } catch (err) {
      toast.error('Failed to load alumni data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, batchYear, branch, course, status, campusFilter, userRole]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const resetFilters = () => {
    setSearch('');
    setBatchYear('');
    setBranch('');
    setCourse('');
    setStatus('');
    if (userRole === 'ADMIN') setCampusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Enrollment No', 'Batch Year', 'Branch', 'Course', 'Phone', 'Status', 'Current Role', 'Company', 'City'];
    const rows = alumni.map(a => [
      a.name, a.email, a.enrollmentNo || '', a.batchYear, a.branch, a.course || '', a.phone || '',
      a.displayStatus, a.currentRole || '', a.currentCompany || '', a.city || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_export_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle size={12}/> Registered</span>;
      case 'INVITED':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Mail size={12}/> Invited</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-[#2f5dbf] bg-gradient-to-r from-[#0f2e75] via-[#1f46a3] to-[#cc1f4a] p-6 text-white shadow-xl">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Admin Module</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Alumni Management</h1>
            {userRole === 'SUB_ADMIN' && assignedCampusName && (
              <p className="mt-2 text-sm text-blue-100">
                Viewing alumni for: <span className="font-semibold">{assignedCampusName}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/alumni/feed"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-white/40 bg-white/15 hover:bg-white/25 text-white rounded-xl transition font-semibold text-sm backdrop-blur-sm"
            >
              <ExternalLink size={16}/> Enter Alumni Portal
            </Link>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 border border-white bg-[#012140] text-white rounded-xl hover:bg-[#012140]/90 transition"
            >
              <Download size={18}/> Export CSV
            </button>
            <button
              onClick={fetchAlumni}
              className="flex items-center gap-2 px-4 py-2 border border-white bg-[#012140] text-white rounded-xl hover:bg-[#012140]/90 transition"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/> Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-[#012140] shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18}/>
            <input
              type="text"
              placeholder="Search by name, email, enrollment, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border text-black border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-2 focus:ring-[#012140]/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${
              showFilters ? 'bg-[#012140] text-white' : 'border border-[#012140] text-[#012140] hover:bg-[#012140]/5'
            }`}
          >
            <Filter size={18}/> Filters
            {(batchYear || branch || course || status || campusFilter) && (
              <span className="ml-1 w-5 h-5 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center">!</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className={`mt-5 pt-5 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 ${userRole === 'ADMIN' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
            {userRole === 'ADMIN' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Campus</label>
                <select
                  value={campusFilter}
                  onChange={(e) => {
                    setCampusFilter(e.target.value);
                    setBatchYear('');
                    setBranch('');
                    setCourse('');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 text-[#012140] rounded-lg focus:outline-none focus:border-[#012140]"
                >
                  <option value="">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Batch Year</label>
              <select
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-[#012140] rounded-lg focus:outline-none focus:border-[#012140]"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-[#012140] rounded-lg focus:outline-none focus:border-[#012140]"
              >
                <option value="">All Branches</option>
                {availableBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-[#012140] rounded-lg focus:outline-none focus:border-[#012140]"
              >
                <option value="">All Courses</option>
                {availableCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-[#012140] rounded-lg focus:outline-none focus:border-[#012140]"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="INVITED">Invited</option>
                <option value="REGISTERED">Registered</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 border border-gray-300 text-[#012140] text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-l-4 border-[#012140] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#012140]">{pagination.total}</p>
              <p className="text-xs text-gray-500">Total Alumni</p>
            </div>
            <Users size={28} className="text-[#012140]/30"/>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-yellow-500 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{alumni.filter(a => a.displayStatus === 'PENDING').length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <Clock size={28} className="text-yellow-500/30"/>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-blue-500 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{alumni.filter(a => a.displayStatus === 'INVITED').length}</p>
              <p className="text-xs text-gray-500">Invited</p>
            </div>
            <Mail size={28} className="text-blue-500/30"/>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-green-500 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{alumni.filter(a => a.displayStatus === 'REGISTERED').length}</p>
              <p className="text-xs text-gray-500">Registered</p>
            </div>
            <UserCheck size={28} className="text-green-500/30"/>
          </div>
        </div>
      </div>

      {/* Alumni Table */}
      <div className="bg-white rounded-xl border border-[#012140] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#012140]/5 border-b border-[#012140]/10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">#</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Photo</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Batch</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Branch</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Course</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Role/Company</th>
                <th className="px-4 py-3 text-left font-semibold text-[#012140]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-[#012140] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-2 text-gray-500">Loading alumni data...</p>
                  </td>
                </tr>
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <UserX size={48} className="mx-auto text-gray-300 mb-2"/>
                    No alumni found matching your criteria.
                  </td>
                </tr>
              ) : (
                alumni.map((alum, index) => (
                  <tr key={alum.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#012140] to-[#C41E3A] text-white flex items-center justify-center font-bold text-[11px] shadow-sm overflow-hidden flex-shrink-0">
                        {alum.avatarUrl ? (
                          <img src={alum.avatarUrl} alt={alum.name} className="w-full h-full object-cover" />
                        ) : (
                          alum.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{alum.name}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{alum.email}</td>
                    <td className="px-4 py-3 text-gray-600">{alum.batchYear}</td>
                    <td className="px-4 py-3 text-gray-600">{alum.branch}</td>
                    <td className="px-4 py-3 text-gray-600">{alum.course || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(alum.displayStatus)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {alum.currentRole && alum.currentCompany
                        ? `${alum.currentRole} (${alum.currentCompany})`
                        : alum.currentRole || alum.currentCompany || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedAlumni(alum);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-[#012140] hover:bg-[#012140]/10 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={18}/>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Alumni Detail Modal */}
          {showModal && selectedAlumni && (
            <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}>
                {/* Modal Banner */}
                <div className="h-28 bg-gradient-to-r from-[#012140] via-[#1a4ea3] to-[#C41E3A] relative" />
                
                {/* Modal Header */}
                <div className="px-6 pb-6 relative flex flex-col items-center -mt-14 border-b border-slate-100">
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-tr from-[#012140] to-[#C41E3A] text-white flex items-center justify-center font-bold text-3xl shadow-md overflow-hidden mb-3">
                    {selectedAlumni.avatarUrl ? (
                      <img src={selectedAlumni.avatarUrl} alt={selectedAlumni.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedAlumni.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    )}
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-1.5">
                    {selectedAlumni.name}
                  </h2>
                  <p className="text-sm font-semibold text-[#012140] mt-1 text-center">
                    {selectedAlumni.currentRole || 'Alumni'} {selectedAlumni.currentCompany ? `at ${selectedAlumni.currentCompany}` : ''}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {selectedAlumni.city || 'Location not specified'}
                  </p>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[50vh] overflow-y-auto space-y-6">
                  {/* Grid details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-black">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</label>
                      <p className="font-semibold text-slate-800 break-all">{selectedAlumni.email}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</label>
                      <p className="font-semibold text-slate-800">{selectedAlumni.phone || '-'}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Academic details</label>
                      <p className="font-semibold text-slate-800">{selectedAlumni.course || 'Degree'} in {selectedAlumni.branch}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Class of {selectedAlumni.batchYear} • {selectedAlumni.college}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Campus Association</label>
                      <p className="font-semibold text-[#012140]">{selectedAlumni.campus?.name || '-'}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enrollment Number</label>
                      <p className="font-semibold text-slate-800">{selectedAlumni.enrollmentNo || '-'}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Status</label>
                      <div className="mt-0.5">{getStatusBadge(selectedAlumni.displayStatus)}</div>
                    </div>
                  </div>

                  {/* Metadata Audit */}
                  <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                    <div>
                      <p>Invited: {selectedAlumni.invitedAt ? new Date(selectedAlumni.invitedAt).toLocaleDateString() : '-'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Original invitation email: {selectedAlumni.originalInvitedEmail || '-'}</p>
                    </div>
                    <div>
                      <p>Registered: {selectedAlumni.registeredAt ? new Date(selectedAlumni.registeredAt).toLocaleDateString() : '-'}</p>
                      {selectedAlumni.googleId && <p className="text-[10px] text-slate-400 font-medium">Connected Google OAuth</p>}
                      {selectedAlumni.linkedinId && <p className="text-[10px] text-slate-400 font-medium">Connected LinkedIn OAuth</p>}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
                  <a
                    href={`/alumni/profile/${selectedAlumni.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2.5 bg-[#012140] hover:bg-[#012140]/90 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={13}/> View Full Profile
                  </a>
                  <a
                    href="/alumni/feed"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2.5 bg-gradient-to-r from-[#1a4ea3] to-[#003D7A] hover:opacity-90 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={13}/> Enter Alumni Portal
                  </a>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="px-4 py-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
              <span className="ml-4">Total: {pagination.total} records</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft size={18}/>
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail view modal would go here – optional, you can implement on click of the eye icon */}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";
import { toast } from 'react-hot-toast';
import { Database, GitMerge, CheckCircle, AlertTriangle, RefreshCw, Plus, ToggleLeft, ToggleRight, ListChecks, FileText } from 'lucide-react';

interface VariantCount {
  branch?: string;
  course?: string;
  count: number;
}

interface BcaMcaPreviewRow {
  id: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  course: string;
  campus?: { name: string } | null;
}

interface NeedsReviewRow {
  id: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  course?: string | null;
  currentCompany?: string | null;
  campus?: { name: string } | null;
}

interface AcademicOptionItem {
  id: string;
  type: string; // 'BRANCH' | 'COURSE'
  value: string;
  isActive: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function DataNormalizationPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state from API
  const [branches, setBranches] = useState<VariantCount[]>([]);
  const [courses, setCourses] = useState<VariantCount[]>([]);
  const [bcaMcaMismatchCount, setBcaMcaMismatchCount] = useState(0);
  const [bcaMcaMismatchRows, setBcaMcaMismatchRows] = useState<BcaMcaPreviewRow[]>([]);
  const [needsReviewAlumni, setNeedsReviewAlumni] = useState<NeedsReviewRow[]>([]);
  const [needsReviewRequests, setNeedsReviewRequests] = useState<NeedsReviewRow[]>([]);
  const [allAcademicOptions, setAllAcademicOptions] = useState<AcademicOptionItem[]>([]);

  // Section 0: New Academic Option Creation Form
  const [newOptionType, setNewOptionType] = useState<'BRANCH' | 'COURSE'>('BRANCH');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [addingOption, setAddingOption] = useState(false);
  const [activeTabOptions, setActiveTabOptions] = useState<'BRANCH' | 'COURSE'>('BRANCH');

  // Section 1: Merge State & Pagination
  const [mergeType, setMergeType] = useState<'BRANCH' | 'COURSE'>('BRANCH');
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [targetValue, setTargetValue] = useState<string>('');
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);
  const [merging, setMerging] = useState(false);
  const [variantsPage, setVariantsPage] = useState(1);

  // Section 2: BCA/MCA Fix State & Pagination
  const [fixConfirmOpen, setFixConfirmOpen] = useState(false);
  const [fixingBcaMca, setFixingBcaMca] = useState(false);
  const [bcaMcaPage, setBcaMcaPage] = useState(1);

  // Section 3: Resolve Review State & Pagination
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reviewEdits, setReviewEdits] = useState<Record<string, { branch: string; course: string; currentCompany: string }>>({});
  const [alumniReviewPage, setAlumniReviewPage] = useState(1);
  const [requestsReviewPage, setRequestsReviewPage] = useState(1);

  // Section 4: Unified College Normalization Tool State
  const [collegeClusters, setCollegeClusters] = useState<{
    collegeText: string;
    alumniCount: number;
    requestCount: number;
    totalCount: number;
    suggestedCampusId: string | null;
    suggestedCampusName: string;
  }[]>([]);
  const [campusesList, setCampusesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [approvedAffiliatedList, setApprovedAffiliatedList] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedCollegeVariants, setSelectedCollegeVariants] = useState<string[]>([]);
  const [collegeActionType, setCollegeActionType] = useState<'MAP_TO_CAMPUS' | 'TREAT_AS_AFFILIATED'>('MAP_TO_CAMPUS');
  const [selectedTargetCampusId, setSelectedTargetCampusId] = useState('');
  const [affiliatedMode, setAffiliatedMode] = useState<'CREATE_NEW' | 'MERGE_EXISTING'>('CREATE_NEW');
  const [newAffiliatedName, setNewAffiliatedName] = useState('');
  const [selectedTargetAffiliatedId, setSelectedTargetAffiliatedId] = useState('');
  const [executingCollegeNorm, setExecutingCollegeNorm] = useState(false);
  const [collegeNormPage, setCollegeNormPage] = useState(1);

  // Section 4b: Pending Affiliated College Requests (from self-registration)
  const [pendingColleges, setPendingColleges] = useState<{
    id: string;
    name: string;
    requestedBy: string;
    createdAt: string;
    alumniCount: number;
    requestCount: number;
    totalReferencing: number;
  }[]>([]);

  // Merge Audit Logs State
  const [mergeLogs, setMergeLogs] = useState<{
    id: string;
    field: string;
    fromValues: string[];
    toValue: string;
    affectedCount: number;
    performedBy: string;
    createdAt: string;
  }[]>([]);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchCollegeClusters();
    fetchAffiliatedColleges();
    fetchMergeLogs();
  }, []);

  const fetchMergeLogs = async () => {
    try {
      const res = await apiFetch('/admin/normalize/merge-logs');
      if (res.ok) {
        const data = await res.json();
        setMergeLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch merge logs:', err);
    }
  };

  const handleCleanupOrphans = async () => {
    setCleaningOrphans(true);
    try {
      const res = await apiFetch('/admin/affiliated-colleges/cleanup-orphans', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cleanup failed');
      toast.success(data.message || 'Orphaned entries cleaned up!');
      fetchAffiliatedColleges();
      fetchCollegeClusters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cleanup orphaned entries');
    } finally {
      setCleaningOrphans(false);
    }
  };

  const fetchCollegeClusters = async () => {
    try {
      const res = await apiFetch('/admin/normalize/colleges');
      if (res.ok) {
        const data = await res.json();
        setCollegeClusters(data.clusters || []);
        setCampusesList(data.campuses || []);
        setApprovedAffiliatedList(data.approvedAffiliatedColleges || []);
      }
    } catch (err) {
      console.error('Failed to fetch college clusters:', err);
    }
  };

  const fetchAffiliatedColleges = async () => {
    try {
      const res = await apiFetch('/admin/affiliated-colleges');
      if (res.ok) {
        const data = await res.json();
        setPendingColleges(data.pending || []);
      }
    } catch (err) {
      console.error('Failed to fetch affiliated colleges queue:', err);
    }
  };

  const handleExecuteCollegeNorm = async () => {
    if (selectedCollegeVariants.length === 0) {
      toast.error('Please select at least one college variant to normalize.');
      return;
    }

    if (collegeActionType === 'MAP_TO_CAMPUS' && !selectedTargetCampusId) {
      toast.error('Please select a target constituent campus.');
      return;
    }

    if (collegeActionType === 'TREAT_AS_AFFILIATED') {
      if (affiliatedMode === 'CREATE_NEW' && !newAffiliatedName.trim()) {
        toast.error('Please enter the name for the new approved affiliated college.');
        return;
      }
      if (affiliatedMode === 'MERGE_EXISTING' && !selectedTargetAffiliatedId) {
        toast.error('Please select an existing approved affiliated college.');
        return;
      }
    }

    setExecutingCollegeNorm(true);
    try {
      const res = await apiFetch('/admin/normalize/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedColleges: selectedCollegeVariants,
          actionType: collegeActionType,
          targetCampusId: selectedTargetCampusId,
          affiliatedMode,
          newCollegeName: newAffiliatedName.trim(),
          targetAffiliatedId: selectedTargetAffiliatedId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Normalization failed');

      toast.success(data.message || 'College normalization completed!');
      setSelectedCollegeVariants([]);
      setNewAffiliatedName('');
      fetchCollegeClusters();
      fetchAffiliatedColleges();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to normalize colleges');
    } finally {
      setExecutingCollegeNorm(false);
    }
  };



  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const [statsRes, optionsRes] = await Promise.all([
        apiFetch('/admin/normalize/stats'),
        apiFetch('/admin/academic-options'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to load normalization stats');
      const statsData = await statsRes.json();
      
      let optionsData = { options: [] };
      if (optionsRes.ok) {
        optionsData = await optionsRes.json();
      }

      setBranches(statsData.branches || []);
      setCourses(statsData.courses || []);
      setBcaMcaMismatchCount(statsData.bcaMcaMismatchCount || 0);
      setBcaMcaMismatchRows(statsData.bcaMcaMismatchRows || []);
      setNeedsReviewAlumni(statsData.needsReviewAlumni || []);
      setNeedsReviewRequests(statsData.needsReviewRequests || []);
      setAllAcademicOptions(optionsData.options || []);

      // Initialize review edit state
      const edits: Record<string, { branch: string; course: string; currentCompany: string }> = {};
      (statsData.needsReviewAlumni || []).forEach((r: NeedsReviewRow) => {
        edits[`ALUMNI_${r.id}`] = {
          branch: r.branch || '',
          course: r.course || '',
          currentCompany: r.currentCompany || '',
        };
      });
      (statsData.needsReviewRequests || []).forEach((r: NeedsReviewRow) => {
        edits[`REQUEST_${r.id}`] = {
          branch: r.branch || '',
          course: r.course || '',
          currentCompany: r.currentCompany || '',
        };
      });
      setReviewEdits(edits);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load normalization data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const activeCanonicalBranches = allAcademicOptions
    .filter((o) => o.type === 'BRANCH' && o.isActive)
    .map((o) => o.value);
  const activeCanonicalCourses = allAcademicOptions
    .filter((o) => o.type === 'COURSE' && o.isActive)
    .map((o) => o.value);

  // Toggle active status of an AcademicOption
  const handleToggleOptionActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch('/admin/academic-options', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Option updated.');
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to update option.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating option.');
    }
  };

  // Add new canonical option directly
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionValue.trim()) return;

    setAddingOption(true);
    try {
      const res = await apiFetch('/admin/academic-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newOptionType, value: newOptionValue.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Option added!');
        setNewOptionValue('');
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to add option');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding option');
    } finally {
      setAddingOption(false);
    }
  };

  // Variant selection toggling for Merge Tool
  const toggleVariantSelection = (value: string) => {
    setSelectedVariants((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleExecuteMerge = async () => {
    if (selectedVariants.length === 0 || !targetValue.trim()) return;
    setMerging(true);
    try {
      const res = await apiFetch('/admin/normalize/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mergeType,
          sourceValues: selectedVariants,
          targetValue: targetValue.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Merge completed successfully!');
        setSelectedVariants([]);
        setTargetValue('');
        setMergeConfirmOpen(false);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to merge variants');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error executing merge');
    } finally {
      setMerging(false);
    }
  };

  const handleFixBcaMca = async () => {
    setFixingBcaMca(true);
    try {
      const res = await apiFetch('/admin/normalize/fix-bca-mca', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'BCA/MCA rows corrected to Computer Applications!');
        setFixConfirmOpen(false);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to apply bulk correction');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error applying bulk correction');
    } finally {
      setFixingBcaMca(false);
    }
  };

  const handleResolveReview = async (model: 'ALUMNI' | 'REGISTRATION_REQUEST', id: string) => {
    const key = `${model === 'ALUMNI' ? 'ALUMNI' : 'REQUEST'}_${id}`;
    const edit = reviewEdits[key];
    if (!edit || !edit.branch.trim()) {
      toast.error('Branch is required.');
      return;
    }

    setResolvingId(id);
    try {
      const res = await apiFetch('/admin/normalize/resolve-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          id,
          branch: edit.branch,
          course: edit.course,
          currentCompany: edit.currentCompany,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Needs-review item resolved!');
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to resolve item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error resolving item');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-medium text-black animate-pulse">
          Loading Data Normalization Tool...
        </p>
      </div>
    );
  }

  const currentVariantsList = mergeType === 'BRANCH' ? branches : courses;
  const currentCanonicalList = mergeType === 'BRANCH' ? activeCanonicalBranches : activeCanonicalCourses;

  // Pagination helper
  const paginate = <T,>(items: T[], page: number, pageSize: number = ITEMS_PER_PAGE) => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  const totalVariantPages = Math.ceil(currentVariantsList.length / ITEMS_PER_PAGE) || 1;
  const totalBcaMcaPages = Math.ceil(bcaMcaMismatchRows.length / ITEMS_PER_PAGE) || 1;
  const totalAlumniReviewPages = Math.ceil(needsReviewAlumni.length / ITEMS_PER_PAGE) || 1;
  const totalRequestsReviewPages = Math.ceil(needsReviewRequests.length / ITEMS_PER_PAGE) || 1;
  
  const AUDIT_ITEMS_PER_PAGE = 15;
  const totalAuditPages = Math.ceil(mergeLogs.length / AUDIT_ITEMS_PER_PAGE) || 1;

  const paginatedVariants = paginate(currentVariantsList, variantsPage);
  const paginatedBcaMca = paginate(bcaMcaMismatchRows, bcaMcaPage);
  const paginatedAlumniReview = paginate(needsReviewAlumni, alumniReviewPage);
  const paginatedRequestsReview = paginate(needsReviewRequests, requestsReviewPage);
  const paginatedMergeLogs = paginate(mergeLogs, auditPage, AUDIT_ITEMS_PER_PAGE);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#012140] text-white p-6 rounded-2xl shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <Database className="text-[#d61c1c]" size={24} />
              <h1 className="text-2xl font-bold">Admin Data Normalization</h1>
            </div>
            <p className="text-sm text-white/70 mt-1">
              Manage canonical options, consolidate historical spelling variants, enforce degree-to-branch rules, and resolve review queues.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 0: Curated Academic Options Management */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ListChecks className="text-[#003D7A]" size={20} />
                0. Curated Academic Options Management
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                View, add, or toggle active status of canonical branches and courses used in all dropdowns site-wide.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTabOptions('BRANCH')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTabOptions === 'BRANCH' ? 'bg-[#003D7A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Branches ({allAcademicOptions.filter(o => o.type === 'BRANCH').length})
              </button>
              <button
                onClick={() => setActiveTabOptions('COURSE')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTabOptions === 'COURSE' ? 'bg-[#003D7A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Courses ({allAcademicOptions.filter(o => o.type === 'COURSE').length})
              </button>
            </div>
          </div>

          {/* Add New Option Form */}
          <form onSubmit={handleAddOption} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-44">
              <label className="block text-xs font-bold text-gray-700 uppercase">Option Type</label>
              <select
                value={newOptionType}
                onChange={(e) => setNewOptionType(e.target.value as 'BRANCH' | 'COURSE')}
                className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#003D7A]"
              >
                <option value="BRANCH">BRANCH</option>
                <option value="COURSE">COURSE</option>
              </select>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-700 uppercase">New Canonical Name (e.g. &quot;Physics&quot;, &quot;BAMS&quot;)</label>
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="Type new course or branch name..."
                required
                className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#003D7A]"
              />
            </div>

            <button
              type="submit"
              disabled={addingOption || !newOptionValue.trim()}
              className="w-full sm:w-auto bg-[#003D7A] hover:bg-[#012140] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              {addingOption ? 'Adding...' : 'Add Active Option'}
            </button>
          </form>

          {/* Table of Existing Options */}
          <div className="border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b sticky top-0 font-bold text-gray-700">
                <tr>
                  <th className="p-3">Canonical Value</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Toggle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAcademicOptions
                  .filter((o) => o.type === activeTabOptions)
                  .map((opt) => (
                    <tr key={opt.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-gray-900">{opt.value}</td>
                      <td className="p-3 font-semibold text-gray-600">{opt.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          opt.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {opt.isActive ? 'Active (Canonical)' : 'Inactive / Retired'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleOptionActive(opt.id, opt.isActive)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#003D7A]"
                        >
                          {opt.isActive ? <ToggleRight className="text-emerald-600" size={20} /> : <ToggleLeft className="text-slate-400" size={20} />}
                          <span>{opt.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 1: Branch & Course Variant Merge Tool */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <GitMerge className="text-[#003D7A]" size={20} />
                1. Historical Variant Merge Tool
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Multi-select raw historical strings and merge them into one canonical AcademicOption value.
              </p>
            </div>

            {/* Switch between Branch and Course */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setMergeType('BRANCH');
                  setSelectedVariants([]);
                  setTargetValue('');
                  setVariantsPage(1);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  mergeType === 'BRANCH' ? 'bg-[#003D7A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Branch Variants ({branches.length})
              </button>
              <button
                onClick={() => {
                  setMergeType('COURSE');
                  setSelectedVariants([]);
                  setTargetValue('');
                  setVariantsPage(1);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  mergeType === 'COURSE' ? 'bg-[#003D7A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Course Variants ({courses.length})
              </button>
            </div>
          </div>

          {/* Merge Controls & Target Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Selected Source Variants ({selectedVariants.length})
              </label>
              <div className="mt-1 min-h-[42px] p-2 bg-white border rounded-xl flex flex-wrap gap-2 text-xs">
                {selectedVariants.length === 0 ? (
                  <span className="text-gray-400 italic">Click checkmarks below to select variants to merge...</span>
                ) : (
                  selectedVariants.map((v) => (
                    <span key={v} className="bg-blue-100 text-[#003D7A] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      {v}
                      <button onClick={() => toggleVariantSelection(v)} className="hover:text-red-600 font-bold ml-1">×</button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">
                Target Canonical {mergeType}
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#003D7A]"
              >
                <option value="">-- Choose Canonical Target --</option>
                {currentCanonicalList.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>

              <button
                disabled={selectedVariants.length === 0 || !targetValue.trim()}
                onClick={() => setMergeConfirmOpen(true)}
                className="mt-3 w-full bg-[#003D7A] hover:bg-[#012140] text-white font-bold py-2 px-4 rounded-xl text-xs transition disabled:opacity-40 shadow-sm cursor-pointer"
              >
                Preview & Merge Selected ({selectedVariants.length})
              </button>
            </div>
          </div>

          {/* Variants Table with Checkboxes */}
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b font-bold text-gray-700">
                <tr>
                  <th className="p-3 w-12 text-center">Select</th>
                  <th className="p-3">Existing Raw String</th>
                  <th className="p-3 text-right">Alumni Row Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedVariants.map((item) => {
                  const val = (mergeType === 'BRANCH' ? item.branch : item.course) || '';
                  const isSelected = selectedVariants.includes(val);
                  return (
                    <tr key={val} className={`hover:bg-slate-50 transition ${isSelected ? 'bg-blue-50/60' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleVariantSelection(val)}
                          className="w-4 h-4 text-[#003D7A] rounded border-gray-300 focus:ring-[#003D7A] cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-semibold text-gray-800">{val}</td>
                      <td className="p-3 text-right font-bold text-gray-900">{item.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalVariantPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {(variantsPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(variantsPage * ITEMS_PER_PAGE, currentVariantsList.length)} of {currentVariantsList.length} variants</span>
              <div className="flex gap-2">
                <button
                  disabled={variantsPage <= 1}
                  onClick={() => setVariantsPage((p) => p - 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="py-1 font-semibold text-gray-700">Page {variantsPage} of {totalVariantPages}</span>
                <button
                  disabled={variantsPage >= totalVariantPages}
                  onClick={() => setVariantsPage((p) => p + 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: BCA/MCA → Computer Applications Bulk Correction */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={20} />
                2. BCA / MCA → &quot;Computer Applications&quot; Rule Correction
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Enforce rule: any alumnus with course = BCA or MCA must have branch = &quot;Computer Applications&quot;.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1.5 rounded-full">
                {bcaMcaMismatchCount} Rows Requiring Correction
              </span>
              <button
                disabled={bcaMcaMismatchCount === 0}
                onClick={() => setFixConfirmOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-40 shadow-sm cursor-pointer"
              >
                Preview & Apply Bulk Fix
              </button>
            </div>
          </div>

          {bcaMcaMismatchCount === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <p className="text-sm font-semibold text-emerald-800">
                ✅ All BCA/MCA records currently match branch &quot;Computer Applications&quot;!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-3">
                Previewing affected rows ({bcaMcaMismatchRows.length} shown):
              </p>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b font-bold text-gray-700">
                    <tr>
                      <th className="p-3">Alumnus Name / Email</th>
                      <th className="p-3">Batch Year</th>
                      <th className="p-3">Current Course</th>
                      <th className="p-3">Current Branch</th>
                      <th className="p-3 text-right">Corrected Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedBcaMca.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{r.name}</div>
                          <div className="text-gray-500 text-[11px]">{r.email}</div>
                        </td>
                        <td className="p-3 font-semibold text-gray-700">{r.batchYear}</td>
                        <td className="p-3 font-semibold text-emerald-700">{r.course}</td>
                        <td className="p-3 font-semibold text-red-600 line-through">{r.branch}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">Computer Applications</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalBcaMcaPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3">
                  <span>Showing {(bcaMcaPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(bcaMcaPage * ITEMS_PER_PAGE, bcaMcaMismatchRows.length)} of {bcaMcaMismatchRows.length} preview rows</span>
                  <div className="flex gap-2">
                    <button
                      disabled={bcaMcaPage <= 1}
                      onClick={() => setBcaMcaPage((p) => p - 1)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="py-1 font-semibold text-gray-700">Page {bcaMcaPage} of {totalBcaMcaPages}</span>
                    <button
                      disabled={bcaMcaPage >= totalBcaMcaPages}
                      onClick={() => setBcaMcaPage((p) => p + 1)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 3: Needs-Review Queue */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={20} />
              3. Needs-Review Flagged Queue ({needsReviewAlumni.length + needsReviewRequests.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Flagged entries containing unrecognised branch/course values that didn&apos;t match curated options during submission or import. Resolving an item automatically activates its values in Academic Options.
            </p>
          </div>

          {needsReviewAlumni.length === 0 && needsReviewRequests.length === 0 ? (
            <div className="p-8 text-center bg-blue-50/50 border border-blue-100 rounded-xl">
              <p className="text-sm font-semibold text-[#003D7A]">
                🎉 No unflagged needsReview items pending administrative resolution.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Alumni Table */}
              {needsReviewAlumni.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">
                    Alumni Table Flagged Items ({needsReviewAlumni.length})
                  </h3>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b font-bold text-gray-700">
                        <tr>
                          <th className="p-3">Name / Email</th>
                          <th className="p-3">Batch</th>
                          <th className="p-3">Edit Course</th>
                          <th className="p-3">Edit Branch</th>
                          <th className="p-3">Company</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedAlumniReview.map((r) => {
                          const key = `ALUMNI_${r.id}`;
                          const edit = reviewEdits[key] || { branch: r.branch || '', course: r.course || '', currentCompany: r.currentCompany || '' };
                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-bold text-gray-900">{r.name}</div>
                                <div className="text-gray-500 text-[11px]">{r.email}</div>
                              </td>
                              <td className="p-3 font-semibold text-gray-700">{r.batchYear}</td>
                              <td className="p-3">
                                <select
                                  value={edit.course}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], course: e.target.value },
                                    }))
                                  }
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                >
                                  <option value="">-- Course --</option>
                                  {activeCanonicalCourses.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                  {edit.course && !activeCanonicalCourses.includes(edit.course) && (
                                    <option value={edit.course}>{edit.course} (custom / new)</option>
                                  )}
                                </select>
                              </td>
                              <td className="p-3">
                                <select
                                  value={edit.branch}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], branch: e.target.value },
                                    }))
                                  }
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                >
                                  <option value="">-- Branch --</option>
                                  {activeCanonicalBranches.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                  {edit.branch && !activeCanonicalBranches.includes(edit.branch) && (
                                    <option value={edit.branch}>{edit.branch} (custom / new)</option>
                                  )}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={edit.currentCompany}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], currentCompany: e.target.value },
                                    }))
                                  }
                                  placeholder="Company"
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  disabled={resolvingId === r.id}
                                  onClick={() => handleResolveReview('ALUMNI', r.id)}
                                  className="bg-[#003D7A] hover:bg-[#012140] text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition disabled:opacity-50 shadow-sm cursor-pointer"
                                >
                                  {resolvingId === r.id ? '...' : 'Resolve'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalAlumniReviewPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <span>Showing {(alumniReviewPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(alumniReviewPage * ITEMS_PER_PAGE, needsReviewAlumni.length)} of {needsReviewAlumni.length} alumni review items</span>
                      <div className="flex gap-2">
                        <button
                          disabled={alumniReviewPage <= 1}
                          onClick={() => setAlumniReviewPage((p) => p - 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                        >
                          ← Prev
                        </button>
                        <span className="py-1 font-semibold text-gray-700">Page {alumniReviewPage} of {totalAlumniReviewPages}</span>
                        <button
                          disabled={alumniReviewPage >= totalAlumniReviewPages}
                          onClick={() => setAlumniReviewPage((p) => p + 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Registration Request Table */}
              {needsReviewRequests.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">
                    Pending Registration Requests Flagged Items ({needsReviewRequests.length})
                  </h3>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b font-bold text-gray-700">
                        <tr>
                          <th className="p-3">Name / Email</th>
                          <th className="p-3">Batch</th>
                          <th className="p-3">Edit Course</th>
                          <th className="p-3">Edit Branch</th>
                          <th className="p-3">Company</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedRequestsReview.map((r) => {
                          const key = `REQUEST_${r.id}`;
                          const edit = reviewEdits[key] || { branch: r.branch || '', course: r.course || '', currentCompany: r.currentCompany || '' };
                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="p-3">
                                <div className="font-bold text-gray-900">{r.name}</div>
                                <div className="text-gray-500 text-[11px]">{r.email}</div>
                              </td>
                              <td className="p-3 font-semibold text-gray-700">{r.batchYear}</td>
                              <td className="p-3">
                                <select
                                  value={edit.course}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], course: e.target.value },
                                    }))
                                  }
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                >
                                  <option value="">-- Course --</option>
                                  {activeCanonicalCourses.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                  {edit.course && !activeCanonicalCourses.includes(edit.course) && (
                                    <option value={edit.course}>{edit.course} (custom / new)</option>
                                  )}
                                </select>
                              </td>
                              <td className="p-3">
                                <select
                                  value={edit.branch}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], branch: e.target.value },
                                    }))
                                  }
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                >
                                  <option value="">-- Branch --</option>
                                  {activeCanonicalBranches.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                  {edit.branch && !activeCanonicalBranches.includes(edit.branch) && (
                                    <option value={edit.branch}>{edit.branch} (custom / new)</option>
                                  )}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={edit.currentCompany}
                                  onChange={(e) =>
                                    setReviewEdits((prev) => ({
                                      ...prev,
                                      [key]: { ...prev[key], currentCompany: e.target.value },
                                    }))
                                  }
                                  placeholder="Company"
                                  className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-gray-900"
                                />
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  disabled={resolvingId === r.id}
                                  onClick={() => handleResolveReview('REGISTRATION_REQUEST', r.id)}
                                  className="bg-[#003D7A] hover:bg-[#012140] text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition disabled:opacity-50 shadow-sm cursor-pointer"
                                >
                                  {resolvingId === r.id ? '...' : 'Resolve'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {totalRequestsReviewPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                      <span>Showing {(requestsReviewPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(requestsReviewPage * ITEMS_PER_PAGE, needsReviewRequests.length)} of {needsReviewRequests.length} request review items</span>
                      <div className="flex gap-2">
                        <button
                          disabled={requestsReviewPage <= 1}
                          onClick={() => setRequestsReviewPage((p) => p - 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                        >
                          ← Prev
                        </button>
                        <span className="py-1 font-semibold text-gray-700">Page {requestsReviewPage} of {totalRequestsReviewPages}</span>
                        <button
                          disabled={requestsReviewPage >= totalRequestsReviewPages}
                          onClick={() => setRequestsReviewPage((p) => p + 1)}
                          className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 4: UNIFIED COLLEGE NORMALIZATION TOOL */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#003D7A] flex items-center gap-2">
                <ListChecks size={20} /> Section 4: College Normalization
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Inspect all distinct college text values across Alumni + Registration Requests. Select one or more variants and either map them to a constituent campus, or explicitly treat them as an affiliated college.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
                {collegeClusters.length} distinct college values
              </span>
              {selectedCollegeVariants.length > 0 && (
                <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-full">
                  {selectedCollegeVariants.length} selected
                </span>
              )}
            </div>
          </div>

          {collegeClusters.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-gray-500 text-xs font-medium">
              ✅ All college text values are normalized — no variants found.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cluster list */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b flex items-center gap-3 text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 accent-[#003D7A]"
                    checked={selectedCollegeVariants.length === collegeClusters.slice((collegeNormPage - 1) * 20, collegeNormPage * 20).length && collegeClusters.length > 0}
                    onChange={(e) => {
                      const page = collegeClusters.slice((collegeNormPage - 1) * 20, collegeNormPage * 20);
                      if (e.target.checked) {
                        const newSel = Array.from(new Set([...selectedCollegeVariants, ...page.map((c) => c.collegeText)]));
                        setSelectedCollegeVariants(newSel);
                      } else {
                        const pageTexts = new Set(page.map((c) => c.collegeText));
                        setSelectedCollegeVariants(selectedCollegeVariants.filter((v) => !pageTexts.has(v)));
                      }
                    }}
                  />
                  <span>College Text (distinct value)</span>
                  <span className="ml-auto">Alumni</span>
                  <span className="w-16 text-right">Requests</span>
                  <span className="w-40 text-right">Suggested Campus</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {collegeClusters.slice((collegeNormPage - 1) * 20, collegeNormPage * 20).map((cluster) => {
                    const isSelected = selectedCollegeVariants.includes(cluster.collegeText);
                    const isConstituentMatch = campusesList.some(
                      (c) =>
                        c.name.toLowerCase() === cluster.collegeText.toLowerCase() ||
                        c.code.toLowerCase() === cluster.collegeText.toLowerCase()
                    );
                    return (
                      <div
                        key={cluster.collegeText}
                        onClick={() => {
                          setSelectedCollegeVariants((prev) =>
                            isSelected ? prev.filter((v) => v !== cluster.collegeText) : [...prev, cluster.collegeText]
                          );
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-xs transition ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-[#003D7A] shrink-0"
                          checked={isSelected}
                          readOnly
                        />
                        <span className="font-semibold text-gray-900 flex-1 truncate">{cluster.collegeText}</span>
                        {isConstituentMatch && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold shrink-0">
                            Exact Match
                          </span>
                        )}
                        <span className="text-gray-600 font-bold w-12 text-right shrink-0">{cluster.alumniCount}</span>
                        <span className="text-gray-500 w-16 text-right shrink-0">{cluster.requestCount}</span>
                        <span className="text-blue-700 font-semibold w-40 text-right truncate shrink-0">
                          → {cluster.suggestedCampusName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {collegeClusters.length > 20 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Showing {(collegeNormPage - 1) * 20 + 1}–{Math.min(collegeNormPage * 20, collegeClusters.length)} of {collegeClusters.length}</span>
                  <div className="flex gap-2">
                    <button disabled={collegeNormPage <= 1} onClick={() => setCollegeNormPage((p) => p - 1)} className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">← Prev</button>
                    <span className="py-1 font-semibold text-gray-700">Page {collegeNormPage} of {Math.ceil(collegeClusters.length / 20)}</span>
                    <button disabled={collegeNormPage >= Math.ceil(collegeClusters.length / 20)} onClick={() => setCollegeNormPage((p) => p + 1)} className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}

              {/* Action Panel — only shows when rows selected */}
              {selectedCollegeVariants.length > 0 && (
                <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-extrabold text-[#003D7A]">
                    Action for {selectedCollegeVariants.length} selected college variant{selectedCollegeVariants.length > 1 ? 's' : ''}
                  </h3>

                  {/* Action Type */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="collegeAction"
                        value="MAP_TO_CAMPUS"
                        checked={collegeActionType === 'MAP_TO_CAMPUS'}
                        onChange={() => setCollegeActionType('MAP_TO_CAMPUS')}
                        className="accent-[#003D7A]"
                      />
                      Map to Constituent Campus
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="radio"
                        name="collegeAction"
                        value="TREAT_AS_AFFILIATED"
                        checked={collegeActionType === 'TREAT_AS_AFFILIATED'}
                        onChange={() => setCollegeActionType('TREAT_AS_AFFILIATED')}
                        className="accent-[#003D7A]"
                      />
                      Treat as Affiliated College
                    </label>
                  </div>

                  {/* MAP_TO_CAMPUS sub-form */}
                  {collegeActionType === 'MAP_TO_CAMPUS' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700">Select Constituent Campus</label>
                      <select
                        value={selectedTargetCampusId}
                        onChange={(e) => setSelectedTargetCampusId(e.target.value)}
                        className="w-full max-w-xs p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-[#003D7A] outline-none"
                      >
                        <option value="">-- Select Campus --</option>
                        {campusesList.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500">
                        Will bulk-update all selected rows: <code className="bg-white px-1 rounded border">campusId → selected campus</code> and <code className="bg-white px-1 rounded border">college → Campus.name</code>
                      </p>
                    </div>
                  )}

                  {/* TREAT_AS_AFFILIATED sub-form */}
                  {collegeActionType === 'TREAT_AS_AFFILIATED' && (
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                          <input
                            type="radio"
                            name="affiliatedMode"
                            value="CREATE_NEW"
                            checked={affiliatedMode === 'CREATE_NEW'}
                            onChange={() => setAffiliatedMode('CREATE_NEW')}
                            className="accent-[#003D7A]"
                          />
                          Create new approved affiliated college
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                          <input
                            type="radio"
                            name="affiliatedMode"
                            value="MERGE_EXISTING"
                            checked={affiliatedMode === 'MERGE_EXISTING'}
                            onChange={() => setAffiliatedMode('MERGE_EXISTING')}
                            className="accent-[#003D7A]"
                          />
                          Merge into existing approved college
                        </label>
                      </div>

                      {affiliatedMode === 'CREATE_NEW' && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700">Canonical Name for New Affiliated College</label>
                          <input
                            type="text"
                            value={newAffiliatedName}
                            onChange={(e) => setNewAffiliatedName(e.target.value)}
                            placeholder="e.g. Guru Nanak Dev Engineering College, Ludhiana"
                            className="w-full max-w-md p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-[#003D7A] outline-none"
                          />
                          <p className="text-[11px] text-gray-500">This name will be added as an approved Affiliated College and assigned to all selected rows.</p>
                        </div>
                      )}
                      {affiliatedMode === 'MERGE_EXISTING' && (
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700">Select Existing Approved Affiliated College</label>
                          <select
                            value={selectedTargetAffiliatedId}
                            onChange={(e) => setSelectedTargetAffiliatedId(e.target.value)}
                            className="w-full max-w-xs p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-[#003D7A] outline-none"
                          >
                            <option value="">-- Select Affiliated College --</option>
                            {approvedAffiliatedList.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          {approvedAffiliatedList.length === 0 && (
                            <p className="text-[11px] text-amber-700 font-semibold">No approved affiliated colleges yet. Use &quot;Create new&quot; first.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      disabled={executingCollegeNorm}
                      onClick={handleExecuteCollegeNorm}
                      className="px-5 py-2 bg-[#003D7A] hover:bg-[#012140] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      {executingCollegeNorm ? 'Applying...' : 'Apply to Selected'}
                    </button>
                    <button
                      onClick={() => setSelectedCollegeVariants([])}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 5: PENDING AFFILIATED COLLEGE REQUESTS (from self-registration) */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#003D7A] flex items-center gap-2">
                <GitMerge size={20} /> Section 5: Pending Affiliated College Requests
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                These colleges were explicitly requested via the &quot;I am from an Affiliated College&quot; toggle during self-registration. Review each to approve, merge into an existing college, or reject.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={cleaningOrphans}
                onClick={handleCleanupOrphans}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {cleaningOrphans ? 'Cleaning...' : 'Clean Up Orphaned Entries'}
              </button>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${pendingColleges.length > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                {pendingColleges.length} Pending Request{pendingColleges.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {pendingColleges.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-gray-500 text-xs font-medium">
              ✅ No pending affiliated college requests from self-registrations.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b font-bold text-gray-700">
                  <tr>
                    <th className="p-3">College Name</th>
                    <th className="p-3">Requested By</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Referencing Records</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingColleges.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-gray-900">{col.name}</td>
                      <td className="p-3 text-gray-600 font-medium">{col.requestedBy}</td>
                      <td className="p-3 text-gray-500 text-[11px]">{new Date(col.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {col.totalReferencing} record{col.totalReferencing === 1 ? '' : 's'} ({col.alumniCount} alumni, {col.requestCount} requests)
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiFetch(`/admin/affiliated-colleges/${col.id}/approve`, { method: 'POST' });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Approval failed');
                              toast.success('College approved!');
                              fetchAffiliatedColleges();
                              fetchCollegeClusters();
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to approve');
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Reject this college? Referencing records will be unlinked and flagged for review.')) return;
                            try {
                              const res = await apiFetch(`/admin/affiliated-colleges/${col.id}/reject`, { method: 'POST' });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Rejection failed');
                              toast.success('College rejected.');
                              fetchAffiliatedColleges();
                              fetchCollegeClusters();
                              fetchStats();
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to reject');
                            }
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* SECTION 6: MERGE AUDIT HISTORY */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#003D7A] flex items-center gap-2">
                <FileText size={20} /> Section 6: Merge Audit History
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Traceable record of all past bulk merge and normalization operations across College, Branch, and Course.
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
              {mergeLogs.length} Log Entry{mergeLogs.length === 1 ? '' : 's'}
            </span>
          </div>

          {mergeLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-gray-500 text-xs font-medium">
              No merge log entries found. Merge actions will automatically produce audit records here.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b font-bold text-gray-700">
                  <tr>
                    <th className="p-3">Field</th>
                    <th className="p-3">From Values (Merged)</th>
                    <th className="p-3">To Value (Canonical)</th>
                    <th className="p-3">Records Affected</th>
                    <th className="p-3">Performed By</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedMergeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold uppercase text-[10px] rounded">
                          {log.field}
                        </span>
                      </td>
                      <td 
                        className="p-3 font-mono text-[11px] text-rose-700 font-semibold max-w-xs truncate cursor-help"
                        title={log.fromValues.join(', ')}
                      >
                        {log.fromValues.join(', ')}
                      </td>
                      <td className="p-3 font-semibold text-emerald-800">
                        {log.toValue}
                      </td>
                      <td className="p-3 font-bold text-gray-900">
                        {log.affectedCount} record{log.affectedCount === 1 ? '' : 's'}
                      </td>
                      <td className="p-3 text-gray-600 font-medium">
                        {log.performedBy}
                      </td>
                      <td className="p-3 text-right text-gray-500 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Audit Pagination */}
              {totalAuditPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 p-3 bg-slate-50 border-t">
                  <span>Showing {(auditPage - 1) * AUDIT_ITEMS_PER_PAGE + 1}–{Math.min(auditPage * AUDIT_ITEMS_PER_PAGE, mergeLogs.length)} of {mergeLogs.length}</span>
                  <div className="flex gap-2">
                    <button disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)} className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">← Prev</button>
                    <span className="py-1 font-semibold text-gray-700">Page {auditPage} of {totalAuditPages}</span>
                    <button disabled={auditPage >= totalAuditPages} onClick={() => setAuditPage((p) => p + 1)} className="px-3 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* CONFIRMATION MODALS */}
        {/* ────────────────────────────────────────────────────────────────────────── */}

        {/* Merge Confirmation Modal */}
        {mergeConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold text-gray-900">Confirm Bulk Variant Merge</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                You are about to merge <strong className="text-gray-900">{selectedVariants.length} historical {mergeType.toLowerCase()} variant(s)</strong> into canonical value <strong className="text-[#003D7A]">&quot;{targetValue}&quot;</strong>.
              </p>
              <div className="p-3 bg-slate-50 border rounded-xl max-h-40 overflow-y-auto text-xs font-semibold text-gray-800 space-y-1">
                <p className="text-gray-500 font-bold uppercase text-[10px]">Variants to be overwritten:</p>
                {selectedVariants.map((v) => (
                  <div key={v} className="text-red-700 flex items-center gap-1">
                    <span>•</span> {v}
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                ⚠️ Warning: This will permanently update all matching records across Alumni and pending Registration Requests.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setMergeConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={merging}
                  onClick={handleExecuteMerge}
                  className="px-5 py-2 bg-[#003D7A] hover:bg-[#012140] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {merging ? 'Executing Merge...' : 'Confirm & Execute Merge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BCA/MCA Fix Confirmation Modal */}
        {fixConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle size={24} />
                <h3 className="text-lg font-bold text-gray-900">Confirm Bulk BCA/MCA Branch Fix</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                You are about to update <strong className="text-gray-900">{bcaMcaMismatchCount} records</strong> where course is BCA or MCA so that branch is set to <strong className="text-emerald-700">&quot;Computer Applications&quot;</strong>.
              </p>
              <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
                ✅ Deterministic Rule: In Indian technical education, BCA and MCA degrees belong to the Department/Branch of Computer Applications.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setFixConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={fixingBcaMca}
                  onClick={handleFixBcaMca}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {fixingBcaMca ? 'Updating Database...' : 'Confirm & Execute Fix'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

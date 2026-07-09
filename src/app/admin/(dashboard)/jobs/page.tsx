'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Static Subcomponents
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { getAdminJobsAction, toggleAdminJobStatusAction, deleteJobAction } from '@/actions/jobs';
import { type JobsApiResponse, DEFAULT_FILTER_OPTIONS, withAll } from '@/types/jobs';

// Dynamically imported Modal (Lazy Loaded client-side)
const RegisterJobModal = dynamic(
  () => import('@/components/jobs/RegisterJobModal').then((mod) => mod.RegisterJobModal),
  { ssr: false }
);

function AdminJobsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Read search params
  const searchQuery = searchParams.get('search') || '';
  const selectedType = searchParams.get('type') || 'All';
  const selectedWorkplace = searchParams.get('workplace') || 'All';
  const selectedExp = searchParams.get('experience') || 'All';
  const selectedIndustry = searchParams.get('industry') || 'All';
  const activeTab = (searchParams.get('tab') || 'all') as 'all' | 'posted' | 'alumni' | 'staff';
  const showOpenOnly = searchParams.get('openOnly') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to update search params
  const updateQueryParam = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const valueStr = typeof value === 'boolean' ? String(value) : value;

    if (valueStr && valueStr !== 'All' && valueStr !== 'false') {
      params.set(key, valueStr);
    } else {
      params.delete(key);
    }
    
    // Always reset to page 1 on filter changes unless changing page
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string | boolean) => {
    updateQueryParam(key, value);
  };

  // React Query Fetch utilizing Admin Server Action
  const { data, isLoading, error } = useQuery<JobsApiResponse>({
    queryKey: ['admin-jobs', { searchQuery, selectedType, selectedWorkplace, selectedExp, selectedIndustry, activeTab, showOpenOnly, page }],
    queryFn: () =>
      getAdminJobsAction({
        search: searchQuery,
        type: selectedType,
        workplace: selectedWorkplace,
        experience: selectedExp,
        industry: selectedIndustry,
        tab: activeTab,
        page,
        limit: 6,
        showOpenOnly,
      }),
  });

  // React Query Mutations for Lock/Unlock status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleAdminJobStatusAction(id, isActive),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Opportunity status updated!');
        queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  // React Query Mutation for deleting a job post
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJobAction(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Opportunity deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      } else {
        toast.error(result.error || 'Failed to delete opportunity');
      }
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  const handleToggleStatus = (id: string, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Get dynamic unique filters from API filters metadata (fallback to shared defaults)
  const industries = withAll(data?.filters?.industries ?? DEFAULT_FILTER_OPTIONS.industries);
  const types = withAll(data?.filters?.types ?? DEFAULT_FILTER_OPTIONS.types);
  const workplaces = withAll(data?.filters?.workplaces ?? DEFAULT_FILTER_OPTIONS.workplaces);
  const experiences = withAll(data?.filters?.experiences ?? DEFAULT_FILTER_OPTIONS.experiences);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top action header area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Opportunities Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1">Manage and track campus job postings and candidate lists</p>
        </div>
        
        <div className="flex items-center gap-3 self-end">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            <span>Post an opportunity</span>
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Accordion Filters */}
        <div className="lg:col-span-4 space-y-6">
          <JobFilters 
            searchQuery={searchQuery}
            selectedType={selectedType}
            selectedWorkplace={selectedWorkplace}
            selectedExp={selectedExp}
            selectedIndustry={selectedIndustry}
            showOpenOnly={showOpenOnly}
            types={types}
            workplaces={workplaces}
            experiences={experiences}
            industries={industries}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Right column: Opportunities Listing */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Filter Bar */}
          <div className="flex gap-2 pb-2 flex-wrap">
            {[
              { id: 'all', label: 'All Opportunities' },
              { id: 'posted', label: 'My Posts' },
              { id: 'staff', label: 'Staff Posted' },
              { id: 'alumni', label: 'Alumni Posted' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => updateQueryParam('tab', tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards or loaders block */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-2xl mb-2">⚠️</span>
              <h3 className="font-bold text-gray-900 text-sm">Failed to load opportunities</h3>
              <p className="text-xs text-slate-500 mt-1">Please check your network and try again</p>
            </div>
          ) : !data?.jobs || data.jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-4xl mb-3">💼</span>
              <h3 className="font-bold text-gray-900 text-sm">No opportunities found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Try modifying your query or filters, or post a new opportunity to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {data.jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job}
                    onToggleStatus={handleToggleStatus}
                    onApply={() => {}}
                    isAdmin={true}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Simple Pagination Footer */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateQueryParam('page', `${page - 1}`)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => updateQueryParam('page', `${page + 1}`)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reusable Form Modal */}
      <RegisterJobModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAdmin={true}
      />
    </div>
  );
}

// Single card skeleton loader
function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-5 bg-slate-200 rounded-full w-14" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-16" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-3 bg-slate-200 rounded w-10" />
      </div>
    </div>
  );
}

// Full page skeleton loader
function AdminJobsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="h-10 bg-slate-200 rounded-full w-1/2" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<AdminJobsPageSkeleton />}>
      <AdminJobsPageClient />
    </Suspense>
  );
}

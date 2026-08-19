'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Settings, Plus} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Static Subcomponents
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { getJobsAction, toggleJobStatusAction, applyToJobAction, deleteJobAction } from '@/actions/jobs';
import { type JobsApiResponse, type JobItemType, DEFAULT_FILTER_OPTIONS, withAll } from '@/types/jobs';

// Dynamically imported Modal (Lazy Loaded client-side to save bundle size)
const RegisterJobModal = dynamic(
  () => import('@/components/jobs/RegisterJobModal').then((mod) => mod.RegisterJobModal),
  { ssr: false }
);

function JobsPageClient() {
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
  const activeTab = (searchParams.get('tab') || 'all') as 'all' | 'posted' | 'applied';
  const showOpenOnly = searchParams.get('openOnly') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItemType | null>(null);

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

  // React Query Fetch utilizing Server Action
  const { data, isLoading, error, refetch } = useQuery<JobsApiResponse>({
    queryKey: ['jobs', { searchQuery, selectedType, selectedWorkplace, selectedExp, selectedIndustry, activeTab, showOpenOnly, page }],
    queryFn: () =>
      getJobsAction({
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
      toggleJobStatusAction(id, isActive),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Opportunity status updated!');
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  // React Query Mutation for application log
  const applyMutation = useMutation({
    mutationFn: (id: string) => applyToJobAction(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
      }
    },
  });

  // React Query Mutation for deleting a job post
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJobAction(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Opportunity deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
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

  const handleApply = (id: string) => {
    applyMutation.mutate(id);
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
        <h2 className="text-xl font-bold text-gray-950">Opportunities</h2>
        
        <div className="flex items-center gap-3 self-end">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 bg-white rounded-xl transition cursor-pointer">
            <Settings size={14} />
            <span>Preferences</span>
          </button>
          
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
          <div className="flex gap-2 pb-2">
            {[
              { id: 'all', label: 'All opportunities' },
              { id: 'posted', label: 'Posted by me' },
              { id: 'applied', label: 'Applied by me' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => updateQueryParam('tab', tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-200/80 text-gray-800'
                    : 'text-slate-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Opportunities Counter */}
          <p className="text-xs font-semibold text-slate-500">
            {isLoading ? 'Loading opportunities...' : `Showing ${data?.pagination?.totalCount || 0} opportunities`}
          </p>

          {/* Grid of opportunities */}
          <div className="space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, idx) => (
                <JobSkeleton key={idx} />
              ))
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
                <p className="text-sm font-semibold text-red-600">Failed to load opportunities. Please check your connection.</p>
                <button 
                  onClick={() => refetch()} 
                  className="px-4 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition"
                >
                  Retry
                </button>
              </div>
            ) : !data || data.jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 font-semibold">
                No opportunities matching your selection were found.
              </div>
            ) : (
              <>
                {data.jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onToggleStatus={handleToggleStatus} 
                    onApply={handleApply}
                    onDelete={handleDelete}
                    onEdit={setEditingJob}
                  />
                ))}

                {/* Pagination Controls */}
                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => updateQueryParam('page', String(page - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-slate-500">
                      Page {page} of {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => updateQueryParam('page', String(page + 1))}
                      disabled={page >= data.pagination.totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>

      {/* Modal - Post new opportunity */}
      <RegisterJobModal 
        isOpen={isModalOpen || !!editingJob} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }} 
        jobToEdit={editingJob}
      />

    </div>
  );
}

// Skeleton card for loading state
function JobSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="h-5 bg-slate-200 rounded-full w-12" />
      </div>
      <div className="flex items-center gap-6">
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
function JobsPageSkeleton() {
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

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageSkeleton />}>
      <JobsPageClient />
    </Suspense>
  );
}
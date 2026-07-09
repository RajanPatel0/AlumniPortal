'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';

// Static Subcomponents
import { ListBusinessBanner } from '@/components/startups/ListBusinessBanner';
import { StartupFilters } from '@/components/startups/StartupFilters';
import { StartupCard, type StartUpItem } from '@/components/startups/StartupCard';

// Dynamically imported Modal (Lazy Loaded on Demand client-side to save bundle size)
const RegisterStartupModal = dynamic(
  () => import('@/components/startups/RegisterStartupModal').then((mod) => mod.RegisterStartupModal),
  { ssr: false }
);


interface StartupsApiResponse {
  startups: StartUpItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    industries: string[];
    locations: string[];
    designations: string[];
  };
}

function StartupsShowcaseClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Read search params
  const searchQuery = searchParams.get('search') || '';
  const selectedIndustry = searchParams.get('industry') || 'All';
  const selectedDesignation = searchParams.get('designation') || 'All';
  const selectedLocation = searchParams.get('location') || 'All';
  const sortBy = searchParams.get('sort') || 'Name';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<StartUpItem | null>(null);

  // Helper to update search params
  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    updateQueryParam(key, value);
  };

  // React Query fetch
  const { data, isLoading, error, refetch } = useQuery<StartupsApiResponse>({
    queryKey: ['startups', { searchQuery, selectedIndustry, selectedDesignation, selectedLocation, sortBy, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedIndustry && selectedIndustry !== 'All') params.set('industry', selectedIndustry);
      if (selectedDesignation && selectedDesignation !== 'All') params.set('designation', selectedDesignation);
      if (selectedLocation && selectedLocation !== 'All') params.set('location', selectedLocation);
      if (sortBy) params.set('sort', sortBy);
      params.set('page', page.toString());
      params.set('limit', '8');

      const response = await fetch(`/api/alumni/startups?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch startups');
      }
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alumni/startups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Startup deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['startups'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete startup');
    },
  });

  const handleEdit = (startup: StartUpItem) => {
    setEditingStartup(startup);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStartup(null);
  };

  // Get unique filter values from API filters metadata
  const industries = ['All', ...(data?.filters?.industries || ['Interior Design & Decorative Art', 'Graphic Design', 'Food Production'])];
  const locations = ['All', ...(data?.filters?.locations || [])];
  const designations = ['All', ...(data?.filters?.designations || [])];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-950">
          Find and connect with businesses of your fellow members!
        </h2>
        
        {/* Sort drop down */}
        <div className="flex items-center gap-2 self-end">
          <span className="text-xs font-semibold text-slate-500">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => updateQueryParam('sort', e.target.value)}
            className="text-xs font-bold text-gray-800 bg-white border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:border-[#003D7A]"
          >
            <option value="Name">Name</option>
            <option value="Newest">Newest</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Listing Box, Search, Filters */}
        <div className="lg:col-span-4 space-y-6">
          <ListBusinessBanner onOpenModal={() => { setEditingStartup(null); setIsModalOpen(true); }} />
          <StartupFilters 
            searchQuery={searchQuery}
            selectedIndustry={selectedIndustry}
            selectedDesignation={selectedDesignation}
            selectedLocation={selectedLocation}
            industries={industries}
            designations={designations}
            locations={locations}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Right Side: Grid of Startups */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, idx) => (
                <StartupSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <p className="text-sm font-semibold text-red-600">Failed to load startups. Please check your connection.</p>
              <button 
                onClick={() => refetch()} 
                className="px-4 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition"
              >
                Retry
              </button>
            </div>
          ) : !data || data.startups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 font-medium">
              No startups match your search/filter criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.startups.map((startup) => (
                  <StartupCard
                    key={startup.id}
                    startup={startup}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => updateQueryParam('page', (page - 1).toString())}
                    disabled={page <= 1}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => updateQueryParam('page', (page + 1).toString())}
                    disabled={page >= data.pagination.totalPages}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal - List new Business or Edit existing */}
      <RegisterStartupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        startup={editingStartup}
      />

    </div>
  );
}

// Skeleton card for loading state
function StartupSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative flex flex-col justify-between animate-pulse">
      <div className="h-32 bg-slate-100 border-b border-slate-50" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-5/6" />
        </div>
        <div className="pt-3 border-t border-slate-50 space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200" />
          <div className="space-y-1">
            <div className="h-3 bg-slate-200 rounded w-16" />
            <div className="h-2 bg-slate-100 rounded w-8" />
          </div>
        </div>
        <div className="h-4 bg-slate-200 rounded-full w-16" />
      </div>
    </div>
  );
}

// Full page skeleton loader
function StartupsShowcaseSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-12 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function StartupsShowcase() {
  return (
    <Suspense fallback={<StartupsShowcaseSkeleton />}>
      <StartupsShowcaseClient />
    </Suspense>
  );
}

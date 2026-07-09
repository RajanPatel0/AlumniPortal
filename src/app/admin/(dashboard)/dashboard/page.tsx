'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  Users, UserCheck, Mail, Clock, CalendarDays, CheckSquare, 
  GraduationCap, Building, RefreshCw, ChevronDown, CheckCircle, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalAlumni: number;
  registeredAlumni: number;
  pendingInvites: number;
  invitedAlumni: number;
  pendingRequests: number;
  totalEvents: number;
  totalRsvps: number;
  uniqueBranchesCount: number;
  uniqueCompaniesCount: number;
}

interface TodayStats {
  requestsToday: number;
  registrationsToday: number;
  eventsToday: number;
  rsvpsToday: number;
}

interface ChartItem {
  name: string;
  count: number;
}

interface TrendItem {
  date: string;
  count: number;
}

interface DashboardData {
  stats: DashboardStats;
  today: TodayStats;
  charts: {
    registrationTrend: TrendItem[];
    distribution: ChartItem[];
    distributionType: string;
    branchDistribution: ChartItem[];
    companyDistribution: ChartItem[];
  };
}

export default function DashboardPage() {
  const { user: userData } = useAdminAuth();
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');

  // Fetch campuses list using React Query
  const { data: campuses = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['campuses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campuses');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // cache for 1 hour
  });

  // Fetch dashboard summary stats using React Query
  const { 
    data, 
    isLoading: loading, 
    isFetching: refreshing, 
    refetch: fetchDashboardData 
  } = useQuery<DashboardData | null>({
    queryKey: ['admin-dashboard-stats', selectedCampusId],
    queryFn: async () => {
      const url = selectedCampusId 
        ? `/api/admin/dashboard?campusId=${encodeURIComponent(selectedCampusId)}`
        : '/api/admin/dashboard';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Keep dashboard data fresh/cached for 5 minutes
  });

  const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCampusId(e.target.value);
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="w-56 h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-80 h-4 bg-slate-200 rounded"></div>
          </div>
          <div className="w-48 h-10 bg-slate-200 rounded-xl"></div>
        </div>

        {/* Today's quick updates skeleton */}
        <div className="space-y-4">
          <div className="w-40 h-5 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                <div className="w-2/3 h-5 bg-slate-200 rounded mt-2"></div>
                <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* All-time summary statistics skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
              <div className="w-3/4 h-8 bg-slate-200 rounded"></div>
              <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts & Trends section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="w-1/3 h-6 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="w-1/3 h-6 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const today = data?.today;
  const charts = data?.charts;

  // Donut chart segments rendering helper
  const donutColors = ['#003D7A', '#C41E3A', '#0284c7', '#0d9488', '#eab308', '#6366f1'];
  const donutTotal = charts?.distribution.reduce((acc, curr) => acc + curr.count, 0) || 0;
  let donutAccumulator = 0;

  // Horizontal bar charts layout helpers
  const maxBranchCount = Math.max(...(charts?.branchDistribution.map(b => b.count) || [1]), 1);
  const maxCompanyCount = Math.max(...(charts?.companyDistribution.map(c => c.count) || [1]), 1);

  // Line chart path math
  const trendMax = Math.max(...(charts?.registrationTrend.map(t => t.count) || [1]), 1);
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;
  const gridWidth = chartWidth - paddingX * 2;
  const gridHeight = chartHeight - paddingY * 2;

  const getLinePoints = () => {
    if (!charts?.registrationTrend || charts.registrationTrend.length === 0) return '';
    return charts.registrationTrend.map((d, index) => {
      const x = paddingX + index * (gridWidth / (charts.registrationTrend.length - 1));
      const y = paddingY + gridHeight - (d.count / trendMax) * gridHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const getAreaPoints = () => {
    if (!charts?.registrationTrend || charts.registrationTrend.length === 0) return '';
    const points = getLinePoints();
    const startX = paddingX;
    const endX = paddingX + gridWidth;
    const bottomY = paddingY + gridHeight;
    return `${startX},${bottomY} ${points} ${endX},${bottomY}`;
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header section matching reference visual */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#012140] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your alumni network platform</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time blink indicator */}
          <div className="flex items-center gap-2 bg-[#ecfdf5] border border-[#a7f3d0] px-3.5 py-2 rounded-2xl text-emerald-700 font-semibold text-xs shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Updates Active
          </div>

          {/* Enter Alumni Portal Button */}
          <Link
            href="/alumni/feed"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#012140] to-[#1a4ea3] hover:from-[#0f2e75] hover:to-[#2558c4] text-white text-xs font-bold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ExternalLink size={14} />
            Enter Alumni Portal
          </Link>

          <button 
            onClick={() => fetchDashboardData()}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-600 transition"
            title="Refresh Data"
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>

        </div>
      </div>

      {/* Scope Info / Selector */}
      <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#003D7A]/10 text-[#003D7A] flex items-center justify-center">
            <Building size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Viewing Workspace Scope</p>
            <p className="text-sm font-bold text-[#012140]">
              {userData?.role === 'SUB_ADMIN' || userData?.role === 'COORDINATOR'
                ? `Campus Scope: ${userData.campus?.name || 'Assigned Campus'}`
                : selectedCampusId 
                  ? `Campus: ${campuses.find(c => c.id === selectedCampusId)?.name || 'Filtered'}`
                  : 'All Campuses (Consolidated Overview)'
              }
            </p>
          </div>
        </div>

        {userData?.role === 'ADMIN' && (
          <div className="relative min-w-[200px]">
            <select
              value={selectedCampusId}
              onChange={handleCampusChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 text-[#012140] text-sm font-semibold rounded-2xl appearance-none focus:outline-none focus:border-[#003D7A] focus:ring-4 focus:ring-blue-50 pr-10"
            >
              <option value="">All Campuses</option>
              {campuses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Row 1 Stats Cards (Styled identically to reference image) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Total Alumni */}
        <div className="relative bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Total Alumni Records</p>
              <h3 className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.totalAlumni || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition duration-200">
              <Users size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
              +0%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs last month</span>
          </div>
        </div>

        {/* Card 2: Registered Users */}
        <div className="relative bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Total Registered Users</p>
              <h3 className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.registeredAlumni || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-110 transition duration-200">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-0.5">
              +0%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs last month</span>
          </div>
        </div>

        {/* Card 3: Non-Registered Users */}
        <div className="relative bg-rose-50/50 border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Non-Registered Invites</p>
              <h3 className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.pendingInvites || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/10 group-hover:scale-110 transition duration-200">
              <Mail size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-0.5">
              +0%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs last month</span>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="relative bg-purple-50/50 border border-purple-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.pendingRequests || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-110 transition duration-200">
              <Clock size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-0.5">
              +0%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs last financial year</span>
          </div>
        </div>

      </section>

      {/* Row 2 Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 5: Total Events */}
        <div className="relative bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Events Hosted</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.totalEvents || 0}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition duration-200">
              <CalendarDays size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-500 font-medium">Published & upcoming events</p>
        </div>

        {/* Card 6: Event RSVPs */}
        <div className="relative bg-teal-50/50 border border-teal-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Total Event RSVPs</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.totalRsvps || 0}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/10 group-hover:scale-110 transition duration-200">
              <CheckSquare size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-500 font-medium">Alumni attendance confirmations</p>
        </div>

        {/* Card 7: Unique Branches */}
        <div className="relative bg-yellow-50/50 border border-yellow-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Branches / Departments</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.uniqueBranchesCount || 0}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-lg shadow-yellow-500/10 group-hover:scale-110 transition duration-200">
              <GraduationCap size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-500 font-medium">Distinct study branches in database</p>
        </div>

        {/* Card 8: Unique Companies */}
        <div className="relative bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition duration-200 overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#003D7A] uppercase tracking-wider">Companies Represented</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stats?.uniqueCompaniesCount || 0}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition duration-200">
              <Building size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-500 font-medium">Alumni working in distinct companies</p>
        </div>

      </section>

      {/* Today's Highlights Section */}
      <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-slate-100 px-6 py-4.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#003D7A] flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#012140]">Today's Highlights</h2>
              <p className="text-[11px] text-slate-500">Real Time Activity Summary</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-[10px] font-bold text-violet-700">
            <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-ping" />
            Live Activity
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Highlight Card 1: New Sign-Up Requests */}
          <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between min-h-[120px] group">
            <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center group-hover:scale-105 transition duration-150">
              <Clock size={16} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">New Account Sign-Ups</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{today?.requestsToday || 0}</h4>
            </div>
          </div>

          {/* Highlight Card 2: Completed Registrations */}
          <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between min-h-[120px] group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-105 transition duration-150">
              <UserCheck size={16} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">Registered Users</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{today?.registrationsToday || 0}</h4>
            </div>
          </div>

          {/* Highlight Card 3: Events Created */}
          <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between min-h-[120px] group">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center group-hover:scale-105 transition duration-150">
              <CalendarDays size={16} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">Events Published</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{today?.eventsToday || 0}</h4>
            </div>
          </div>

          {/* Highlight Card 4: New RSVPs */}
          <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-5 flex flex-col justify-between min-h-[120px] group">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center group-hover:scale-105 transition duration-150">
              <CheckSquare size={16} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">New RSVPs Received</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{today?.rsvpsToday || 0}</h4>
            </div>
          </div>

        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Daily Registrations Trend (Line/Area Chart) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#012140]">Daily Registered Users</h3>
              <p className="text-[11px] text-slate-500">Sign-ups trend over the last 7 days</p>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="relative w-full flex items-center justify-center">
            {charts?.registrationTrend && charts.registrationTrend.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                {/* Grid Lines */}
                {[0, 1, 2, 3, 4].map((g) => {
                  const y = paddingY + (gridHeight / 4) * g;
                  return (
                    <line 
                      key={g} 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartWidth - paddingX} 
                      y2={y} 
                      stroke="#f1f5f9" 
                      strokeWidth="1.5" 
                    />
                  );
                })}

                {/* Shaded Area Under Line */}
                <polygon
                  points={getAreaPoints()}
                  fill="url(#chartGrad)"
                  opacity="0.15"
                />

                {/* Main Trend Line */}
                <polyline
                  fill="none"
                  stroke="#003D7A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={getLinePoints()}
                />

                {/* Interactive Points Circles */}
                {charts.registrationTrend.map((d, index) => {
                  const x = paddingX + index * (gridWidth / (charts.registrationTrend.length - 1));
                  const y = paddingY + gridHeight - (d.count / trendMax) * gridHeight;
                  return (
                    <g key={index} className="group/dot cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#ffffff"
                        stroke="#003D7A"
                        strokeWidth="3.5"
                        className="transition-all duration-150 group-hover/dot:r-7"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="transparent"
                      />
                      {/* Interactive Point Value Label on hover */}
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        className="opacity-0 group-hover/dot:opacity-100 text-[10px] font-bold fill-[#003D7A] transition-opacity duration-150"
                      >
                        {d.count}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Date Labels */}
                {charts.registrationTrend.map((d, index) => {
                  const x = paddingX + index * (gridWidth / (charts.registrationTrend.length - 1));
                  return (
                    <text
                      key={index}
                      x={x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-400 font-bold"
                    >
                      {d.date}
                    </text>
                  );
                })}

                {/* Define gradient for the area chart */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003D7A" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-xs italic">
                No recent registration data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Distribution (Pie/Donut Chart) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-extrabold text-[#012140]">
              {charts?.distributionType === 'campus' ? 'Campus Distribution' : 'Course Distribution'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {charts?.distributionType === 'campus' ? 'Alumni share across all campuses' : 'Top course distribution in campus'}
            </p>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col items-center justify-center space-y-5 flex-1">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {donutTotal > 0 ? (
                <>
                  <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                    {charts?.distribution.map((item, idx) => {
                      const percent = item.count / donutTotal;
                      const strokeDasharray = `${percent * 314.16} 314.16`;
                      const strokeDashoffset = `${-donutAccumulator * 314.16}`;
                      donutAccumulator += percent;

                      return (
                        <circle
                          key={idx}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={donutColors[idx % donutColors.length]}
                          strokeWidth="15"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[17] cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
                    <span className="text-xl font-extrabold text-[#012140] tracking-tight">{donutTotal}</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs italic text-center">
                  No records to display
                </div>
              )}
            </div>

            {/* Legends */}
            <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-700">
              {charts?.distribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: donutColors[idx % donutColors.length] }} 
                  />
                  <span className="truncate" title={item.name}>{item.name}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Row 4: Top Branches & Top Companies side-by-side Progress Bars */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Branches Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-extrabold text-[#012140]">Top Branches</h3>
            <p className="text-[11px] text-slate-500">Distribution of alumni by branch / department</p>
          </div>

          <div className="space-y-4">
            {charts?.branchDistribution && charts.branchDistribution.length > 0 ? (
              charts.branchDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="truncate pr-4">{item.name}</span>
                    <span>{item.count} alumni</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#003D7A] to-[#002654] h-full rounded-full transition-all duration-700" 
                      style={{ width: `${(item.count / maxBranchCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No branch data available
              </div>
            )}
          </div>
        </div>

        {/* Top Companies Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-extrabold text-[#012140]">Top Companies</h3>
            <p className="text-[11px] text-slate-500">Primary employers representing university alumni</p>
          </div>

          <div className="space-y-4">
            {charts?.companyDistribution && charts.companyDistribution.length > 0 ? (
              charts.companyDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="truncate pr-4">{item.name}</span>
                    <span>{item.count} alumni</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#C41E3A] to-red-700 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${(item.count / maxCompanyCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs italic">
                No company data available
              </div>
            )}
          </div>
        </div>

      </section>

    </div>
  );
}
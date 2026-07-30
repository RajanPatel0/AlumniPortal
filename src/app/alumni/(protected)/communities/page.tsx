import Link from "next/link";
import { Users, Building2, ArrowRight, MessageSquareCode, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CatalogFilterBar } from "./CatalogFilterBar";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    campusId?: string;
    category?: string;
  }>;
}

export default async function CommunitiesCatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const selectedCampus = params.campusId || "";
  const selectedCategory = params.category || "All";

  // Server-side direct Prisma queries
  const where: any = { isActive: true };
  if (selectedCampus) where.campusId = selectedCampus;
  if (selectedCategory && selectedCategory !== "All") where.category = selectedCategory;
  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } },
    ];
  }

  const [communities, campuses] = await Promise.all([
    prisma.community.findMany({
      where,
      include: {
        campus: { select: { id: true, name: true, code: true } },
        _count: { select: { members: true, updates: true, blogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campus.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalMembersCount = communities.reduce((acc, c) => acc + (c._count?.members || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header Info Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Row 1: Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#C41E3A] shrink-0 shadow-2xs">
            <Users size={22} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Communities & Student Clubs
          </h1>
        </div>

        {/* Row 2: Subtitle + Quick Stats Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-xl leading-relaxed">
            Explore active student clubs, technical societies, and alumni-supported interest groups across campuses.
          </p>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 px-3.5 py-2 bg-gradient-to-br from-blue-50/80 to-slate-50 rounded-2xl border border-blue-100/60 shadow-2xs hover:shadow-xs transition duration-200">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#003D7A] shadow-2xs border border-blue-100/60 shrink-0">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Communities</p>
                <p className="text-xs font-black text-slate-900 mt-1">{communities.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2 bg-gradient-to-br from-red-50/80 to-slate-50 rounded-2xl border border-red-100/60 shadow-2xs hover:shadow-xs transition duration-200">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#C41E3A] shadow-2xs border border-red-100/60 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Members</p>
                <p className="text-xs font-black text-slate-900 mt-1">{totalMembersCount > 0 ? totalMembersCount.toLocaleString() : '0'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition duration-200">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#003D7A] shadow-2xs border border-slate-200/60 shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Campuses</p>
                <p className="text-xs font-black text-slate-900 mt-1">{campuses.length > 0 ? campuses.length : 'All'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Search & Filter Controls Bar */}
      <CatalogFilterBar
        campuses={campuses}
        initialSearch={search}
        initialCampus={selectedCampus}
        initialCategory={selectedCategory}
      />

      {/* Communities Grid */}
      <main>
        {communities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3 shadow-sm">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No communities found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Try adjusting your search criteria or explore other categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/alumni/communities/${community.slug || community.id}`}
                className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Banner Header */}
                <div className="h-28 relative bg-gradient-to-r from-[#003D7A] to-[#012140] shrink-0">
                  {community.bannerUrl ? (
                    <img
                      src={community.bannerUrl}
                      alt={community.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                  )}

                  {/* Campus Tag Pill */}
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-sm">
                    <Building2 className="w-3 h-3 text-blue-300" />
                    {community.campus ? (community.campus.code || community.campus.name).toUpperCase() : "GLOBAL"}
                  </div>

                  {/* Category Tag Pill */}
                  <div className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#003D7A] text-[11px] font-bold shadow-sm">
                    {community.category || "General"}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Logo Avatar */}
                    <div className="relative -mt-10 mb-2 z-10">
                      {community.logoUrl ? (
                        <img
                          src={community.logoUrl}
                          alt={community.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl ring-4 ring-white shadow-md bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] text-white flex items-center justify-center font-black text-lg">
                          {community.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-[#003D7A] transition-colors line-clamp-1">
                      {community.name}
                    </h2>

                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed font-normal">
                      {community.description.replace(/[#*`_]/g, "")}
                    </p>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-[#003D7A]" />
                        {community._count?.members || 0} Members
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MessageSquareCode className="w-3.5 h-3.5 text-[#C41E3A]" />
                        {community._count?.updates || 0} Updates
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[#003D7A] font-bold group-hover:translate-x-0.5 transition-transform">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

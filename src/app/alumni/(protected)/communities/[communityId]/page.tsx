import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { alumniAuthConfig } from "@/lib/alumni/auth";
import { getAuthenticatedStaff } from "@/lib/auth/staff-auth";
import { BLOG_CATEGORIES, getCommunityPermissions } from "@/lib/community-permissions";
import { ExternalLinksBar } from "@/components/community/ExternalLinksBar";
import { MemberBadgeTag } from "@/components/community/MemberBadgeTag";
import { MarkdownRenderer, EditOverviewButton } from "@/components/community/MarkdownRenderer";
import { CommunityTabClient } from "./CommunityTabClient";
import {
  Users,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface CommunityPageProps {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<{ tab?: string; updateFilter?: string; blogCategory?: string }>;
}

export default async function CommunityMainPage({ params, searchParams }: CommunityPageProps) {
  const { communityId } = await params;
  const { tab = "OVERVIEW", updateFilter = "ALL", blogCategory = "All" } = await searchParams;

  const community = await prisma.community.findFirst({
    where: {
      OR: [{ id: communityId }, { slug: communityId }],
    },
    include: {
      campus: true,
      members: {
        include: {
          alumni: {
            select: { id: true, name: true, avatarUrl: true, currentRole: true, currentCompany: true, batchYear: true, branch: true },
          },
          staff: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: { members: true, updates: true, blogs: true },
      },
    },
  });

  if (!community) {
    notFound();
  }

  // Resolve current user member & admin status on the server
  let currentUserMember: any = null;
  let isAdmin = false;

  let currentUserId: string | null = null;
  let currentStaffId: string | null = null;

  const staff = await getAuthenticatedStaff();
  if (staff) {
    isAdmin = staff.role === "ADMIN";
    currentStaffId = staff.id;
    currentUserMember = community.members.find((m) => m.staffId === staff.id) || null;
  } else {
    const session = await getServerSession(alumniAuthConfig);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      currentUserId = userId;
      currentUserMember = community.members.find((m) => m.alumniId === userId) || null;
    }
  }

  const permissions = getCommunityPermissions(currentUserMember?.roleTag, isAdmin);
  const leaders = community.members.filter(
    (m) => m.roleTag === "LEADER" || m.roleTag === "COORDINATOR" || m.roleTag === "ADVISOR"
  );
  const isFollowing = Boolean(currentUserMember?.isFollowingNewsletter);

  // Fetch tab specific data on server
  let initialUpdates: any[] = [];
  let initialBlogs: any[] = [];

  if (tab === "UPDATES") {
    const updateWhere: any = { communityId: community.id };
    if (updateFilter === "NEWSLETTER") {
      updateWhere.OR = [{ isNewsletter: true }, { type: "NEWSLETTER" }];
    } else if (updateFilter !== "ALL") {
      updateWhere.type = updateFilter;
    }

    const rawUpdates = await prisma.communityUpdate.findMany({
      where: updateWhere,
      include: {
        authorAlumni: { select: { id: true, name: true, avatarUrl: true, currentRole: true } },
        authorStaff: { select: { id: true, name: true, role: true } },
        documents: true,
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } },
                votes: {
                  where: currentUserMember?.alumniId ? { alumniId: currentUserMember.alumniId } : undefined,
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    initialUpdates = rawUpdates.map((up) => {
      let formattedPoll = null;
      if (up.poll) {
        const totalVotes = up.poll.options.reduce((sum, opt) => sum + opt._count.votes, 0);
        formattedPoll = {
          id: up.poll.id,
          question: up.poll.question,
          allowMultiple: up.poll.allowMultiple,
          totalVotes,
          expiresAt: up.poll.expiresAt,
          options: up.poll.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            voteCount: opt._count.votes,
            hasVoted: opt.votes && opt.votes.length > 0,
          })),
        };
      }
      return {
        ...up,
        poll: formattedPoll,
      };
    });
  } else if (tab === "BLOGS") {
    const blogWhere: any = { communityId: community.id };
    if (blogCategory !== "All") {
      const matchedCat = BLOG_CATEGORIES.find(
        (c) => c.value === blogCategory || c.label === blogCategory
      );
      const possibleValues = matchedCat
        ? [matchedCat.value, matchedCat.label]
        : [blogCategory];

      blogWhere.category = { in: possibleValues };
    }

    initialBlogs = await prisma.communityBlog.findMany({
      where: blogWhere,
      include: {
        authorAlumni: { select: { id: true, name: true, avatarUrl: true } },
        authorStaff: { select: { id: true, name: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-1">
      {/* Banner & Header */}
      <div className="relative h-48 sm:h-72 rounded-3xl overflow-hidden bg-gradient-to-r from-[#012140] via-[#003D7A] to-[#0f4068] shadow-lg border border-white/10">
        {community.bannerUrl ? (
          <img src={community.bannerUrl} alt={community.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
      </div>

      <div className="relative z-10 -mt-16 sm:-mt-20">
        {/* Profile Card Overlay with Interactive Buttons */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {community.logoUrl ? (
                <img
                  src={community.logoUrl}
                  alt={community.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-white shadow-md bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] text-white flex items-center justify-center font-extrabold text-3xl shrink-0">
                  {community.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {community.name}
                  </h1>
                  {community.campus && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[#003D7A] text-xs font-semibold">
                      <Building2 className="w-3 h-3 text-[#003D7A]" />
                      {community.campus.name}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-4">
                  <span>{community.category} Category</span>
                  <span>•</span>
                  <span>{community._count.members} Members & Followers</span>
                </p>
              </div>
            </div>
          </div>

          {/* Social External Links Bar */}
          {community.externalLinks && (
            <div className="pt-2 border-t border-slate-100">
              <ExternalLinksBar links={community.externalLinks as Record<string, string>} />
            </div>
          )}
        </div>

        {/* Client Interactive Tab Switching & Feed Component */}
        <CommunityTabClient
          communityId={community.id}
          activeTab={tab as "OVERVIEW" | "UPDATES" | "BLOGS"}
          counts={community._count}
          permissions={permissions}
          currentUserId={currentUserId}
          currentStaffId={currentStaffId}
          initialIsFollowing={isFollowing}
          initialUpdates={JSON.parse(JSON.stringify(initialUpdates))}
          initialBlogs={JSON.parse(JSON.stringify(initialBlogs))}
          initialUpdateFilter={updateFilter}
          initialBlogCategory={blogCategory}
        >
          {/* Tab 1: Overview Server Rendered */}
          {tab === "OVERVIEW" && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Description (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      About Community
                    </h3>
                    {permissions.canEditCommunity && (
                      <EditOverviewButton
                        communityId={community.id}
                        initialDescription={community.description}
                      />
                    )}
                  </div>
                  <MarkdownRenderer content={community.description} />
                </div>
              </div>

              {/* Sidebar: Leaders & Members (1 col) */}
              <div className="space-y-6">
                {/* Community Leaders Box */}
                {leaders.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" /> Community Leadership
                    </h3>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                      {leaders.map((m) => {
                        const content = (
                          <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                            <div className="flex items-center gap-3">
                              {m.alumni?.avatarUrl ? (
                                <img src={m.alumni.avatarUrl} alt={m.alumni.name} className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#003D7A] font-bold flex items-center justify-center text-xs">
                                  {m.alumni?.name?.slice(0, 2) || "CM"}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-[#003D7A] transition-colors">{m.alumni?.name || "Staff Member"}</p>
                                <p className="text-[11px] text-slate-500">{m.alumni?.currentRole || m.alumni?.branch}</p>
                              </div>
                            </div>
                            <MemberBadgeTag roleTag={m.roleTag} customTitle={m.customTitle} />
                          </div>
                        );

                        return m.alumni?.id ? (
                          <Link key={m.id} href={`/alumni/profile/${m.alumni.id}`}>
                            {content}
                          </Link>
                        ) : (
                          <div key={m.id}>{content}</div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Member List */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#003D7A]" /> Members & Followers
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold">{community._count.members} total</span>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {community.members.map((m) => {
                      const memberRow = (
                        <div className="flex items-center justify-between gap-2 py-1 hover:bg-slate-50 px-1.5 rounded-lg transition-colors group cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            {m.alumni?.avatarUrl ? (
                              <img src={m.alumni.avatarUrl} alt={m.alumni.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {m.alumni?.name?.slice(0, 2) || "M"}
                              </div>
                            )}
                            <span className="text-xs font-medium text-slate-800 group-hover:text-[#003D7A] transition-colors line-clamp-1">
                              {m.alumni?.name || "Member"}
                            </span>
                          </div>
                          <MemberBadgeTag roleTag={m.roleTag} customTitle={m.customTitle} size="sm" />
                        </div>
                      );

                      return m.alumni?.id ? (
                        <Link key={m.id} href={`/alumni/profile/${m.alumni.id}`}>
                          {memberRow}
                        </Link>
                      ) : (
                        <div key={m.id}>{memberRow}</div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CommunityTabClient>
      </div>
    </div>
  );
}

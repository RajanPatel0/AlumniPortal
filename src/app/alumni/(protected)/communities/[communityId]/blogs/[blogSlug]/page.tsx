import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownRenderer, DeleteBlogClientButton } from "@/components/community/MarkdownRenderer";
import { Calendar, Clock, ArrowLeft, Trash2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { alumniAuthConfig } from "@/lib/alumni/auth";
import { getAuthenticatedStaff } from "@/lib/auth/staff-auth";
import { getCommunityPermissions, canDeletePost, canEditPost, calculateReadTime } from "@/lib/community-permissions";

interface BlogArticleReaderPageProps {
  params: Promise<{ communityId: string; blogSlug: string }>;
}

export default async function BlogArticleReaderPage({ params }: BlogArticleReaderPageProps) {
  const { communityId, blogSlug } = await params;

  const community = await prisma.community.findFirst({
    where: { OR: [{ id: communityId }, { slug: communityId }] },
    include: {
      members: true,
    },
  });

  if (!community) {
    notFound();
  }

  const blog = await prisma.communityBlog.findFirst({
    where: {
      communityId: community.id,
      OR: [{ slug: blogSlug }, { id: blogSlug }],
      isPublished: true,
    },
    include: {
      authorAlumni: {
        select: { id: true, name: true, avatarUrl: true, currentRole: true },
      },
      authorStaff: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  if (!blog) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-12">
        <h2 className="text-2xl font-bold text-slate-800">Article Not Found</h2>
        <p className="text-slate-500 text-sm">The requested article could not be loaded or is not published.</p>
        <Link href={`/alumni/communities/${community.id}?tab=BLOGS`} className="inline-flex items-center gap-2 text-[#003D7A] font-bold hover:underline">
          Back to Community Blogs
        </Link>
      </div>
    );
  }

  // Session check for delete permission
  let currentUserId: string | null = null;
  let currentStaffId: string | null = null;
  let currentUserMember: any = null;
  let isAdmin = false;

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

  const perms = getCommunityPermissions(currentUserMember?.roleTag, isAdmin);
  const canDeleteThisBlog = canDeletePost(
    blog.authorAlumniId,
    blog.authorStaffId,
    currentUserId,
    currentStaffId,
    perms.canDeletePosts
  );
  const canEditThisBlog = canEditPost(
    blog.authorAlumniId,
    blog.authorStaffId,
    currentUserId,
    currentStaffId,
    perms.canCreateBlog
  );

  // Increment views count asynchronously
  prisma.communityBlog.update({
    where: { id: blog.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-1">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm flex items-center justify-between">
        <Link
          href={`/alumni/communities/${community.id}?tab=BLOGS`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003D7A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blogs & Grants
        </Link>
        <div className="flex items-center gap-3">
          {canEditThisBlog && (
            <Link
              href={`/alumni/communities/${community.id}/blogs/edit?edit=${blog.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-[#003D7A] hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
              title="Edit blog article"
            >
              Edit Article
            </Link>
          )}
          {canDeleteThisBlog && (
            <DeleteBlogClientButton communityId={community.id} blogId={blog.id} />
          )}
          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#003D7A] text-xs font-bold border border-blue-100">
            {blog.category}
          </span>
        </div>
      </div>

      <main className="space-y-8">
        {/* Article Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {blog.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-3xl mx-auto">
            {blog.summary}
          </p>

          {/* Author Card & Date */}
          <div className="pt-4 flex items-center justify-center gap-4 text-xs text-slate-500 font-medium border-t border-slate-100 py-4">
            {blog.authorAlumni?.id ? (
              <Link
                href={`/alumni/profile/${blog.authorAlumni.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition group"
              >
                {blog.authorAlumni.avatarUrl ? (
                  <img src={blog.authorAlumni.avatarUrl} alt={blog.authorAlumni.name ?? "Author"} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#003D7A] text-white font-bold flex items-center justify-center text-xs">
                    {blog.authorAlumni.name?.slice(0, 1) || "A"}
                  </div>
                )}
                <div className="text-left">
                  <p className="font-bold text-slate-900 group-hover:text-[#003D7A] transition-colors">
                    {blog.authorAlumni.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{blog.authorAlumni.currentRole || "Contributor"}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#003D7A] text-white font-bold flex items-center justify-center text-xs">
                  {blog.authorStaff?.name?.slice(0, 1) || "A"}
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">
                    {blog.authorStaff?.name || "Community Member"}
                  </p>
                  <p className="text-[11px] text-slate-500">{blog.authorStaff?.role || "Contributor"}</p>
                </div>
              </div>
            )}

            <span>•</span>

            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#003D7A]" />
              {blog.publishedAt
                ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent"}
            </span>

            <span>•</span>

            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C41E3A]" /> {calculateReadTime(blog.content)} min read
            </span>
          </div>
        </div>

        {/* Cover Photo */}
        {blog.coverImage && (
          <div className="rounded-3xl overflow-hidden shadow-xl max-h-[450px] bg-slate-900 border border-slate-200">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Full Article Body */}
        <article className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm">
          <MarkdownRenderer content={blog.content} />
        </article>
      </main>
    </div>
  );
}

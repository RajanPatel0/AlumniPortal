"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MarkdownRenderer } from "@/components/community/MarkdownRenderer";
import { PollWidget } from "@/components/community/PollWidget";
import { MarkdownEditor } from "@/components/community/MarkdownEditor";
import { BLOG_CATEGORIES, UPDATE_TYPES, UPDATE_FILTERS, canDeletePost, canEditPost, calculateReadTime } from "@/lib/community-permissions";
import { apiFetch } from "@/lib/api";
import {
  Bell,
  Check,
  PlusCircle,
  Pin,
  MailCheck,
  FileText,
  Download,
  Calendar,
  BarChart2,
  X,
  BookOpen,
  Clock,
  ArrowRight,
  Upload,
  MessageSquare,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

interface CommunityTabClientProps {
  communityId: string;
  activeTab: "OVERVIEW" | "UPDATES" | "BLOGS";
  counts: { members: number; updates: number; blogs: number };
  permissions: {
    canEditCommunity: boolean;
    canPostUpdate: boolean;
    canCreateBlog: boolean;
    canManageMembers: boolean;
    canDeletePosts: boolean;
  };
  currentUserId?: string | null;
  currentStaffId?: string | null;
  initialIsFollowing: boolean;
  initialUpdates: any[];
  initialBlogs: any[];
  initialUpdateFilter: string;
  initialBlogCategory: string;
  children?: React.ReactNode;
}

export function CommunityTabClient({
  communityId,
  activeTab,
  counts,
  permissions,
  currentUserId,
  currentStaffId,
  initialIsFollowing,
  initialUpdates,
  initialBlogs,
  initialUpdateFilter,
  initialBlogCategory,
  children,
}: CommunityTabClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [updates, setUpdates] = useState(initialUpdates);
  const [blogs, setBlogs] = useState(initialBlogs);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setUpdates(initialUpdates);
  }, [initialUpdates]);

  useEffect(() => {
    setBlogs(initialBlogs);
  }, [initialBlogs]);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // Modal State
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("GENERAL_MSG");
  const [isNewsletter, setIsNewsletter] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [documents, setDocuments] = useState<{ fileName: string; fileUrl: string }[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const resetModalState = () => {
    setEditingUpdateId(null);
    setTitle("");
    setContent("");
    setType("GENERAL_MSG");
    setIsNewsletter(false);
    setIsPinned(false);
    setDocName("");
    setDocUrl("");
    setDocuments([]);
    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const handleOpenEditUpdate = (update: any) => {
    setEditingUpdateId(update.id);
    setTitle(update.title || "");
    setContent(update.content || "");
    setType(update.type || "GENERAL_MSG");
    setIsNewsletter(Boolean(update.isNewsletter));
    setIsPinned(Boolean(update.isPinned));
    setDocuments(update.documents || []);
    setIsModalOpen(true);
  };

  const updateFilters = UPDATE_FILTERS;

  const handleTabChange = (newTab: string) => {
    router.push(`${pathname}?tab=${newTab}`, { scroll: false });
  };

  const handleUpdateFilterChange = (filter: string) => {
    router.push(`${pathname}?tab=UPDATES&updateFilter=${filter}`, { scroll: false });
  };

  const handleBlogCategoryChange = (category: string) => {
    router.push(`${pathname}?tab=BLOGS&blogCategory=${category}`, { scroll: false });
  };

  const handleToggleFollow = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    try {
      const res = await apiFetch(`/communities/${communityId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFollowing: nextState }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(nextState ? "Following community newsletter!" : "Unfollowed newsletter");
      }
    } catch {
      setIsFollowing(!nextState);
      toast.error("Failed to update follow status");
    }
  };

  const handleAddDocument = () => {
    if (docName.trim() && docUrl.trim()) {
      setDocuments([...documents, { fileName: docName, fileUrl: docUrl }]);
      setDocName("");
      setDocUrl("");
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions((prev) => [...prev, ""]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    setPollOptions((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const pollData =
        showPollCreator && pollQuestion.trim()
          ? {
              question: pollQuestion,
              options: pollOptions.filter((o) => o.trim().length > 0),
            }
          : undefined;

      const endpoint = editingUpdateId
        ? `/communities/${communityId}/updates/${editingUpdateId}`
        : `/communities/${communityId}/updates`;
      const method = editingUpdateId ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          type,
          isNewsletter,
          isPinned,
          documents,
          poll: pollData,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetModalState();
        toast.success(editingUpdateId ? "Update edited successfully!" : "Update posted successfully!");
        router.refresh();
      } else {
        toast.error(json.error || "Failed to save update");
      }
    } catch (err) {
      console.error("Error saving update:", err);
      toast.error("Error saving update post");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePollVote = async (pollId: string, optionId: string) => {
    try {
      await apiFetch(`/communities/${communityId}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      router.refresh();
    } catch (err) {
      console.error("Poll vote failed:", err);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update post?")) return;
    try {
      const res = await apiFetch(`/communities/${communityId}/updates/${updateId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Update post deleted");
        router.refresh();
      } else {
        toast.error(json.error || "Failed to delete update");
      }
    } catch {
      toast.error("Error deleting update post");
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog article?")) return;
    try {
      const res = await apiFetch(`/communities/${communityId}/blogs/${blogId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Blog article deleted");
        router.refresh();
      } else {
        toast.error(json.error || "Failed to delete blog");
      }
    } catch {
      toast.error("Error deleting blog article");
    }
  };

  const featuredBlog = blogs[0];
  const regularBlogs = blogs.slice(1);

  return (
    <>
      {/* Top Header Action Buttons Overlay */}
      <div className="flex flex-wrap items-center justify-end gap-3 mt-4 sm:-mt-16 mb-4 relative z-20 px-6 sm:px-8">
        <button
          onClick={handleToggleFollow}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
            isFollowing
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
              : "bg-[#003D7A] hover:bg-[#002654] text-white"
          }`}
        >
          {isFollowing ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" /> Following Community
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" /> Follow Community
            </>
          )}
        </button>

        {activeTab === "BLOGS"
          ? permissions.canCreateBlog && (
              <Link
                href={`/alumni/communities/${communityId}/blogs/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" /> Write Article
              </Link>
            )
          : activeTab === "UPDATES"
          ? permissions.canPostUpdate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-red-50 text-[#C41E3A] hover:bg-red-100 transition-colors border border-red-100 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Post Update
              </button>
            )
          : null}
      </div>

      {/* Navigation Tabs (URL Driven) */}
      <div className="mt-10 flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange("OVERVIEW")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "OVERVIEW"
              ? "bg-[#003D7A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => handleTabChange("UPDATES")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "UPDATES"
              ? "bg-[#003D7A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Updates & Feed ({counts.updates})
        </button>
        <button
          onClick={() => handleTabChange("BLOGS")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "BLOGS"
              ? "bg-[#003D7A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Blogs & Grants ({counts.blogs})
        </button>
      </div>

      {/* Children for Overview tab or Client Feed for Updates/Blogs */}
      {activeTab === "OVERVIEW" && children}

      {/* Tab 2: Updates */}
      {activeTab === "UPDATES" && (
        <div className="mt-8 space-y-6">
          {/* Filter Tabs */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {updateFilters.map((f) => {
                const isActive = (initialUpdateFilter || "ALL") === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => handleUpdateFilterChange(f.value)}
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#003D7A] to-[#012140] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Updates Feed */}
          <div className="space-y-6">
            {updates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No updates posted yet</h3>
                <p className="text-slate-500 text-xs">Be the first to share progress updates or newsletter posts!</p>
              </div>
            ) : (
              updates.map((update) => (
                <article
                  key={update.id}
                  className={`bg-white rounded-3xl border ${
                    update.isPinned ? "border-amber-400 shadow-md" : "border-slate-200/80 shadow-sm"
                  } p-6 space-y-4`}
                >
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {update.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      {update.isNewsletter && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200">
                          <MailCheck className="w-3 h-3" /> Newsletter
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        {update.type.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(update.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      {canEditPost(
                        update.authorAlumniId,
                        update.authorStaffId,
                        currentUserId,
                        currentStaffId,
                        permissions.canPostUpdate
                      ) && (
                        <button
                          onClick={() => handleOpenEditUpdate(update)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#003D7A] hover:bg-blue-50 transition cursor-pointer"
                          title="Edit update post"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {canDeletePost(
                        update.authorAlumniId,
                        update.authorStaffId,
                        currentUserId,
                        currentStaffId,
                        permissions.canDeletePosts
                      ) && (
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete update post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Markdown Body */}
                  <div className="space-y-3">
                    <h2 className="text-xl font-extrabold text-slate-900">{update.title}</h2>
                    <MarkdownRenderer content={update.content} />
                  </div>

                  {/* Document Attachments */}
                  {update.documents && update.documents.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#003D7A]" /> Progress Attachments:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {update.documents.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#003D7A]" />
                            <span>{doc.fileName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Poll Widget */}
                  {update.poll && (
                    <PollWidget
                      poll={update.poll}
                      onVote={(optionId) => {
                        handlePollVote(update.poll.id, optionId);
                      }}
                    />
                  )}

                  {/* Author Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#003D7A] text-white font-bold flex items-center justify-center text-[10px]">
                        {update.authorAlumni?.name?.slice(0, 1) || update.authorStaff?.name?.slice(0, 1) || "A"}
                      </div>
                      <span className="font-semibold text-slate-700">
                        {update.authorAlumni?.name || update.authorStaff?.name || "Community Leader"}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Blogs */}
      {activeTab === "BLOGS" && (
        <div className="mt-8 space-y-6">
          {/* Category Filter Pills */}
          <div className="bg-white p-3 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[{ value: "All", label: "All" }, ...BLOG_CATEGORIES].map((cat) => {
              const isActive =
                (initialBlogCategory || "All") === cat.label ||
                (initialBlogCategory || "All") === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => handleBlogCategoryChange(cat.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                    isActive
                      ? "bg-[#C41E3A] border-[#C41E3A] text-white shadow-md"
                      : "bg-slate-100 border-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No blog posts published yet</h3>
              <p className="text-slate-500 text-sm">Stay tuned for upcoming community recaps and articles!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredBlog && (
                <Link
                  href={`/alumni/communities/${communityId}/blogs/${featuredBlog.slug}`}
                  className="group relative grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-3xl bg-white border border-slate-200/80 overflow-hidden p-6 sm:p-8 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-64 lg:h-auto rounded-2xl overflow-hidden bg-slate-100 relative">
                    {featuredBlog.coverImage ? (
                      <img
                        src={featuredBlog.coverImage}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#003D7A] to-[#012140] flex items-center justify-center p-8 text-white font-extrabold text-2xl text-center">
                        {featuredBlog.title}
                      </div>
                    )}
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#003D7A] text-white text-xs font-bold shadow-md">
                      Featured {featuredBlog.category}
                    </span>

                    {(canEditPost(
                      featuredBlog.authorAlumniId,
                      featuredBlog.authorStaffId,
                      currentUserId,
                      currentStaffId,
                      permissions.canCreateBlog
                    ) ||
                      canDeletePost(
                        featuredBlog.authorAlumniId,
                        featuredBlog.authorStaffId,
                        currentUserId,
                        currentStaffId,
                        permissions.canDeletePosts
                      )) && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 z-20 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200">
                        {canEditPost(
                          featuredBlog.authorAlumniId,
                          featuredBlog.authorStaffId,
                          currentUserId,
                          currentStaffId,
                          permissions.canCreateBlog
                        ) && (
                          <Link
                            href={`/alumni/communities/${communityId}/blogs/edit?edit=${featuredBlog.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#003D7A] hover:bg-blue-50 transition cursor-pointer"
                            title="Edit blog article"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {canDeletePost(
                          featuredBlog.authorAlumniId,
                          featuredBlog.authorStaffId,
                          currentUserId,
                          currentStaffId,
                          permissions.canDeletePosts
                        ) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteBlog(featuredBlog.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete blog article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#003D7A]" />
                          {featuredBlog.publishedAt
                            ? new Date(featuredBlog.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Recently"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C41E3A]" /> {calculateReadTime(featuredBlog.content)} min read
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#003D7A] transition-colors">
                        {featuredBlog.title}
                      </h2>

                      <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                        {featuredBlog.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#003D7A] text-white font-bold flex items-center justify-center text-xs">
                            {featuredBlog.authorAlumni?.name?.slice(0, 1) || "A"}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">
                            {featuredBlog.authorAlumni?.name || featuredBlog.authorStaff?.name || "Community Author"}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {featuredBlog.viewsCount || 0} views
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003D7A] group-hover:translate-x-1 transition-transform">
                        Read Full Story <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {regularBlogs.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-extrabold text-slate-900">More Articles & Grants</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularBlogs.map((blog: any) => (
                      <Link
                        key={blog.id}
                        href={`/alumni/communities/${communityId}/blogs/${blog.slug}`}
                        className="group flex flex-col justify-between rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="h-44 relative bg-slate-100 overflow-hidden">
                          {blog.coverImage ? (
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-[#012140] to-[#003D7A] flex items-center justify-center p-4 text-white font-bold text-center text-sm">
                              {blog.title}
                            </div>
                          )}
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                            {blog.category}
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-[#003D7A] transition-colors line-clamp-2">
                                {blog.title}
                              </h4>
                              <div className="flex items-center gap-1 shrink-0 z-10">
                                {canEditPost(
                                  blog.authorAlumniId,
                                  blog.authorStaffId,
                                  currentUserId,
                                  currentStaffId,
                                  permissions.canCreateBlog
                                ) && (
                                  <Link
                                    href={`/alumni/communities/${communityId}/blogs/edit?edit=${blog.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded-md text-slate-400 hover:text-[#003D7A] hover:bg-blue-50 transition cursor-pointer"
                                    title="Edit blog article"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                )}

                                {canDeletePost(
                                  blog.authorAlumniId,
                                  blog.authorStaffId,
                                  currentUserId,
                                  currentStaffId,
                                  permissions.canDeletePosts
                                ) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteBlog(blog.id);
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                    title="Delete blog article"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {blog.summary}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-3">
                              <span>{blog.authorAlumni?.name || blog.authorStaff?.name || "Author"}</span>
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                {blog.viewsCount || 0} views
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[#003D7A] font-bold group-hover:translate-x-0.5 transition-transform">
                              Read <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50 rounded-t-2xl shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingUpdateId ? "Edit Update Post" : "Post New Update"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalState();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUpdate} className="space-y-4 p-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Progress Milestone & Grant Distribution"
                  className="w-full text-slate-900 placeholder:text-slate-500 p-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#003D7A] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Update Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-slate-900 p-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#003D7A] font-medium"
                  >
                    {UPDATE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewsletter}
                      onChange={(e) => setIsNewsletter(e.target.checked)}
                      className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                    />
                    Newsletter Flag
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-slate-300 text-[#003D7A] focus:ring-[#003D7A]"
                    />
                    Pin Post
                  </label>
                </div>
              </div>

              <MarkdownEditor label="Update Content (Markdown)" value={content} onChange={setContent} rows={5} />

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#003D7A]" /> Attach Document / Progress Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Custom File/Document Title"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-500 font-medium"
                  />
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="File URL or upload file →"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-500 font-medium"
                    />
                    <label className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shrink-0 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("folder", "community_docs");
                            const res = await apiFetch("/upload", { method: "POST", body: formData });
                            const data = await res.json();
                            if (data.url) {
                              setDocUrl(data.url);
                              if (!docName.trim()) setDocName(file.name);
                              toast.success("File uploaded!");
                            }
                          } catch {
                            toast.error("Upload failed");
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="px-4 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold cursor-pointer transition shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {documents.map((d, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#003D7A] text-xs font-semibold border border-blue-100">
                        <FileText className="w-3 h-3 text-[#003D7A]" />
                        {d.fileName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003D7A] hover:underline cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4" />
                  {showPollCreator ? "Remove Poll" : "+ Add Interactive Poll"}
                </button>

                {showPollCreator && (
                  <div className="mt-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
                    <input
                      type="text"
                      placeholder="Poll Question (e.g. Which project should we fund next?)"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-blue-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-500"
                    />

                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                          className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-500 font-medium"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-xs font-bold text-[#003D7A] hover:underline"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetModalState();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer transition"
                >
                  {submitting
                    ? "Saving..."
                    : editingUpdateId
                    ? "Save Changes"
                    : "Publish Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

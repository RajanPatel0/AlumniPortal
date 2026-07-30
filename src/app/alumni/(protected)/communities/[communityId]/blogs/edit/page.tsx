"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MarkdownEditor } from "@/components/community/MarkdownEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { ArrowLeft, BookOpen, Sparkles, Send, Tag } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";
import { BLOG_CATEGORIES } from "@/lib/community-permissions";

export default function CommunityBlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = params.communityId as string;
  const editBlogId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("General");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetchingEditData, setFetchingEditData] = useState(false);

  useEffect(() => {
    if (communityId && editBlogId) {
      fetchBlogForEdit(editBlogId);
    }
  }, [communityId, editBlogId]);

  const fetchBlogForEdit = async (blogId: string) => {
    setFetchingEditData(true);
    try {
      const res = await apiFetch(`/communities/${communityId}/blogs/${blogId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const b = json.data;
        setTitle(b.title || "");
        setSlug(b.slug || "");
        setSummary(b.summary || "");
        setContent(b.content || "");
        setCoverImage(b.coverImage || "");
        setCategory(b.category || "General");
        if (Array.isArray(b.tags)) {
          setTagsInput(b.tags.join(", "));
        }
      }
    } catch {
      toast.error("Failed to load blog for editing");
    } finally {
      setFetchingEditData(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editBlogId && (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        summary,
        content,
        coverImage: coverImage || null,
        category,
        tags,
      };

      const endpoint = editBlogId
        ? `/communities/${communityId}/blogs/${editBlogId}`
        : `/communities/${communityId}/blogs`;
      const method = editBlogId ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editBlogId ? "Blog article updated successfully!" : "Blog article published successfully!");
        router.push(`/alumni/communities/${communityId}/blogs/${json.data.slug}`);
      } else {
        toast.error(json.error || "Failed to save blog article");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingEditData) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-12">
        <p className="text-slate-500 font-semibold text-sm">Loading article data for editing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 px-1">
      {/* Header Info Banner matching platform design system */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <Link
          href={`/alumni/communities/${communityId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003D7A] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Community Profile
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#C41E3A] shrink-0 shadow-2xs">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {editBlogId ? "Edit Community Article" : "Create Community Article"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              {editBlogId
                ? "Update your published article details and content."
                : "Share project milestones, grant recaps, technical write-ups, or announcements."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Q3 Open Source Grant Distribution & Project Milestones"
              className="w-full text-slate-900 placeholder:text-slate-400 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-base focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-semibold transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="q3-open-source-grant"
                className="w-full text-slate-900 placeholder:text-slate-400 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-slate-900 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-medium transition cursor-pointer"
              >
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Short Summary
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief 1-2 sentence overview of the article..."
              className="w-full text-slate-900 placeholder:text-slate-400 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-medium transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Cover Image
            </label>
            <ImageUploader
              value={coverImage}
              onChange={setCoverImage}
              placeholder="Upload cover image for blog"
              folder="communities/blogs"
            />
          </div>

          {/* Markdown Content Editor */}
          <MarkdownEditor
            label="Article Body (Markdown)"
            value={content}
            onChange={setContent}
            rows={12}
            placeholder="Write full article using Markdown formatting..."
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#003D7A]" /> Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. OpenSource, Robotics, Grants, kapurthala"
              className="w-full text-slate-900 placeholder:text-slate-400 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-medium transition"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Link
            href={`/alumni/communities/${communityId}`}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-2xl bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {submitting
                ? "Saving..."
                : editBlogId
                ? "Save Changes"
                : "Publish Article"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

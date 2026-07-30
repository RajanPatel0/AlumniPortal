"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div
      className={`prose max-w-none text-slate-900
      prose-headings:font-bold prose-headings:text-slate-900 
      prose-h1:text-2xl prose-h1:mt-2 prose-h1:mb-3
      prose-h2:text-xl prose-h2:mt-3 prose-h2:mb-2 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-1
      prose-h3:text-lg prose-h3:mt-2 prose-h3:mb-1
      prose-p:text-slate-800 prose-p:my-1.5 prose-p:leading-relaxed
      prose-strong:text-slate-900 prose-strong:font-bold
      prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 prose-ul:text-slate-800
      prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2 prose-ol:text-slate-800
      prose-li:my-1 prose-li:pl-1
      prose-a:text-[#003D7A] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-4 prose-blockquote:border-l-[#003D7A] prose-blockquote:text-slate-700 prose-blockquote:bg-slate-50 prose-blockquote:py-1.5 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:my-2
      prose-code:text-[#003D7A] prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
      prose-img:rounded-xl prose-img:shadow-sm ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function DeleteBlogClientButton({ communityId, blogId }: { communityId: string; blogId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog article?")) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/communities/${communityId}/blogs/${blogId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/alumni/communities/${communityId}?tab=BLOGS`);
        router.refresh();
      } else {
        alert(json.error || "Failed to delete blog article");
      }
    } catch {
      alert("Error deleting blog article");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer disabled:opacity-50"
      title="Delete blog article"
    >
      {deleting ? "Deleting..." : "Delete Article"}
    </button>
  );
}

export function EditOverviewButton({
  communityId,
  initialDescription,
}: {
  communityId: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [description, setDescription] = React.useState(initialDescription || "");
  const [saving, setSaving] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const res = await apiFetch(`/communities/${communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (json.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(json.error || "Failed to update community overview");
      }
    } catch {
      alert("Error updating community overview");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-[#003D7A] hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
        title="Edit About Description"
      >
        Edit Overview
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Edit About Community Description
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Community Description (Markdown supported)
                </label>
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-slate-900 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003D7A] font-medium transition"
                  placeholder="Describe your community..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold shadow-md disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save Overview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

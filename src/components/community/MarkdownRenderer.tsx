"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

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

import React, { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Eye, Edit3 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write update content in Markdown format...",
  rows = 6,
  label,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#003D7A] hover:underline cursor-pointer ml-auto"
        >
          {isPreview ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-[#003D7A]" /> Edit Markdown
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-[#003D7A]" /> Live Preview
            </>
          )}
        </button>
      </div>

      {isPreview ? (
        <div className="min-h-[140px] p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 overflow-y-auto max-h-[300px]">
          {value && value.trim() ? (
            <MarkdownRenderer content={value} className="text-slate-900 text-sm leading-relaxed" />
          ) : (
            <p className="text-xs text-slate-400 italic font-medium">Nothing to preview yet. Write some markdown content first.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#003D7A] transition-all font-sans font-medium leading-relaxed"
        />
      )}
    </div>
  );
}

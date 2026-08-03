'use client';

import { useState } from 'react';

interface PostTextContentProps {
  content: string;
}

export default function PostTextContent({ content }: PostTextContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content) return null;
  const MAX_LENGTH = 180;
  const isLong = content.length > MAX_LENGTH || content.split('\n').length > 4;

  if (!isLong) {
    return (
      <p className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
        {content}
      </p>
    );
  }

  return (
    <div className="text-sm text-slate-800 leading-relaxed font-medium">
      {isExpanded ? (
        <p className="whitespace-pre-line">
          {content}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 font-bold hover:text-slate-600 text-xs ml-2 cursor-pointer inline-flex items-center"
          >
            Show less
          </button>
        </p>
      ) : (
        <p className="whitespace-pre-line">
          {content.slice(0, MAX_LENGTH)}...
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-[#003D7A] font-extrabold hover:text-[#C41E3A] hover:underline text-xs ml-1 cursor-pointer inline-flex items-center"
          >
            more
          </button>
        </p>
      )}
    </div>
  );
}

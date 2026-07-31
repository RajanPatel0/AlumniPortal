"use client";

import React from "react";
import { Globe, MessageSquare, Send, Disc as Discord, ExternalLink } from "lucide-react";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.64a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface ExternalLinksBarProps {
  links?: Record<string, string> | null;
}

export function ExternalLinksBar({ links }: ExternalLinksBarProps) {
  let parsedLinks = links;
  if (typeof links === "string") {
    try {
      parsedLinks = JSON.parse(links);
    } catch {
      parsedLinks = null;
    }
  }

  if (!parsedLinks || typeof parsedLinks !== "object" || Object.keys(parsedLinks).length === 0) return null;

  const getIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("whatsapp")) return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
    if (k.includes("telegram")) return <Send className="w-3.5 h-3.5 text-sky-600" />;
    if (k.includes("linkedin")) return <LinkedInIcon className="w-3.5 h-3.5 text-[#003D7A]" />;
    if (k.includes("github")) return <GitHubIcon className="w-3.5 h-3.5 text-slate-800" />;
    if (k.includes("discord")) return <Discord className="w-3.5 h-3.5 text-indigo-600" />;
    if (k.includes("website")) return <Globe className="w-3.5 h-3.5 text-[#003D7A]" />;
    return <ExternalLink className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(parsedLinks).map(([name, url]) => {
        if (!url || typeof url !== "string" || !url.trim()) return null;
        const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

        return (
          <a
            key={name}
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#003D7A] transition-colors border border-slate-200"
          >
            {getIcon(name)}
            <span className="capitalize">{name}</span>
          </a>
        );
      })}
    </div>
  );
}

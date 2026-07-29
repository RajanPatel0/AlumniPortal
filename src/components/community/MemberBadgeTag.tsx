"use client";

import React from "react";
import { ShieldCheck, Award, UserCheck, Star } from "lucide-react";

export type CommunityRoleTagType = "LEADER" | "COORDINATOR" | "CORE_MEMBER" | "ADVISOR" | "MEMBER" | "FOLLOWER";

interface MemberBadgeTagProps {
  roleTag: CommunityRoleTagType;
  customTitle?: string | null;
  size?: "sm" | "md";
}

export function MemberBadgeTag({ roleTag, customTitle, size = "sm" }: MemberBadgeTagProps) {
  const displayTitle = customTitle || roleTag.replace("_", " ");

  const colorMap: Record<CommunityRoleTagType, { bg: string; text: string; icon: React.ReactNode }> = {
    LEADER: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: <ShieldCheck className="w-3 h-3 text-amber-600" />,
    },
    COORDINATOR: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-[#003D7A]",
      icon: <Award className="w-3 h-3 text-[#003D7A]" />,
    },
    ADVISOR: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      icon: <Star className="w-3 h-3 text-emerald-600" />,
    },
    CORE_MEMBER: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-800",
      icon: <UserCheck className="w-3 h-3 text-purple-600" />,
    },
    MEMBER: {
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-700",
      icon: null,
    },
    FOLLOWER: {
      bg: "bg-slate-50 border-slate-200",
      text: "text-slate-500",
      icon: null,
    },
  };

  const style = colorMap[roleTag] || colorMap.MEMBER;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border ${style.bg} ${style.text} ${padding}`}
    >
      {style.icon}
      {displayTitle}
    </span>
  );
}

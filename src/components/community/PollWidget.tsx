"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, BarChart2 } from "lucide-react";

export interface PollOptionData {
  id: string;
  text: string;
  voteCount: number;
  hasVoted?: boolean;
}

export interface PollData {
  id: string;
  question: string;
  allowMultiple?: boolean;
  totalVotes: number;
  options: PollOptionData[];
  expiresAt?: string | null;
}

interface PollWidgetProps {
  poll: PollData;
  onVote: (optionId: string) => Promise<void> | void;
  isLoggedIn?: boolean;
}

export function PollWidget({ poll, onVote, isLoggedIn = true }: PollWidgetProps) {
  const [options, setOptions] = useState<PollOptionData[]>(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (optionId: string) => {
    if (!isLoggedIn || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onVote(optionId);
      // Optimistic update
      setOptions((prev) =>
        prev.map((opt) => {
          if (opt.id === optionId) {
            const nextVoted = !opt.hasVoted;
            return {
              ...opt,
              hasVoted: nextVoted,
              voteCount: nextVoted ? opt.voteCount + 1 : Math.max(0, opt.voteCount - 1),
            };
          }
          return poll.allowMultiple ? opt : { ...opt, hasVoted: false };
        })
      );
      setTotalVotes((prev) => prev + 1);
    } catch (err) {
      console.error("Poll vote error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-[#012140] flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#003D7A]" />
          {poll.question}
        </h4>
        <span className="text-xs text-slate-500 font-semibold">{totalVotes} votes</span>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={!isLoggedIn || isSubmitting}
              onClick={() => handleVote(option.id)}
              className={`w-full relative overflow-hidden text-left p-3 rounded-xl border transition-all cursor-pointer ${
                option.hasVoted
                  ? "border-[#003D7A] bg-blue-50/50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* Progress bar background */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-blue-100/60 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {option.hasVoted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#003D7A] shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">{option.text}</span>
                </div>
                <span className="text-xs font-bold text-slate-700">{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

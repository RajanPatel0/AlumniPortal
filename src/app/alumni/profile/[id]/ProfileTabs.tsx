'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, GraduationCap, Building, Calendar, Award, Rocket, 
   Globe
} from 'lucide-react';

import PostCard from '@/components/alumni/PostCard';

interface ProfileTabsProps {
  alumni: {
    branch: string;
    college: string;
    batchYear: number;
  };
  workExperience: any[];
  education: any[];
  startups: any[];
  posts: any[];
  activityPosts: any[];
  currentUser: {
    id?: string;
    name: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  } | null;
}

function formatDate(date: Date | string | null) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
}

import PostTextContent from '@/components/alumni/PostTextContent';
import ImageGallery from '@/components/alumni/ImageGallery';

// Reusable timeline node so connector-line logic can't drift out of sync between sections
function TimelineNode({
  isLast,
  dotClass = 'bg-gradient-to-br from-[#003D7A] to-[#C41E3A] ring-slate-100',
}: { isLast: boolean; dotClass?: string }) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div className={`w-3.5 h-3.5 rounded-full ring-4 ${dotClass}`} />
      {!isLast && <div className="w-0.5 flex-1 bg-slate-100 my-2 min-h-[16px]" />}
    </div>
  );
}

export default function ProfileTabs({
  alumni,
  workExperience,
  education,
  startups,
  posts,
  activityPosts,
  currentUser
}: ProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'experience' | 'posts' | 'activity'>('experience');

  const tabBtn = (tab: 'experience' | 'posts' | 'activity', label: string) => (
    <button
      role="tab"
      aria-selected={activeTab === tab}
      onClick={() => setActiveTab(tab)}
      className={`relative pb-3 px-1 text-sm font-bold transition-colors mr-6 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#003D7A]/40 rounded-t ${
        activeTab === tab ? 'text-[#003D7A]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {label}
      <span
        className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-all ${
          activeTab === tab ? 'bg-[#003D7A]' : 'bg-transparent'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div role="tablist" className="flex border-b border-slate-200 bg-white rounded-t-3xl px-6 pt-4 shadow-sm">
        {tabBtn('experience', 'Experience & Education')}
        {tabBtn('posts', `Recent Posts (${posts.length})`)}
        {tabBtn('activity', `Activity (${activityPosts.length})`)}
      </div>

      {/* Tab Contents */}
      <div key={activeTab} className="animate-[fadeIn_0.15s_ease-out]">
      {activeTab === 'experience' ? (
        <div className="space-y-8">
          {/* Work Experience Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <Briefcase size={20} className="text-[#003D7A]" />
              <span>Work Experience</span>
            </h2>

            {workExperience.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                No work experience specified
              </div>
            ) : (
              <div className="space-y-6">
                {workExperience.map((exp, idx) => (
                  <div key={exp.id} className="relative flex gap-4">
                    <TimelineNode isLast={idx === workExperience.length - 1} />
                    <div className="space-y-1.5 pb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {exp.title}
                      </h3>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 flex-wrap">
                        <Building size={14} className="text-slate-400 shrink-0" />
                        <span>{exp.company}</span>
                        {exp.location && (
                          <span className="text-xs text-slate-400 font-medium">({exp.location})</span>
                        )}
                        {exp.isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>
                          {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                        </span>
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-500 leading-relaxed pt-1.5 whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <GraduationCap size={22} className="text-[#003D7A]" />
              <span>Education</span>
            </h2>

            <div className="space-y-6">
              <div className="relative flex gap-4">
                <TimelineNode isLast={education.length === 0} dotClass="bg-[#C41E3A] ring-rose-50" />
                <div className="space-y-1 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    {alumni.branch}
                  </h3>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Award size={14} className="text-[#C41E3A]" />
                    <span>{alumni.college}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Class of {alumni.batchYear}</span>
                  </p>
                </div>
              </div>

              {education.map((edu, idx) => (
                <div key={edu.id} className="relative flex gap-4">
                  <TimelineNode isLast={idx === education.length - 1} dotClass="bg-slate-300 ring-slate-100" />
                  <div className="space-y-1.5 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </h3>
                    <p className="text-sm font-semibold text-slate-700">
                      {edu.school}
                    </p>
                    <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>
                        {formatDate(edu.startDate)} – {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                      </span>
                    </p>
                    {edu.description && (
                      <p className="text-xs text-slate-500 leading-relaxed pt-1.5 whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Startups Card */}
          {startups.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <Rocket size={20} className="text-[#003D7A]" />
                <span>Startups & Ventures</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {startups.map((startup) => (
                  <div key={startup.id} className="border border-slate-150 rounded-2xl p-4 space-y-3 hover:border-slate-300 hover:shadow-sm transition bg-slate-50/50">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{startup.name}</h3>
                        {startup.industry && (
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-0.5">{startup.industry}</p>
                        )}
                      </div>
                      {startup.websiteUrl && (
                        <a 
                          href={startup.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#003D7A] transition shrink-0"
                        >
                          <Globe size={16} />
                        </a>
                      )}
                    </div>
                    {startup.description && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{startup.description}</p>
                    )}
                    {startup.foundedYear && (
                      <div className="text-[10px] font-bold text-slate-400 mt-2">
                        Founded {startup.foundedYear}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'posts' ? (
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-sm font-medium">
              No recent posts to display
            </div>
          ) : (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onDeleteSuccess={() => {
                  router.refresh();
                }}
                priority={index === 0}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activityPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-sm font-medium">
              No recent activity to display
            </div>
          ) : (
            activityPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onDeleteSuccess={() => {
                  router.refresh();
                }}
                priority={index === 0}
              />
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
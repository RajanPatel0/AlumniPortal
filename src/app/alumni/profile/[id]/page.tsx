import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Mail, Briefcase, MapPin, Calendar, ExternalLink, 
  GraduationCap, Globe, ShieldCheck, Building, Award, Rocket
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
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

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;

  const alumni = await prisma.alumni.findUnique({
    where: { id },
    include: {
      education: {
        orderBy: { startDate: 'desc' }
      },
      workExperience: {
        orderBy: { startDate: 'desc' }
      },
      startups: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!alumni) {
    notFound();
  }

  const initial = alumni.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#C41E3A]/10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#003D7A] transition"
          >
            ← Back to Portal
          </Link>
          <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full font-bold">
            <ShieldCheck size={14} />
            Verified Alumni Profile
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Header Cover Banner */}
          <div className="bg-gradient-to-r from-[#003D7A] via-[#002b56] to-[#C41E3A] h-48 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          </div>

          <div className="px-6 sm:px-10 pb-10 relative">
            {/* Avatar Circle */}
            <div className="flex justify-start -mt-20 mb-6">
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[#003D7A] to-[#C41E3A] p-1.5 shadow-xl bg-white">
                <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
                  {alumni.avatarUrl ? (
                    <img 
                      src={alumni.avatarUrl} 
                      alt={alumni.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 font-extrabold text-5xl">{initial}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Info */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-2.5">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  {alumni.name}
                  {alumni.isRegistered && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#003D7A]/10 text-[#003D7A]" title="Active Member">
                      ACTIVE
                    </span>
                  )}
                </h1>

                {alumni.currentRole && (
                  <p className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={18} className="text-[#C41E3A] shrink-0" />
                    <span>{alumni.currentRole} {alumni.currentCompany && `at ${alumni.currentCompany}`}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={16} className="text-slate-400" />
                    {alumni.branch} · Class of {alumni.batchYear}
                  </span>
                  {alumni.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {alumni.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                {alumni.linkedinUrl && (
                  <a
                    href={alumni.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0077B5] hover:bg-[#006399] text-white text-sm font-bold rounded-xl transition shadow-sm"
                  >
                    <span>Connect on LinkedIn</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                <a
                  href={`mailto:${alumni.email}`}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  <Mail size={16} />
                  <span>Send Email</span>
                </a>
              </div>
            </div>

            {/* Bio Section */}
            {alumni.bio && (
              <div className="mt-8 pt-8 border-t border-slate-100 max-w-3xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">About</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{alumni.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Work Experience Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <Briefcase size={20} className="text-[#003D7A]" />
                <span>Work Experience</span>
              </h2>

              {alumni.workExperience.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No work experience specified
                </div>
              ) : (
                <div className="space-y-6">
                  {alumni.workExperience.map((exp, idx) => (
                    <div key={exp.id} className="relative flex gap-4">
                      {/* Timeline bar / dot */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#003D7A] to-[#C41E3A] ring-4 ring-slate-100" />
                        {idx < alumni.workExperience.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-100 my-2" />
                        )}
                      </div>
                      <div className="space-y-1.5 pb-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                          {exp.title}
                        </h3>
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Building size={14} className="text-slate-400" />
                          <span>{exp.company}</span>
                          {exp.location && (
                            <span className="text-xs text-slate-400 font-medium">({exp.location})</span>
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
                {/* Always include institutional info first if available */}
                <div className="relative flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#C41E3A] ring-4 ring-rose-50" />
                    {alumni.education.length > 0 && (
                      <div className="w-0.5 flex-1 bg-slate-100 my-2" />
                    )}
                  </div>
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

                {alumni.education.map((edu, idx) => (
                  <div key={edu.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                      {idx < alumni.education.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-100 my-2" />
                      )}
                    </div>
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
            {alumni.startups.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                  <Rocket size={20} className="text-[#003D7A]" />
                  <span>Startups & Ventures</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {alumni.startups.map((startup) => (
                    <div key={startup.id} className="border border-slate-150 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition bg-slate-50/50">
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
                            className="text-slate-400 hover:text-[#003D7A] transition"
                          >
                            <Globe size={16} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{startup.description}</p>
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

          {/* Sidebar / Additional Info */}
          <div className="space-y-8">
            
            {/* Contact Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Contact & Location</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Mail className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                    <a href={`mailto:${alumni.email}`} className="text-sm font-semibold text-slate-700 hover:underline truncate block">
                      {alumni.email}
                    </a>
                  </div>
                </div>

                {alumni.phone && (
                  <div className="flex gap-3">
                    <span className="text-slate-400 shrink-0 text-md">📞</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {alumni.phone}
                      </p>
                    </div>
                  </div>
                )}

                {alumni.city && (
                  <div className="flex gap-3">
                    <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Preferred Location</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {alumni.city}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* University & Degree Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Academic Profile</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">College</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{alumni.college}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Course & Branch</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{alumni.course || 'B.Tech'} in {alumni.branch}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Graduation Year</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">Class of {alumni.batchYear}</p>
                </div>
                {alumni.enrollmentNo && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enrollment No.</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{alumni.enrollmentNo}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

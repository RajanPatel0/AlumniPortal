import { MapPin, Briefcase, DollarSign, Lock, Unlock, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export interface JobItemType {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salaryRange: string | null;
  applyUrl: string | null;
  isActive: boolean;
  postedByAlumniId: string | null;
  createdAt: Date | string;
  expireAt: Date | string | null;
  workplaceType: string;
  type: string;
  experienceRange: string;
  industry: string;
  skills: string[];
  applicants: string[];
  applicantsProfiles: any[];
  postedByMe: boolean;
  appliedByMe: boolean;
  isExpired: boolean;
  postedByAlumni?: {
    name: string;
    currentRole: string | null;
    avatarUrl: string | null;
    city: string | null;
  } | null;
  postedByStaff?: {
    name: string;
  } | null;
}

interface JobCardProps {
  job: JobItemType;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onApply: (id: string) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export function JobCard({ job, onToggleStatus, onApply, isAdmin = false, onDelete }: JobCardProps) {
  const getInitials = (name: string) => {
    return name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'J';
  };

  const formatDate = (dateStr: Date | string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition flex flex-col justify-between gap-3 relative">
      {/* Top Header: Title, Company, Status Tag */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-950 hover:text-[#003D7A] transition-colors">
            {job.title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{job.company}</p>
        </div>
        
        <span className="flex-shrink-0 px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-wide">
          {job.type}
        </span>
      </div>

      {/* Metadata Row */}
      <div className="flex items-center gap-x-6 gap-y-2 text-[11px] text-slate-500 font-semibold flex-wrap">
        <div className="flex items-center gap-1">
          <MapPin size={13} className="text-slate-400" />
          <span>{job.location} ({job.workplaceType})</span>
        </div>
        <div className="flex items-center gap-1">
          <Briefcase size={13} className="text-slate-400" />
          <span>{job.experienceRange}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign size={13} className="text-slate-400" />
          <span>{job.salaryRange || 'Not specified'}</span>
        </div>
        {job.expireAt && (
          <div className="flex items-center gap-1">
            <Calendar size={13} className="text-slate-400" />
            <span>Deadline: {formatDate(job.expireAt)}</span>
          </div>
        )}
      </div>

      {/* Skills tags */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 my-1">
          {job.skills.map((skill, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[9px] font-bold border border-slate-100">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Owner Info & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-medium flex-wrap gap-2">
        <div>
          <span>
            Posted by {job.postedByMe ? 'You' : (job.postedByStaff?.name || job.postedByAlumni?.name || 'System')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Active status label */}
          <div className="flex items-center gap-1 font-bold">
            {job.isActive && !job.isExpired ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <Unlock size={11} />
                Open
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-0.5">
                <Lock size={11} />
                Closed {job.isExpired && '(Expired)'}
              </span>
            )}
          </div>

          {/* Owner/Admin controls: Toggle Status */}
          {(job.postedByMe || isAdmin) && (
            <button
              onClick={() => onToggleStatus(job.id, !job.isActive)}
              className={`p-1 px-2.5 rounded-lg border text-[9px] font-black transition flex items-center gap-1 active:scale-[0.98] ${
                job.isActive 
                  ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700' 
                  : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700'
              }`}
            >
              {job.isActive ? <Lock size={10} /> : <Unlock size={10} />}
              <span>{job.isActive ? 'Close Job' : 'Reopen Job'}</span>
            </button>
          )}

          {/* Admin controls: Delete Job */}
          {isAdmin && onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this opportunity?')) {
                  onDelete(job.id);
                }
              }}
              className="p-1 px-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-[9px] font-black transition flex items-center gap-1 active:scale-[0.98]"
            >
              <Trash2 size={10} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Applied Action block */}
      {!job.postedByMe && !isAdmin && (
        <div className="flex justify-end pt-1">
          {job.appliedByMe ? (
            <span className="px-3.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold border border-slate-200">
              Applied
            </span>
          ) : job.isActive && !job.isExpired ? (
            <a
              href={job.applyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                onApply(job.id);
                if (!job.applyUrl) {
                  e.preventDefault();
                  toast.success("Application logged successfully!");
                }
              }}
              className="px-4 py-1.5 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-xl text-[10px] font-black transition select-none flex items-center gap-1 active:scale-[0.98]"
            >
              <span>Apply Now</span>
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="px-3.5 py-1 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-100">
              Applications Closed
            </span>
          )}
        </div>
      )}

      {/* Lister candidates view list */}
      {(job.postedByMe || isAdmin) && job.applicantsProfiles && job.applicantsProfiles.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
          <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Interested Candidates ({job.applicantsProfiles.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.applicantsProfiles.map((candidate: any) => (
              <Link 
                key={candidate.id}
                href={`/alumni/profile?id=${candidate.id}`}
                title={`View ${candidate.name}'s Profile (${candidate.email})`}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 rounded-full pl-1 pr-2.5 py-1 text-[9px] font-semibold text-slate-700 transition cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-[7px] font-bold border border-slate-100">
                  {candidate.avatarUrl ? (
                    <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(candidate.name)
                  )}
                </div>
                <div className="flex flex-col leading-none">
                  <span>{candidate.name}</span>
                  <span className="text-[7px] text-slate-400 font-normal">{candidate.currentRole || 'Alumni'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

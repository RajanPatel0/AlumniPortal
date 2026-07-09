import { MapPin, Globe, ExternalLink, Pencil, Trash2 } from 'lucide-react';

export interface StartUpItem {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  foundedYear?: number | null;
  founderId: string;
  postedByMe?: boolean;
  createdAt?: string;
  updatedAt?: string;
  founder: {
    id: string;
    name: string;
    currentRole?: string | null;
    avatarUrl?: string | null;
    city?: string | null;
  };
}

interface StartupCardProps {
  startup: StartUpItem;
  onEdit?: (startup: StartUpItem) => void;
  onDelete?: (id: string) => void;
}

export function StartupCard({ startup, onEdit, onDelete }: StartupCardProps) {
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'S';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition relative flex flex-col justify-between">
      {/* Logo Banner Area */}
      <div className="h-32 bg-slate-50 border-b border-slate-50 flex items-center justify-center p-4 relative">
        {startup.logoUrl ? (
          <img 
            src={startup.logoUrl} 
            alt={startup.name} 
            className="max-h-full max-w-[150px] object-contain rounded-lg shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] flex items-center justify-center text-white font-black text-xl">
            {getInitials(startup.name)}
          </div>
        )}

        {/* Owner controls overlay */}
        {startup.postedByMe && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            {onEdit && (
              <button
                onClick={() => onEdit(startup)}
                title="Edit startup"
                className="p-1.5 bg-white/90 hover:bg-white text-slate-600 hover:text-[#003D7A] rounded-lg shadow-sm border border-slate-200 transition"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${startup.name}"? This cannot be undone.`)) {
                    onDelete(startup.id);
                  }
                }}
                title="Delete startup"
                className="p-1.5 bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg shadow-sm border border-slate-200 hover:border-rose-200 transition"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info block */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
            {startup.name}
          </h4>
          <p className="text-[11px] text-slate-600 font-medium mt-1 line-clamp-3 leading-relaxed">
            {startup.description}
          </p>
        </div>

        <div className="mt-4 space-y-2 pt-3 border-t border-slate-50">
          {/* Location Pin */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <MapPin size={13} className="text-slate-400" />
            <span>{startup.founder?.city || 'Not specified'}</span>
          </div>

          {/* Website Link */}
          {startup.websiteUrl && (
            <a 
              href={startup.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold w-fit"
            >
              <Globe size={13} />
              <span className="truncate max-w-[180px]">{startup.websiteUrl}</span>
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Founder Block & Industry Tag */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] overflow-hidden flex-shrink-0">
            {startup.founder?.avatarUrl ? (
              <img src={startup.founder.avatarUrl} alt={startup.founder.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(startup.founder?.name || 'S')
            )}
          </div>
          <div>
            <p className="font-bold text-gray-800 leading-tight">
              {startup.postedByMe ? 'You' : startup.founder?.name}
            </p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-none">
              {startup.founder?.currentRole || 'Alumnus'}
            </p>
          </div>
        </div>
        
        {startup.industry && (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] truncate max-w-[120px]">
            {startup.industry}
          </span>
        )}
      </div>
    </div>
  );
}

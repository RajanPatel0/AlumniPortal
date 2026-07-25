import { BASE_PATH } from '@/lib/api';
import { AlumniMarkerData } from '../utils/cluster';
import { escapeHtml } from '../utils/popup';

/**
 * Pure function returning clean HTML template for an individual alumnus marker popup
 */
export function renderSingleAlumnusPopup(person: AlumniMarkerData): string {
  const name = escapeHtml(person.name);
  const branch = escapeHtml(person.branch);
  const company = escapeHtml(person.currentCompany);
  const role = escapeHtml(person.currentRole);
  const location = escapeHtml(person.location?.displayName);
  const campusCode = person.campus ? escapeHtml(person.campus.toUpperCase()) : null;
  const firstLetter = escapeHtml(person.name.charAt(0).toUpperCase());

  return `
    <div class="w-80 p-1.5 font-sans text-slate-800">
      <!-- Header Card with Ring Avatar -->
      <div class="flex items-start gap-3">
        <div class="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#003D7A] via-[#1E5086] to-[#C41E3A] p-[2px] flex-shrink-0 shadow-md shadow-slate-900/10">
          <div class="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center border border-white">
            ${person.avatarUrl 
              ? `<img src="${escapeHtml(person.avatarUrl)}" alt="${name}" class="w-full h-full object-cover rounded-full" />`
              : `<span class="text-[#003D7A] font-extrabold text-base tracking-tight">${firstLetter}</span>`
            }
          </div>
        </div>
        <div class="min-w-0 flex-1 pr-4">
          <h4 class="text-sm font-extrabold text-slate-900 truncate leading-snug">${name}</h4>
          <p class="text-[11px] font-medium text-slate-500 mt-0.5">Class of '${String(person.batchYear).slice(-2)}</p>
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#003D7A] border border-blue-100/80">
              ${branch}
            </span>
            ${campusCode ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 uppercase" title="Campus Code: ${campusCode}">
                🏫 ${campusCode}
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Role & Company Info Box -->
      ${(role || company) 
        ? `
        <div class="mt-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-xs text-slate-900 truncate">${role || 'Alumni'}</span>
            ${company ? `
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px] text-slate-700 font-semibold shadow-2xs min-w-0 max-w-[50%]">
                <svg class="w-3 h-3 text-[#003D7A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m0 0v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5 font-normal"></path></svg>
                <span class="truncate">${company}</span>
              </div>
            ` : ''}
          </div>
        </div>
        `
        : ''
      }

      <!-- Location Badge -->
      ${location 
        ? `
        <div class="mt-2.5 flex items-center gap-1.5 px-0.5 text-[11px] font-medium text-slate-500">
          <svg class="w-3.5 h-3.5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span class="truncate">${location}</span>
        </div>
        `
        : ''
      }

      <!-- Action Buttons -->
      <div class="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
        <a href="${BASE_PATH}/alumni/profile/${person.id}" class="flex-1 py-2 px-3 bg-[#003D7A] hover:bg-[#002f5e] active:scale-[0.98] text-white text-center text-xs font-bold rounded-xl transition duration-150 decoration-none shadow-md shadow-blue-900/15 flex items-center justify-center gap-1.5">
          <span>View Profile</span>
          <svg class="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
        </a>
        ${person.linkedinUrl 
          ? `<a href="${escapeHtml(person.linkedinUrl)}" target="_blank" rel="noopener noreferrer" class="p-2 bg-slate-100 hover:bg-blue-50 hover:text-[#0077b5] text-slate-600 rounded-xl transition duration-150 flex items-center justify-center border border-slate-200/60 shadow-sm" title="LinkedIn Profile">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>`
          : ''
        }
      </div>
    </div>
  `;
}

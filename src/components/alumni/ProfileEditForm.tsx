'use client';

import { useEffect, useRef } from 'react';
import CompanyAutocomplete from '@/components/CompanyAutocomplete';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

import { AlumniProfile } from '@/types/alumni';

interface ProfileEditFormProps {
  formData: AlumniProfile;
  setFormData: React.Dispatch<React.SetStateAction<AlumniProfile | null>>;
  onChange: (field: keyof AlumniProfile, value: any) => void;
}

export default function ProfileEditForm({
  formData,
  setFormData,
  onChange,
}: ProfileEditFormProps) {
  // Store the initial pincode to prevent geocoding on initial mount/open
  const initialPincodeRef = useRef(formData?.pincode);

  // Auto-resolve city name from pincode to prevent spelling anomalies
  useEffect(() => {
    const pin = formData?.pincode?.trim();
    const cntry = formData?.country?.trim() || 'India';

    // Skip if pincode is empty, less than 5 characters, or hasn't changed from the initial loaded value
    if (!pin || pin.length < 5 || pin === initialPincodeRef.current?.trim()) {
      return;
    }

    const controller = new AbortController();
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/alumni/geocode-pincode?pincode=${encodeURIComponent(pin)}&country=${encodeURIComponent(cntry)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.city || data.country) {
            setFormData((prev) => {
              if (!prev) return null;
              const nextData = { ...prev };
              if (data.city) nextData.city = data.city;
              if (data.country) nextData.country = data.country;
              return nextData;
            });
            
            const locationParts = [data.city, data.country].filter(Boolean).join(', ');
            toast.success(`Resolved Location: ${locationParts}`);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to auto-resolve location:', err);
        }
      }
    }, 700);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [formData?.pincode, formData?.country, setFormData]);

  return (
    <div className="space-y-3 w-full max-w-xl pt-16 md:pt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Full Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Contact Phone</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Current Job Title</label>
          <input
            type="text"
            value={formData.currentRole || ''}
            onChange={(e) => onChange('currentRole', e.target.value)}
            placeholder="e.g. Senior Architect"
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Current Company</label>
          <CompanyAutocomplete
            value={formData.currentCompany || ''}
            onChange={(val) => onChange('currentCompany', val)}
            placeholder="e.g. Google India"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">LinkedIn Profile URL</label>
        <input
          type="url"
          value={formData.linkedinUrl || ''}
          onChange={(e) => onChange('linkedinUrl', e.target.value)}
          placeholder="e.g. https://linkedin.com/in/username"
          className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">About / Bio</label>
        <textarea
          rows={3}
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Write a brief professional bio about your achievements, interests, or background..."
          className="w-full px-3 py-2 text-slate-800 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">City</label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="e.g. Chandigarh"
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Country</label>
          <input
            type="text"
            value={formData.country || ''}
            onChange={(e) => onChange('country', e.target.value)}
            placeholder="e.g. India"
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Pincode</label>
          <input
            type="text"
            value={formData.pincode || ''}
            onChange={(e) => onChange('pincode', e.target.value)}
            placeholder="e.g. 160012"
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Map Visibility</label>
          <select
            value={formData.mapVisibility || 'PUBLIC'}
            onChange={(e) => onChange('mapVisibility', e.target.value)}
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A] bg-white"
          >
            <option value="PUBLIC">Public</option>
            <option value="ALUMNI_ONLY">Alumni Only</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Branch</label>
          <input
            type="text"
            value={formData.branch || ''}
            onChange={(e) => onChange('branch', e.target.value)}
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Batch Year</label>
          <input
            type="number"
            value={formData.batchYear || ''}
            onChange={(e) => onChange('batchYear', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
          />
        </div>
      </div>
    </div>
  );
}

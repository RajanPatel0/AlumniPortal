'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { getAlumniSuggestions } from '@/actions/admin-alumni-suggestions';
import { useDebounce } from '@/lib/useDebounce';

interface AlumniData {
  id: string;
  name: string;
  email: string;
  enrollmentNo: string | null;
  batchYear: number;
  branch: string;
  college: string;
  course: string | null;
  phone: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  city: string | null;
  country?: string | null;
  pincode?: string | null;
}

interface EditAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  alumni: AlumniData;
  onSaveSuccess: () => void;
}

export default function EditAlumniModal({
  isOpen,
  onClose,
  alumni,
  onSaveSuccess,
}: EditAlumniModalProps) {
  const [saving, setSaving] = useState(false);
  const [collegesList, setCollegesList] = useState<string[]>([]);
  const [coursesList, setCoursesList] = useState<string[]>([]);
  const [branchesList, setBranchesList] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      getAlumniSuggestions()
        .then((data) => {
          setCollegesList(data.colleges || []);
          setCoursesList(data.courses || []);
          setBranchesList(data.branches || []);
        })
        .catch((err) => console.error('Failed to load suggestions via Server Action:', err));
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollmentNo: '',
    batchYear: '',
    branch: '',
    college: '',
    course: '',
    phone: '',
    currentRole: '',
    currentCompany: '',
    city: '',
    country: '',
    pincode: '',
  });



  useEffect(() => {
    if (alumni) {
      setFormData({
        name: alumni.name || '',
        email: alumni.email || '',
        enrollmentNo: alumni.enrollmentNo || '',
        batchYear: alumni.batchYear ? String(alumni.batchYear) : '',
        branch: alumni.branch || '',
        college: alumni.college || '',
        course: alumni.course || '',
        phone: alumni.phone || '',
        currentRole: alumni.currentRole || '',
        currentCompany: alumni.currentCompany || '',
        city: alumni.city || '',
        country: alumni.country || '',
        pincode: alumni.pincode || '',
      });
    }
  }, [alumni, isOpen]);

  const debouncedPincode = useDebounce(formData.pincode, 700);
  const debouncedCountry = useDebounce(formData.country, 700);

  // Client-side auto-resolution of City and Country when Pincode changes
  useEffect(() => {
    const pin = debouncedPincode.trim();
    const cntry = debouncedCountry.trim() || 'India';

    if (pin.length >= 5) {
      let isSubscribed = true;
      const fetchGeo = async () => {
        try {
          const res = await apiFetch(
            `/alumni/geocode-pincode?pincode=${encodeURIComponent(pin)}&country=${encodeURIComponent(cntry)}`
          );
          if (res.ok && isSubscribed) {
            const data = await res.json();
            setFormData((prev) => {
              const nextData = { ...prev };
              if (data.city) nextData.city = data.city;
              if (data.country) nextData.country = data.country;
              return nextData;
            });
          }
        } catch (err) {
          console.error('Failed to resolve pincode location:', err);
        }
      };
      fetchGeo();
      return () => {
        isSubscribed = false;
      };
    }
  }, [debouncedPincode, debouncedCountry]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.batchYear) {
      toast.error('Batch Year is required');
      return;
    }
    if (!formData.branch.trim()) {
      toast.error('Branch is required');
      return;
    }
    if (!formData.college.trim()) {
      toast.error('College is required');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/admin/alumni/${alumni.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          batchYear: Number(formData.batchYear),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update alumni');
      }

      toast.success('Alumni details updated successfully');
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transition-all flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#012140] via-[#1a4ea3] to-[#C41E3A] px-6 py-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold">Edit Alumni Information</h2>
            <p className="text-xs text-blue-100/80">Correct academic, contact, and professional details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Academic Details */}
          <div>
            <h3 className="text-sm font-bold text-[#012140] uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">
              Academic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-black">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enrollment Number</label>
                <input
                  type="text"
                  name="enrollmentNo"
                  value={formData.enrollmentNo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Batch Year *</label>
                <input
                  type="number"
                  name="batchYear"
                  value={formData.batchYear}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Branch *</label>
                <input
                  type="text"
                  name="branch"
                  list="edit-branches-list"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
                <datalist id="edit-branches-list">
                  {branchesList.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">College *</label>
                <input
                  type="text"
                  name="college"
                  list="edit-colleges-list"
                  value={formData.college}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
                <datalist id="edit-colleges-list">
                  {collegesList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
                <input
                  type="text"
                  name="course"
                  list="edit-courses-list"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech, MBA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
                <datalist id="edit-courses-list">
                  {coursesList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold text-[#012140] uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">
              Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-black">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div>
            <h3 className="text-sm font-bold text-[#012140] uppercase tracking-wider mb-3 pb-1 border-b border-gray-100">
              Professional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-black">
              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Role</label>
                <input
                  type="text"
                  name="currentRole"
                  value={formData.currentRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Current Company</label>
                <input
                  type="text"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. India, USA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 144011"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#012140] focus:ring-1 focus:ring-[#012140]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#012140] hover:bg-[#012140]/90 text-white text-sm font-bold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Confirm Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

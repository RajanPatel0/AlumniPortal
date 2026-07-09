'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Edit3, Save, X, Mail, Briefcase, MapPin, Plus, Trash2, 
  Calendar, GraduationCap, Phone, CheckCircle, Camera 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

interface AlumniProfile {
  id: string;
  name: string;
  email: string;
  batchYear: number;
  branch: string;
  college: string;
  course?: string;
  phone?: string;
  currentRole?: string;
  currentCompany?: string;
  city?: string;
  avatarUrl?: string;
  isRegistered?: boolean;
  education?: EducationItem[];
  workExperience?: ExperienceItem[];
  campus?: { id: string; name: string } | null;
}

function ProfilePageClient() {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AlumniProfile | null>(null);
  const [isSelf, setIsSelf] = useState(true);
  
  // Modals state for Education CRUD
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<Partial<EducationItem> | null>(null);

  // Modals state for Experience CRUD
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Partial<ExperienceItem> | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const fetchProfile = useCallback(async () => {
    try {
      const url = id ? `/api/alumni/me?id=${id}` : '/api/alumni/me';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setProfile(data.user);
      setFormData(data.user);
      setIsSelf(data.isSelf ?? !id);
    } catch {
      // Before redirecting to alumni login, check if this is an admin session
      try {
        const adminRes = await fetch('/api/admin/me');
        if (adminRes.ok) {
          // Admin is authenticated but the profile fetch still failed (maybe no id param)
          // Redirect back to admin dashboard
          router.push('/admin/dashboard');
          return;
        }
      } catch {}
      router.push('/alumni/login');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const res = await fetch('/api/alumni/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setProfile(prev => ({
        ...prev,
        ...updated.user,
      }));
      setFormData(prev => ({
        ...prev,
        ...updated.user,
      }));
      setEditingMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditingMode(false);
  };

  const handleInputChange = (field: keyof AlumniProfile, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  // Avatar Image Upload via Cloudinary
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading photo...');
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/alumni/upload-avatar', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      if (data.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        setFormData(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        toast.success('Profile photo updated!', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo', { id: toastId });
    }
  };

  // Education CRUD
  const saveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEdu) return;

    const isEdit = !!selectedEdu.id;
    const url = '/api/alumni/education';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedEdu),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(isEdit ? 'Education updated!' : 'Education added!');
      setEduModalOpen(false);
      fetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save education');
    }
  };

  const deleteEducation = async (eduId: string) => {
    if (!window.confirm('Are you sure you want to delete this education?')) return;

    try {
      const res = await fetch(`/api/alumni/education?id=${eduId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');
      toast.success('Education deleted!');
      fetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete education');
    }
  };

  // Experience CRUD
  const saveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;

    const isEdit = !!selectedExp.id;
    const url = '/api/alumni/experience';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedExp),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(isEdit ? 'Experience updated!' : 'Experience added!');
      setExpModalOpen(false);
      fetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save experience');
    }
  };

  const deleteExperience = async (expId: string) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;

    try {
      const res = await fetch(`/api/alumni/experience?id=${expId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');
      toast.success('Experience deleted!');
      fetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete experience');
    }
  };

  const getInitials = (nameStr: string) => {
    return nameStr ? nameStr.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'A';
  };

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003D7A] border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <Toaster position="top-right" />

      {/* LinkedIn style Upper Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Banner Graphic background */}
        <div className="h-44 bg-gradient-to-r from-[#003D7A] via-[#005fb8] to-[#C41E3A] relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:20px_20px]" />
        </div>

        {/* Edit mode toggle button overlay on banner corner */}
        {isSelf && (
          <div className="absolute top-4 right-4 z-10">
            {editingMode ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-md border border-slate-200 transition"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMode(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#003D7A] rounded-xl text-xs font-bold shadow-md border border-slate-200 transition"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        )}

        {/* Profile details wrapper */}
        <div className="px-8 pb-8 relative flex flex-col md:flex-row md:items-end gap-6 -mt-16">
          {/* Avatar container with instant Cloudinary upload */}
          <div className="relative w-36 h-36 rounded-full border-4 border-white bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] text-white flex items-center justify-center font-black text-4xl shadow-lg overflow-hidden group flex-shrink-0">
            {formData?.avatarUrl ? (
              <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(formData?.name || '')
            )}

            {isSelf && (
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer gap-1">
                <Camera size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Change photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 md:pb-2">
            {!editingMode ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  {profile?.name}
                  {profile?.isRegistered && (
                    <span className="inline-flex" title="Verified Alumni">
                      <CheckCircle size={18} className="text-emerald-500 fill-emerald-50" />
                    </span>
                  )}
                </h2>

                <p className="text-md text-slate-700 font-semibold mt-1">
                  {profile?.currentRole || 'Alumni'} {profile?.currentCompany ? `at ${profile.currentCompany}` : ''}
                </p>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-3 text-xs font-semibold text-slate-500">
                  {profile?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      {profile.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} className="text-slate-400" />
                    {profile?.branch} (Class of {profile?.batchYear})
                  </span>
                  {profile?.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={14} className="text-slate-400" />
                      {profile.email}
                    </span>
                  )}
                  {profile?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} className="text-slate-400" />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </>
            ) : (
              // Edit inputs for basic info
              <div className="space-y-3 w-full max-w-xl pt-16 md:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData?.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={formData?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Current Job Title</label>
                    <input
                      type="text"
                      value={formData?.currentRole || ''}
                      onChange={(e) => handleInputChange('currentRole', e.target.value)}
                      placeholder="e.g. Senior Architect"
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Current Company</label>
                    <input
                      type="text"
                      value={formData?.currentCompany || ''}
                      onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                      placeholder="e.g. Google India"
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">City / Location</label>
                    <input
                      type="text"
                      value={formData?.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g. Chandigarh"
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData?.branch || ''}
                      onChange={(e) => handleInputChange('branch', e.target.value)}
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Batch Year</label>
                    <input
                      type="number"
                      value={formData?.batchYear || ''}
                      onChange={(e) => handleInputChange('batchYear', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-slate-800 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[#003D7A]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Experience Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="text-[#003D7A]" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Experience</h3>
          </div>
          {isSelf && (
            <button
              onClick={() => {
                setSelectedExp({ company: '', title: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
                setExpModalOpen(true);
              }}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#003D7A] rounded-full transition"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* List all experiences */}
          {profile?.workExperience && profile.workExperience.length > 0 ? (
            profile.workExperience.map((exp, index) => (
              <div key={exp.id} className={`flex gap-4 relative group ${index > 0 ? 'border-t border-slate-50 pt-5' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#003D7A] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  💼
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                        {exp.isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded-full uppercase">
                            Currently Working
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{exp.company}</p>
                    </div>

                    {isSelf && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setSelectedExp({
                              ...exp,
                              startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
                              endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
                            });
                            setExpModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className="p-1 hover:bg-slate-100 text-red-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar size={10} />
                    {formatDateStr(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDateStr(exp.endDate)}
                    {exp.location && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={10} />
                        {exp.location}
                      </>
                    )}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-500 font-medium whitespace-pre-line mt-1.5">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">No experience entries listed.</p>
          )}
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-[#003D7A]" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Education</h3>
          </div>
          {isSelf && (
            <button
              onClick={() => {
                setSelectedEdu({ school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, description: '' });
                setEduModalOpen(true);
              }}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#003D7A] rounded-full transition"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Primary campus course/branch display */}
          <div className="flex gap-4 relative group">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C41E3A] flex items-center justify-center text-sm font-bold flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {profile?.course || 'Degree'} in {profile?.branch}
                </h4>
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold rounded-full uppercase">
                  Primary Campus
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {profile?.college} ({profile?.campus?.name || 'IKGPTU Campus'})
              </p>
              <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                <Calendar size={10} />
                Class of {profile?.batchYear}
              </p>
            </div>
          </div>

          {/* List additional educations */}
          {profile?.education && profile.education.length > 0 ? (
            profile.education.map((edu) => (
              <div key={edu.id} className="flex gap-4 relative group border-t border-slate-50 pt-5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#003D7A] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  🎓
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{edu.school}</h4>
                      <p className="text-xs font-semibold text-slate-600">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </p>
                    </div>

                    {isSelf && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setSelectedEdu({
                              ...edu,
                              startDate: edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : '',
                              endDate: edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '',
                            });
                            setEduModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteEducation(edu.id)}
                          className="p-1 hover:bg-slate-100 text-red-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar size={10} />
                    {formatDateStr(edu.startDate)} – {edu.isCurrent ? 'Present' : formatDateStr(edu.endDate)}
                  </p>
                  {edu.description && (
                    <p className="text-xs text-slate-500 font-medium whitespace-pre-line mt-1.5">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Experience CRUD Modal */}
      {expModalOpen && selectedExp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-md font-bold text-[#003D7A]">
                {selectedExp.id ? 'Edit Experience' : 'Add Experience'}
              </h3>
              <button onClick={() => setExpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveExperience} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  value={selectedExp.company || ''}
                  onChange={(e) => setSelectedExp({ ...selectedExp, company: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={selectedExp.title || ''}
                  onChange={(e) => setSelectedExp({ ...selectedExp, title: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedExp.location || ''}
                  onChange={(e) => setSelectedExp({ ...selectedExp, location: e.target.value })}
                  placeholder="e.g. Bangalore, India"
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={selectedExp.startDate || ''}
                    onChange={(e) => setSelectedExp({ ...selectedExp, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    disabled={selectedExp.isCurrent}
                    value={selectedExp.isCurrent ? '' : selectedExp.endDate || ''}
                    onChange={(e) => setSelectedExp({ ...selectedExp, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A] disabled:opacity-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={!!selectedExp.isCurrent}
                  onChange={(e) => setSelectedExp({ ...selectedExp, isCurrent: e.target.checked })}
                  className="w-4 h-4 text-[#003D7A]"
                />
                <span className="text-xs font-semibold text-slate-600">Currently working in this role</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={selectedExp.description || ''}
                  onChange={(e) => setSelectedExp({ ...selectedExp, description: e.target.value })}
                  placeholder="Key responsibilities and achievements..."
                  className="w-full px-3 py-1.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold transition">
                  Save
                </button>
                <button type="button" onClick={() => setExpModalOpen(false)} className="flex-1 py-2 border rounded-lg text-xs font-bold text-slate-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education CRUD Modal */}
      {eduModalOpen && selectedEdu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-md font-bold text-[#003D7A]">
                {selectedEdu.id ? 'Edit Education' : 'Add Education'}
              </h3>
              <button onClick={() => setEduModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEducation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">School / University *</label>
                <input
                  type="text"
                  required
                  value={selectedEdu.school || ''}
                  onChange={(e) => setSelectedEdu({ ...selectedEdu, school: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Degree / Qualification *</label>
                <input
                  type="text"
                  required
                  value={selectedEdu.degree || ''}
                  onChange={(e) => setSelectedEdu({ ...selectedEdu, degree: e.target.value })}
                  placeholder="e.g. MBA, MS"
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={selectedEdu.fieldOfStudy || ''}
                  onChange={(e) => setSelectedEdu({ ...selectedEdu, fieldOfStudy: e.target.value })}
                  placeholder="e.g. Information Technology"
                  className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={selectedEdu.startDate || ''}
                    onChange={(e) => setSelectedEdu({ ...selectedEdu, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    disabled={selectedEdu.isCurrent}
                    value={selectedEdu.isCurrent ? '' : selectedEdu.endDate || ''}
                    onChange={(e) => setSelectedEdu({ ...selectedEdu, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A] disabled:opacity-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={!!selectedEdu.isCurrent}
                  onChange={(e) => setSelectedEdu({ ...selectedEdu, isCurrent: e.target.checked })}
                  className="w-4 h-4 text-[#003D7A]"
                />
                <span className="text-xs font-semibold text-slate-600">Currently studying here</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={selectedEdu.description || ''}
                  onChange={(e) => setSelectedEdu({ ...selectedEdu, description: e.target.value })}
                  placeholder="Additional details, grades, honors..."
                  className="w-full px-3 py-1.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#003D7A]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold transition">
                  Save
                </button>
                <button type="button" onClick={() => setEduModalOpen(false)} className="flex-1 py-2 border rounded-lg text-xs font-bold text-slate-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003D7A] border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfilePageClient />
    </Suspense>
  );
}
'use client';
import { apiFetch } from "@/lib/api";
import dynamic from 'next/dynamic';

const ExperienceModal = dynamic(() => import('@/components/alumni/ExperienceModal'), { ssr: false });
const EducationModal = dynamic(() => import('@/components/alumni/EducationModal'), { ssr: false });
const ProfileEditForm = dynamic(() => import('@/components/alumni/ProfileEditForm'), { ssr: false });

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Edit3, Save, X, Mail, Briefcase, MapPin, Plus, Trash2, 
  Calendar, GraduationCap, Phone, CheckCircle, Camera, FileText, Link2, Eye
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { AlumniProfile, EducationItem, ExperienceItem } from '@/types/alumni';
import { getInitials } from "@/lib/utils/avatar";

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
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEditRequested = searchParams.get('edit') === 'true';

  // Instant redirect if legacy query param ?id= was used
  useEffect(() => {
    if (id) {
      router.replace(`/alumni/profile/${id}`);
    }
  }, [id, router]);

  const fetchProfile = useCallback(async () => {
    if (id) return; // Prevent fetching self profile if redirecting
    try {
      const res = await apiFetch('/alumni/me');
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();

      setProfile(data.user);
      setFormData(data.user);
      setIsSelf(true);

      if (isEditRequested) {
        setEditingMode(true);
      }
    } catch {
      // Before redirecting to alumni login, check if this is an admin session
      try {
        const adminRes = await apiFetch('/admin/me');
        if (adminRes.ok) {
          router.push('/admin/dashboard');
          return;
        }
      } catch {}
      router.push('/alumni/login');
    } finally {
      setLoading(false);
    }
  }, [id, isEditRequested, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const res = await apiFetch('/alumni/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      
      // Invalidate react query cache for header and feed completeness checkers
      queryClient.invalidateQueries({ queryKey: ['alumni-profile-me'] });
      
      // Re-fetch the complete profile with education/experience details
      await fetchProfile();
      
      setEditingMode(false);
      router.refresh();
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
      const res = await apiFetch('/alumni/upload-avatar', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      if (data.avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        setFormData(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
        queryClient.invalidateQueries({ queryKey: ['alumni-profile-me'] });
        toast.success('Profile photo updated!', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo', { id: toastId });
    }
  };

  const deleteEducation = async (eduId: string) => {
    if (!window.confirm('Are you sure you want to delete this education?')) return;

    try {
      const res = await apiFetch(`/alumni/education?id=${eduId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');
      queryClient.invalidateQueries({ queryKey: ['alumni-profile-me'] });
      toast.success('Education deleted!');
      fetchProfile();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete education');
    }
  };

  const deleteExperience = async (expId: string) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) return;

    try {
      const res = await apiFetch(`/alumni/experience?id=${expId}`, {
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
        {/* Banner Graphic */}
        <div className="h-32 md:h-40 bg-gradient-to-br from-blue-50 via-white to-red-50 relative overflow-hidden">
          {/* Stronger brand-color washes, corner-anchored */}
          <div className="absolute -top-20 -left-16 w-80 h-80 bg-[#003D7A]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-[#C41E3A]/20 rounded-full blur-3xl"></div>

          {/* Diagonal center sweep tying the two brand colors together */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#003D7A]/10 via-transparent to-[#C41E3A]/10"></div>

          {/* Dot-grid texture, a touch stronger than before */}
          <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(#003D7A_1px,transparent_1px)] [background-size:18px_18px]"></div>

          {/* Brand accent line along the bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#003D7A] via-[#C41E3A] to-[#003D7A]"></div>
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
              <div className="flex gap-2">
                <button
                  onClick={() => profile?.id && router.push(`/alumni/profile/${profile.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Eye size={14} />
                  <span>Preview Profile</span>
                </button>
                <button
                  onClick={() => setEditingMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#003D7A] rounded-xl text-xs font-bold shadow-md border border-slate-200 transition"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile details wrapper */}
        <div className="px-8 pb-8 relative flex flex-col md:flex-row md:items-end gap-6 -mt-16">
          {/* Avatar container with instant Cloudinary upload */}
          <div className="relative w-36 h-36 rounded-full border-4 border-white bg-gradient-to-tr from-[#003D7A] to-[#C41E3A] text-white flex items-center justify-center font-black text-4xl shadow-lg overflow-hidden group flex-shrink-0">
            {formData?.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt={formData.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
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
                  {(profile?.city || profile?.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                      {profile.pincode ? ` (${profile.pincode})` : ''}
                    </span>
                  )}
                  {profile?.mapVisibility && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      🗺️ Map: {profile.mapVisibility.replace('_', ' ')}
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
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#003D7A] font-bold text-xs transition border border-blue-100 shadow-xs"
                    >
                      {/* LinkedIn SVG logo */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#0077B5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn Profile</span>
                      <Link2 size={10} className="text-slate-400" />
                    </a>
                  )}
                </div>

                {profile?.bio && (
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal">
                    <p className="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-[#003D7A]">
                      <FileText size={13} />
                      About / Bio
                    </p>
                    <p className="whitespace-pre-line">{profile.bio}</p>
                  </div>
                )}
              </>
            ) : (
              formData && (
                <ProfileEditForm
                  formData={formData}
                  setFormData={setFormData}
                  onChange={handleInputChange}
                />
              )
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
                      <div className="flex gap-1.5 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setSelectedExp({
                              ...exp,
                              startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
                              endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
                            });
                            setExpModalOpen(true);
                          }}
                          className="p-1 bg-slate-100 text-blue-600 rounded"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className="p-1 bg-slate-100 text-red-600 rounded"
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
      <ExperienceModal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        experience={selectedExp}
        onSuccess={fetchProfile}
      />

      {/* Education CRUD Modal */}
      <EducationModal
        isOpen={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        education={selectedEdu}
        onSuccess={fetchProfile}
      />
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
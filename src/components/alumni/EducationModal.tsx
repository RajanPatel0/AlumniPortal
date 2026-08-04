'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { EducationItem } from '@/types/alumni';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  education: Partial<EducationItem> | null;
  onSuccess: () => void;
}

export default function EducationModal({
  isOpen,
  onClose,
  education,
  onSuccess,
}: EducationModalProps) {
  const [formData, setFormData] = useState<Partial<EducationItem>>({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (education) {
      setFormData({
        ...education,
        startDate: education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '',
        endDate: education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : '',
      });
    }
  }, [education, isOpen]);

  if (!isOpen || !education) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.school || !formData.degree || !formData.startDate) {
      toast.error('School, degree, and start date are required');
      return;
    }

    setSaving(true);
    const isEdit = !!formData.id;
    const url = '/alumni/education';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(isEdit ? 'Education updated!' : 'Education added!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save education');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-md font-bold text-[#003D7A]">
            {formData.id ? 'Edit Education' : 'Add Education'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">School / University *</label>
            <input
              type="text"
              required
              value={formData.school || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
              className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Degree / Qualification *</label>
            <input
              type="text"
              required
              value={formData.degree || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
              placeholder="e.g. MBA, MS"
              className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Field of Study</label>
            <input
              type="text"
              value={formData.fieldOfStudy || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
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
                value={formData.startDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                disabled={formData.isCurrent}
                value={formData.isCurrent ? '' : formData.endDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-1.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#003D7A] disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={!!formData.isCurrent}
              onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked }))}
              className="w-4 h-4 text-[#003D7A]"
            />
            <span className="text-xs font-semibold text-slate-600">Currently studying here</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details, grades, honors..."
              className="w-full px-3 py-1.5 border rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#003D7A] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-[#003D7A] hover:bg-[#002b56] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

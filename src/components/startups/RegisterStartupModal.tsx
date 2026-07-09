import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { startupSchema, type StartupSchemaType } from '@/schemas/startup';
import { ImageUploader } from '@/components/ImageUploader';
import { useEffect } from 'react';

interface StartupItem {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  industry?: string | null;
  foundedYear?: number | null;
}

interface RegisterStartupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If provided, modal opens in edit mode for this startup */
  startup?: StartupItem | null;
}

export function RegisterStartupModal({ isOpen, onClose, startup }: RegisterStartupModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!startup;

  const createStartupMutation = useMutation({
    mutationFn: async (formData: StartupSchemaType & { logoUrl?: string }) => {
      const url = isEditing ? `/api/alumni/startups/${startup!.id}` : '/api/alumni/startups';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to ${isEditing ? 'update' : 'register'} startup`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Business updated successfully!' : 'Business registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['startups'] });
      onClose();
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Something went wrong');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StartupSchemaType>({
    resolver: zodResolver(startupSchema),
    defaultValues: {
      name: '',
      description: '',
      industry: 'Interior Design & Decorative Art',
      customIndustry: '',
      websiteUrl: '',
      logoUrl: '',
      foundedYear: undefined,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (startup && isOpen) {
      const knownIndustries = ['Interior Design & Decorative Art', 'Graphic Design', 'Food Production'];
      const isKnown = knownIndustries.includes(startup.industry || '');
      reset({
        name: startup.name,
        description: startup.description,
        industry: isKnown ? (startup.industry || '') : 'Other',
        customIndustry: isKnown ? '' : (startup.industry || ''),
        websiteUrl: startup.websiteUrl || '',
        logoUrl: startup.logoUrl || '',
        foundedYear: startup.foundedYear ?? undefined,
      });
    } else if (!startup && isOpen) {
      reset({
        name: '',
        description: '',
        industry: 'Interior Design & Decorative Art',
        customIndustry: '',
        websiteUrl: '',
        logoUrl: '',
        foundedYear: undefined,
      });
    }
  }, [startup, isOpen, reset]);

  const watchedIndustry = watch('industry');
  const watchedLogoUrl = watch('logoUrl');

  const onSubmit = (formData: StartupSchemaType) => {
    const payload = { ...formData } as any;
    if (payload.industry === 'Other') {
      payload.industry = payload.customIndustry || '';
    }
    delete payload.customIndustry;
    if (payload.foundedYear === undefined || isNaN(payload.foundedYear)) {
      delete payload.foundedYear;
    }
    createStartupMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-gray-900 text-sm">
            {isEditing ? 'Edit your startup' : 'List your startup'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Business Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Labs"
              {...register('name')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description *</label>
            <textarea 
              rows={3}
              placeholder="Tell us what your startup does (min 10 characters)..."
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Industry *</label>
              <select 
                {...register('industry')}
                className={`w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 ${
                  errors.industry ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="Interior Design & Decorative Art">Interior Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Food Production">Food Production</option>
                <option value="Other">Other</option>
              </select>
              {errors.industry && <p className="text-[10px] text-red-500 mt-1">{errors.industry.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Founded Year</label>
              <input 
                type="number" 
                placeholder="e.g. 2024"
                {...register('foundedYear', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.foundedYear ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.foundedYear && <p className="text-[10px] text-red-500 mt-1">{errors.foundedYear.message}</p>}
            </div>
          </div>

          {watchedIndustry === 'Other' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Custom Industry Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Artificial Intelligence"
                {...register('customIndustry')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.customIndustry ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.customIndustry && <p className="text-[10px] text-red-500 mt-1">{errors.customIndustry.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Website Link</label>
            <input 
              type="url" 
              placeholder="https://example.com"
              {...register('websiteUrl')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                errors.websiteUrl ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.websiteUrl && <p className="text-[10px] text-red-500 mt-1">{errors.websiteUrl.message}</p>}
          </div>

          {/* Cloudinary Logo Upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Logo / Brand Image</label>
            <ImageUploader
              value={watchedLogoUrl || ''}
              onChange={(url) => setValue('logoUrl', url, { shouldValidate: true })}
              folder="startup_logos"
              placeholder="Upload your startup logo"
            />
            {errors.logoUrl && <p className="text-[10px] text-red-500 mt-1">{errors.logoUrl.message}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createStartupMutation.isPending}
              className="flex-1 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {createStartupMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Register Business'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

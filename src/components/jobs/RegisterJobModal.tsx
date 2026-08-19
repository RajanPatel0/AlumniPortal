import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { jobSchema, type JobSchemaType } from '@/schemas/job';
import { createJobAction, createAdminJobAction, updateJobAction, updateAdminJobAction } from '@/actions/jobs';
import type { JobItemType } from '@/types/jobs';

interface RegisterJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  jobToEdit?: JobItemType | null;
}

const getDefaultExpireDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

export function RegisterJobModal({ isOpen, onClose, isAdmin = false, jobToEdit = null }: RegisterJobModalProps) {
  const queryClient = useQueryClient();

  const jobMutation = useMutation({
    mutationFn: async (formData: JobSchemaType) => {
      if (jobToEdit) {
        const action = isAdmin ? updateAdminJobAction : updateJobAction;
        const result = await action(jobToEdit.id, formData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update job');
        }
        return result;
      } else {
        const action = isAdmin ? createAdminJobAction : createJobAction;
        const result = await action(formData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to create job');
        }
        return result;
      }
    },
    onSuccess: () => {
      toast.success(jobToEdit ? 'Opportunity updated successfully!' : 'Opportunity posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
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
    formState: { errors },
  } = useForm<JobSchemaType>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      title: '',
      company: '',
      description: '',
      location: '',
      workplaceType: 'On-site',
      type: 'Full Time',
      experienceRange: '1-4 years',
      salaryRange: '',
      applyUrl: '',
      industry: 'Software',
      customIndustry: '',
      skills: '',
      expireAt: getDefaultExpireDate() as any,
    },
  });

  const watchedIndustry = watch('industry');

  useEffect(() => {
    if (isOpen) {
      if (jobToEdit) {
        const isPredefinedIndustry = ['Software', 'Design', 'Administration'].includes(jobToEdit.industry);
        reset({
          title: jobToEdit.title,
          company: jobToEdit.company,
          description: jobToEdit.description,
          location: jobToEdit.location || '',
          workplaceType: jobToEdit.workplaceType,
          type: jobToEdit.type,
          experienceRange: jobToEdit.experienceRange,
          salaryRange: jobToEdit.salaryRange || '',
          applyUrl: jobToEdit.applyUrl || '',
          industry: isPredefinedIndustry ? jobToEdit.industry : 'Other',
          customIndustry: isPredefinedIndustry ? '' : jobToEdit.industry,
          skills: jobToEdit.skills ? jobToEdit.skills.join(', ') : '',
          expireAt: jobToEdit.expireAt ? new Date(jobToEdit.expireAt).toISOString().split('T')[0] : null,
        } as any);
      } else {
        reset({
          title: '',
          company: '',
          description: '',
          location: '',
          workplaceType: 'On-site',
          type: 'Full Time',
          experienceRange: '1-4 years',
          salaryRange: '',
          applyUrl: '',
          industry: 'Software',
          customIndustry: '',
          skills: '',
          expireAt: getDefaultExpireDate() as any,
        });
      }
    }
  }, [jobToEdit, reset, isOpen]);

  const onSubmit = (formData: JobSchemaType) => {
    const payload = { ...formData } as any;
    if (payload.industry === 'Other') {
      payload.industry = payload.customIndustry || '';
    }
    delete payload.customIndustry;
    jobMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-sm">
            {jobToEdit ? 'Edit opportunity' : 'Post an opportunity'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Opportunity Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Frontend Engineer"
              {...register('title')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Company Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Labs"
              {...register('company')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                errors.company ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.company && <p className="text-[10px] text-red-500 mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Description *</label>
            <textarea 
              rows={3}
              placeholder="Provide a detailed description of the role, requirements, etc..."
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Workplace *</label>
              <select 
                {...register('workplaceType')}
                className={`w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 ${
                  errors.workplaceType ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              {errors.workplaceType && <p className="text-[10px] text-red-500 mt-1">{errors.workplaceType.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Location *</label>
              <input 
                type="text" 
                placeholder="e.g. Jalandhar, Remote"
                {...register('location')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.location ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.location && <p className="text-[10px] text-red-500 mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Experience Range *</label>
              <select 
                {...register('experienceRange')}
                className={`w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 ${
                  errors.experienceRange ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="0-1 years">0-1 years</option>
                <option value="1-4 years">1-4 years</option>
                <option value="2-6 years">2-6 years</option>
                <option value="5+ years">5+ years</option>
                <option value="9-10 years">9-10 years</option>
              </select>
              {errors.experienceRange && <p className="text-[10px] text-red-500 mt-1">{errors.experienceRange.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Salary Range</label>
              <input 
                type="text" 
                placeholder="e.g. INR 6 - 8 LPA"
                {...register('salaryRange')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.salaryRange ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.salaryRange && <p className="text-[10px] text-red-500 mt-1">{errors.salaryRange.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Opportunity Type *</label>
              <select 
                {...register('type')}
                className={`w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 ${
                  errors.type ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
              {errors.type && <p className="text-[10px] text-red-500 mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Industry *</label>
              <select 
                {...register('industry')}
                className={`w-full px-3 py-2 border bg-white rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 ${
                  errors.industry ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="Software">Software</option>
                <option value="Design">Design</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other</option>
              </select>
              {errors.industry && <p className="text-[10px] text-red-500 mt-1">{errors.industry.message}</p>}
            </div>
          </div>

          {watchedIndustry === 'Other' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Custom Industry Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Finance, Education"
                {...register('customIndustry')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.customIndustry ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.customIndustry && <p className="text-[10px] text-red-500 mt-1">{errors.customIndustry.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Skills (Comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. React, Next.js, CSS"
              {...register('skills')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Application Link / URL</label>
              <input 
                type="url" 
                placeholder="https://company.com/apply"
                {...register('applyUrl')}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400 ${
                  errors.applyUrl ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.applyUrl && <p className="text-[10px] text-red-500 mt-1">{errors.applyUrl.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">Application Deadline</label>
              <input 
                type="date" 
                {...register('expireAt')}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#003D7A] text-xs font-semibold text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={jobMutation.isPending}
              className="flex-1 py-2.5 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {jobMutation.isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{jobToEdit ? 'Update Opportunity' : 'Post Opportunity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

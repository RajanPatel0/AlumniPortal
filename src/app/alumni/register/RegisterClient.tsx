'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { 
  User, Mail, Phone, Lock, GraduationCap, School, 
  Briefcase, Building, ChevronRight, ChevronLeft, 
  CheckCircle, ShieldAlert, Award, Calendar, BookOpen
} from 'lucide-react';

type Campus = { id: string; name: string; code: string };
type AutocompleteOptions = { branches: string[]; courses: string[]; companies: string[] };

export default function SelfRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOptions>({
    branches: [],
    courses: [],
    companies: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enrollmentNo: '',
    batchYear: '',
    branch: '',
    college: '',
    course: '',
    phone: '',
    campusId: '',
    password: '',
    currentRole: '',
    currentCompany: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      router.replace(`/alumni/login?token=${encodeURIComponent(token)}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Fetch campuses
    fetch('/api/campuses')
      .then((res) => res.json())
      .then((data) => setCampuses(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch autocomplete options
    fetch('/api/alumni/options')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAutocompleteOptions({
            branches: data.branches || [],
            courses: data.courses || [],
            companies: data.companies || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const validateStep = (step: number) => {
    setError('');
    if (step === 1) {
      if (!formData.name.trim()) return 'Full Name is required';
      if (!formData.email.trim()) return 'Email Address is required';
      if (!formData.email.includes('@')) return 'Please enter a valid email address';
      if (!formData.password) return 'Password is required';
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
    } else if (step === 2) {
      if (!formData.campusId) return 'Please select your campus';
      if (!formData.batchYear) return 'Batch Year is required';
      const year = Number(formData.batchYear);
      if (isNaN(year) || year < 1990 || year > 2035) return 'Please enter a valid batch year (1990-2035)';
      if (!formData.branch.trim()) return 'Branch/Department is required';
      if (!formData.course.trim()) return 'Course is required';
      if (!formData.college.trim()) return 'College is required';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(2);
    if (err) {
      setError(err);
      setCurrentStep(2);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(formData.password, salt);

      const res = await fetch('/api/alumni/new-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          batchYear: Number(formData.batchYear),
          authProvider: 'MANUAL',
          passwordHash: hashedPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center border border-white/20">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Request Submitted!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Thank you, <strong className="text-slate-800 font-semibold">{formData.name}</strong>. Your registration request has been successfully sent to the alumni administration for verification.
            Once approved, you will be able to log in with your credentials.
          </p>
          <button
            onClick={() => router.push('/alumni/login')}
            className="w-full py-3.5 bg-gradient-to-r from-[#003D7A] to-[#002654] text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-900/20 active:scale-[0.98] transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col">
      <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group transition-transform duration-200 active:scale-95">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-900/10 tracking-wider">
              <img src="/icon.png" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none mb-1 group-hover:text-[#003D7A] transition-colors">
                IKGPTU Alumni
              </h1>
              <p className="text-xs font-medium text-[#C41E3A] tracking-widest uppercase">Portal</p>
            </div>
          </Link>

          <Link href="/alumni/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#003D7A] transition-colors px-3 py-2 rounded-lg hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar Panel */}
          <div className="md:w-72 bg-gradient-to-br from-[#003D7A] via-[#002b5c] to-[#C41E3A] p-8 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-6 backdrop-blur-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight mb-2">Join Our Network</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-8">Create your profile and connect with university peers worldwide.</p>
              
              {/* Step indicator */}
              <div className="space-y-6">
                {[
                  { step: 1, title: 'Personal Profile', desc: 'Account credentials' },
                  { step: 2, title: 'Academic Profile', desc: 'University details' },
                  { step: 3, title: 'Professional Info', desc: 'Current employment' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                      currentStep === s.step 
                        ? 'bg-white text-[#003D7A] border-white scale-110 shadow-lg shadow-white/20' 
                        : currentStep > s.step 
                          ? 'bg-green-500/20 border-green-400 text-green-300' 
                          : 'border-white/30 text-white/50'
                    }`}>
                      {currentStep > s.step ? '✓' : s.step}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${currentStep === s.step ? 'text-white' : 'text-white/60'}`}>{s.title}</p>
                      <p className="text-[10px] text-white/45">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/50 text-center md:text-left">
              Need help? Contact support at <span className="text-white">alumni@ptu.ac.in</span>
            </div>
          </div>

          {/* Form Panel */}
          <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Heading */}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C41E3A]">Step {currentStep} of 3</span>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {currentStep === 1 && 'Personal Information'}
                  {currentStep === 2 && 'Academic Details'}
                  {currentStep === 3 && 'Professional Details (Optional)'}
                </h1>
                <p className="text-slate-500 text-xs mt-1">
                  {currentStep === 1 && 'Set up your credentials and basic info'}
                  {currentStep === 2 && 'Fill in your education credentials at IKGPTU'}
                  {currentStep === 3 && 'Tell us what you are doing now'}
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Step 1: Personal Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. john@example.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Will be used to login once approved by admin.</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Academic Details */}
                {currentStep === 2 && (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus *</label>
                      <div className="relative">
                        <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <select
                          required
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none"
                          value={formData.campusId}
                          onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                        >
                          <option value="">Select your campus</option>
                          {campuses.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Batch Year *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <input
                            type="number"
                            required
                            min={1990}
                            max={2035}
                            placeholder="e.g. 2019"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                            value={formData.batchYear}
                            onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Enrollment No.</label>
                        <div className="relative">
                          <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. 1901234"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                            value={formData.enrollmentNo}
                            onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Course *</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          list="courses-list"
                          placeholder="e.g. B.Tech"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        />
                        <datalist id="courses-list">
                          {autocompleteOptions.courses.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Branch/Department *</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          list="branches-list"
                          placeholder="e.g. Computer Science"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        />
                        <datalist id="branches-list">
                          {autocompleteOptions.branches.map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">College *</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. PTU Main Campus Jalandhar"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Professional Info */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Job Role / Designation</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Software Development Engineer (SDE)"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.currentRole}
                          onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Company</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          list="companies-list"
                          placeholder="e.g. Google India"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.currentCompany}
                          onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                        />
                        <datalist id="companies-list">
                          {autocompleteOptions.companies.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Actions Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 active:scale-95 transition-all duration-150"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-3 bg-[#003D7A] hover:bg-[#002654] text-white rounded-2xl text-sm font-bold shadow-md shadow-blue-900/10 active:scale-95 transition-all duration-150"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-8 py-3.5 bg-gradient-to-r from-[#C41E3A] to-red-700 hover:shadow-lg hover:shadow-rose-900/20 text-white rounded-2xl text-sm font-bold active:scale-95 transition-all duration-150 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

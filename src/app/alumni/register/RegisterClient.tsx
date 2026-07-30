'use client';

import { useState, useEffect } from 'react';
import { apiFetch, BASE_PATH } from "@/lib/api";
import { useRouter, useSearchParams } from 'next/navigation';
import bcrypt from 'bcryptjs';
import Link from 'next/link';
import { 
  User, Mail, Phone, Lock, GraduationCap, School, 
  Briefcase, Building, ChevronRight, ChevronLeft, 
  CheckCircle, ShieldAlert, Award, Calendar, BookOpen, MapPin
} from 'lucide-react';

type Campus = { id: string; name: string; code: string };
type AutocompleteOptions = { branches: string[]; courses: string[]; companies: string[] };

export default function SelfRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [approvedColleges, setApprovedColleges] = useState<{ id: string; name: string }[]>([]);
  const [isAffiliated, setIsAffiliated] = useState(false);
  const [affiliatedCollegeId, setAffiliatedCollegeId] = useState('');
  const [customCollegeName, setCustomCollegeName] = useState('');

  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOptions>({
    branches: [],
    courses: [],
    companies: [],
  });

  const [courseSelection, setCourseSelection] = useState('');
  const [customCourse, setCustomCourse] = useState('');
  const [branchSelection, setBranchSelection] = useState('');
  const [customBranch, setCustomBranch] = useState('');

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
    linkedinUrl: '',
    pincode: '',
    city: '',
    country: '',
  });

  // Client-side auto-resolution of City and Country when Pincode changes
  useEffect(() => {
    const pin = formData.pincode.trim();
    const cntry = formData.country.trim() || 'India';

    if (pin.length >= 5) {
      const controller = new AbortController();
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await apiFetch(
            `/alumni/geocode-pincode?pincode=${encodeURIComponent(pin)}&country=${encodeURIComponent(cntry)}`,
            { signal: controller.signal }
          );
          if (res.ok) {
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
      }, 700);

      return () => {
        clearTimeout(delayDebounce);
        controller.abort();
      };
    }
  }, [formData.pincode, formData.country]);

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
    apiFetch('/campuses')
      .then((res) => res.json())
      .then((data) => setCampuses(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch approved affiliated colleges
    apiFetch('/affiliated-colleges')
      .then((res) => res.json())
      .then((data) => setApprovedColleges(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch autocomplete options
    apiFetch('/alumni/options')
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
      if (!isAffiliated) {
        if (!formData.campusId) return 'Please select your campus';
      } else {
        if (!affiliatedCollegeId) return 'Please select your affiliated college';
        if (affiliatedCollegeId === 'NEW' && !customCollegeName.trim()) {
          return 'Please specify your affiliated college name';
        }
      }
      if (!formData.batchYear) return 'Batch Year is required';
      const year = Number(formData.batchYear);
      if (isNaN(year) || year < 1990 || year > 2035) return 'Please enter a valid batch year (1990-2035)';
      const effCourse = courseSelection === 'OTHER' ? customCourse.trim() : courseSelection.trim();
      if (!effCourse) return 'Course is required';
      const effBranch = branchSelection === 'OTHER' ? customBranch.trim() : branchSelection.trim();
      if (!effBranch) return 'Branch/Department is required';
    } else if (step === 3) {
      if (!formData.pincode.trim()) return 'Current Pincode is required';
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
    const err2 = validateStep(2);
    if (err2) {
      setError(err2);
      setCurrentStep(2);
      return;
    }
    const err3 = validateStep(3);
    if (err3) {
      setError(err3);
      setCurrentStep(3);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(formData.password, salt);

      const finalCourse = courseSelection === 'OTHER' ? customCourse.trim() : courseSelection.trim();
      const finalBranch = branchSelection === 'OTHER' ? customBranch.trim() : branchSelection.trim();

      const mainCampus = campuses.find((c) => c.code === 'main') || campuses[0];
      const selectedCampus = campuses.find((c) => c.id === formData.campusId);
      const effectiveCampusId = isAffiliated ? (mainCampus?.id || formData.campusId) : formData.campusId;
      const effectiveCollege = isAffiliated
        ? (affiliatedCollegeId === 'NEW'
            ? customCollegeName.trim()
            : approvedColleges.find((ac) => ac.id === affiliatedCollegeId)?.name || customCollegeName.trim())
        : (selectedCampus?.name || '');

      const res = await apiFetch('/alumni/new-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          campusId: effectiveCampusId,
          college: effectiveCollege,
          isAffiliated,
          affiliatedCollegeId: isAffiliated && affiliatedCollegeId !== 'NEW' ? affiliatedCollegeId : null,
          customCollegeName: isAffiliated && affiliatedCollegeId === 'NEW' ? customCollegeName.trim() : null,
          course: finalCourse,
          branch: finalBranch,
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
              <img src={`${BASE_PATH}/icon.png`} alt="logo" className="w-full h-full object-cover" />
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
                  {currentStep === 3 && 'Professional & Location Details'}
                </h1>
                <p className="text-slate-500 text-xs mt-1">
                  {currentStep === 1 && 'Set up your credentials and basic info'}
                  {currentStep === 2 && 'Fill in your education credentials at IKGPTU'}
                  {currentStep === 3 && 'Tell us about your current role and location'}
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
                    {/* Toggle: Affiliated vs Constituent */}
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="affiliatedToggle"
                        checked={isAffiliated}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setIsAffiliated(val);
                          if (val) {
                            const mainCampus = campuses.find((c) => c.code === 'main') || campuses[0];
                            if (mainCampus) {
                              setFormData((prev) => ({ ...prev, campusId: mainCampus.id }));
                            }
                          } else {
                            setAffiliatedCollegeId('');
                            setCustomCollegeName('');
                          }
                        }}
                        className="w-4 h-4 rounded text-[#003D7A] focus:ring-[#003D7A] cursor-pointer"
                      />
                      <label htmlFor="affiliatedToggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                        I am from an Affiliated College
                      </label>
                    </div>

                    {!isAffiliated ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Campus *</label>
                        <div className="relative">
                          <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                          <select
                            required={!isAffiliated}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none"
                            value={formData.campusId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const selectedCamp = campuses.find((c) => c.id === selectedId);
                              setFormData((prev) => ({
                                ...prev,
                                campusId: selectedId,
                                college: selectedCamp?.name || '',
                              }));
                            }}
                          >
                            <option value="">Select your campus</option>
                            {campuses.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Affiliated College *</label>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 z-10" />
                            <select
                              required={isAffiliated}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none"
                              value={affiliatedCollegeId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAffiliatedCollegeId(val);
                                if (val !== 'NEW') {
                                  const affName = approvedColleges.find((c) => c.id === val)?.name || '';
                                  setFormData((prev) => ({ ...prev, college: affName }));
                                }
                              }}
                            >
                              <option value="">Select your affiliated college</option>
                              {approvedColleges.map((col) => (
                                <option key={col.id} value={col.id}>{col.name}</option>
                              ))}
                              <option value="NEW">+ Request new college</option>
                            </select>
                          </div>
                        </div>

                        {affiliatedCollegeId === 'NEW' && (
                          <div>
                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">Specify Affiliated College Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Chandigarh Engineering College, Landran"
                              className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:border-[#003D7A] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                              value={customCollegeName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomCollegeName(val);
                                setFormData((prev) => ({ ...prev, college: val }));
                              }}
                            />
                            <p className="mt-1 text-[11px] text-amber-700 font-medium">New college requests will be reviewed by university administration.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Passout Batch Year *</label>
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
                        <BookOpen className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 z-10" />
                        <select
                          required
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none"
                          value={courseSelection}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCourseSelection(val);
                            if (val !== 'OTHER') {
                              setFormData((prev) => ({ ...prev, course: val }));
                            } else {
                              setFormData((prev) => ({ ...prev, course: customCourse }));
                            }
                          }}
                        >
                          <option value="">Select your course</option>
                          {autocompleteOptions.courses.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="OTHER">Other (specify)</option>
                        </select>
                      </div>

                      {courseSelection === 'OTHER' && (
                        <div className="mt-2.5">
                          <input
                            type="text"
                            required
                            placeholder="Enter your course name..."
                            className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:border-[#003D7A] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                            value={customCourse}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomCourse(val);
                              setFormData((prev) => ({ ...prev, course: val }));
                            }}
                          />
                          <p className="mt-1 text-[11px] text-amber-700 font-medium">Custom entries will be flagged for administrative review.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Branch/Department *</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 z-10" />
                        <select
                          required
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 appearance-none"
                          value={branchSelection}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBranchSelection(val);
                            if (val !== 'OTHER') {
                              setFormData((prev) => ({ ...prev, branch: val }));
                            } else {
                              setFormData((prev) => ({ ...prev, branch: customBranch }));
                            }
                          }}
                        >
                          <option value="">Select your branch/department</option>
                          {autocompleteOptions.branches.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                          <option value="OTHER">Other (specify)</option>
                        </select>
                      </div>

                      {branchSelection === 'OTHER' && (
                        <div className="mt-2.5">
                          <input
                            type="text"
                            required
                            placeholder="Enter your branch/department name..."
                            className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:border-[#003D7A] focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                            value={customBranch}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomBranch(val);
                              setFormData((prev) => ({ ...prev, branch: val }));
                            }}
                          />
                          <p className="mt-1 text-[11px] text-amber-700 font-medium">Custom entries will be flagged for administrative review.</p>
                        </div>
                      )}
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        LinkedIn Profile URL
                        <span className="ml-1.5 text-[10px] font-semibold text-slate-400 normal-case tracking-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="#0077B5" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <input
                          type="url"
                          placeholder="e.g. https://linkedin.com/in/username"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.linkedinUrl}
                          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Pincode *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 144603"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                        <input
                          type="text"
                          placeholder="Resolved City"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Country</label>
                        <input
                          type="text"
                          placeholder="Resolved Country"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:border-[#003D7A] focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
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

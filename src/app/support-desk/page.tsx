'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, CheckCircle2, LifeBuoy, ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SupportDeskPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [category, setCategory] = useState('Degree / Certificate Verification');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketNo: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !category || !subject || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/support-desk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          enrollmentNo,
          category,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedTicket({ ticketNo: data.ticketNo });
        toast.success(`Support Ticket ${data.ticketNo} submitted!`);
      } else {
        toast.error(data.error || 'Failed to submit support ticket');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error submitting support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#003D7A] to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-sky-200 hover:text-white transition-colors uppercase tracking-wider bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft size={14} /> Back to Landing Page
          </Link>
        </div>

        {/* Header Title */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C41E3A] rounded-full text-[10px] font-extrabold uppercase tracking-widest text-white mb-4 shadow-lg">
            <LifeBuoy size={14} /> Official Support Portal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            IKGPTU Alumni Support Desk
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-[#C41E3A] via-sky-400 to-white mx-auto rounded-full mb-4" />
          <p className="text-sky-100 max-w-2xl mx-auto text-sm sm:text-base font-medium leading-relaxed">
            Need help with degree verification, alumni portal account access, transcripts, or university events? Raise a ticket directly with our support team.
          </p>
        </div>

        {/* Main Content Box */}
        {submittedTicket ? (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-md animate-fade-in max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Support Ticket Created!</h2>
            <p className="text-sky-200 text-sm mb-4">
              Your ticket reference number is:
            </p>
            <div className="inline-block bg-slate-900 border border-emerald-500/50 text-emerald-400 font-mono text-2xl font-black px-6 py-3 rounded-2xl mb-6 shadow-inner tracking-widest">
              {submittedTicket.ticketNo}
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-8 font-medium">
              An email notification has been dispatched to <strong className="text-white">alumni@ptu.ac.in</strong> and a confirmation receipt has been sent to <strong className="text-white">{email}</strong>.
            </p>
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setName('');
                setEmail('');
                setPhone('');
                setEnrollmentNo('');
                setSubject('');
                setMessage('');
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-xs font-extrabold uppercase tracking-wider hover:shadow-xl transition-all"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section (2 cols) */}
            <div className="lg:col-span-2 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. gurpreet@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Phone Number <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Roll / Enrollment No <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      placeholder="e.g. 1904512"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Issue Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                  >
                    <option value="Degree / Certificate Verification">Degree / Certificate Verification</option>
                    <option value="Account & Login Access">Account &amp; Login Access</option>
                    <option value="Transcripts & Document Request">Transcripts &amp; Document Request</option>
                    <option value="Reunion & Event Inquiry">Reunion &amp; Event Inquiry</option>
                    <option value="Technical Bug Report">Technical Bug Report</option>
                    <option value="General Alumni Inquiry">General Alumni Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Subject / Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Short summary of your issue"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Detailed Message / Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or query in detail so our team can assist you effectively..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#e62648] text-white text-sm font-extrabold uppercase tracking-wider hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={16} />
                  <span>{loading ? 'Submitting Support Ticket...' : 'Submit Support Ticket'}</span>
                </button>
              </form>
            </div>

            {/* Side Info Box (1 col) */}
            <div className="space-y-6">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
                  <ShieldCheck className="text-emerald-400" size={20} /> Official Contact Info
                </h3>
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <Mail className="text-sky-400 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-bold text-white">Support Email</p>
                      <a href="mailto:alumni@ptu.ac.in" className="text-sky-300 hover:underline">
                        alumni@ptu.ac.in
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-rose-400 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-bold text-white">Office Location</p>
                      <p className="text-slate-400">IKGPTU Main Campus, Jalandhar-Kapurthala Highway, Punjab 144603</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="font-bold text-white">Support Hours</p>
                      <p className="text-slate-400">Mon - Fri: 9:00 AM - 5:00 PM IST</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sky-950/60 border border-sky-500/30 rounded-3xl p-6 text-xs text-sky-200">
                <p className="font-bold text-white mb-1.5">💡 Support Processing SLA</p>
                <p className="leading-relaxed font-medium">
                  Tickets logged during business hours are reviewed within 24 hours. Your ticket number will be referenced in all email correspondence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

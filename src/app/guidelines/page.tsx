import React from 'react';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-gray-900 selection:bg-[#C41E3A] selection:text-white flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <LandingNav />

        {/* Main Content Area */}
        <div className="py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40">
          <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-10 text-center">
              <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Community & Standard</h3>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight flex justify-center items-center gap-2">
                <span>📢</span> Usage Guidelines & Community Policy
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
              <p className="text-gray-600 max-w-2xl mx-auto font-medium">
                Standards of interaction, safety, and content policy to maintain a professional and respectful network.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-gray-700">
              
              <div className="border-b border-slate-100 pb-5">
                <p className="font-extrabold text-gray-900 mb-2">Welcome to the IKGPTU Alumni Connect Portal,</p>
                <p className="text-gray-600">
                  This portal has been established to strengthen connections, foster professional collaborations, and build a vibrant community across IKGPTU's global network. These guidelines outline the standard of conduct expected from all users accessing or interacting on the platform.
                </p>
                <p className="mt-2 text-gray-600">
                  To ensure that the platform remains safe, professional, and valuable for everyone, we request all registered members and visitors to adhere to these usage and community guidelines.
                </p>
              </div>

              {/* Do's */}
              <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h2 className="text-base font-extrabold text-emerald-800 mb-3 flex items-center gap-2">
                  <span>✅</span> Do's
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-emerald-950 font-medium">
                  <li>Use the portal for professional networking, collaboration, mentorship, and reconnecting with fellow alumni.</li>
                  <li>Be respectful and courteous while communicating with other alumni.</li>
                  <li>Share authentic and meaningful updates, achievements, events, and opportunities.</li>
                  <li>Verify the accuracy of any information before posting.</li>
                  <li>Report any inappropriate content or suspicious activity to the portal administrators.</li>
                  <li>Respect the privacy and preferences of fellow alumni.</li>
                </ul>
              </section>

              {/* Don'ts */}
              <section className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                <h2 className="text-base font-extrabold text-rose-800 mb-3 flex items-center gap-2">
                  <span>❌</span> Don'ts
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-rose-950 font-medium">
                  <li>Do not use the portal for harassment, unsolicited personal messages, spam, or promotional activities unrelated to the alumni community.</li>
                  <li>Do not misuse contact information obtained through the portal.</li>
                  <li>Do not impersonate another person or provide misleading information.</li>
                  <li>Do not post offensive, abusive, defamatory, discriminatory, or illegal content.</li>
                  <li>Do not upload copyrighted material unless you have permission to do so.</li>
                  <li>Do not attempt to collect or scrape alumni data for commercial or personal purposes.</li>
                </ul>
              </section>

              {/* Privacy & Contact Information */}
              <section className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#C41E3A] rounded-full"></span>
                  Privacy & Contact Information
                </h2>
                <p className="italic text-gray-500 font-semibold">The privacy of our alumni is a top priority</p>
                <p className="text-gray-600">
                  Following recent feedback and an incident involving misuse of publicly visible contact information, we have reviewed our privacy practices. Personal details such as phone numbers and other sensitive information will no longer be publicly displayed on alumni profiles unless explicitly permitted.
                </p>
                <p className="font-extrabold text-gray-900">Members are requested to:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Share only the information they are comfortable making visible.</li>
                  <li>Use the platform responsibly when reaching out to fellow alumni.</li>
                  <li>Respect the privacy choices made by other members.</li>
                </ul>
                <p className="text-[#C41E3A] font-extrabold pt-2 border-t border-slate-200 mt-2">
                  *Any misuse of contact information may result in suspension or permanent removal of portal access.*
                </p>
              </section>

              {/* News Feed, Events & Public Content */}
              <section className="space-y-3">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#C41E3A] rounded-full"></span>
                  News Feed, Events & Public Content
                </h2>
                <p className="text-gray-600">All content posted on the News Feed, Events, Gallery, and other public sections of the portal should:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Be relevant to the alumni community.</li>
                  <li>Maintain a professional and respectful tone.</li>
                  <li>Avoid misinformation, offensive language, political campaigning, or unrelated advertisements.</li>
                  <li>Respect copyright and privacy before uploading photos or media.</li>
                </ul>
                <p className="italic text-gray-500 text-xs mt-2">
                  *The administration reserves the right to review, edit, hide, or remove any content that violates these guidelines without prior notice.*
                </p>
              </section>

              {/* Our Commitment */}
              <section className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-extrabold text-gray-900">Our Commitment</h2>
                <p className="text-gray-600">
                  We are continuously working to improve the platform while ensuring a secure and welcoming environment for every alumnus.
                </p>
                <p className="text-gray-600">
                  By using the Alumni Portal, you agree to follow these community guidelines and help us build a respectful and trustworthy alumni network.
                </p>
                <div className="pt-3 border-t border-slate-200 text-gray-600">
                  <p>Thank you for your cooperation and continued support.</p>
                  <div className="mt-2 text-xs">
                    <p className="font-bold">Regards,</p>
                    <p className="font-extrabold text-[#C41E3A] text-sm">Team Alumni Connect</p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>

      {/* Footer (matches landing page styling exactly) */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">IKGPTU Alumni</h4>
              <p className="text-[11px] leading-relaxed font-light text-slate-400">
                Fostering lifelong alliances across technology, management research, and creative design domains globally since 1997.
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Quick Navigation</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><Link href="/#events" className="hover:text-[#C41E3A] transition-colors">Events & Reunions</Link></li>
                <li><Link href="/#news" className="hover:text-[#C41E3A] transition-colors">News Updates</Link></li>
                <li><Link href="#" className="hover:text-[#C41E3A] transition-colors">Support Desk</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Compliance</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><Link href="/privacy" className="hover:text-[#C41E3A] transition-colors">Privacy Charter</Link></li>
                <li><Link href="/guidelines" className="hover:text-[#C41E3A] transition-colors">Platform Guidelines</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Connect Safely</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                <a href="https://www.linkedin.com/in/tandpikgptu/" className="hover:text-white transition-colors">LinkedIn</a>
                <a href="https://www.facebook.com/IKGujralPTU/" className="hover:text-white transition-colors">Facebook</a>
                <a href="https://x.com/IKGujralPTU" className="hover:text-white transition-colors">Twitter</a>
                <a href="https://www.instagram.com/ikgujralptu/" className="hover:text-white transition-colors">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-8 text-center text-[11px] font-medium tracking-wide text-slate-500">
            <p>&copy; {new Date().getFullYear()} IKGPTU Alumni Network. Designed to University Excellence Standards. All rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
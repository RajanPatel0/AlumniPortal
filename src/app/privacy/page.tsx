import React from 'react';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-gray-900 selection:bg-[#C41E3A] selection:text-white flex flex-col justify-between">
      <div>
        {/* Navigation Header */}
        <LandingNav />

        {/* Main Content Area */}
        <div className="py-16 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40">
          <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="mb-10 text-center">
              <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Legal & Safety</h3>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Privacy Charter & Terms of Use</h1>
              <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
              <p className="text-gray-600 max-w-2xl mx-auto font-medium">
                Official terms and policy agreements for IKGPTU Alumni Portal.
              </p>
            </div>

            {/* Temporary Hosting Notice */}
            <div className="mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-sm">
              <p className="font-extrabold text-[#003D7A] mb-2 text-sm uppercase tracking-wider">Dear Alumnus,</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                The PTU Alumni Connect portal is currently hosted temporarily on <span className="font-bold text-[#C41E3A]">test.ptu.ac.in</span>, as a part of the deployment process and it will soon be migrated to its permanent domain, <span className="font-bold text-[#C41E3A]">alumni.ptu.ac.in</span>.
              </p>
              <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                We would like to assure you that the portal is hosted within the University's own IT infrastructure and connected to the University's data centre. No third-party infrastructure or external services are being used for storing or processing alumni registration data.
              </p>
              <p className="mt-3 text-gray-700 text-sm leading-relaxed font-semibold">
                We appreciate your understanding and look forward to your registration.
              </p>
              <div className="mt-4 pt-3 border-t border-amber-200 text-xs text-gray-600">
                <p className="font-bold">Thanks & Regards</p>
                <p className="text-[#C41E3A] font-extrabold">IKGPTU Alumni Network</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-10">
              
              {/* Web Site Terms and Conditions of Use */}
              <section className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#C41E3A] rounded-full"></span>
                  Web Site Terms and Conditions of Use
                </h2>

                <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">1. Terms</h3>
                    <p>
                      By accessing this web site and the IKGPTU Alumni Portal, you are agreeing to be bound by these Terms and Conditions of Use, all applicable laws and regulations, and their compliance. If you disagree with any of the stated terms and conditions, you are prohibited from using or accessing this site. The materials and assets contained in this portal are secured by relevant copyright and trademark law.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">2. Use License</h3>
                    <p className="mb-2">
                      Permission is granted to temporarily view and interact with the professional profiles, updates, and directory information on IKGPTU's Alumni Portal for individual, networking, and non-commercial professional use only. This is just a license grant and not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>modify, copy, or scrape directory listings or member information;</li>
                      <li>use the materials for any commercial marketing, solicitation, or public presentation without explicit permission;</li>
                      <li>attempt to decompile or reverse engineer any software or service contained within IKGPTU's Alumni Portal;</li>
                      <li>remove any copyright, trademark, or proprietary designations from the portal; or</li>
                      <li>transfer the portal's data to another individual or "mirror" the contents on any other server or repository.</li>
                    </ul>
                    <p className="mt-2">
                      This license shall automatically terminate if you violate any of these restrictions, and your access may be revoked by IKGPTU administrators at any time. Upon termination of your portal access or this license, you must cease using the platform and delete any cached, downloaded, or exported member records in your possession.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">3. Disclaimer</h3>
                    <p>
                      The resources, directory listings, and features on IKGPTU's Alumni Portal are provided on an "as is" and "as available" basis. IKGPTU makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of professional suitability, fitness for a specific purpose, or non-infringement of intellectual property. Further, IKGPTU does not warrant or make any representations concerning the accuracy, completeness, or reliability of the information provided by alumni on their profiles, or on websites linked from this portal.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">4. Constraints</h3>
                    <p>
                      In no event shall IKGPTU or its technical suppliers be liable for any damages (including, without limitation, damages for loss of personal/professional data, loss of opportunity, or due to network interruption) arising out of the use or inability to use the IKGPTU Alumni Portal, even if an authorized representative of IKGPTU has been notified of the possibility of such damage.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">5. Amendments and Errata</h3>
                    <p>
                      The materials appearing on IKGPTU's Alumni Portal could include technical, typographical, or photographic errors. IKGPTU does not warrant that any of the materials on its site are accurate, complete, or current. IKGPTU may make updates to the portal features, layouts, or terms at any time without prior notice.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">6. Links</h3>
                    <p>
                      IKGPTU has not reviewed all of the external links submitted by users or connected to its portal and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by IKGPTU. Use of any such linked website is at the user's own risk.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">7. Site Terms of Use Modifications</h3>
                    <p>
                      IKGPTU may revise these terms of use for its Alumni Portal at any time without notice. By using this portal you are agreeing to be bound by the then-current version of these Terms and Conditions of Use.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 mb-1">8. Governing Law</h3>
                    <p>
                      Any claim relating to IKGPTU's Alumni Portal shall be governed by the laws of India and subject to local state jurisdiction, without regard to its conflict of law provisions.
                    </p>
                    <p className="mt-3 text-xs italic text-gray-500 font-medium">
                      General Terms and Conditions applicable to Use of a Web Site.
                    </p>
                  </div>
                </div>
              </section>

              {/* Privacy Policy */}
              <section className="space-y-4 pt-8 border-t border-slate-100">
                <h2 className="text-xl font-black text-gray-900 pb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#C41E3A] rounded-full"></span>
                  Privacy Policy
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Your privacy is critical to us. Likewise, we have built up this Policy with the end goal you should see how we gather, utilize, impart and reveal and make utilization of individual data. The following outlines our privacy policy:
                </p>

                <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700 leading-relaxed">
                  <li>Before or at the time of collecting personal information, we will identify the purposes for which information is being collected.</li>
                  <li>We will gather and utilization of individual data singularly with the target of satisfying those reasons indicated by us and for other good purposes, unless we get the assent of the individual concerned or as required by law.</li>
                  <li>We will just hold individual data the length of essential for the satisfaction of those reasons.</li>
                  <li>We will gather individual data by legal and reasonable means and, where fitting, with the information or assent of the individual concerned.</li>
                  <li>Personal information ought to be important to the reasons for which it is to be utilized, and, to the degree essential for those reasons, ought to be exact, finished, and updated.</li>
                  <li>We will protect individual data by security shields against misfortune or burglary, and also unapproved access, divulgence, duplicating, use or alteration.</li>
                  <li>We will promptly provide customers with access to our policies and procedures for the administration of individual data.</li>
                </ul>

                <p className="mt-4 text-sm text-gray-700 leading-relaxed font-semibold">
                  We are focused on leading our business as per these standards with a specific end goal to guarantee that the privacy of individual data is secure and maintained.
                </p>
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
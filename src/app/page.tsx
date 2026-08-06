import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { getCurrentAlumni } from '@/lib/auth/getCurrentAlumni';
import { GET } from '@/app/api/landing-data/route';
import { BASE_PATH } from '@/lib/api';

// Components
import HeroCarousel from '@/components/landing/HeroCarousel';
import EventsSection from '@/components/landing/EventsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import GalleryMasonry from '@/components/landing/GalleryMasonry';
import NewsletterSignup from '@/components/landing/NewsletterSignup';
import LandingNav from '@/components/landing/LandingNav';
import NewsSection from '@/components/landing/NewsSection';
import VideosSection from '@/components/landing/VideosSection';
import SpotlightSection from '@/components/landing/SpotlightSection';
import LeadershipWelcomeSection from '@/components/landing/LeadershipWelcomeSection';
import LandingMapSection from '@/components/landing/LandingMapSection';

async function getLandingData() {
  const res = await GET();
  return await res.json();
}

export default async function HomePage() {
  const alumni = await getCurrentAlumni();
  const initialAlumni = alumni ? {
    id: alumni.id,
    name: alumni.name,
    avatarUrl: alumni.avatarUrl,
    email: alumni.email,
  } : null;

  // Load landing page data (API route call)
  const data = await getLandingData();

  // Static campuses list as requested
  const staticCampuses = [
    {
      id: 'main-campus',
      name: 'Main Campus',
      location: 'Kapurthala, Punjab',
      iconName: 'Building3',
      description: 'The flagship campus of IKGPTU, driving excellence in engineering, management, computer applications, applied sciences, research, innovation, and industry collaboration.',
      url: 'https://ptu.ac.in',
      image: `${BASE_PATH}/campus/kpt.png`,
    },
    {
      id: 'mohali-1',
      name: 'Mohali-I Campus',
      location: 'Mohali, Punjab',
      iconName: 'Building',
      description: 'Specializing in computer applications, management education, and emerging sciences through industry-focused learning and innovation.',
      alumniCount: '1,200+',
      url: 'https://mohali.ptu.ac.in',
      image: `${BASE_PATH}/campus/m1.png`,
    },
    {
      id: 'mohali-2',
      name: 'Mohali-II Campus',
      location: 'Mohali, Punjab',
      iconName: 'Building2',
      description: 'Advancing technology education with modern computing, software innovation, startup incubation, and applied research.',
      alumniCount: '800+',
      url: 'https://mohalicampus.ptu.ac.in',
      image: `${BASE_PATH}/campus/m2.png`,
    },
    {
      id: 'amritsar',
      name: 'Amritsar Campus',
      location: 'Amritsar, Punjab',
      iconName: 'GraduationCap',
      description: 'Delivering quality education in engineering, computer networking, and technical disciplines with strong career development support.',
      alumniCount: '1,500+',
      url: 'https://amritsar.ptu.ac.in',
      image: `${BASE_PATH}/campus/amritsir.png`,
    },
    {
      id: 'hoshiarpur',
      name: 'Hoshiarpur Campus',
      location: 'Hoshiarpur, Punjab',
      iconName: 'School',
      description: 'Strengthening engineering education through industrial training, applied sciences, and hands-on technical learning.',
      alumniCount: '1,100+',
      url: 'https://hoshiarpur.ptu.ac.in',
      image: `${BASE_PATH}/campus/hoshiarpur.png`,
    },
    {
      id: 'batala',
      name: 'Batala Campus',
      location: 'Batala, Punjab',
      iconName: 'Library',
      description: 'Empowering students with vocational excellence, manufacturing technologies, and entrepreneurship-driven education.',
      alumniCount: '700+',
      url: 'https://ptu.ac.in/batala-campus/',
      image: `${BASE_PATH}/campus/Batala.png`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-gray-900 selection:bg-[#C41E3A] selection:text-white">
      {/* Navigation Header */}
      <LandingNav initialAlumni={initialAlumni} />

      {/* 1. Hero Section (Dynamic rotating carousel) */}
      <HeroCarousel slides={data.heroSlides} initialAlumni={initialAlumni} />

      {/* 2. Stats Strip */}
      <section className="bg-gradient-to-r from-[#003D7A] to-[#C41E3A] py-8 md:py-10 text-white relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-blue-950/20 backdrop-brightness-75" />
        <div className="relative z-10">
          {/* Mobile: Horizontal auto-scroll with scroll-snap — touch-friendly, no JS needed */}
          <div className="md:hidden overflow-x-auto scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
            <div
              className="flex gap-0 w-max px-4"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {data.statsList?.map((stat: any, idx: number) => {
                const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.BarChart3;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center px-8 py-2 border-r border-white/15 last:border-none flex-shrink-0"
                    style={{ scrollSnapAlign: 'center', minWidth: '38vw' }}
                  >
                    <div className="mb-2 p-2 bg-white/10 rounded-xl">
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <p className="text-2xl font-black mb-1 tracking-tight">{stat.number}</p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-200 font-bold leading-tight">{stat.label}</p>
                  </div>
                );
              })}
            </div>
            {/* Scroll hint dots */}
            {data.statsList && data.statsList.length > 2 && (
              <div className="flex justify-center gap-1 mt-3 pb-1">
                {data.statsList.map((_: any, i: number) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Original 5-column grid */}
          <div className="hidden md:block max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-5 gap-x-4 text-center">
              {data.statsList?.map((stat: any, idx: number) => {
                const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.BarChart3;
                return (
                  <div key={idx} className="border-r border-white/10 last:border-none flex flex-col items-center py-2">
                    <div className="mb-2 p-2 bg-white/10 rounded-xl">
                      <IconComponent size={22} className="text-white" />
                    </div>
                    <p className="text-4xl font-black mb-1.5 tracking-tight">{stat.number}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-200 font-bold">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. About / Welcome Note (Carousel for multiple leadership messages) */}
      <LeadershipWelcomeSection welcomeNotes={data.welcomeNotes || [data.welcomeNote]} />

      {/* 4. Upcoming Events Section */}
      <EventsSection events={data.events} />
      {/* 5. News & Campus Updates Section */}
      <NewsSection news={data.news} />

      {/* 5.5 Global Community Alumni Map Section */}
      <LandingMapSection />

      {/* 6. Gallery / Memories Section */}
      <GalleryMasonry items={data.gallery} />

      {/* 6.5 Alumni Videos Section */}
      <VideosSection videos={data.videos} />

      {/* 7. Notable Alumni / Spotlight Section */}
      <SpotlightSection notableAlumni={data.notableAlumni} />

      {/* 8. Testimonials Section */}
      <TestimonialsSection initialTestimonials={data.testimonials} />


      {/* 9. Campus Showcase (Statically Fixed) */}
      <section id="campuses" className="py-14 md:py-18 bg-gradient-to-b from-white via-sky-50/40 to-slate-50/60 scroll-mt-16 border-b border-sky-100/50">
        <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Our Footprint</h3>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">Campus Showcase</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
            <p className="text-slate-600 max-w-4xl mx-auto text-xs sm:text-sm md:text-base font-medium leading-relaxed">
              Explore our core campuses fostering engineering, tech research, and professional domains.
            </p>
          </div>

          {/* Horizontal scroll support for campuses on mobile / 6-column grid on laptops */}
          <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-3 lg:grid-cols-6 pb-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] -mx-4 px-4 sm:mx-0 sm:px-0">
            {staticCampuses.map((campus) => {
              const IconComp = (LucideIcons as any)[campus.iconName] || LucideIcons.School;
              return (
                <div 
                  key={campus.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden w-[260px] flex-shrink-0 md:w-auto"
                >
                  {/* Elegant Campus Image */}
                  <div className="h-32 md:h-36 w-full relative group overflow-hidden border-b border-slate-100 bg-slate-100">
                    <Image 
                      src={campus.image} 
                      alt={campus.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 15vw"
                      className="object-cover group-hover:scale-110 transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"></div>
                    <div className="absolute top-2.5 right-2.5 p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md text-[#003D7A] group-hover:scale-110 transition-all duration-300">
                      <IconComp size={16} />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="text-base font-extrabold text-black mb-1 leading-tight line-clamp-1">{campus.name}</h4>
                    <p className="text-xs font-bold text-[#C41E3A] uppercase tracking-wider mb-2">📍 {campus.location}</p>
                    <p className="text-black text-xs md:text-sm leading-relaxed mb-3 font-normal flex-grow">
                      {campus.description}
                    </p>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-black mt-auto">
                      <span>{campus.alumniCount} Alumni</span>
                      <a href={campus.url} target="_blank" rel="noopener noreferrer" className="text-[#C41E3A] font-extrabold hover:text-[#003D7A] transition-colors">Visit ↗</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Partner/Affiliated Colleges strip */}
      {/* <section className="py-16 bg-white border-t border-b border-slate-100">
        <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-8">
            Partner / Affiliated Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-70">
            {data.affiliatedColleges?.map((college: any) => (
              <div key={college.id} className="flex items-center gap-2 hover:opacity-100 transition-opacity">
                {college.logo.includes('https://') || college.logo.includes('http://') ? (
                  <img src={college.logo} alt={college.name} className="h-14" />
                ) : (
                  <span className="text-xl">{college.logo}</span>
                )}
                <span className="text-xs font-bold text-slate-600">{college.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* 11. Newsletter Capture Form */}
      <NewsletterSignup />

      {/* 12. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">IKGPTU Alumni</h4>
              <p className="text-[14px] leading-relaxed font-light text-slate-400">
                Fostering lifelong alliances across technology, management research, and creative design domains globally since 1997.
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Quick Navigation</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><Link href="#events" className="hover:text-[#C41E3A] transition-colors">Events & Reunions</Link></li>
                <li><Link href="#news" className="hover:text-[#C41E3A] transition-colors">News Updates</Link></li>
                <li><Link href="#" className="hover:text-[#C41E3A] transition-colors">Support Desk</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Compliance</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><Link href="/guidelines" className="hover:text-[#C41E3A] transition-colors">Platform Guidelines</Link></li>
                <li><Link href="/privacy" className="hover:text-[#C41E3A] transition-colors">Privacy Charter</Link></li>
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
          <div className="border-t border-slate-800/80 pt-8 text-center text-[13px] font-medium tracking-wide text-slate-500">
            <p>&copy; {new Date().getFullYear()} IKGPTU Alumni Network. Designed to University Excellence Standards. All rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
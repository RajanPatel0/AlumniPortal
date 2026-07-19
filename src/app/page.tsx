import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';
import { GET } from '@/app/api/landing-data/route';

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

async function getLandingData() {
  const res = await GET();
  return await res.json();
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('alumniAccessToken')?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      verifyAlumniAccessToken(token);
      isAuthenticated = true;
    } catch {
      // Token expired – treat as not authenticated
    }
  }

  if (isAuthenticated) {
    redirect('/alumni/feed');
  }

  // Load landing page data (API route call)
  const data = await getLandingData();

  // Static campuses list as requested
    const staticCampuses = [
    {
      id: 'mohali-1',
      name: 'Mohali-I Campus',
      location: 'Mohali, Punjab',
      iconName: 'Building',
      description: 'Specializing in computer applications, management education, and emerging sciences through industry-focused learning and innovation.',
      alumniCount: '1,200+',
      url: 'https://mohali.ptu.ac.in',
      image: '/campus/m1.png',
    },
    {
      id: 'mohali-2',
      name: 'Mohali-II Campus',
      location: 'Mohali, Punjab',
      iconName: 'Building2',
      description: 'Advancing technology education with modern computing, software innovation, startup incubation, and applied research.',
      alumniCount: '800+',
      url: 'https://mohalicampus.ptu.ac.in',
      image: '/campus/m2.png',
    },
    {
      id: 'amritsar',
      name: 'Amritsar Campus',
      location: 'Amritsar, Punjab',
      iconName: 'GraduationCap',
      description: 'Delivering quality education in engineering, computer networking, and technical disciplines with strong career development support.',
      alumniCount: '1,500+',
      url: 'https://amritsar.ptu.ac.in',
      image: '/campus/amritsir.png',
    },
    {
      id: 'hoshiarpur',
      name: 'Hoshiarpur Campus',
      location: 'Hoshiarpur, Punjab',
      iconName: 'School',
      description: 'Strengthening engineering education through industrial training, applied sciences, and hands-on technical learning.',
      alumniCount: '1,100+',
      url: 'https://hoshiarpur.ptu.ac.in',
      image: '/campus/hoshiarpur.png',
    },
    {
      id: 'batala',
      name: 'Batala Campus',
      location: 'Batala, Punjab',
      iconName: 'Library',
      description: 'Empowering students with vocational excellence, manufacturing technologies, and entrepreneurship-driven education.',
      alumniCount: '700+',
      url: 'https://ptu.ac.in/batala-campus/',
      image: '/campus/Batala.png',
    },
    {
      id: 'main-campus',
      name: 'Main Campus',
      location: 'Kapurthala, Punjab',
      iconName: 'Building3',
      description: 'The flagship campus of IKGPTU, driving excellence in engineering, management, computer applications, applied sciences, research, innovation, and industry collaboration.',
      url: 'https://ptu.ac.in',
      image: '/campus/kpt.png',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-gray-900 selection:bg-[#C41E3A] selection:text-white">
      {/* Navigation Header */}
      <LandingNav />

      {/* 1. Hero Section (Dynamic rotating carousel) */}
      <HeroCarousel slides={data.heroSlides} />

      {/* 2. Stats Strip */}
      <section className="bg-gradient-to-r from-[#003D7A] to-[#C41E3A] py-14 text-white relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-blue-950/20 backdrop-brightness-75"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap md:grid md:grid-cols-5 gap-y-8 gap-x-4 justify-center text-center">
            {data.statsList?.map((stat: any, idx: number) => {
              // Resolve Lucide Icon dynamically
              const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.BarChart3;
              return (
                <div key={idx} className="flex-1 min-w-[140px] md:border-r md:border-white/10 last:border-none flex flex-col items-center">
                  <div className="mb-2 p-2 bg-white/10 rounded-xl">
                    <IconComponent size={22} className="text-white" />
                  </div>
                  <p className="text-3xl md:text-4.5xl font-black mb-1.5 tracking-tight">{stat.number}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-200 font-bold">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. About / Welcome Note */}
      <section id="leadership" className="scroll-mt-16 py-24 bg-gradient-to-b from-white via-slate-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Note text */}
            <div className="lg:col-span-7">
              <span className="inline-block px-3 py-1 bg-[#003D7A]/5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#003D7A] mb-4">
                Message from Leadership
              </span>
              <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                {data.welcomeNote.title}
              </h2>
              <div 
                className="text-gray-600 text-sm leading-relaxed font-light mb-8"
                dangerouslySetInnerHTML={{ __html: data.welcomeNote.body }}
              />
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm">{data.welcomeNote.name}</h4>
                <p className="text-xs text-[#C41E3A] font-bold uppercase tracking-wider mt-0.5">{data.welcomeNote.designation}</p>
              </div>
            </div>
            
            {/* Leadership Photo Card with Layered Offset Borders */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="absolute -inset-2.5 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] rounded-[2.5rem] blur opacity-15 -rotate-1 scale-95" />
              <div className="absolute -top-3 -left-3 w-16 h-16 border-t-4 border-l-4 border-[#C41E3A] rounded-tl-3xl hidden sm:block" />
              <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b-4 border-r-4 border-[#003D7A] rounded-br-3xl hidden sm:block" />
              <div className="relative p-3.5 bg-white border border-slate-100 rounded-[2.2rem] shadow-2xl max-w-sm w-full z-10 transition-transform duration-300 hover:scale-[1.02]">
                <div className="relative h-96 w-full rounded-3xl overflow-hidden bg-slate-50">
                  <img 
                    src={data.welcomeNote.photo} 
                    alt={data.welcomeNote.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Events Section */}
      <EventsSection events={data.events} />
      {/* 5. News & Campus Updates Section */}
      <NewsSection news={data.news} />

      {/* 6. Gallery / Memories Section */}
      <GalleryMasonry items={data.gallery} />

      {/* 6.5 Alumni Videos Section */}
      <VideosSection videos={data.videos} />

      {/* 7. Notable Alumni / Spotlight Section */}
      <SpotlightSection notableAlumni={data.notableAlumni} />

      {/* 8. Testimonials Section */}
      <TestimonialsSection initialTestimonials={data.testimonials} />


      {/* 9. Campus Showcase (Statically Fixed) */}
      <section id="campuses" className="py-24 bg-gradient-to-b from-white via-slate-50/70 to-slate-100/40 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Our Footprint</h3>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Campus Showcase</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#C41E3A] to-[#003D7A] mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">
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
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden w-[240px] flex-shrink-0 md:w-auto"
                >
                  {/* Elegant Campus Image */}
                  <div className="h-28 w-full relative group overflow-hidden border-b border-slate-100 bg-slate-100">
                    <Image 
                      src={campus.image} 
                      alt={campus.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 15vw"
                      className="object-cover group-hover:scale-110 transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"></div>
                    <div className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-[#003D7A] group-hover:scale-110 transition-all duration-300">
                      <IconComp size={15} />
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="text-sm font-extrabold text-gray-900 mb-1 leading-tight line-clamp-1">{campus.name}</h4>
                    <p className="text-[9px] font-bold text-[#C41E3A] uppercase tracking-wider mb-2">📍 {campus.location}</p>
                    <p className="text-slate-600 text-xs leading-relaxed mb-3 font-normal flex-grow">
                      {campus.description}
                    </p>
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-gray-700 mt-auto">
                      <span>{campus.alumniCount} Alumni</span>
                      <a href={campus.url} target="_blank" rel="noopener noreferrer" className="text-[#C41E3A] font-medium hover:text-[#003D7A] transition-colors">Visit</a>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <li><a href="#" className="hover:text-[#C41E3A] transition-colors">About Association</a></li>
                <li><a href="#events" className="hover:text-[#C41E3A] transition-colors">Events & Reunions</a></li>
                <li><a href="#news" className="hover:text-[#C41E3A] transition-colors">News Updates</a></li>
                <li><a href="#" className="hover:text-[#C41E3A] transition-colors">Support Desk</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Compliance</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><a href="#" className="hover:text-[#C41E3A] transition-colors">Privacy Charter</a></li>
                <li><a href="#" className="hover:text-[#C41E3A] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#C41E3A] transition-colors">Platform Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-4 tracking-wider text-xs uppercase">Connect Safely</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
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
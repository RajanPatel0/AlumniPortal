'use client';

import dynamic from 'next/dynamic';

const AlumniMap = dynamic(() => import('@/components/map/AlumniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] sm:h-[520px] lg:h-[580px] rounded-3xl bg-slate-100/90 flex items-center justify-center border border-slate-200/80 animate-pulse">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#003D7A] border-t-[#C41E3A] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-bold text-sm">Loading Alumni Map Engine...</p>
      </div>
    </div>
  ),
});

export default function LandingMapSection() {
  return (
    <section id="map" className="relative z-0 py-14 md:py-18 bg-gradient-to-b from-white via-slate-50/50 to-white scroll-mt-16">
      <div className="w-full max-w-[92vw] xl:max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h3 className="text-xs font-extrabold text-[#C41E3A] uppercase tracking-widest mb-3">Our Global Footprint</h3>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            A Global Community
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#003D7A] to-[#C41E3A] mx-auto rounded-full mt-3 mb-3"></div>
          <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-xl mx-auto">
            Discover our vibrant network of alumni spanning across cities and continents around the world.
          </p>
        </div>

        {/* 90vw Wide Map Container */}
        <div className="w-full shadow-2xl rounded-3xl overflow-hidden border border-slate-200/80">
          <AlumniMap isPublic={true} heightClass="h-[450px] sm:h-[520px] lg:h-[580px]" />
        </div>
      </div>
    </section>
  );
}

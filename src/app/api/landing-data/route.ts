import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      dbHeroSlides,
      dbStats,
      dbWelcome,
      dbEvents,
      dbNews,
      dbTestimonials,
      dbGallery,
      dbVideos,
    ] = await Promise.all([
      prisma.landingHeroSlide.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.landingStat.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.landingWelcome.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.event.findMany({
        where: { showOnLanding: true, isPublished: true },
        orderBy: { eventDate: 'asc' },
      }),
      prisma.landingNews.findMany({
        where: { isActive: true },
        orderBy: { publishedDate: 'desc' },
      }),
      prisma.landingTestimonial.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.albumImage.findMany({
        where: { showOnLanding: true },
        orderBy: { createdAt: 'desc' },
        include: { album: true },
      }),
      prisma.landingVideo.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    const heroSlides = dbHeroSlides.length > 0 
      ? dbHeroSlides.map(slide => ({
          id: slide.id,
          imageUrl: slide.imageUrl,
          headline: slide.headline || '',
          subtext: slide.subtext || '',
          ctaText: 'Are You Alumni?',
          ctaLink: '/alumni/login',
        }))
      : [
          {
            id: 'hero-1',
            imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80',
            headline: 'Join 10,000+ Distinguished Alumni Network',
            subtext: 'Unlock lifelong connections, global mentorship, and exclusive career opportunities with IKGPTU.',
            ctaText: 'Are You Alumni?',
            ctaLink: '/alumni/login',
          },
          {
            id: 'hero-2',
            imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80',
            headline: 'Celebrating 27 Years of Academic Excellence',
            subtext: 'Empowering students and alumni since 1997. Reconnect with your batchmates and relive campus memories.',
            ctaText: 'Are You Alumni?',
            ctaLink: '/alumni/login',
          },
          {
            id: 'hero-3',
            imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
            headline: 'Empower the Next Generation of Leaders',
            subtext: 'Share your journey, provide mentorship, and guide current students toward absolute success.',
            ctaText: 'Are You Alumni?',
            ctaLink: '/alumni/login',
          }
        ];

    const statsList = dbStats.length > 0
      ? dbStats.map(s => ({
          number: s.number,
          label: s.label,
          icon: s.icon,
        }))
      : [
          { number: '10,000+', label: 'Total Alumni', icon: 'Users' },
          { number: '6', label: 'Campuses', icon: 'GraduationCap' },
          { number: '150+', label: 'Affiliated Colleges', icon: 'School' },
          { number: '45+', label: 'Countries', icon: 'Globe' },
          { number: '350+', label: 'Events Hosted', icon: 'Calendar' }
        ];

    const welcomeNote = dbWelcome
      ? {
          title: dbWelcome.title,
          body: dbWelcome.body,
          photo: dbWelcome.photo,
          name: dbWelcome.name,
          designation: dbWelcome.designation,
        }
      : {
          title: 'Welcome to the IKGPTU Alumni Family',
          body: '<p class="mb-4">It is a matter of immense pride to witness our alumni community spread its wings across the globe, driving innovation, entrepreneurship, and leadership in diverse fields.</p><p class="mb-4">This portal serves as a bridge connecting our rich legacy with the promising future. I invite all our former students to actively participate, share their expertise, and stay connected with their alma mater.</p>',
          photo: 'https://ptu.ac.in/wp-content/uploads/2025/08/vice_chancellor_photo.jpg',
          name: 'Dr. Susheel Mittal',
          designation: 'Vice Chancellor, IKGPTU',
        };

    const events = dbEvents.length > 0
      ? dbEvents.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          bannerImage: e.coverImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
          dateTime: e.eventDate.toISOString(),
          venue: e.venue,
          venueType: 'physical',
          category: e.category.toLowerCase().includes('webinar') 
            ? 'webinar' 
            : e.category.toLowerCase().includes('workshop') 
              ? 'workshop' 
              : 'reunion',
          registrationLink: '#rsvp-modal',
          campusTag: 'Main Campus',
          published: e.isPublished,
        }))
      : [
          {
            id: 'event-1',
            title: 'Silver Jubilee Alumni Reunion 2026',
            description: 'Join us at the Main Campus for a nostalgic walk down memory lane, network dinners, and interactive sessions with current students.',
            bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
            dateTime: '2026-08-15T10:00:00Z',
            venue: 'Main Auditorium, IKGPTU Main Campus',
            venueType: 'physical',
            category: 'reunion',
            registrationLink: '#rsvp-modal',
            capacity: 500,
            campusTag: 'Main Campus',
            published: true,
          },
          {
            id: 'event-2',
            title: 'Global Tech Webinar: AI in 2026',
            description: 'Industry experts from Silicon Valley discuss the future landscape of generative AI and prompt engineering standards.',
            bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
            dateTime: '2026-07-22T15:30:00Z',
            venue: 'Zoom & YouTube Live Stream',
            venueType: 'virtual',
            category: 'webinar',
            registrationLink: '#rsvp-modal',
            capacity: 1000,
            campusTag: 'All Campuses',
            published: true,
          }
        ];

    // 5. Fetch News
    const news = dbNews.length > 0
      ? dbNews.map(n => ({
          id: n.id,
          title: n.title,
          summary: n.summary,
          body: n.body || '',
          coverImage: n.coverImage || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
          category: n.category,
          author: n.author,
          publishedDate: n.publishedDate,
          campusTag: n.campusTag,
          linkTo: n.linkTo || null,
          featured: n.featured,
        }))
      : [
          {
            id: 'news-1',
            title: 'IKGPTU Bags Outstanding University Placement Award 2026',
            summary: 'The university has been recognized at the National Education Summit for stellar career placements and internship drives.',
            body: 'Full story contents here...',
            coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
            category: 'Placements',
            author: 'Media Relations Cell',
            publishedDate: '2026-06-25',
            campusTag: 'Main Campus',
            featured: true,
          },
          {
            id: 'news-2',
            title: 'Alum Mohit Sharma Named Vice President at Leading Tech Corp',
            summary: 'Mohit Sharma, Batch of 2008 (ECE), has been promoted to VP of Engineering at Silicon Valley tech giant.',
            body: 'Full story contents here...',
            coverImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
            category: 'Achievement',
            author: 'Alumni Association Office',
            publishedDate: '2026-06-18',
            campusTag: 'Main Campus',
            featured: true,
          }
        ];

    // 6. Fetch Testimonials and notableAlumni (Spotlights)
    const testimonials = dbTestimonials.filter(t => !t.isSpotlight).length > 0
      ? dbTestimonials.filter(t => !t.isSpotlight).map(t => ({
          id: t.id,
          name: t.name,
          photo: t.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          batch: t.batchYear ? String(t.batchYear) : 'N/A',
          quote: t.quote,
          rating: 5,
          status: 'approved',
        }))
      : [
          {
            id: 't-1',
            name: 'Sandeep Brar',
            photo: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&w=400&q=80',
            batch: '2005',
            quote: 'The mentorship and network I built at IKGPTU were crucial milestones that helped transition my career to global leadership levels.',
            rating: 5,
            status: 'approved',
          },
          {
            id: 't-2',
            name: 'Mehak Preet',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            batch: '2018',
            quote: 'Connecting back with seniors through this platform helped me land my dream remote role in product management.',
            rating: 5,
            status: 'approved',
          }
        ];

    const notableAlumni = dbTestimonials.filter(t => t.isSpotlight).length > 0
      ? dbTestimonials.filter(t => t.isSpotlight).map((t, idx) => ({
          id: t.id,
          name: t.name,
          photo: t.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          batch: t.batchYear ? String(t.batchYear) : 'N/A',
          branch: t.branch || 'General',
          designation: t.designation || 'Alumni',
          company: t.company || '',
          bio: t.quote,
          linkedIn: t.linkedIn || 'https://linkedin.com',
          featuredOrder: idx + 1,
        }))
      : [
          {
            id: 'alum-1',
            name: 'Amit Khurana',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
            batch: '2002',
            branch: 'Computer Science & Engineering',
            designation: 'Co-Founder & CEO',
            company: 'StellarData Systems',
            bio: 'Amit pioneered big-data analytics products now used by Fortune 500 financial institutions globally.',
            linkedIn: 'https://linkedin.com',
            featuredOrder: 1,
          },
          {
            id: 'alum-2',
            name: 'Priyanka Sen',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
            batch: '2007',
            branch: 'Mechanical Engineering',
            designation: 'Director of Aerospace Design',
            company: 'NovaAero Dynamics',
            bio: 'Priyanka leads rocket nozzle thermal structural analysis and space exploration system architectures.',
            linkedIn: 'https://linkedin.com',
            featuredOrder: 2,
          }
        ];

    // 7. Selected Gallery Images
    const gallery = dbGallery.length > 0
      ? dbGallery.map((img, idx) => ({
          id: img.id,
          image: img.imageUrl,
          caption: img.caption || 'Campus Memory',
          album: img.album?.title || 'Gallery',
          uploadDate: img.createdAt.toISOString().split('T')[0],
          displayOrder: idx + 1,
        }))
      : [
          {
            id: 'gal-1',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
            caption: '23rd Annual Convocation Ceremony',
            album: 'Convocation',
            uploadDate: '2026-04-10',
            displayOrder: 1,
          },
          {
            id: 'gal-2',
            image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
            caption: 'Silver Jubilee Mega Fest Night',
            album: 'Fests & Culture',
            uploadDate: '2026-05-15',
            displayOrder: 2,
          },
          {
            id: 'gal-3',
            image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
            caption: 'Global Alumni Interactive Summit',
            album: 'Reunions',
            uploadDate: '2026-05-20',
            displayOrder: 3,
          }
        ];

    // 8. Campuses list (Statically overridden in page.tsx as well)
    const campuses = [
      {
        id: 'camp-1',
        name: 'IKGPTU Main Campus',
        location: 'Kapurthala-Jalandhar Highway',
        logo: '🏫',
        description: 'The state-of-the-art center of research, advanced engineering, and university leadership.',
        alumniCount: '8,000+',
        link: '#',
      },
      {
        id: 'camp-2',
        name: 'Amritsar Campus',
        location: 'Amritsar, Punjab',
        logo: '🏢',
        description: 'Focusing on specialized computer sciences, applications, and mechanical designs.',
        alumniCount: '1,500+',
        link: '#',
      },
      {
        id: 'camp-3',
        name: 'Hoshiarpur Campus',
        location: 'Hoshiarpur, Punjab',
        logo: '🏛️',
        description: 'Nurturing foundational technology pathways, professional trades, and local innovation.',
        alumniCount: '1,200+',
        link: '#',
      }
    ];

    // const affiliatedColleges = [
    //   { id: 'ac-1', name: 'DAV Institute of Engineering & Technology', logo: '🎓', status: 'active' },
    //   { id: 'ac-2', name: 'Guru Nanak Dev Engineering College', logo: '🎓', status: 'active' },
    //   { id: 'ac-3', name: 'Lyallpur Khalsa College of Engineering', logo: '🎓', status: 'active' },
    // ];

    const videos = dbVideos.length > 0
      ? dbVideos.map(v => ({
          id: v.id,
          videoUrl: v.videoUrl,
          title: v.title,
          description: v.description || '',
        }))
      : [
          {
            id: 'v-1',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            title: 'Campus Walkthrough & Tech Fest Memories',
            description: 'A glimpse into student innovation and tech events across Kapurthala main campus.',
          },
          {
            id: 'v-2',
            videoUrl: 'https://www.w3schools.com/html/movie.mp4',
            title: 'Alumni Entrepreneurs Summit 2025 Highlights',
            description: 'Key moments and insights shared by alumni business leaders during our annual summit.',
          }
        ];

    return NextResponse.json({
      heroSlides,
      statsList,
      welcomeNote,
      events,
      news,
      notableAlumni,
      testimonials,
      gallery,
      videos,
      campuses,
      // affiliatedColleges,
    });
  } catch (error: any) {
    console.error('[API_GET_LANDING_DATA_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to load landing data' }, { status: 500 });
  }
}

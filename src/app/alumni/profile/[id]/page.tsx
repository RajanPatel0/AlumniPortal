import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { 
  Mail, Briefcase, MapPin, Calendar, ExternalLink, 
  GraduationCap, Globe, ShieldCheck, Building, Award, Rocket
} from 'lucide-react';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';
import AlumniHeader from '@/components/AlumniHeader';
import AlumniBottomNav from '@/components/AlumniBottomNav';
import ProfileTabs from './ProfileTabs';
import { cookies } from 'next/headers';
import { verifyAlumniAccessToken } from '@/lib/auth/alumni-jwt';



interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const staff = await getAuthenticatedStaff();

  const cookieStore = await cookies();
  const alumniToken = cookieStore.get('alumniAccessToken')?.value;

  let currentAlumniId: string | null = null;
  let currentAlumni: { id: string; name: string; avatarUrl: string | null } | null = null;

  if (alumniToken) {
    try {
      const payload = verifyAlumniAccessToken(alumniToken);
      if (payload?.id) {
        currentAlumniId = payload.id;
        currentAlumni = await prisma.alumni.findUnique({
          where: { id: payload.id },
          select: { id: true, name: true, avatarUrl: true }
        });
      }
    } catch {}
  }

  const alumni = await prisma.alumni.findUnique({
    where: { id: id },
    include: {
      education: {
        orderBy: { startDate: 'desc' }
      },
      workExperience: {
        orderBy: { startDate: 'desc' }
      },
      startups: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const postsData = await prisma.post.findMany({
    where: { authorId: id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          batchYear: true,
          currentRole: true,
          currentCompany: true
        }
      },
      postedByStaff: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        }
      },
      images: true,
      likes: {
        where: { alumniId: currentAlumniId || '' },
        select: { id: true }
      },
      _count: {
        select: { likes: true, comments: true }
      }
    }
  });

  const posts = postsData.map(post => {
    const author = post.postedByStaff 
      ? {
          id: post.postedByStaff.id,
          name: post.postedByStaff.name,
          batchYear: 0,
          avatarUrl: undefined,
          currentRole: post.postedByStaff.role,
          currentCompany: "IKGPTU Staff",
          isAdmin: true,
        }
      : post.author 
        ? {
            id: post.author.id,
            name: post.author.name,
            avatarUrl: post.author.avatarUrl || undefined,
            batchYear: post.author.batchYear,
            currentRole: post.author.currentRole || undefined,
            currentCompany: post.author.currentCompany || undefined,
            isAdmin: false,
          }
        : {
            name: "Anonymous",
            batchYear: 0,
            isAdmin: false,
          };

    return {
      id: post.id,
      content: post.content || "",
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      hasLiked: post.likes ? post.likes.length > 0 : false,
      images: post.images.map(img => ({ imageUrl: img.imageUrl })),
      media: post.images.length > 0 ? { type: "image" as const, url: post.images[0].imageUrl } : undefined,
      author,
    };
  });

  const activityPostsData = await prisma.post.findMany({
    where: {
      OR: [
        {
          likes: {
            some: { alumniId: id }
          }
        },
        {
          comments: {
            some: { alumniId: id }
          }
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          batchYear: true,
          currentRole: true,
          currentCompany: true
        }
      },
      postedByStaff: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        }
      },
      images: true,
      likes: {
        where: { alumniId: currentAlumniId || '' },
        select: { id: true }
      },
      _count: {
        select: { likes: true, comments: true }
      }
    }
  });

  const activityPosts = activityPostsData.map(post => {
    const author = post.postedByStaff 
      ? {
          id: post.postedByStaff.id,
          name: post.postedByStaff.name,
          batchYear: 0,
          avatarUrl: undefined,
          currentRole: post.postedByStaff.role,
          currentCompany: "IKGPTU Staff",
          isAdmin: true,
        }
      : post.author 
        ? {
            id: post.author.id,
            name: post.author.name,
            avatarUrl: post.author.avatarUrl || undefined,
            batchYear: post.author.batchYear,
            currentRole: post.author.currentRole || undefined,
            currentCompany: post.author.currentCompany || undefined,
            isAdmin: false,
          }
        : {
            name: "Anonymous",
            batchYear: 0,
            isAdmin: false,
          };

    return {
      id: post.id,
      content: post.content || "",
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      hasLiked: post.likes ? post.likes.length > 0 : false,
      images: post.images.map(img => ({ imageUrl: img.imageUrl })),
      media: post.images.length > 0 ? { type: "image" as const, url: post.images[0].imageUrl } : undefined,
      author,
    };
  });

  const currentUser = staff
    ? { id: staff.id, name: staff.name, isAdmin: staff.role === 'ADMIN' }
    : currentAlumni
      ? { id: currentAlumni.id, name: currentAlumni.name, avatarUrl: currentAlumni.avatarUrl || undefined, isAdmin: false }
      : null;



  if (!alumni) {
    notFound();
  }

  const initial = alumni.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50/60 pb-28 antialiased selection:bg-[#C41E3A]/10">
      <AlumniHeader isStaff={!!staff} />
      
      <main className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Header Cover Banner */}
          <div className="bg-gradient-to-r from-[#003D7A] via-[#002b56] to-[#C41E3A] h-48 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            
            {/* Top-Right Status Badge */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10 flex items-center gap-1.5 text-xs text-emerald-800 bg-white/90 backdrop-blur-md border border-emerald-200/60 px-3 py-1.5 rounded-full font-bold shadow-sm">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Verified Alumni Profile</span>
            </div>
          </div>

          <div className="px-6 sm:px-10 pb-10 relative">
            {/* Avatar Circle */}
            <div className="flex justify-start -mt-20 mb-6">
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[#003D7A] to-[#C41E3A] p-1.5 shadow-xl bg-white">
                <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center relative">
                  {alumni.avatarUrl ? (
                    <img 
                      src={alumni.avatarUrl} 
                      alt={alumni.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-slate-400 font-extrabold text-5xl">{initial}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Info */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-2.5">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  {alumni.name}
                  {alumni.isRegistered && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#003D7A]/10 text-[#003D7A]" title="Active Member">
                      ACTIVE
                    </span>
                  )}
                </h1>

                {alumni.currentRole && (
                  <p className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={18} className="text-[#C41E3A] shrink-0" />
                    <span>{alumni.currentRole} {alumni.currentCompany && `at ${alumni.currentCompany}`}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={16} className="text-slate-400" />
                    {alumni.branch} · Class of {alumni.batchYear}
                  </span>
                  {alumni.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {alumni.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                {alumni.linkedinUrl && (
                  <a
                    href={alumni.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0077B5] hover:bg-[#006399] text-white text-sm font-bold rounded-xl transition shadow-sm"
                  >
                    <span>Connect on LinkedIn</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                <a
                  href={`mailto:${alumni.email}`}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  <Mail size={16} />
                  <span>Send Email</span>
                </a>
              </div>
            </div>

            {/* Bio Section */}
            {alumni.bio && (
              <div className="mt-8 pt-8 border-t border-slate-100 max-w-3xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">About</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{alumni.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Columns */}
          <div className="lg:col-span-2">
            <ProfileTabs
              alumni={alumni}
              workExperience={alumni.workExperience}
              education={alumni.education}
              startups={alumni.startups}
              posts={posts}
              activityPosts={activityPosts}
              currentUser={currentUser}
            />
          </div>

          {/* Sidebar / Additional Info */}
          <div className="space-y-8">
            
            {/* Contact Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Contact & Location</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Mail className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                    <a href={`mailto:${alumni.email}`} className="text-sm font-semibold text-slate-700 hover:underline truncate block">
                      {alumni.email}
                    </a>
                  </div>
                </div>

                {staff && alumni.phone && (
                  <div className="flex gap-3">
                    <span className="text-slate-400 shrink-0 text-md">📞</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {alumni.phone}
                      </p>
                    </div>
                  </div>
                )}

                {alumni.city && (
                  <div className="flex gap-3">
                    <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Preferred Location</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {alumni.city}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* University & Degree Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Academic Profile</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">College</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{alumni.college}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Course & Branch</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{alumni.course || 'B.Tech'} in {alumni.branch}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Graduation Year</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">Class of {alumni.batchYear}</p>
                </div>
                {alumni.enrollmentNo && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enrollment No.</p>
                    <p className="text-sm font-semibold text-slate-700 mt-0.5">{alumni.enrollmentNo}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>

      <AlumniBottomNav isStaff={!!staff} />
    </div>
  );
}

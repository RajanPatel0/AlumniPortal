'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedStaff } from '@/lib/auth/staff-auth';

// Helper to verify staff session
async function verifyStaff() {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    throw new Error('Unauthorized');
  }
  return staff;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO SLIDES
// ─────────────────────────────────────────────────────────────────────────────

export async function getHeroSlidesAction() {
  try {
    const slides = await prisma.landingHeroSlide.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, slides };
  } catch (err: any) {
    console.error('[getHeroSlidesAction]', err);
    return { success: false, error: err.message || 'Failed to fetch hero slides' };
  }
}

export async function createHeroSlideAction(data: {
  imageUrl: string;
  headline?: string;
  subtext?: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  try {
    await verifyStaff();
    const slide = await prisma.landingHeroSlide.create({
      data: {
        imageUrl: data.imageUrl,
        headline: data.headline || null,
        subtext: data.subtext || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, slide };
  } catch (err: any) {
    console.error('[createHeroSlideAction]', err);
    return { success: false, error: err.message || 'Failed to create hero slide' };
  }
}

export async function updateHeroSlideAction(
  id: string,
  data: {
    imageUrl: string;
    headline?: string;
    subtext?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    await verifyStaff();
    const slide = await prisma.landingHeroSlide.update({
      where: { id },
      data: {
        imageUrl: data.imageUrl,
        headline: data.headline || null,
        subtext: data.subtext || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, slide };
  } catch (err: any) {
    console.error('[updateHeroSlideAction]', err);
    return { success: false, error: err.message || 'Failed to update hero slide' };
  }
}

export async function deleteHeroSlideAction(id: string) {
  try {
    await verifyStaff();
    await prisma.landingHeroSlide.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    console.error('[deleteHeroSlideAction]', err);
    return { success: false, error: err.message || 'Failed to delete hero slide' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATS STRIP
// ─────────────────────────────────────────────────────────────────────────────

export async function getStatsAction() {
  try {
    const stats = await prisma.landingStat.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, stats };
  } catch (err: any) {
    console.error('[getStatsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch stats' };
  }
}

export async function createStatAction(data: {
  number: string;
  label: string;
  icon: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  try {
    await verifyStaff();
    const stat = await prisma.landingStat.create({
      data: {
        number: data.number,
        label: data.label,
        icon: data.icon,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, stat };
  } catch (err: any) {
    console.error('[createStatAction]', err);
    return { success: false, error: err.message || 'Failed to create stat' };
  }
}

export async function updateStatAction(
  id: string,
  data: {
    number: string;
    label: string;
    icon: string;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    await verifyStaff();
    const stat = await prisma.landingStat.update({
      where: { id },
      data: {
        number: data.number,
        label: data.label,
        icon: data.icon,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, stat };
  } catch (err: any) {
    console.error('[updateStatAction]', err);
    return { success: false, error: err.message || 'Failed to update stat' };
  }
}

export async function deleteStatAction(id: string) {
  try {
    await verifyStaff();
    await prisma.landingStat.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    console.error('[deleteStatAction]', err);
    return { success: false, error: err.message || 'Failed to delete stat' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WELCOME MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export async function getWelcomeMsgAction() {
  try {
    const welcome = await prisma.landingWelcome.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, welcome };
  } catch (err: any) {
    console.error('[getWelcomeMsgAction]', err);
    return { success: false, error: err.message || 'Failed to fetch welcome message' };
  }
}

export async function saveWelcomeMsgAction(data: {
  title: string;
  body: string;
  photo: string;
  name: string;
  designation: string;
}) {
  try {
    await verifyStaff();
    // We update the active welcome message, or create one if none exists.
    const current = await prisma.landingWelcome.findFirst({
      where: { isActive: true },
    });

    let welcome;
    if (current) {
      welcome = await prisma.landingWelcome.update({
        where: { id: current.id },
        data: {
          title: data.title,
          body: data.body,
          photo: data.photo,
          name: data.name,
          designation: data.designation,
        },
      });
    } else {
      welcome = await prisma.landingWelcome.create({
        data: {
          title: data.title,
          body: data.body,
          photo: data.photo,
          name: data.name,
          designation: data.designation,
          isActive: true,
        },
      });
    }
    return { success: true, welcome };
  } catch (err: any) {
    console.error('[saveWelcomeMsgAction]', err);
    return { success: false, error: err.message || 'Failed to save welcome message' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EVENTS SELECT & SHOW
// ─────────────────────────────────────────────────────────────────────────────

export async function getLandingEventsAction() {
  try {
    // Return all events in system, sorted by eventDate desc
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        eventDate: true,
        venue: true,
        isPublished: true,
        showOnLanding: true,
      },
    });
    return { success: true, events };
  } catch (err: any) {
    console.error('[getLandingEventsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch events list' };
  }
}

export async function toggleEventLandingAction(id: string, showOnLanding: boolean) {
  try {
    await verifyStaff();
    const event = await prisma.event.update({
      where: { id },
      data: { showOnLanding },
    });
    return { success: true, event };
  } catch (err: any) {
    console.error('[toggleEventLandingAction]', err);
    return { success: false, error: err.message || 'Failed to update event show state' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NEWS / UPDATES
// ─────────────────────────────────────────────────────────────────────────────

export async function getNewsAction() {
  try {
    const news = await prisma.landingNews.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, news };
  } catch (err: any) {
    console.error('[getNewsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch news' };
  }
}

export async function createNewsAction(data: {
  title: string;
  summary: string;
  body?: string;
  coverImage?: string;
  category: string;
  author: string;
  publishedDate: string;
  campusTag: string;
  featured?: boolean;
  isActive?: boolean;
}) {
  try {
    await verifyStaff();
    const news = await prisma.landingNews.create({
      data: {
        title: data.title,
        summary: data.summary,
        body: data.body || null,
        coverImage: data.coverImage || null,
        category: data.category,
        author: data.author,
        publishedDate: data.publishedDate,
        campusTag: data.campusTag,
        featured: data.featured ?? false,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, news };
  } catch (err: any) {
    console.error('[createNewsAction]', err);
    return { success: false, error: err.message || 'Failed to create news item' };
  }
}

export async function updateNewsAction(
  id: string,
  data: {
    title: string;
    summary: string;
    body?: string;
    coverImage?: string;
    category: string;
    author: string;
    publishedDate: string;
    campusTag: string;
    featured?: boolean;
    isActive?: boolean;
  }
) {
  try {
    await verifyStaff();
    const news = await prisma.landingNews.update({
      where: { id },
      data: {
        title: data.title,
        summary: data.summary,
        body: data.body || null,
        coverImage: data.coverImage || null,
        category: data.category,
        author: data.author,
        publishedDate: data.publishedDate,
        campusTag: data.campusTag,
        featured: data.featured ?? false,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, news };
  } catch (err: any) {
    console.error('[updateNewsAction]', err);
    return { success: false, error: err.message || 'Failed to update news item' };
  }
}

export async function deleteNewsAction(id: string) {
  try {
    await verifyStaff();
    await prisma.landingNews.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    console.error('[deleteNewsAction]', err);
    return { success: false, error: err.message || 'Failed to delete news item' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TESTIMONIALS & SPOTLIGHTS (MIXED AS ONE)
// ─────────────────────────────────────────────────────────────────────────────

export async function getTestimonialsAction() {
  try {
    const testimonials = await prisma.landingTestimonial.findMany({
      orderBy: [{ isSpotlight: 'desc' }, { displayOrder: 'asc' }],
    });
    return { success: true, testimonials };
  } catch (err: any) {
    console.error('[getTestimonialsAction]', err);
    return { success: false, error: err.message || 'Failed to fetch testimonials' };
  }
}

export async function createTestimonialAction(data: {
  name: string;
  photo?: string;
  batchYear?: number;
  branch?: string;
  designation?: string;
  company?: string;
  quote: string;
  linkedIn?: string;
  isSpotlight?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}) {
  try {
    await verifyStaff();
    const testimonial = await prisma.landingTestimonial.create({
      data: {
        name: data.name,
        photo: data.photo || null,
        batchYear: data.batchYear || null,
        branch: data.branch || null,
        designation: data.designation || null,
        company: data.company || null,
        quote: data.quote,
        linkedIn: data.linkedIn || null,
        isSpotlight: data.isSpotlight ?? false,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    return { success: true, testimonial };
  } catch (err: any) {
    console.error('[createTestimonialAction]', err);
    return { success: false, error: err.message || 'Failed to create testimonial' };
  }
}

export async function updateTestimonialAction(
  id: string,
  data: {
    name: string;
    photo?: string;
    batchYear?: number;
    branch?: string;
    designation?: string;
    company?: string;
    quote: string;
    linkedIn?: string;
    isSpotlight?: boolean;
    isActive?: boolean;
    displayOrder?: number;
  }
) {
  try {
    await verifyStaff();
    const testimonial = await prisma.landingTestimonial.update({
      where: { id },
      data: {
        name: data.name,
        photo: data.photo || null,
        batchYear: data.batchYear || null,
        branch: data.branch || null,
        designation: data.designation || null,
        company: data.company || null,
        quote: data.quote,
        linkedIn: data.linkedIn || null,
        isSpotlight: data.isSpotlight ?? false,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    return { success: true, testimonial };
  } catch (err: any) {
    console.error('[updateTestimonialAction]', err);
    return { success: false, error: err.message || 'Failed to update testimonial' };
  }
}

export async function deleteTestimonialAction(id: string) {
  try {
    await verifyStaff();
    await prisma.landingTestimonial.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    console.error('[deleteTestimonialAction]', err);
    return { success: false, error: err.message || 'Failed to delete testimonial' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GALLERY SHOWCASE (toggle AlbumImages showOnLanding)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAlbumsWithImagesAction() {
  try {
    // Fetch all albums and their images
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return { success: true, albums };
  } catch (err: any) {
    console.error('[getAlbumsWithImagesAction]', err);
    return { success: false, error: err.message || 'Failed to fetch albums' };
  }
}

export async function toggleAlbumImageLandingAction(id: string, showOnLanding: boolean) {
  try {
    await verifyStaff();
    const image = await prisma.albumImage.update({
      where: { id },
      data: { showOnLanding },
    });
    return { success: true, image };
  } catch (err: any) {
    console.error('[toggleAlbumImageLandingAction]', err);
    return { success: false, error: err.message || 'Failed to update gallery image show state' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. ALUMNI VIDEOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVideosAction() {
  try {
    const videos = await prisma.landingVideo.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, videos };
  } catch (err: any) {
    console.error('[getVideosAction]', err);
    return { success: false, error: err.message || 'Failed to fetch videos' };
  }
}

export async function createVideoAction(data: {
  videoUrl: string;
  title: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  try {
    await verifyStaff();
    const video = await prisma.landingVideo.create({
      data: {
        videoUrl: data.videoUrl,
        title: data.title,
        description: data.description || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, video };
  } catch (err: any) {
    console.error('[createVideoAction]', err);
    return { success: false, error: err.message || 'Failed to create video' };
  }
}

export async function updateVideoAction(
  id: string,
  data: {
    videoUrl: string;
    title: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    await verifyStaff();
    const video = await prisma.landingVideo.update({
      where: { id },
      data: {
        videoUrl: data.videoUrl,
        title: data.title,
        description: data.description || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, video };
  } catch (err: any) {
    console.error('[updateVideoAction]', err);
    return { success: false, error: err.message || 'Failed to update video' };
  }
}

export async function deleteVideoAction(id: string) {
  try {
    await verifyStaff();
    // Delete video from local disk if it starts with /uploads/
    const video = await prisma.landingVideo.findUnique({
      where: { id },
      select: { videoUrl: true },
    });
    if (video?.videoUrl) {
      const { deleteFile } = await import('@/lib/fileUpload');
      await deleteFile(video.videoUrl);
    }
    await prisma.landingVideo.delete({ where: { id } });
    return { success: true };
  } catch (err: any) {
    console.error('[deleteVideoAction]', err);
    return { success: false, error: err.message || 'Failed to delete video' };
  }
}

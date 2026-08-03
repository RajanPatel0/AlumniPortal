import { redirect } from "next/navigation";
import { getCurrentAlumniOrStaff } from "@/lib/auth/getCurrentAlumni";
import { prisma } from "@/lib/prisma";
import AlumniFeedClient, { AlumniProfile, FeedPost } from "./AlumniFeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await getCurrentAlumniOrStaff();

  // If no profile resolves, redirect to login
  if (!session) {
    redirect("/alumni/login");
  }

  // 1. Map session to AlumniProfile
  let profile: AlumniProfile | null = null;
  const currentAlumniId = session.isAdmin ? null : session.alumni.id;

  if (session.isAdmin) {
    const staff = await prisma.staff.findUnique({
      where: { id: session.staffId },
      include: { campus: true },
    });
    if (staff) {
      profile = {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        isAdmin: true,
        currentRole: staff.role,
        college: staff.campus?.name || "All Campuses (Consolidated)",
        batchYear: 0,
        branch: "",
      };
    }
  } else {
    profile = {
      id: session.alumni.id,
      name: session.alumni.name,
      email: session.alumni.email,
      batchYear: session.alumni.batchYear,
      branch: session.alumni.branch,
      college: session.alumni.college,
      currentRole: session.alumni.currentRole || undefined,
      currentCompany: session.alumni.currentCompany || undefined,
      city: session.alumni.city || undefined,
      avatarUrl: session.alumni.avatarUrl || undefined,
      isAdmin: false,
    };
  }

  if (!profile) {
    redirect("/alumni/login");
  }

  // 2. Query initial feed posts from Database (Page 1)
  const postsFromDb = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          branch: true,
          batchYear: true,
          currentRole: true,
          currentCompany: true,
        },
      },
      postedByStaff: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        },
      },
      images: true,
      likes: {
        where: { alumniId: currentAlumniId || "" },
        select: { id: true }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  const posts: FeedPost[] = postsFromDb.map((post) => {
    const hasLiked = post.likes ? post.likes.length > 0 : false;
    const dateFormatted = post.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (post.postedByStaff) {
      return {
        id: post.id,
        content: post.content || "",
        createdAt: dateFormatted,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        hasLiked,
        images: post.images.map((img) => ({ imageUrl: img.imageUrl })),
        media: post.images.length > 0 ? { type: "image", url: post.images[0].imageUrl } : undefined,
        author: {
          id: post.postedByStaff.id,
          name: post.postedByStaff.name,
          batchYear: 0,
          avatarUrl: undefined,
          currentRole: post.postedByStaff.role,
          currentCompany: "IKGPTU Staff",
          isAdmin: true,
        },
      };
    } else {
      const authorName = post.author?.name || "Anonymous";
      return {
        id: post.id,
        content: post.content || "",
        createdAt: dateFormatted,
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        hasLiked,
        images: post.images.map((img) => ({ imageUrl: img.imageUrl })),
        media: post.images.length > 0 ? { type: "image", url: post.images[0].imageUrl } : undefined,
        author: {
          id: post.author?.id || undefined,
          name: authorName,
          batchYear: post.author?.batchYear || 0,
          avatarUrl: post.author?.avatarUrl || undefined,
          currentRole: post.author?.currentRole || undefined,
          currentCompany: post.author?.currentCompany || undefined,
          isAdmin: false,
        },
      };
    }
  });

  return <AlumniFeedClient initialProfile={profile} initialPosts={posts} />;
}

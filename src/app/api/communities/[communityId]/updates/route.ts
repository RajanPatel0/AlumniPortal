import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isNewsletter = searchParams.get("isNewsletter");

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const where: any = { communityId: community.id };
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (isNewsletter === "true") {
      where.isNewsletter = true;
    }

    const updates = await prisma.communityUpdate.findMany({
      where,
      include: {
        authorAlumni: {
          select: { id: true, name: true, avatarUrl: true, currentRole: true, currentCompany: true },
        },
        authorStaff: {
          select: { id: true, name: true, role: true },
        },
        documents: true,
        poll: {
          include: {
            options: {
              include: {
                _count: { select: { votes: true } },
                votes: { select: { alumniId: true } },
              },
            },
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    // Format poll response for frontend widget
    const formattedUpdates = updates.map((up) => {
      let formattedPoll = null;
      if (up.poll) {
        const totalVotes = up.poll.options.reduce((sum, opt) => sum + opt._count.votes, 0);
        formattedPoll = {
          id: up.poll.id,
          question: up.poll.question,
          allowMultiple: up.poll.allowMultiple,
          totalVotes,
          expiresAt: up.poll.expiresAt,
          options: up.poll.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            voteCount: opt._count.votes,
            hasVoted: false, // Client can compute based on active user ID
          })),
        };
      }
      return {
        ...up,
        poll: formattedPoll,
      };
    });

    return NextResponse.json({ success: true, data: formattedUpdates });
  } catch (error: any) {
    console.error("GET /api/communities/[communityId]/updates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params;
    const body = await request.json();
    const { title, content, type, isNewsletter, isPinned, authorAlumniId, authorStaffId, documents, poll } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const update = await prisma.communityUpdate.create({
      data: {
        communityId: community.id,
        title,
        content,
        type: type || "GENERAL_MSG",
        isNewsletter: !!isNewsletter,
        isPinned: !!isPinned,
        authorAlumniId: authorAlumniId || null,
        authorStaffId: authorStaffId || null,
        documents: documents && documents.length > 0 ? {
          create: documents.map((doc: any) => ({
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize || null,
            mimeType: doc.mimeType || null,
          })),
        } : undefined,
        poll: poll && poll.question && poll.options?.length > 0 ? {
          create: {
            question: poll.question,
            allowMultiple: !!poll.allowMultiple,
            options: {
              create: poll.options.map((optText: string) => ({ text: optText })),
            },
          },
        } : undefined,
      },
      include: {
        documents: true,
        poll: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: update }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/communities/[communityId]/updates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

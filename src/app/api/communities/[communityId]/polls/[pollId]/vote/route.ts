import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { alumniAuthConfig } from "@/lib/alumni/auth";
import { getAuthenticatedStaff } from "@/lib/auth/staff-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string; pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const body = await request.json();
    const { optionId } = body;

    let alumniId: string | null = null;
    const staff = await getAuthenticatedStaff();
    const session = await getServerSession(alumniAuthConfig);

    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      alumniId = userId;
    }

    if (!alumniId && !staff) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!optionId) {
      return NextResponse.json({ success: false, error: "optionId is required" }, { status: 400 });
    }

    const poll = await prisma.communityPoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    const voterId = alumniId || staff?.id || "anonymous-voter";

    // Check if user already voted on this option
    const existingVote = await prisma.communityPollVote.findFirst({
      where: {
        optionId,
        alumniId: voterId,
      },
    });

    if (existingVote) {
      // Toggle / Remove vote
      await prisma.communityPollVote.delete({
        where: { id: existingVote.id },
      });
      return NextResponse.json({ success: true, action: "removed" });
    }

    // If multiple votes not allowed, clear previous option votes for this poll
    if (!poll.allowMultiple) {
      const optionIds = poll.options.map((o) => o.id);
      await prisma.communityPollVote.deleteMany({
        where: {
          alumniId: voterId,
          optionId: { in: optionIds },
        },
      });
    }

    const vote = await prisma.communityPollVote.create({
      data: {
        optionId,
        alumniId: voterId,
      },
    });

    return NextResponse.json({ success: true, action: "voted", data: vote });
  } catch (error: any) {
    console.error("POST poll vote error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

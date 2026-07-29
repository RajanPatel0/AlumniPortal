import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ communityId: string; pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const body = await request.json();
    const { optionId, alumniId } = body;

    if (!optionId || !alumniId) {
      return NextResponse.json({ success: false, error: "optionId and alumniId are required" }, { status: 400 });
    }

    const poll = await prisma.communityPoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 });
    }

    // Check if user already voted on this option
    const existingVote = await prisma.communityPollVote.findUnique({
      where: {
        optionId_alumniId: { optionId, alumniId },
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
          alumniId,
          optionId: { in: optionIds },
        },
      });
    }

    const vote = await prisma.communityPollVote.create({
      data: {
        optionId,
        alumniId,
      },
    });

    return NextResponse.json({ success: true, action: "voted", data: vote });
  } catch (error: any) {
    console.error("POST poll vote error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

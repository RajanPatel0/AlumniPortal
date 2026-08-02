import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommunitySession } from "@/lib/auth/community-auth";
import { isLeaderOrAdmin, hasCommunityAdminAccess } from "@/lib/community-permissions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ communityId: string; updateId: string }> }
) {
  try {
    const session = await getCommunitySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { communityId, updateId } = await params;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      include: {
        members: {
          where: session.alumniId
            ? { alumniId: session.alumniId }
            : session.staffId
            ? { staffId: session.staffId }
            : undefined,
        },
      },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const updateItem = await prisma.communityUpdate.findFirst({
      where: {
        id: updateId,
        communityId: community.id,
      },
      select: { id: true, authorAlumniId: true, authorStaffId: true },
    });

    if (!updateItem) {
      return NextResponse.json({ success: false, error: "Update post not found" }, { status: 404 });
    }
    const userMember = community.members[0];
    const isLeadership = hasCommunityAdminAccess(session, community.campusId) || isLeaderOrAdmin(false, userMember?.roleTag);

    const isAuthor =
      (session.alumniId && updateItem.authorAlumniId === session.alumniId) ||
      (session.staffId && updateItem.authorStaffId === session.staffId);

    if (!isLeadership && !isAuthor) {
      return NextResponse.json({ success: false, error: "Forbidden. You can only delete your own updates unless you are a leader or admin." }, { status: 403 });
    }

    await prisma.communityUpdate.delete({
      where: { id: updateId },
    });

    return NextResponse.json({ success: true, message: "Update deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/communities/[communityId]/updates/[updateId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ communityId: string; updateId: string }> }
) {
  try {
    const session = await getCommunitySession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { communityId, updateId } = await params;
    const body = await request.json();
    const { title, content, type, isNewsletter, isPinned, documents } = body;

    const community = await prisma.community.findFirst({
      where: { OR: [{ id: communityId }, { slug: communityId }] },
      include: {
        members: {
          where: session.alumniId
            ? { alumniId: session.alumniId }
            : session.staffId
            ? { staffId: session.staffId }
            : undefined,
        },
      },
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const updateItem = await prisma.communityUpdate.findFirst({
      where: {
        id: updateId,
        communityId: community.id,
      },
      select: { id: true, authorAlumniId: true, authorStaffId: true },
    });

    if (!updateItem) {
      return NextResponse.json({ success: false, error: "Update post not found" }, { status: 404 });
    }
    const userMember = community.members[0];
    const isLeadership = hasCommunityAdminAccess(session, community.campusId) || isLeaderOrAdmin(false, userMember?.roleTag);

    const isAuthor =
      (session.alumniId && updateItem.authorAlumniId === session.alumniId) ||
      (session.staffId && updateItem.authorStaffId === session.staffId);

    if (!isLeadership && !isAuthor) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You can only edit your own updates unless you are a leader or admin." },
        { status: 403 }
      );
    }

    // Delete existing document attachments if updating documents
    if (documents && Array.isArray(documents)) {
      await prisma.communityDocument.deleteMany({
        where: { updateId },
      });
    }

    const updated = await prisma.communityUpdate.update({
      where: { id: updateId },
      data: {
        title,
        content,
        type,
        isNewsletter: Boolean(isNewsletter),
        isPinned: Boolean(isPinned),
        documents:
          documents && Array.isArray(documents)
            ? {
                create: documents.map((doc: any) => ({
                  fileName: doc.fileName,
                  fileUrl: doc.fileUrl,
                  fileType: doc.fileType || "DOCUMENT",
                })),
              }
            : undefined,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT /api/communities/[communityId]/updates/[updateId] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

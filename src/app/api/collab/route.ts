import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List collab requests (sent + received by current user)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [sent, received] = await Promise.all([
            prisma.collabRequest.findMany({
                where: { fromUserId: session.user.id },
                include: {
                    toUser: { select: { id: true, name: true, image: true, role: true } },
                    post: { select: { id: true, title: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.collabRequest.findMany({
                where: { toUserId: session.user.id },
                include: {
                    fromUser: { select: { id: true, name: true, image: true, role: true } },
                    post: { select: { id: true, title: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return NextResponse.json({ sent, received });
    } catch (error) {
        console.error("Collab fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Send a collab request
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { postId, projectId, toUserId, message } = await req.json();

        if (!toUserId) return NextResponse.json({ error: "Target user required" }, { status: 400 });
        if (!postId && !projectId) return NextResponse.json({ error: "Post or project required" }, { status: 400 });
        if (toUserId === session.user.id) return NextResponse.json({ error: "Cannot collab with yourself" }, { status: 400 });

        const collab = await prisma.collabRequest.create({
            data: {
                postId: postId || null,
                projectId: projectId || null,
                fromUserId: session.user.id,
                toUserId,
                message: message || null,
            },
        });

        // Notify the target user
        const fromUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
        await (prisma as any).notification.create({
            data: {
                type: "collab_request",
                message: `${fromUser?.name || "Someone"} sent you a collaboration request`,
                userId: toUserId,
                relatedId: collab.id,
            },
        });

        return NextResponse.json(collab, { status: 201 });
    } catch (error) {
        console.error("Collab request error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Accept or reject a collab request
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, status } = await req.json();
        if (!id || !["accepted", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Valid ID and status required" }, { status: 400 });
        }

        const existing = await prisma.collabRequest.findUnique({ where: { id } });
        if (!existing || existing.toUserId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const collab = await prisma.collabRequest.update({
            where: { id },
            data: { status },
        });

        // When a collab is accepted, auto-create an accepted MessageRequest
        // so both users can DM each other immediately
        if (status === "accepted") {
            const existingMsgReq = await (prisma as any).messageRequest.findFirst({
                where: {
                    OR: [
                        { fromUserId: existing.fromUserId, toUserId: existing.toUserId },
                        { fromUserId: existing.toUserId, toUserId: existing.fromUserId },
                    ],
                },
            });

            if (!existingMsgReq) {
                await (prisma as any).messageRequest.create({
                    data: {
                        fromUserId: existing.fromUserId,
                        toUserId: existing.toUserId,
                        status: "accepted",
                    },
                });
            } else if (existingMsgReq.status !== "accepted") {
                // If a request exists but is pending/rejected, accept it
                await (prisma as any).messageRequest.update({
                    where: { id: existingMsgReq.id },
                    data: { status: "accepted" },
                });
            }

            // Create notification for the collab sender
            const acceptorName = session.user.name || "Someone";
            await (prisma as any).notification.create({
                data: {
                    type: "collab_request",
                    message: `${acceptorName} accepted your collab request! You can now DM them.`,
                    userId: existing.fromUserId,
                    relatedId: session.user.id,
                },
            });

            // Award XP for collaboration
            await prisma.user.update({
                where: { id: existing.fromUserId },
                data: { impactXP: { increment: 5 } },
            });
            await prisma.user.update({
                where: { id: existing.toUserId },
                data: { impactXP: { increment: 5 } },
            });
        }

        return NextResponse.json(collab);
    } catch (error) {
        console.error("Collab update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

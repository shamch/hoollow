import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List pending join requests for a club (managers+)
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const clubId = params.id;

        // Check the requester is a manager+ of this club
        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: session.user.id } },
        });

        const ROLE_LEVEL: Record<string, number> = { owner: 4, coowner: 3, manager: 2, member: 1 };
        if (!member || (ROLE_LEVEL[member.role] || 0) < ROLE_LEVEL.manager) {
            return NextResponse.json({ error: "Need manager or higher to view join requests" }, { status: 403 });
        }

        const requests = await (prisma as any).clubJoinRequest.findMany({
            where: { clubId },
            include: {
                user: { select: { id: true, name: true, image: true, role: true, impactXP: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Club join requests fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH: Accept or reject a join request
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const clubId = params.id;
        const { requestId, status } = await req.json();

        if (!requestId || !["accepted", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Valid requestId and status required" }, { status: 400 });
        }

        // Check the responder is a manager+ of this club
        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId: session.user.id } },
        });

        const ROLE_LEVEL: Record<string, number> = { owner: 4, coowner: 3, manager: 2, member: 1 };
        if (!member || (ROLE_LEVEL[member.role] || 0) < ROLE_LEVEL.manager) {
            return NextResponse.json({ error: "Need manager or higher" }, { status: 403 });
        }

        const joinReq = await (prisma as any).clubJoinRequest.findUnique({ where: { id: requestId } });
        if (!joinReq || joinReq.clubId !== clubId) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Update the request status
        const updated = await (prisma as any).clubJoinRequest.update({
            where: { id: requestId },
            data: { status },
        });

        // If accepted, add the user as a member
        if (status === "accepted") {
            const existingMember = await prisma.clubMember.findUnique({
                where: { clubId_userId: { clubId, userId: joinReq.userId } },
            });

            if (!existingMember) {
                await prisma.clubMember.create({
                    data: { clubId, userId: joinReq.userId, role: "member" },
                });
            }

            // Notify the user
            const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } });
            await (prisma as any).notification.create({
                data: {
                    type: "club_join_request",
                    message: `Your request to join ${club?.name || "a club"} has been approved!`,
                    userId: joinReq.userId,
                    relatedId: clubId,
                },
            });
        } else {
            // Notify the user of rejection
            const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } });
            await (prisma as any).notification.create({
                data: {
                    type: "club_join_request",
                    message: `Your request to join ${club?.name || "a club"} was declined.`,
                    userId: joinReq.userId,
                    relatedId: clubId,
                },
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Club join request action error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clubId = params.id;
        const userId = session.user.id;

        // Fetch club to check type
        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { type: true, name: true },
        });

        if (!club) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 });
        }

        const existing = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });

        if (existing) {
            // Leave club (works for all types)
            await prisma.clubMember.delete({ where: { id: existing.id } });
            return NextResponse.json({ joined: false });
        }

        // For open clubs, join immediately
        if (club.type === "open") {
            await prisma.clubMember.create({
                data: { clubId, userId, role: "member" },
            });
            return NextResponse.json({ joined: true });
        }

        // For invite/application clubs, create a join request
        // Check if a pending request already exists
        const existingRequest = await (prisma as any).clubJoinRequest.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });

        if (existingRequest) {
            if (existingRequest.status === "pending") {
                return NextResponse.json({ error: "You already have a pending request", requested: true }, { status: 409 });
            }
            if (existingRequest.status === "rejected") {
                // Allow re-requesting after rejection
                await (prisma as any).clubJoinRequest.update({
                    where: { id: existingRequest.id },
                    data: { status: "pending" },
                });
            }
        } else {
            const body = await req.json().catch(() => ({}));
            await (prisma as any).clubJoinRequest.create({
                data: {
                    clubId,
                    userId,
                    message: body.message || null,
                },
            });
        }

        // Notify club managers/owners/co-owners
        const managers = await prisma.clubMember.findMany({
            where: {
                clubId,
                role: { in: ["owner", "coowner", "manager"] },
            },
            select: { userId: true },
        });

        const userName = session.user.name || "Someone";
        for (const manager of managers) {
            await (prisma as any).notification.create({
                data: {
                    type: "club_join_request",
                    message: `${userName} wants to join ${club.name}`,
                    userId: manager.userId,
                    relatedId: clubId,
                },
            });
        }

        return NextResponse.json({ requested: true });
    } catch (error) {
        console.error("Club join error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

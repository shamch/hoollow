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

        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { type: true, name: true, visibility: true, inviteCode: true },
        });

        if (!club) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 });
        }

        // Check if user is banned
        const ban = await prisma.clubBan.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });
        if (ban) {
            if (!ban.expiresAt || ban.expiresAt > new Date()) {
                return NextResponse.json({ error: "You are banned from this club" }, { status: 403 });
            }
            // Ban expired, remove it
            await prisma.clubBan.delete({ where: { id: ban.id } });
        }

        const existing = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });

        if (existing) {
            // Leave club
            await prisma.clubMember.delete({ where: { id: existing.id } });
            return NextResponse.json({ joined: false });
        }

        // For private clubs, require invite code
        if (club.visibility === "private") {
            const body = await req.json().catch(() => ({}));
            const code = body.inviteCode;
            
            if (!code) {
                return NextResponse.json({ error: "Invite code required for private clubs" }, { status: 400 });
            }

            // Check main invite code
            if (code === club.inviteCode) {
                // Valid main code
            } else {
                // Check special invite codes
                const specialCode = await prisma.clubInviteCode.findUnique({ where: { code } });
                if (!specialCode || specialCode.clubId !== clubId) {
                    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
                }
                if (specialCode.expiresAt && specialCode.expiresAt < new Date()) {
                    return NextResponse.json({ error: "This invite code has expired" }, { status: 400 });
                }
                if (specialCode.maxUses > 0 && specialCode.uses >= specialCode.maxUses) {
                    return NextResponse.json({ error: "This invite code has reached its usage limit" }, { status: 400 });
                }
                // Increment uses
                await prisma.clubInviteCode.update({
                    where: { id: specialCode.id },
                    data: { uses: { increment: 1 } },
                });
            }

            // Join directly with invite code
            await prisma.clubMember.create({
                data: { clubId, userId, role: "member" },
            });
            return NextResponse.json({ joined: true });
        }

        // For public open clubs, join immediately
        if (club.type === "open") {
            await prisma.clubMember.create({
                data: { clubId, userId, role: "member" },
            });
            return NextResponse.json({ joined: true });
        }

        // For application clubs, create a join request
        const existingRequest = await (prisma as any).clubJoinRequest.findUnique({
            where: { clubId_userId: { clubId, userId } },
        });

        if (existingRequest) {
            if (existingRequest.status === "pending") {
                return NextResponse.json({ error: "You already have a pending request", requested: true }, { status: 409 });
            }
            if (existingRequest.status === "rejected") {
                await (prisma as any).clubJoinRequest.update({
                    where: { id: existingRequest.id },
                    data: { status: "pending" },
                });
            }
        } else {
            const body = await req.json().catch(() => ({}));
            await (prisma as any).clubJoinRequest.create({
                data: { clubId, userId, message: body.message || null },
            });
        }

        // Notify club managers
        const managers = await prisma.clubMember.findMany({
            where: { clubId, role: { in: ["owner", "coowner", "moderator"] } },
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


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLE_LEVEL: Record<string, number> = { owner: 4, coowner: 3, moderator: 2, member: 1 };

// PATCH: Change a member's role
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { memberId, newRole } = await req.json();
        if (!memberId || !newRole || !ROLE_LEVEL[newRole]) {
            return NextResponse.json({ error: "Valid memberId and role required" }, { status: 400 });
        }

        // Get acting user's membership
        const actingMember = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!actingMember || (ROLE_LEVEL[actingMember.role] || 0) < ROLE_LEVEL.coowner) {
            return NextResponse.json({ error: "Need co-owner or higher to change roles" }, { status: 403 });
        }

        // Get target member
        const targetMember = await prisma.clubMember.findUnique({ where: { id: memberId } });
        if (!targetMember || targetMember.clubId !== params.id) {
            return NextResponse.json({ error: "Member not found in this club" }, { status: 404 });
        }

        // Can't change role of someone equal or higher
        if ((ROLE_LEVEL[targetMember.role] || 0) >= (ROLE_LEVEL[actingMember.role] || 0)) {
            return NextResponse.json({ error: "Cannot change role of equal/higher rank" }, { status: 403 });
        }

        // Can't promote to equal or higher than yourself
        if (ROLE_LEVEL[newRole] >= (ROLE_LEVEL[actingMember.role] || 0)) {
            return NextResponse.json({ error: "Cannot promote above your own rank" }, { status: 403 });
        }

        // Only owner can transfer ownership
        if (newRole === "owner" && actingMember.role !== "owner") {
            return NextResponse.json({ error: "Only owner can transfer ownership" }, { status: 403 });
        }

        // Cap coowners at 3
        if (newRole === "coowner") {
            const currentCoowners = await prisma.clubMember.count({
                where: { clubId: params.id, role: "coowner" },
            });
            if (currentCoowners >= 3) {
                return NextResponse.json({ error: "Maximum of 3 co-owners allowed" }, { status: 400 });
            }
        }

        const updated = await prisma.clubMember.update({
            where: { id: memberId },
            data: { role: newRole },
            include: { user: { select: { id: true, name: true, image: true } } },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Role change error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Kick a member
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get("memberId");
        if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

        const actingMember = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!actingMember || (ROLE_LEVEL[actingMember.role] || 0) < ROLE_LEVEL.moderator) {
            return NextResponse.json({ error: "Need moderator or higher to kick members" }, { status: 403 });
        }

        const targetMember = await prisma.clubMember.findUnique({ where: { id: memberId } });
        if (!targetMember || targetMember.clubId !== params.id) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Can't kick equal or higher role
        if ((ROLE_LEVEL[targetMember.role] || 0) >= (ROLE_LEVEL[actingMember.role] || 0)) {
            return NextResponse.json({ error: "Cannot kick equal/higher rank" }, { status: 403 });
        }

        await prisma.clubMember.delete({ where: { id: memberId } });
        return NextResponse.json({ kicked: true });
    } catch (error) {
        console.error("Kick member error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Ban or timeout a member
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { memberId, action, reason, durationHours } = await req.json();
        // action: "ban" | "timeout"

        if (!memberId || !action) {
            return NextResponse.json({ error: "memberId and action required" }, { status: 400 });
        }

        const actingMember = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!actingMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        // Check permissions from club's permissions JSON
        const club = await prisma.club.findUnique({ where: { id: params.id }, select: { permissions: true, name: true } });
        const perms = (club?.permissions as any)?.[actingMember.role] || {};

        // Owner always has all permissions
        const isOwner = actingMember.role === "owner";

        if (action === "ban" && !isOwner && !perms.ban) {
            return NextResponse.json({ error: "You don't have ban permission" }, { status: 403 });
        }
        if (action === "timeout" && !isOwner && !perms.timeout) {
            return NextResponse.json({ error: "You don't have timeout permission" }, { status: 403 });
        }

        const targetMember = await prisma.clubMember.findUnique({
            where: { id: memberId },
            include: { user: { select: { id: true, name: true } } },
        });
        if (!targetMember || targetMember.clubId !== params.id) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Can't ban/timeout equal or higher rank
        if ((ROLE_LEVEL[targetMember.role] || 0) >= (ROLE_LEVEL[actingMember.role] || 0)) {
            return NextResponse.json({ error: "Cannot moderate equal/higher rank" }, { status: 403 });
        }

        if (action === "ban") {
            // Remove from club and create ban record
            await prisma.clubMember.delete({ where: { id: memberId } });
            await prisma.clubBan.upsert({
                where: { clubId_userId: { clubId: params.id, userId: targetMember.userId } },
                create: { clubId: params.id, userId: targetMember.userId, reason: reason || null, expiresAt: null },
                update: { reason: reason || null, expiresAt: null },
            });

            // Notify the banned user
            await (prisma as any).notification.create({
                data: {
                    type: "club_ban",
                    message: `You have been banned from "${club?.name}"${reason ? `: ${reason}` : ""}`,
                    userId: targetMember.userId,
                    relatedId: params.id,
                },
            });

            return NextResponse.json({ banned: true });
        }

        if (action === "timeout") {
            const hours = durationHours || 1;
            const expiresAt = new Date(Date.now() + hours * 3600000);

            await prisma.clubBan.upsert({
                where: { clubId_userId: { clubId: params.id, userId: targetMember.userId } },
                create: { clubId: params.id, userId: targetMember.userId, reason: reason || "Timed out", expiresAt },
                update: { reason: reason || "Timed out", expiresAt },
            });

            // Notify the timed-out user
            await (prisma as any).notification.create({
                data: {
                    type: "club_timeout",
                    message: `You have been timed out from "${club?.name}" for ${hours} hour(s)${reason ? `: ${reason}` : ""}`,
                    userId: targetMember.userId,
                    relatedId: params.id,
                },
            });

            return NextResponse.json({ timedOut: true, expiresAt });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Ban/timeout error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


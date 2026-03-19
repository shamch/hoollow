import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch messages for a club (paginated)
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must be a member to see messages
        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const channel = searchParams.get("channel") || "general";
        const take = 50;

        const messages = await prisma.clubMessage.findMany({
            where: { clubId: params.id, channel },
            orderBy: { createdAt: "desc" },
            take,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            include: {
                author: { select: { id: true, name: true, image: true, role: true } },
            },
        });

        return NextResponse.json({
            messages: messages.reverse(), // Return oldest-first for display
            nextCursor: messages.length === take ? messages[0]?.id : null,
        });
    } catch (error) {
        console.error("Messages fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must be a member to send messages
        const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: params.id, userId: session.user.id } },
        });
        if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const { text, channel = "general" } = await req.json();
        if (!text?.trim()) return NextResponse.json({ error: "Message text required" }, { status: 400 });

        if (channel === "announcements") {
            const roleLevelMap: Record<string, number> = { owner: 4, coowner: 3, moderator: 2, member: 1 };
            if ((roleLevelMap[member.role] || 0) < 3) {
                return NextResponse.json({ error: "Only owners and co-owners can post announcements" }, { status: 403 });
            }
        }

        const message = await prisma.clubMessage.create({
            data: {
                text: text.trim(),
                channel,
                clubId: params.id,
                authorId: session.user.id,
            },
            include: {
                author: { select: { id: true, name: true, image: true, role: true } },
            },
        });

        if (channel === "announcements" && text.includes("#important")) {
            const club = await prisma.club.findUnique({
                where: { id: params.id },
                include: { members: true },
            });
            if (club) {
                const notifications = club.members
                    .filter((m) => m.userId !== session.user.id)
                    .map((m) => ({
                        type: "club_announcement",
                        message: `[${club.name}] Important announcement: ${text.substring(0, 60)}${text.length > 60 ? "..." : ""}`,
                        userId: m.userId,
                        relatedId: club.id,
                    }));
                
                if (notifications.length > 0) {
                    await prisma.notification.createMany({ data: notifications });
                }
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Message send error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
